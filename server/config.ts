import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  appEnv: process.env['APP_ENV'] || 'development',
  tmdbApiKey: process.env['TMDB_API_KEY'] || '675b1517e0b53ddcbfb61232248e60cd',
  tmdbAccessToken: process.env['TMDB_ACCESS_TOKEN'] || '',
  youtubeApiKey: process.env['YOUTUBE_API_KEY'] || '',
  vimeoAccessToken: process.env['VIMEO_ACCESS_TOKEN'] || '',
  enableVimeo: process.env['ENABLE_VIMEO'] === 'true',
  enableInternetArchive: process.env['ENABLE_INTERNET_ARCHIVE'] !== 'false',
  enableYouTube: process.env['ENABLE_YOUTUBE'] !== 'false',
  corsOrigin: process.env['CORS_ORIGIN'] || '*',
  adminUsername: process.env['ADMIN_USERNAME'] || 'admin',
  adminPassword: process.env['ADMIN_PASSWORD'] || 'MovieVault2025!#Secure',
  adminTokenSecret: process.env['ADMIN_TOKEN_SECRET'] || 'movie-explorer-internal-token-secret-987654321',
};
