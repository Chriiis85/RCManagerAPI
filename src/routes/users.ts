import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
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

// Helper to generate unique username suggestions
async function generateUniqueUsernames(baseUsername: string, prisma: PrismaClient): Promise<string[]> {
  const suggestions: string[] = [];
  let attempts = 0;
  
  while (suggestions.length < 3 && attempts < 10) {
    const randomSuffix = Math.floor(Math.random() * 1000);
    const suggestion = `${baseUsername}${randomSuffix}`;
    const exists = await prisma.user.findUnique({ where: { username: suggestion } });
    if (!exists) {
      suggestions.push(suggestion);
    }
    attempts++;
  }
  return suggestions;
}

// Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.userId;
    const { firstName, lastName, profileImage, username } = req.body;
    const prisma = getPrisma(req);

    if (!currentUserId) {
      res.status(401).json({ error: 'User ID missing from token' });
      return;
    }

    // Comprobar si quiere cambiar el username y si ya existe
    if (username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser && existingUser.id !== currentUserId) {
        const suggestions = await generateUniqueUsernames(username, prisma);
        res.status(409).json({ 
          error: 'El nombre de usuario ya está en uso.',
          suggestions 
        });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        profileImage: profileImage !== undefined ? profileImage : undefined,
        username: username !== undefined ? username : undefined,
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

// Update or set user password
router.put('/password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId || (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;
    const prisma = getPrisma(req);

    if (!currentUserId) {
      res.status(401).json({ error: 'Usuario no autenticado o token inválido.' });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    // Si el cliente envía la contraseña actual, verificarla
    if (currentPassword) {
      const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordMatch) {
        res.status(400).json({ error: 'La contraseña actual no es correcta.' });
        return;
      }
    }

    // Hashear y guardar la nueva contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: currentUserId },
      data: { passwordHash }
    });

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({
      error: 'Error interno al actualizar la contraseña.',
      details: error instanceof Error ? error.message : error
    });
  }
});

export default router;
