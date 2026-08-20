import express from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

// In-memory fallback if MongoDB is not installed
const mockUsers: any[] = [];

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, using Mock DB for Registration');
      const id = String(mockUsers.length + 1);
      mockUsers.push({ id, username, password });
      const token = jwt.sign({ id }, JWT_SECRET);
      return res.json({ token, user: { id, username } });
    }

    const user = new User({ username, password }); 
    await user.save();
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, username } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, using Mock DB for Login');
      const user = mockUsers.find(u => u.username === username && u.password === password);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id }, JWT_SECRET);
      return res.json({ token, user: { id: user.id, username } });
    }

    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, username } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
