// src/models/user_progress.js
const mongoose = require('mongoose');

const user_progress_schema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    flashcard_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'flashcard',
      required: true
    },
    level: {
      type: Number,
      default: 0, // 0-5 ระดับความรู้
      min: 0,
      max: 5
    },
    next_review: {
      type: Date,
      default: Date.now
    },
    last_reviewed: {
      type: Date,
      default: Date.now
    },
    is_favorite: {
      type: Boolean,
      default: false
    },
    review_history: [
      {
        date: {
          type: Date,
          default: Date.now
        },
        result: {
          type: Boolean, // true = จำได้, false = จำไม่ได้
          required: true
        },
        time_taken: {
          type: Number, // เวลาที่ใช้ตอบเป็นวินาที
          default: 0
        }
      }
    ]
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

const UserProgress = mongoose.model('user_progress', user_progress_schema);
module.exports = UserProgress;
