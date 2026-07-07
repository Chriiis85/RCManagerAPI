import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Helper to get Prisma from app locals (injected in index.ts)
const getPrisma = (req: Request): PrismaClient => (req.app.locals.prisma as PrismaClient);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 🔴 POST /api/auth/register 🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴
router.post('/register', async (req: Request, res: Response) => {
  try {
    let { username, email, password } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
      res.status(400).json({ error: 'username, email y password son obligatorios.' });
      return;
    }
    email = email.toLowerCase().trim();
    username = username.trim();

    if (password.length < 8) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    const prisma = getPrisma(req);

    // Verificar duplicados
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existing) {
      if (existing.email === email) {
        res.status(409).json({ error: 'El email ya está registrado. Si usaste Google o Apple, inicia sesión con ese botón.' });
        return;
      }
      res.status(409).json({ error: 'El nombre de usuario ya está en uso.' });
      return;
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
      select: { id: true, username: true, email: true, role: true, firstName: true, lastName: true, profileImage: true, createdAt: true }
    });

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.status(201).json({
      message: 'Usuario registrado correctamente.',
      token,
      user
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      error: 'Error interno al registrar el usuario.',
      details: error instanceof Error ? error.message : error
    });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email y password son obligatorios.' });
      return;
    }
    
    email = email.toLowerCase().trim();

    const prisma = getPrisma(req);

    // Buscar usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Credenciales incorrectas o usuario no encontrado.' });
      return;
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciales incorrectas. Si creaste tu cuenta con Google o Apple, usa ese botón para entrar.' });
      return;
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      message: 'Sesión iniciada correctamente.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno al iniciar sesión.',
      details: error instanceof Error ? error.message : error
    });
  }
});

// ── POST /api/auth/supabase ──────────────────────────────────────────────────
router.post('/supabase', async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      res.status(400).json({ error: 'access_token es obligatorio.' });
      return;
    }

    const supabaseUrl = 'https://qgxpnuesyxwbexavydnp.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFneHBudWVzeXh3YmV4YXZ5ZG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODU1OTgsImV4cCI6MjA4OTk2MTU5OH0.BrBqXjWINCUdA-CMjw1GlKzkJ0UPWYaicCVNo1RRHHc';

    const supRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        apikey: supabaseAnonKey
      }
    });

    if (!supRes.ok) {
      res.status(401).json({ error: 'Token de Supabase inválido.' });
      return;
    }

    const supUser = await supRes.json();
    const email = supUser.email;
    const username = supUser.user_metadata?.full_name || email.split('@')[0];

    const prisma = getPrisma(req);
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      
      let uniqueUsername = username;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${username}${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          email,
          username: uniqueUsername,
          passwordHash: randomPassword
        }
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      message: 'Sesión iniciada correctamente mediante Supabase.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error en /supabase:', error);
    res.status(500).json({ error: 'Error interno en autenticación Supabase.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
// Ruta protegida: devuelve el perfil del usuario autenticado
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticación requerido.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    let decoded: { userId: number; email: string; role: string };

    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
    } catch {
      res.status(401).json({ error: 'Token inválido o expirado.' });
      return;
    }

    const prisma = getPrisma(req);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, email: true, role: true, firstName: true, lastName: true, profileImage: true, createdAt: true }
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({ error: 'Error interno.' });
  }
});

export default router;
