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
    const { coasterId, rideDate, rating, review, coasterData } = req.body;

    if (!coasterId) {
      res.status(400).json({ error: 'coasterId es obligatorio.' });
      return;
    }

    let localCoasterId = coasterId;

    if (coasterData) {
      let coaster = await prisma.coaster.findFirst({ where: { apiId: coasterId } });
      if (!coaster) {
        // Find or create the park first
        let park = await prisma.park.findFirst({ where: { apiId: coasterData.parkApiId } });
        if (!park) {
          const parkName = coasterData.park || 'Parque Desconocido';
          const slugBase = parkName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          park = await prisma.park.create({
            data: {
              name: parkName,
              slug: `${slugBase}-${Date.now()}`,
              country: coasterData.country || 'Desconocido',
              apiId: coasterData.parkApiId || null
            }
          });
        }
        const slugBase = coasterData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        coaster = await prisma.coaster.create({
          data: {
            name: coasterData.name,
            slug: `${slugBase}-${Date.now()}`,
            parkId: park.id,
            manufacturer: coasterData.manufacturer || null,
            apiId: coasterId
          }
        });
      }
      localCoasterId = coaster.id;
    }

    const credit = await prisma.coasterCredit.create({
      data: {
        userId,
        coasterId: localCoasterId,
        rideDate: rideDate ? new Date(rideDate) : new Date(),
        rating,
        review
      },
      include: { coaster: { include: { park: true } } }
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

    let localCoasterId = coasterId;
    const coasterByApiId = await prisma.coaster.findFirst({ where: { apiId: coasterId } });
    if (coasterByApiId) {
      localCoasterId = coasterByApiId.id;
    }

    await prisma.coasterCredit.deleteMany({
      where: { userId, coasterId: localCoasterId }
    });

    res.json({ message: 'Credit eliminado correctamente.' });
  } catch (error: any) {
    console.error('Error deleting credit:', error);
    res.status(500).json({ error: 'Error interno al eliminar el credit.' });
  }
});

// Actualizar número de veces montado (rating field)
router.patch('/credits/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    const { rating } = req.body;

    const credit = await prisma.coasterCredit.updateMany({
      where: { id, userId },
      data: { rating }
    });

    if (credit.count === 0) {
      res.status(404).json({ error: 'Credit no encontrado.' });
      return;
    }

    const updated = await prisma.coasterCredit.findFirst({ where: { id }, include: { coaster: { include: { park: true } } } });
    res.json(updated);
  } catch (error) {
    console.error('Error updating credit count:', error);
    res.status(500).json({ error: 'Error interno al actualizar el credit.' });
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
    const { attractionId, rideDate, rating, attractionData } = req.body;

    if (!attractionId) {
      res.status(400).json({ error: 'attractionId es obligatorio.' });
      return;
    }

    let localAttractionId = attractionId;

    if (attractionData) {
      let attraction = await prisma.attraction.findFirst({ where: { apiId: attractionId } });
      if (!attraction) {
        let park = await prisma.park.findFirst({ where: { apiId: attractionData.parkApiId } });
        if (!park) {
          const parkName = attractionData.park || 'Parque Desconocido';
          const slugBase = parkName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          park = await prisma.park.create({
            data: {
              name: parkName,
              slug: `${slugBase}-${Date.now()}`,
              country: attractionData.country || 'Desconocido',
              apiId: attractionData.parkApiId || null
            }
          });
        }
        const slugBase = attractionData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        attraction = await prisma.attraction.create({
          data: {
            name: attractionData.name,
            slug: `${slugBase}-${Date.now()}`,
            parkId: park.id,
            manufacturer: attractionData.manufacturer || null,
            apiId: attractionId,
            type: 'OTHER'
          }
        });
      }
      localAttractionId = attraction.id;
    }

    const record = await prisma.attractionRecord.create({
      data: {
        userId,
        attractionId: localAttractionId,
        rideDate: rideDate ? new Date(rideDate) : new Date(),
        rating
      },
      include: { attraction: { include: { park: true } } }
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

    let localAttractionId = attractionId;
    const attrByApiId = await prisma.attraction.findFirst({ where: { apiId: attractionId } });
    if (attrByApiId) {
      localAttractionId = attrByApiId.id;
    }

    await prisma.attractionRecord.deleteMany({
      where: { userId, attractionId: localAttractionId }
    });

    res.json({ message: 'Registro de atracción eliminado.' });
  } catch (error: any) {
    console.error('Error deleting attraction:', error);
    res.status(500).json({ error: 'Error interno al eliminar la atracción.' });
  }
});

// Actualizar número de veces visitada (rating field)
router.patch('/attractions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    const { rating } = req.body;

    const record = await prisma.attractionRecord.updateMany({
      where: { id, userId },
      data: { rating }
    });

    if (record.count === 0) {
      res.status(404).json({ error: 'Registro no encontrado.' });
      return;
    }

    const updated = await prisma.attractionRecord.findFirst({ where: { id }, include: { attraction: { include: { park: true } } } });
    res.json(updated);
  } catch (error) {
    console.error('Error updating attraction count:', error);
    res.status(500).json({ error: 'Error interno al actualizar la atracción.' });
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
    const { parkId, visitDate, parkData } = req.body;

    if (!parkId) {
      res.status(400).json({ error: 'parkId es obligatorio.' });
      return;
    }

    let localParkId = parkId;

    if (parkData) {
      // Find or create park based on apiId
      let park = await prisma.park.findFirst({ where: { apiId: parkId } });
      if (!park) {
        park = await prisma.park.create({
          data: {
            name: parkData.name || 'Parque Desconocido',
            slug: (parkData.name || `park-${parkId}`).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            country: parkData.country || 'Desconocido',
            apiId: parkId
          }
        });
      }
      localParkId = park.id;
    }

    const visit = await prisma.parkVisit.create({
      data: {
        userId,
        parkId: localParkId,
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

    let localParkId = parkId;
    const parkByApiId = await prisma.park.findFirst({ where: { apiId: parkId } });
    if (parkByApiId) {
      localParkId = parkByApiId.id;
    }

    await prisma.parkVisit.deleteMany({
      where: {
        userId,
        parkId: localParkId
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
