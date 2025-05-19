// src/routes/flashcards/flashcard.routes.js
const express = require("express");
const { user_auth_middleware } = require("../../middlewares/auth.middleware");
const categoryController = require("../../controllers/flashcards/category.controller");
const flashcardController = require("../../controllers/flashcards/flashcard.controller");
const reviewController = require("../../controllers/flashcards/review.controller");
const quizController = require("../../controllers/flashcards/quiz.controller");
const statsController = require("../../controllers/flashcards/stats.controller");
const router = express.Router();

// ต้องการการตรวจสอบตัวตนสำหรับทุก endpoint
router.use(user_auth_middleware);

// หมวดหมู่คำศัพท์
router.get("/categories", categoryController.getAllCategories);
router.post("/categories", categoryController.createCategory);
router.get("/categories/:categoryId", categoryController.getCategoryById);
router.put("/categories/:categoryId", categoryController.updateCategory);
router.delete("/categories/:categoryId", categoryController.deleteCategory);

// คำศัพท์
router.get(
  "/categories/:categoryId/flashcards",
  flashcardController.getFlashcardsByCategory
);
router.post(
  "/categories/:categoryId/flashcards",
  flashcardController.createFlashcard
);
router.post(
  "/categories/:categoryId/flashcards/batch",
  flashcardController.createMultipleFlashcards
);
router.put("/flashcards/:flashcardId", flashcardController.updateFlashcard);
router.delete("/flashcards/:flashcardId", flashcardController.deleteFlashcard);

// การทบทวน
router.get("/review-due", reviewController.getDueReviewCards);
router.post("/review/:flashcardId", reviewController.submitReviewResult);
router.post("/favorite/:flashcardId", reviewController.toggleFavorite);

// แบบทดสอบ
router.post("/quiz", quizController.createQuiz);
router.post("/quiz/submit", quizController.submitQuizResult);

// สถิติการเรียนรู้
router.get("/stats", statsController.getLearningStats);
router.get("/stats/recent", statsController.getRecentStudiedCards);
router.get("/stats/hardest", statsController.getHardestCards);
router.get(
  "/stats/category-distribution",
  statsController.getCategoryDistribution
);
// เพิ่ม Routes ใหม่
router.get("/all-reviewable", reviewController.getAllReviewableCards);
router.post("/add-to-review/:flashcardId", reviewController.addCardToReview);

// แบบทดสอบ
router.post("/quiz", quizController.createQuiz);
router.post("/quiz/submit", quizController.submitQuizResult);
module.exports = router;
