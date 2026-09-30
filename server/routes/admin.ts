import { Router, Request, Response } from 'express';
import { adminSourceStore } from '../services/adminSourceStore';
import { adminAuthService } from '../services/adminAuthService';
import { requireAdminAuth, AuthenticatedRequest } from '../middleware/adminAuth';
import { AdminSourcePayload } from '../types/movie';

const router = Router();

// POST /api/admin/login - Authenticate admin credentials
router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const isValid = adminAuthService.verifyCredentials(username, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid admin username or password' });
    }

    const token = adminAuthService.generateToken(username);
    res.json({
      success: true,
      token,
      user: {
        username,
        role: 'admin',
      },
      expiresIn: 86400, // 24 hours in seconds
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication failed', message: err.message });
  }
});

// GET /api/admin/verify - Verify current token authorization
router.get('/verify', requireAdminAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  res.json({
    authenticated: true,
    user: authReq.adminUser,
  });
});

// GET /api/admin/sources - List all sources (Protected)
router.get('/sources', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const sources = adminSourceStore.getAll();
    res.json(sources);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sources', message: err.message });
  }
});

// POST /api/admin/sources - Add manually verified legal source (Protected)
router.post('/sources', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const body = req.body as AdminSourcePayload;
    if (!body.tmdbId || !body.title || !body.playbackUrl || !body.sourceProvider) {
      return res.status(400).json({
        error: 'Missing required fields: tmdbId, title, playbackUrl, and sourceProvider are required',
      });
    }

    const created = adminSourceStore.addManualSource(body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to create source', message: err.message });
  }
});

// PATCH /api/admin/sources/:id/approve - Approve or disable source (Protected)
router.patch('/sources/:id/approve', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const { approved } = req.body;
    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'Field "approved" must be a boolean' });
    }

    const updated = adminSourceStore.setApproval(id, approved);
    if (!updated) {
      return res.status(404).json({ error: 'Source not found' });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update approval', message: err.message });
  }
});

// DELETE /api/admin/sources/:id - Delete source (Protected)
router.delete('/sources/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const deleted = adminSourceStore.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Source not found' });
    }
    res.json({ success: true, message: 'Source deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete source', message: err.message });
  }
});

export default router;
