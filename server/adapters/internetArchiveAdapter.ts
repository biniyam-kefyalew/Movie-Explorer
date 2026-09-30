import { config } from '../config';
import { globalCache } from '../cache/cacheService';
import { MovieSource } from '../types/movie';

export interface IASearchItem {
  identifier: string;
  title?: string;
  year?: string | number;
  publicdate?: string;
  licenseurl?: string;
  rights?: string;
  mediatype?: string;
  collection?: string | string[];
}

export interface IAMetadataFile {
  name: string;
  format?: string;
  size?: string;
  height?: string | number;
  width?: string | number;
  length?: string;
  title?: string;
}

export interface IAMetadataResponse {
  server?: string;
  dir?: string;
  metadata?: {
    identifier?: string;
    title?: string;
    year?: string | number;
    description?: string;
    licenseurl?: string;
    rights?: string;
    collection?: string | string[];
    publicdate?: string;
  };
  files?: IAMetadataFile[];
}

export class InternetArchiveAdapter {
  private enabled: boolean;

  constructor() {
    this.enabled = config.enableInternetArchive;
  }

  /**
   * Cleans title string for search query (removes punctuation, subtitles, etc.)
   */
  normalizeTitle(title: string): string {
    return (title || '')
      .toLowerCase()
      .replace(/[:\-–—].*$/, '') // remove subtitle after colon/hyphen
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validates if license / rights information permits streaming
   */
  isLegalAndPermitted(metadata: IAMetadataResponse['metadata']): { permitted: boolean; license: string } {
    if (!metadata) return { permitted: false, license: 'Unknown' };

    const rights = (metadata.rights || '').toLowerCase();
    const licenseUrl = (metadata.licenseurl || '').toLowerCase();
    const collections = Array.isArray(metadata.collection)
      ? metadata.collection.map((c) => c.toLowerCase())
      : [(metadata.collection || '').toLowerCase()];

    // Disqualify commercial or restricted/borrowing items
    if (rights.includes('all rights reserved') || rights.includes('restricted') || rights.includes('loan only')) {
      return { permitted: false, license: 'Restricted' };
    }

    // Explicit public domain / creative commons licenses
    if (
      licenseUrl.includes('creativecommons.org/publicdomain') ||
      licenseUrl.includes('creativecommons.org/licenses') ||
      licenseUrl.includes('archive.org/details/publicdomain') ||
      licenseUrl.includes('gnu.org')
    ) {
      return { permitted: true, license: metadata.licenseurl || 'Creative Commons / Public Domain' };
    }

    if (
      rights.includes('public domain') ||
      rights.includes('creative commons') ||
      rights.includes('open access') ||
      rights.includes('no copyright')
    ) {
      return { permitted: true, license: metadata.rights || 'Public Domain' };
    }

    // Verified public-domain cinema collections in archive.org
    const pdCollections = ['feature_films', 'silent_films', 'classic_tv', 'prelinger', 'opensource_movies', 'sci_fi_movies'];
    const isPdCollection = collections.some((c) => pdCollections.includes(c));
    if (isPdCollection) {
      return { permitted: true, license: 'Public Domain / Free Archive Collection' };
    }

    return { permitted: false, license: 'Unverified / Unknown' };
  }

  /**
   * Search archive.org for movie items matching title and approximate year
   */
  async searchItems(title: string, year?: number | null): Promise<IASearchItem[]> {
    if (!this.enabled) return [];

    const normTitle = this.normalizeTitle(title);
    if (!normTitle) return [];

    const cacheKey = `ia:search:${normTitle}:${year || 'noyear'}`;
    return globalCache.getOrSet(cacheKey, 3600, async () => {
      try {
        let query = `title:("${normTitle}") AND mediatype:(movies)`;
        if (year) {
          // Allow ±1 year variance for release date shifts
          query += ` AND (year:[${year - 1} TO ${year + 1}])`;
        }

        const url = new URL('https://archive.org/advancedsearch.php');
        url.searchParams.set('q', query);
        url.searchParams.set('fl[]', 'identifier,title,year,publicdate,licenseurl,rights,mediatype,collection');
        url.searchParams.set('sort[]', 'downloads desc');
        url.searchParams.set('rows', '6');
        url.searchParams.set('output', 'json');

        const res = await fetch(url.toString(), {
          headers: { 'User-Agent': 'MovieExplorer/2.0 (Legal Stream Aggregator)' },
          signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) {
          console.warn(`[InternetArchive] Search HTTP error ${res.status}`);
          return [];
        }

        const data = await res.json();
        const docs = data?.response?.docs || [];

        // If no docs found with strict year, try fallback without year filter
        if (docs.length === 0 && year) {
          const fallbackQuery = `title:("${normTitle}") AND mediatype:(movies)`;
          url.searchParams.set('q', fallbackQuery);
          const fbRes = await fetch(url.toString(), {
            headers: { 'User-Agent': 'MovieExplorer/2.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            return fbData?.response?.docs || [];
          }
        }

        return docs;
      } catch (err: any) {
        console.warn(`[InternetArchive] Search error for "${title}":`, err.message);
        return [];
      }
    });
  }

  /**
   * Retrieves full item metadata and available media files from Archive.org
   */
  async getItemMetadata(identifier: string): Promise<IAMetadataResponse | null> {
    const cacheKey = `ia:metadata:${identifier}`;
    return globalCache.getOrSet(cacheKey, 86400, async () => {
      try {
        const url = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'MovieExplorer/2.0' },
          signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) return null;
        return await res.json();
      } catch (err: any) {
        console.warn(`[InternetArchive] Metadata error for ${identifier}:`, err.message);
        return null;
      }
    });
  }

  /**
   * Finds the best browser-playable video streams in an IA item
   */
  extractPlayableFiles(item: IAMetadataResponse): Array<{ file: IAMetadataFile; quality: string; url: string }> {
    const files = item.files || [];
    const playable: Array<{ file: IAMetadataFile; quality: string; url: string }> = [];

    // Filter candidate files (MP4, H.264, WebM)
    for (const f of files) {
      const name = (f.name || '').toLowerCase();
      const format = (f.format || '').toLowerCase();

      // Skip preview clips or metadata xml
      if (name.includes('trailer') || name.includes('preview') || name.includes('sample') || name.endsWith('.xml') || name.endsWith('.sqlite')) {
        continue;
      }

      const isMp4 = name.endsWith('.mp4') || format.includes('h.264') || format.includes('mpeg4');
      const isWebm = name.endsWith('.webm') || format.includes('webm');

      if (isMp4 || isWebm) {
        const height = typeof f.height === 'number' ? f.height : parseInt(f.height || '0', 10);
        let quality = '480p';
        if (height >= 1080) quality = '1080p';
        else if (height >= 720) quality = '720p';
        else if (height >= 480) quality = '480p';
        else if (height > 0) quality = '360p';
        else if (format.includes('512kb')) quality = '360p';
        else quality = '720p';

        const identifier = item.metadata?.identifier;
        if (identifier) {
          const downloadUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(f.name)}`;
          playable.push({ file: f, quality, url: downloadUrl });
        }
      }
    }

    // Sort: 1080p > 720p > 480p > 360p
    const rank: Record<string, number> = { '1080p': 4, '720p': 3, '480p': 2, '360p': 1 };
    playable.sort((a, b) => (rank[b.quality] || 0) - (rank[a.quality] || 0));

    return playable;
  }

  /**
   * Resolves legal streaming sources for a movie
   */
  async resolveSources(title: string, year?: number | null, movieId: number | string = 0): Promise<MovieSource[]> {
    if (!this.enabled) return [];

    try {
      const items = await this.searchItems(title, year);
      const sources: MovieSource[] = [];

      for (const doc of items.slice(0, 3)) {
        const metadata = await this.getItemMetadata(doc.identifier);
        if (!metadata || !metadata.metadata) continue;

        const { permitted, license } = this.isLegalAndPermitted(metadata.metadata);
        if (!permitted) continue;

        const playable = this.extractPlayableFiles(metadata);
        if (playable.length === 0) continue;

        // Take top 2 quality streams if available (e.g. 720p and 480p)
        const qualitiesSeen = new Set<string>();
        for (const stream of playable) {
          if (qualitiesSeen.has(stream.quality)) continue;
          qualitiesSeen.add(stream.quality);

          sources.push({
            id: `ia_${doc.identifier}_${stream.quality}`,
            movieId,
            provider: 'internet_archive',
            sourceId: doc.identifier,
            title: metadata.metadata.title || title,
            playbackType: 'direct',
            category: 'full_movie',
            url: stream.url,
            embedUrl: `https://archive.org/embed/${doc.identifier}`,
            quality: stream.quality,
            format: stream.file.format || 'MP4',
            license,
            attribution: 'Internet Archive (Open Access / Public Domain)',
            approved: true,
            verifiedAt: new Date().toISOString(),
          });

          if (qualitiesSeen.size >= 2) break;
        }

        if (sources.length > 0) break; // found verified source for top matched item
      }

      return sources;
    } catch (err: any) {
      console.warn(`[InternetArchive] Source resolution error for ${title}:`, err.message);
      return [];
    }
  }
}

export const internetArchiveAdapter = new InternetArchiveAdapter();
