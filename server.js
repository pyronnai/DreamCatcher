import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet'
import { initDatabase } from './config/database-init.js';
import pool from './config/database.js';
import dreamsRouter from './routes/dreams.js';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();

/*
Challenge:
  1. Push this code to GitHub.
  hint.md for git command help.
*/

if (process.env.NODE_ENV === 'production'){
  app.use(helmet());
}

const PORT = process.env.PORT || 3001;
 
// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));


// Limit each IP to 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

// health endpoint

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      db: 'connected',
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      message: err.message,
      uptime: process.uptime()
    })
  }
})

// API Routes
app.use('/api/dreams', dreamsRouter);

// Initialize database then start server
(async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();
