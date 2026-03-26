import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Configure environment variables
dotenv.config();

const app = express();

// Initialize PostgreSQL driver adapter (Required for Prisma 7)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Create an API router
const apiRouter = express.Router();

// Root route of the API
apiRouter.get('/', (req, res) => {
  res.json({ message: 'RCManager API is running!', status: 'OK' });
});

// --- PARKS ---
apiRouter.get('/parks', async (req, res) => {
  try {
    const parks = await prisma.park.findMany({
      include: { operator: true }
    });
    res.json(parks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching parks', details: error });
  }
});

apiRouter.post('/parks', async (req, res) => {
  try {
    const park = await prisma.park.create({
      data: req.body
    });
    res.status(201).json(park);
  } catch (error) {
    res.status(500).json({ error: 'Error creating park', details: error });
  }
});

// --- COASTERS ---
apiRouter.get('/coasters', async (req, res) => {
  try {
    const coasters = await prisma.coaster.findMany({
      include: { park: true }
    });
    res.json(coasters);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching coasters', details: error });
  }
});

apiRouter.post('/coasters', async (req, res) => {
  try {
    const coaster = await prisma.coaster.create({
      data: req.body
    });
    res.status(201).json(coaster);
  } catch (error) {
    res.status(500).json({ error: 'Error creating coaster', details: error });
  }
});

// --- OPERATORS ---
apiRouter.get('/operators', async (req, res) => {
  try {
    const operators = await prisma.operator.findMany();
    res.json(operators);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching operators', details: error });
  }
});

apiRouter.post('/operators', async (req, res) => {
  try {
    const operator = await prisma.operator.create({
      data: req.body
    });
    res.status(201).json(operator);
  } catch (error) {
    res.status(500).json({ error: 'Error creating operator', details: error });
  }
});

// --- ATTRACTIONS ---
apiRouter.get('/attractions', async (req, res) => {
  try {
    const attractions = await prisma.attraction.findMany({
      include: { park: true }
    });
    res.json(attractions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching attractions', details: error });
  }
});

apiRouter.post('/attractions', async (req, res) => {
  try {
    const attraction = await prisma.attraction.create({
      data: req.body
    });
    res.status(201).json(attraction);
  } catch (error) {
    res.status(500).json({ error: 'Error creating attraction', details: error });
  }
});

// --- SHOWS ---
apiRouter.get('/shows', async (req, res) => {
  try {
    const shows = await prisma.show.findMany({
      include: { park: true }
    });
    res.json(shows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching shows', details: error });
  }
});

apiRouter.post('/shows', async (req, res) => {
  try {
    const show = await prisma.show.create({
      data: req.body
    });
    res.status(201).json(show);
  } catch (error) {
    res.status(500).json({ error: 'Error creating show', details: error });
  }
});

// --- RESTAURANTS ---
apiRouter.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: { park: true }
    });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching restaurants', details: error });
  }
});

apiRouter.post('/restaurants', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.create({
      data: req.body
    });
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Error creating restaurant', details: error });
  }
});

// Mount the router under /api
app.use('/api', apiRouter);

// Serve dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
  });
}

module.exports = app;
