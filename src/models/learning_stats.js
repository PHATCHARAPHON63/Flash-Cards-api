// src/models/learning_stats.js
const mongoose = require('mongoose');

const learning_stats_schema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    total_cards_seen: {
      type: Number,
      default: 0
    },
    total_cards_mastered: {
      type: Number,
      default: 0
    },
    total_study_time: {
      type: Number,
      default: 0 // เวลาเรียนสะสมเป็นนาที
    },
    streak_days: {
      type: Number,
      default: 0
    },
    last_study_date: {
      type: Date,
      default: Date.now
    },
    daily_stats: [
      {
        date: {
          type: Date,
          required: true
        },
        cards_studied: {
          type: Number,
          default: 0
        },
        cards_mastered: {
          type: Number,
          default: 0
        },
        study_time: {
          type: Number,
          default: 0 // เวลาเรียนเป็นนาที
        },
        accuracy: {
          type: Number,
          default: 0 // เปอร์เซ็นต์ความแม่นยำ (0-100)
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

const LearningStats = mongoose.model('learning_stats', learning_stats_schema);
module.exports = LearningStats;