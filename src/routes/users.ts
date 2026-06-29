import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const getPrisma = (req: Request): PrismaClient => (req.app.locals.prisma as PrismaClient);

// Search users by username (excluding the current user)
router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const currentUserId = (req as any).user.id;
    const prisma = getPrisma(req);

    if (!q || q.length < 2) {
      res.json([]);
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        username: { contains: q, mode: 'insensitive' },
        id: { not: currentUserId }
      },
      select: { id: true, username: true },
      take: 10
    });

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Error searching users', details: error instanceof Error ? error.message : error });
  }
});

export default router;
