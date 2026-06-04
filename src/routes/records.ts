import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const getPrisma = (req: AuthenticatedRequest): PrismaClient => (req.app.locals.prisma as PrismaClient);

// Proteger todas las rutas de este router
router.use(authenticateToken);

// ── COASTER CREDITS ──────────────────────────────────────────────────────────

// Obtener todos los credits del usuario
router.get('/credits', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;

    const credits = await prisma.coasterCredit.findMany({
      where: { userId },
      include: {
        coaster: {
          include: { park: true }
        }
      },
      orderBy: { rideDate: 'desc' }
    });

    res.json(credits);
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: 'Error interno al obtener credits.' });
  }
});

// Añadir un nuevo credit
router.post('/credits', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;
    const { coasterId, rideDate, rating, review } = req.body;

    if (!coasterId) {
      res.status(400).json({ error: 'coasterId es obligatorio.' });
      return;
    }

    const credit = await prisma.coasterCredit.create({
      data: {
        userId,
        coasterId,
        rideDate: rideDate ? new Date(rideDate) : new Date(),
        rating,
        review
      },
      include: { coaster: true }
    });

    res.status(201).json(credit);
  } catch (error: any) {
    console.error('Error adding credit:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Ya tienes registrado este credit.' });
      return;
    }
    res.status(500).json({ error: 'Error interno al guardar el credit.' });
  }
});

// Eliminar un credit
router.delete('/credits/:coasterId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;
    const coasterId = Number(req.params.coasterId);

    await prisma.coasterCredit.delete({
      where: {
        userId_coasterId: { userId, coasterId }
      }
    });

    res.json({ message: 'Credit eliminado correctamente.' });
  } catch (error: any) {
    console.error('Error deleting credit:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Credit no encontrado.' });
      return;
    }
    res.status(500).json({ error: 'Error interno al eliminar el credit.' });
  }
});

// ── ATTRACTION RECORDS ───────────────────────────────────────────────────────

router.get('/attractions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;

    const records = await prisma.attractionRecord.findMany({
      where: { userId },
      include: {
        attraction: {
          include: { park: true }
        }
      },
      orderBy: { rideDate: 'desc' }
    });

    res.json(records);
  } catch (error) {
    console.error('Error fetching attractions:', error);
    res.status(500).json({ error: 'Error interno al obtener atracciones.' });
  }
});

router.post('/attractions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;
    const { attractionId, rideDate, rating } = req.body;

    if (!attractionId) {
      res.status(400).json({ error: 'attractionId es obligatorio.' });
      return;
    }

    const record = await prisma.attractionRecord.create({
      data: {
        userId,
        attractionId,
        rideDate: rideDate ? new Date(rideDate) : new Date(),
        rating
      },
      include: { attraction: true }
    });

    res.status(201).json(record);
  } catch (error: any) {
    console.error('Error adding attraction record:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Ya tienes registrada esta atracción.' });
      return;
    }
    res.status(500).json({ error: 'Error interno al guardar la atracción.' });
  }
});

router.delete('/attractions/:attractionId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;
    const attractionId = Number(req.params.attractionId);

    await prisma.attractionRecord.delete({
      where: {
        userId_attractionId: { userId, attractionId }
      }
    });

    res.json({ message: 'Registro de atracción eliminado.' });
  } catch (error: any) {
    console.error('Error deleting attraction:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Registro no encontrado.' });
      return;
    }
    res.status(500).json({ error: 'Error interno al eliminar la atracción.' });
  }
});

// ── PARK VISITS ──────────────────────────────────────────────────────────────

router.get('/parks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;

    const visits = await prisma.parkVisit.findMany({
      where: { userId },
      include: { park: true },
      orderBy: { visitDate: 'desc' }
    });

    res.json(visits);
  } catch (error) {
    console.error('Error fetching park visits:', error);
    res.status(500).json({ error: 'Error interno al obtener visitas a parques.' });
  }
});

router.post('/parks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;
    const { parkId, visitDate } = req.body;

    if (!parkId) {
      res.status(400).json({ error: 'parkId es obligatorio.' });
      return;
    }

    const visit = await prisma.parkVisit.create({
      data: {
        userId,
        parkId,
        visitDate: visitDate ? new Date(visitDate) : new Date()
      },
      include: { park: true }
    });

    res.status(201).json(visit);
  } catch (error: any) {
    console.error('Error adding park visit:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Ya tienes registrado este parque.' });
      return;
    }
    res.status(500).json({ error: 'Error interno al guardar la visita.' });
  }
});

router.delete('/parks/:parkId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;
    const parkId = Number(req.params.parkId);

    await prisma.parkVisit.delete({
      where: {
        userId_parkId: { userId, parkId }
      }
    });

    res.json({ message: 'Visita al parque eliminada.' });
  } catch (error: any) {
    console.error('Error deleting park visit:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Visita no encontrada.' });
      return;
    }
    res.status(500).json({ error: 'Error interno al eliminar la visita.' });
  }
});

export default router;
