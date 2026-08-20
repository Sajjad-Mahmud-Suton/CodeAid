import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  feature: String,
  question: String,
  response: String,
  rating: Number,
  feedbackText: String,
  timestamp: { type: Date, default: Date.now }
});

export const Feedback = mongoose.model('Feedback', feedbackSchema);
