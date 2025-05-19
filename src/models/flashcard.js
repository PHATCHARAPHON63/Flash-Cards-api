// src/models/flashcard.js
const mongoose = require("mongoose");

const flashcard_schema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "flashcard_category",
      required: true,
    },
    front: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
    phonetic: {
      type: String,
    },
    part_of_speech: {
      type: String,
      // enum: [
      //   "n.",
      //   "v.",
      //   "adj.",
      //   "adv.",
      //   "prep.",
      //   "conj.",
      //   "pron.",
      //   "interj.",
      //   "art.",
      //   "num.",
      // ],
      default: "n.",
    },
    example: {
      type: String,
    },
    example_translation: {
      type: String,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Flashcard = mongoose.model("flashcard", flashcard_schema);
module.exports = Flashcard;
