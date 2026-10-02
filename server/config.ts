import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  appEnv: process.env['APP_ENV'] || 'development',
  tmdbApiKey: process.env['TMDB_API_KEY'] || '675b1517e0b53ddcbfb61232248e60cd',
  tmdbAccessToken:
    process.env['TMDB_ACCESS_TOKEN'] ||
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2NzViMTUxN2UwYjUzZGRjYmZiNjEyMzIyNDhlNjBjZCIsIm5iZiI6MTc0MTc0NzU3Mi4xOCwic3ViIjoiNjdkMGY1NzQyN2MzOTYwYzJkMWUxMjBhIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.qOhep7MJyt891FA4mRrznQrE6PQh6NugL8cy4gm33fY',
  youtubeApiKey: process.env['YOUTUBE_API_KEY'] || '',
  vimeoAccessToken: process.env['VIMEO_ACCESS_TOKEN'] || '',
  enableVimeo: process.env['ENABLE_VIMEO'] === 'true',
  enableInternetArchive: process.env['ENABLE_INTERNET_ARCHIVE'] !== 'false',
  enableYouTube: process.env['ENABLE_YOUTUBE'] !== 'false',
  corsOrigin: process.env['CORS_ORIGIN'] || '*',
  adminUsername: process.env['ADMIN_USERNAME'] || 'admin',
  adminPassword: process.env['ADMIN_PASSWORD'] || 'MovieVault2025!',
  adminTokenSecret: process.env['ADMIN_TOKEN_SECRET'] || 'movie-explorer-internal-token-secret-987654321',
};
