import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import movieRoutes from './routes/movies';
import adminRoutes from './routes/admin';

const app = express();

// Security and CORS
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request Logger (simple dev log)
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Health check
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.appEnv,
    integrations: {
      tmdb: !!config.tmdbApiKey,
      internetArchive: config.enableInternetArchive,
      youtube: config.enableYouTube,
      vimeo: config.enableVimeo,
    },
  });
});

// API Routes (mounted with and without /api prefix for Vercel serverless rewrite compatibility)
app.use('/api/movies', movieRoutes);
app.use('/movies', movieRoutes);
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// Static Angular frontend serving for local production runs (Vercel serves static via CDN)
if (!process.env['VERCEL']) {
  const distDir = path.resolve(process.cwd(), 'dist/movie-search-app/browser');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.path.startsWith('/api') && req.method === 'GET') {
        res.sendFile(path.join(distDir, 'index.html'));
      } else {
        next();
      }
    });
  }
}

// 404 handler for unmatched API routes
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ServerError]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

if (process.env['NODE_ENV'] !== 'test' && !process.env['VERCEL']) {
  app.listen(config.port, () => {
    console.log(`🎬 Movie Explorer Server running on port ${config.port} (${config.appEnv})`);
  });
}

export default app;
