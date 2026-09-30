import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSlug,
  extractIdFromSlug,
  tmdbAdapter,
} from '../adapters/tmdbAdapter';
import { internetArchiveAdapter } from '../adapters/internetArchiveAdapter';
import { youtubeAdapter } from '../adapters/youtubeAdapter';
import { adminSourceStore } from '../services/adminSourceStore';
import { sourceResolver } from '../services/sourceResolver';
import { NormalizedMovie } from '../types/movie';

test('createSlug and extractIdFromSlug', () => {
  const slug = createSlug('The Shawshank Redemption', 278);
  assert.equal(slug, 'the-shawshank-redemption-278');

  const id = extractIdFromSlug(slug);
  assert.equal(id, 278);

  assert.equal(extractIdFromSlug('550'), 550);
  assert.equal(extractIdFromSlug('fight-club-550'), 550);
});

test('Internet Archive license verification accurately separates legal vs restricted items', () => {
  // Public domain license url
  const pd1 = internetArchiveAdapter.isLegalAndPermitted({
    licenseurl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  });
  assert.equal(pd1.permitted, true);

  // Creative Commons license url
  const cc = internetArchiveAdapter.isLegalAndPermitted({
    licenseurl: 'http://creativecommons.org/licenses/by/4.0/',
  });
  assert.equal(cc.permitted, true);

  // Explicit rights description
  const pdRights = internetArchiveAdapter.isLegalAndPermitted({
    rights: 'This work is in the Public Domain under US Copyright law.',
  });
  assert.equal(pdRights.permitted, true);

  // Verified Public Domain archive collection
  const collPd = internetArchiveAdapter.isLegalAndPermitted({
    collection: 'feature_films',
  });
  assert.equal(collPd.permitted, true);

  // Restricted / All rights reserved item
  const restricted = internetArchiveAdapter.isLegalAndPermitted({
    rights: 'All rights reserved. Reproduction prohibited.',
  });
  assert.equal(restricted.permitted, false);

  // Loan/lending library item
  const loanOnly = internetArchiveAdapter.isLegalAndPermitted({
    rights: 'Restricted 14-day loan only.',
  });
  assert.equal(loanOnly.permitted, false);

  // Unknown / unverified item
  const unknown = internetArchiveAdapter.isLegalAndPermitted({});
  assert.equal(unknown.permitted, false);
});

test('Internet Archive playable file extraction sorts by browser compatibility and quality', () => {
  const sampleMetadata = {
    metadata: {
      identifier: 'night_of_the_living_dead',
      title: 'Night of the Living Dead',
    },
    files: [
      { name: 'night.xml', format: 'Metadata' },
      { name: 'night_sample.mp4', format: 'MPEG4' },
      { name: 'night_360p.mp4', format: 'h.264', height: 360 },
      { name: 'night_720p.mp4', format: 'h.264', height: 720 },
      { name: 'night_480p.mp4', format: 'h.264', height: 480 },
    ],
  };

  const playable = internetArchiveAdapter.extractPlayableFiles(sampleMetadata);
  assert.equal(playable.length, 3);
  assert.equal(playable[0].quality, '720p');
  assert.equal(playable[1].quality, '480p');
  assert.equal(playable[2].quality, '360p');
  assert.match(
    playable[0].url,
    /https:\/\/archive\.org\/download\/night_of_the_living_dead\//,
  );
});

test('YouTube adapter correctly processes and prioritizes official studio trailers from TMDB video keys', () => {
  const sampleVideos = [
    {
      id: '1',
      key: 'clip123',
      name: 'Behind the Scenes',
      site: 'YouTube',
      type: 'Clip',
      official: false,
    },
    {
      id: '2',
      key: 'trailer456',
      name: 'Official Trailer 1',
      site: 'YouTube',
      type: 'Trailer',
      official: true,
    },
    {
      id: '3',
      key: 'teaser789',
      name: 'Teaser Trailer',
      site: 'YouTube',
      type: 'Teaser',
      official: false,
    },
    {
      id: '4',
      key: 'vimeo123',
      name: 'Vimeo Video',
      site: 'Vimeo',
      type: 'Trailer',
      official: true,
    },
  ];

  const sources = youtubeAdapter.fromTmdbVideos(
    sampleVideos,
    'Example Movie',
    100,
  );
  assert.equal(sources.length, 3); // Vimeo filtered out, only YouTube items
  assert.equal(sources[0].sourceId, 'trailer456');
  assert.equal(sources[0].category, 'trailer');
  assert.equal(sources[0].playbackType, 'youtube_embed');
  assert.equal(
    sources[0].embedUrl,
    'https://www.youtube-nocookie.com/embed/trailer456?autoplay=1&enablejsapi=1',
  );
});

test('Admin source management protects against SSRF and validates URLs', () => {
  // Rejects localhost
  assert.throws(() => {
    adminSourceStore.addManualSource({
      tmdbId: 100,
      title: 'Bad Movie',
      sourceProvider: 'manual_verified',
      playbackType: 'direct',
      playbackUrl: 'http://localhost:8080/secret.mp4',
      category: 'full_movie',
      license: 'PD',
      attribution: 'None',
      approved: true,
    });
  }, /private or local network/);

  // Rejects 127.0.0.1
  assert.throws(() => {
    adminSourceStore.addManualSource({
      tmdbId: 100,
      title: 'Bad Movie',
      sourceProvider: 'manual_verified',
      playbackType: 'direct',
      playbackUrl: 'http://127.0.0.1:3000/private',
      category: 'full_movie',
      license: 'PD',
      attribution: 'None',
      approved: true,
    });
  }, /private or local network/);

  // Accepts valid external HTTPS source
  const valid = adminSourceStore.addManualSource({
    tmdbId: 99999,
    title: 'Valid Public Domain Movie',
    sourceProvider: 'manual_verified',
    playbackType: 'direct',
    playbackUrl: 'https://example.com/movies/classic.mp4',
    category: 'full_movie',
    license: 'CC0',
    attribution: 'Example Archive',
    approved: true,
  });

  assert.equal(valid.approved, true);
  assert.equal(valid.playbackType, 'direct');

  // Toggle approval
  const disabled = adminSourceStore.setApproval(valid.id, false);
  assert.equal(disabled?.approved, false);

  // Cleanup
  adminSourceStore.delete(valid.id);
});

test('Watch button logic correctly classifies source priority', async () => {
  // Movie with legal direct source (Night of the Living Dead)
  const mockMovieWithDirect: NormalizedMovie = {
    id: 10331,
    tmdbId: 10331,
    title: 'Night of the Living Dead',
    originalTitle: 'Night of the Living Dead',
    slug: 'night-of-the-living-dead-10331',
    type: 'movie',
    overview: 'Zombies attack a farmhouse.',
    posterUrl: null,
    backdropUrl: null,
    releaseDate: '1968-10-01',
    year: 1968,
    rating: 7.5,
    voteCount: 2000,
    genres: [{ id: 27, name: 'Horror' }],
    runtime: 96,
    cast: [],
    trailers: [],
    similar: [],
    recommended: [],
    freePlayable: false,
    sources: [],
  };

  const resDirect =
    await sourceResolver.resolveMovieSources(mockMovieWithDirect);
  assert.equal(resDirect.freePlayable, true);
  assert.equal(resDirect.watchAction, 'watch_direct');
  assert.ok(resDirect.sources.some((s) => s.playbackType === 'direct'));

  // Movie without free source, but with external providers
  const mockMovieWithProviders: NormalizedMovie = {
    id: 550,
    tmdbId: 550,
    title: 'Fight Club',
    originalTitle: 'Fight Club',
    slug: 'fight-club-550',
    type: 'movie',
    overview: 'An insomniac office worker...',
    posterUrl: null,
    backdropUrl: null,
    releaseDate: '1999-10-15',
    year: 1999,
    rating: 8.4,
    voteCount: 25000,
    genres: [{ id: 18, name: 'Drama' }],
    runtime: 139,
    cast: [],
    trailers: [],
    similar: [],
    recommended: [],
    providers: {
      flatrate: [{ id: 8, name: 'Netflix', logoUrl: '' }],
      rent: [],
      buy: [],
      free: [],
    },
    freePlayable: false,
    sources: [],
  };

  const resProvider = await sourceResolver.resolveMovieSources(
    mockMovieWithProviders,
  );
  assert.equal(resProvider.watchAction, 'where_to_watch');

  // Movie with neither free source nor providers
  const mockBareMovie: NormalizedMovie = {
    id: 99999999,
    tmdbId: 99999999,
    title: 'Obscure Indepedent Movie',
    originalTitle: 'Obscure',
    slug: 'obscure-99999999',
    type: 'movie',
    overview: 'No streams anywhere.',
    posterUrl: null,
    backdropUrl: null,
    releaseDate: '2024-01-01',
    year: 2024,
    rating: 5.0,
    voteCount: 2,
    genres: [],
    runtime: 60,
    cast: [],
    trailers: [],
    similar: [],
    recommended: [],
    freePlayable: false,
    sources: [],
  };

  const resBare = await sourceResolver.resolveMovieSources(mockBareMovie);
  assert.equal(resBare.freePlayable, false);
  assert.equal(resBare.watchAction, 'none');
});

test('AdminAuthService securely authenticates credentials and signs/verifies tokens', () => {
  const { adminAuthService } = require('../services/adminAuthService');

  const { config } = require('../config');
  // Valid credentials
  assert.equal(adminAuthService.verifyCredentials(config.adminUsername, config.adminPassword), true);

  // Invalid credentials
  assert.equal(adminAuthService.verifyCredentials('admin', 'wrongpassword'), false);
  assert.equal(adminAuthService.verifyCredentials('hacker', config.adminPassword), false);
  assert.equal(adminAuthService.verifyCredentials('', ''), false);

  // Token generation
  const token = adminAuthService.generateToken('admin');
  assert.ok(typeof token === 'string' && token.includes('.'));

  // Token verification
  const verification = adminAuthService.verifyToken(token);
  assert.equal(verification.valid, true);
  assert.equal(verification.user?.username, 'admin');
  assert.equal(verification.user?.role, 'admin');

  // Tampered payload verification failure
  const parts = token.split('.');
  const tamperedToken = `eyJ1c2VybmFtZSI6ImhhY2tlciIsInJvbGUiOiJhZG1pbiJ9.${parts[1]}`;
  const tamperedVerification = adminAuthService.verifyToken(tamperedToken);
  assert.equal(tamperedVerification.valid, false);

  // Tampered signature verification failure
  const invalidSigToken = `${parts[0]}.invalidsignature123`;
  assert.equal(adminAuthService.verifyToken(invalidSigToken).valid, false);

  // Malformed token rejection
  assert.equal(adminAuthService.verifyToken('').valid, false);
  assert.equal(adminAuthService.verifyToken('not-a-valid-token').valid, false);
});
