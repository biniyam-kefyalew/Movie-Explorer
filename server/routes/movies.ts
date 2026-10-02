import { Router, Request, Response } from 'express';
import { tmdbAdapter, extractIdFromSlug } from '../adapters/tmdbAdapter';
import { sourceResolver } from '../services/sourceResolver';
import { adminSourceStore } from '../services/adminSourceStore';
import { NormalizedMoviePreview, PaginatedResult } from '../types/movie';

const router = Router();

// Helper to filter free playable items from preview list
function markFreePlayablePreviews(previews: NormalizedMoviePreview[]): NormalizedMoviePreview[] {
  const verifiedIds = new Set(adminSourceStore.getAll().filter((s) => s.approved).map((s) => Number(s.movieId)));
  return previews.map((p) => ({
    ...p,
    freePlayable: verifiedIds.has(p.id) || verifiedIds.has(p.tmdbId),
  }));
}

function getFallbackPreviews(): NormalizedMoviePreview[] {
  const verifiedSources = adminSourceStore.getAll().filter((s) => s.approved && s.category === 'full_movie');
  return verifiedSources.map((s) => ({
    id: Number(s.movieId),
    tmdbId: Number(s.movieId),
    title: s.title.replace(/ - Full (Movie|Restored Feature|Silent Masterpiece).*$/i, '').trim(),
    slug: `${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${s.movieId}`,
    overview: 'Pre-verified classic movie streaming legally via public domain archive.',
    posterUrl: s.url ? 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop' : null,
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop',
    releaseDate: '1968-10-01',
    year: 1968,
    rating: 8.0,
    voteCount: 1500,
    genres: [{ id: 27, name: 'Classic' }],
    type: 'movie',
    freePlayable: true,
  }));
}

// GET /api/movies/hero - Returns popular/trending movies enriched with trailer keys for the slideshow
router.get('/hero', async (_req: Request, res: Response) => {
  try {
    const movies = await tmdbAdapter.getHeroMovies();
    res.json(markFreePlayablePreviews(movies));
  } catch (err: any) {
    console.warn('[MoviesRouter] getHeroMovies failed, using fallback:', err.message);
    res.json(getFallbackPreviews());
  }
});

// GET /api/movies/latest
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query['page'] as string) || '1', 10);
    const genre = req.query['genre'] as string;
    const year = req.query['year'] as string;
    const minRating = req.query['minRating'] as string;
    const maxRating = req.query['maxRating'] as string;
    const sortBy = req.query['sortBy'] as string;
    const freeOnly = req.query['freeOnly'] === 'true';

    const result = await tmdbAdapter.getLatest(page, {
      genre,
      year,
      minRating,
      maxRating,
      sortBy,
    });
    let enriched = markFreePlayablePreviews(result.results);

    if (freeOnly) {
      enriched = enriched.filter((m) => m.freePlayable);
    }

    res.json({
      ...result,
      results: enriched,
    });
  } catch (err: any) {
    console.warn('[MoviesRouter] getLatest failed, using fallback:', err.message);
    const fallbacks = getFallbackPreviews();
    res.json({
      page: 1,
      totalPages: 1,
      totalResults: fallbacks.length,
      results: fallbacks,
    });
  }
});

// GET /api/movies/trending
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query['page'] as string) || '1', 10);
    const timeWindow = (req.query['timeWindow'] as string) || 'day';
    const result = await tmdbAdapter.getTrending(timeWindow, page);
    res.json({
      ...result,
      results: markFreePlayablePreviews(result.results),
    });
  } catch (err: any) {
    console.warn('[MoviesRouter] getTrending failed, using fallback:', err.message);
    const fallbacks = getFallbackPreviews();
    res.json({
      page: 1,
      totalPages: 1,
      totalResults: fallbacks.length,
      results: fallbacks,
    });
  }
});

// GET /api/movies/popular
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query['page'] as string) || '1', 10);
    const result = await tmdbAdapter.getPopular(page);
    res.json({
      ...result,
      results: markFreePlayablePreviews(result.results),
    });
  } catch (err: any) {
    console.warn('[MoviesRouter] getPopular failed, using fallback:', err.message);
    const fallbacks = getFallbackPreviews();
    res.json({
      page: 1,
      totalPages: 1,
      totalResults: fallbacks.length,
      results: fallbacks,
    });
  }
});

// GET /api/movies/top-rated
router.get('/top-rated', async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query['page'] as string) || '1', 10);
    const result = await tmdbAdapter.getTopRated(page);
    res.json({
      ...result,
      results: markFreePlayablePreviews(result.results),
    });
  } catch (err: any) {
    console.warn('[MoviesRouter] getTopRated failed, using fallback:', err.message);
    const fallbacks = getFallbackPreviews();
    res.json({
      page: 1,
      totalPages: 1,
      totalResults: fallbacks.length,
      results: fallbacks,
    });
  }
});

// GET /api/movies/now-playing
router.get('/now-playing', async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query['page'] as string) || '1', 10);
    const result = await tmdbAdapter.getNowPlaying(page);
    res.json({
      ...result,
      results: markFreePlayablePreviews(result.results),
    });
  } catch (err: any) {
    console.warn('[MoviesRouter] getNowPlaying failed, using fallback:', err.message);
    const fallbacks = getFallbackPreviews();
    res.json({
      page: 1,
      totalPages: 1,
      totalResults: fallbacks.length,
      results: fallbacks,
    });
  }
});

// GET /api/movies/upcoming
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query['page'] as string) || '1', 10);
    const result = await tmdbAdapter.getUpcoming(page);
    res.json({
      ...result,
      results: markFreePlayablePreviews(result.results),
    });
  } catch (err: any) {
    console.warn('[MoviesRouter] getUpcoming failed, using fallback:', err.message);
    const fallbacks = getFallbackPreviews();
    res.json({
      page: 1,
      totalPages: 1,
      totalResults: fallbacks.length,
      results: fallbacks,
    });
  }
});

// GET /api/movies/free-movies (Verified Legal Full Movies Available for Streaming)
router.get('/free-movies', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query['page'] as string || '1', 10);
    const verifiedSources = adminSourceStore.getAll().filter((s) => s.approved && s.category === 'full_movie');
    const movieIds = Array.from(new Set(verifiedSources.map((s) => Number(s.movieId))));

    // Fetch movie details for each verified item
    const movies = await Promise.all(
      movieIds.map(async (id) => {
        try {
          const detail = await tmdbAdapter.getMovieDetails(id);
          if (!detail) return null;
          return {
            id: detail.id,
            tmdbId: detail.tmdbId,
            title: detail.title,
            slug: detail.slug,
            overview: detail.overview,
            posterUrl: detail.posterUrl,
            backdropUrl: detail.backdropUrl,
            releaseDate: detail.releaseDate,
            year: detail.year,
            rating: detail.rating,
            voteCount: detail.voteCount,
            genres: detail.genres,
            freePlayable: true,
            type: 'movie' as const,
          };
        } catch {
          return null;
        }
      })
    );

    const validMovies = movies.filter((m): m is NormalizedMoviePreview => m !== null);
    const pageSize = 12;
    const startIndex = (page - 1) * pageSize;
    const paginated = validMovies.slice(startIndex, startIndex + pageSize);

    const result: PaginatedResult<NormalizedMoviePreview> = {
      page,
      totalPages: Math.max(1, Math.ceil(validMovies.length / pageSize)),
      totalResults: validMovies.length,
      results: paginated,
    };

    res.json(result);
  } catch (err: any) {
    console.error('Error fetching free movies:', err);
    res.status(500).json({ error: 'Failed to fetch free movies', message: err.message });
  }
});

// GET /api/movies/genres
router.get('/genres', async (_req: Request, res: Response) => {
  try {
    const genres = await tmdbAdapter.getGenres();
    res.json(genres);
  } catch (err: any) {
    console.error('Error fetching genres:', err);
    res.status(500).json({ error: 'Failed to fetch genres', message: err.message });
  }
});

// GET /api/movies/search?q=
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query['q'] as string || '').trim();
    if (!query) {
      return res.json({ page: 1, totalPages: 0, totalResults: 0, results: [] });
    }

    const page = parseInt(req.query['page'] as string || '1', 10);
    const result = await tmdbAdapter.searchMulti(query, page);

    res.json({
      ...result,
      results: markFreePlayablePreviews(result.results),
    });
  } catch (err: any) {
    console.error('Error searching movies:', err);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const movieId = extractIdFromSlug(req.params['id'] as string);
    if (!movieId) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    const movie = await tmdbAdapter.getMovieDetails(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const enrichedMovie = await sourceResolver.enrichMovie(movie);
    res.json(enrichedMovie);
  } catch (err: any) {
    console.error(`Error fetching movie ${req.params['id']}:`, err);
    res.status(500).json({ error: 'Failed to fetch movie details', message: err.message });
  }
});

// GET /api/movies/:id/sources
router.get('/:id/sources', async (req: Request, res: Response) => {
  try {
    const movieId = extractIdFromSlug(req.params['id'] as string);
    if (!movieId) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    const movie = await tmdbAdapter.getMovieDetails(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const resolution = await sourceResolver.resolveMovieSources(movie);
    res.json(resolution);
  } catch (err: any) {
    console.error(`Error resolving sources for ${req.params['id']}:`, err);
    res.status(500).json({ error: 'Failed to resolve sources', message: err.message });
  }
});

// GET /api/movies/:id/trailers
router.get('/:id/trailers', async (req: Request, res: Response) => {
  try {
    const movieId = extractIdFromSlug(req.params['id'] as string);
    const movie = await tmdbAdapter.getMovieDetails(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie.trailers);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch trailers', message: err.message });
  }
});

// GET /api/movies/:id/providers
router.get('/:id/providers', async (req: Request, res: Response) => {
  try {
    const movieId = extractIdFromSlug(req.params['id'] as string);
    const movie = await tmdbAdapter.getMovieDetails(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie.providers || null);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch providers', message: err.message });
  }
});

export default router;
