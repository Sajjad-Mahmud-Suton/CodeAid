import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// Routes
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import executeRoutes from './routes/execute';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CodeAid Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/execute', executeRoutes);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeaid';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error. Starting server without DB:', error.message);
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
