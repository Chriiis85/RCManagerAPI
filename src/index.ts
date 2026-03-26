import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

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

// Mount the router under /api
app.use('/api', apiRouter);

// Basic welcome route at root
app.get('/', (req, res) => {
  res.send('Welcome to RCManager API. Find the API at <a href="/api">/api</a>');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
