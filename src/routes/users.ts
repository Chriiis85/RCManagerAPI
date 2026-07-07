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

// Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.userId;
    const { firstName, lastName, profileImage } = req.body;
    const prisma = getPrisma(req);

    if (!currentUserId) {
      res.status(401).json({ error: 'User ID missing from token' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        profileImage: profileImage !== undefined ? profileImage : undefined,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile', details: error instanceof Error ? error.message : error });
  }
});

export default router;
