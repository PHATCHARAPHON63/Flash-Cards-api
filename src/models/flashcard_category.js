const mongoose = require('mongoose');

const flashcard_category_schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    color: {
      type: String,
      default: '#4CAF50'
    },
    icon: {
      type: String,
      default: '📚'
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    is_public: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

const FlashcardCategory = mongoose.model('flashcard_category', flashcard_category_schema);
module.exports = FlashcardCategory;