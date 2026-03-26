const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

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
    console.error('Error fetching parks:', error);
    res.status(500).json({ error: 'Error fetching parks', details: error instanceof Error ? error.message : error });
  }
});

apiRouter.post('/parks', async (req, res) => {
  try {
    const park = await prisma.park.create({
      data: req.body
    });
    res.status(201).json(park);
  } catch (error) {
    console.error('Error creating park:', error);
    res.status(500).json({ error: 'Error creating park', details: error instanceof Error ? error.message : error });
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
    console.error('Error fetching coasters:', error);
    res.status(500).json({ error: 'Error fetching coasters', details: error instanceof Error ? error.message : error });
  }
});

apiRouter.post('/coasters', async (req, res) => {
  try {
    const coaster = await prisma.coaster.create({
      data: req.body
    });
    res.status(201).json(coaster);
  } catch (error) {
    console.error('Error creating coaster:', error);
    res.status(500).json({ error: 'Error creating coaster', details: error instanceof Error ? error.message : error });
  }
});

// --- OPERATORS ---
apiRouter.get('/operators', async (req, res) => {
  try {
    const operators = await prisma.operator.findMany();
    res.json(operators);
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({ error: 'Error fetching operators', details: error instanceof Error ? error.message : error });
  }
});

apiRouter.post('/operators', async (req, res) => {
  try {
    const operator = await prisma.operator.create({
      data: req.body
    });
    res.status(201).json(operator);
  } catch (error) {
    console.error('Error creating operator:', error);
    res.status(500).json({ error: 'Error creating operator', details: error instanceof Error ? error.message : error });
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
    console.error('Error fetching attractions:', error);
    res.status(500).json({ error: 'Error fetching attractions', details: error instanceof Error ? error.message : error });
  }
});

apiRouter.post('/attractions', async (req, res) => {
  try {
    const attraction = await prisma.attraction.create({
      data: req.body
    });
    res.status(201).json(attraction);
  } catch (error) {
    console.error('Error creating attraction:', error);
    res.status(500).json({ error: 'Error creating attraction', details: error instanceof Error ? error.message : error });
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
    console.error('Error fetching shows:', error);
    res.status(500).json({ error: 'Error fetching shows', details: error instanceof Error ? error.message : error });
  }
});

apiRouter.post('/shows', async (req, res) => {
  try {
    const show = await prisma.show.create({
      data: req.body
    });
    res.status(201).json(show);
  } catch (error) {
    console.error('Error creating show:', error);
    res.status(500).json({ error: 'Error creating show', details: error instanceof Error ? error.message : error });
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
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Error fetching restaurants', details: error instanceof Error ? error.message : error });
  }
});

apiRouter.post('/restaurants', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.create({
      data: req.body
    });
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ error: 'Error creating restaurant', details: error instanceof Error ? error.message : error });
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
