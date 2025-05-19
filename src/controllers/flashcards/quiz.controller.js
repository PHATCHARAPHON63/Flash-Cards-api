// สร้างคอนโทรลเลอร์สำหรับจัดการแบบทดสอบ
const Flashcard = require("../../models/flashcard");
const FlashcardCategory = require("../../models/flashcard_category");
const UserProgress = require("../../models/user_progress");
const LearningStats = require("../../models/learning_stats");

// สร้างแบบทดสอบ
const createQuiz = async (req, res) => {
  try {
    const {
      categoryId,
      questionCount = 10,
      timePerQuestion = 20,
      difficulty,
      quizType,
    } = req.body;

    // ค้นหาคำศัพท์ตามเงื่อนไข
    let flashcards = [];
    let categoryTitle = "คำศัพท์ทั้งหมด";

    // กรณีเลือกเฉพาะหมวดหมู่
    if (categoryId && categoryId !== "all") {
      const category = await FlashcardCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "ไม่พบหมวดหมู่ที่ระบุ" });
      }
      categoryTitle = category.title;
      flashcards = await Flashcard.find({ category_id: categoryId });
    } else {
      // กรณีเลือกทุกหมวดหมู่
      flashcards = await Flashcard.find();
    }

    // กรองตามประเภทแบบทดสอบ
    if (quizType === "studied") {
      // เฉพาะคำที่เคยท่องแล้ว
      const progress = await UserProgress.find({ user_id: req.user._id });
      const flashcardIds = progress.map((p) => p.flashcard_id);
      flashcards = flashcards.filter((card) =>
        flashcardIds.some((id) => id.toString() === card._id.toString())
      );
    } else if (quizType === "favorite") {
      // เฉพาะคำโปรด
      const progress = await UserProgress.find({
        user_id: req.user._id,
        is_favorite: true,
      });
      const flashcardIds = progress.map((p) => p.flashcard_id);
      flashcards = flashcards.filter((card) =>
        flashcardIds.some((id) => id.toString() === card._id.toString())
      );
    } else if (quizType === "difficult") {
      // เฉพาะคำที่ยาก (ตอบผิดบ่อย)
      const progress = await UserProgress.find({
        user_id: req.user._id,
        "review_history.0": { $exists: true },
      });

      // หาคำที่มีอัตราการตอบถูกต่ำ
      const difficultProgressIds = progress
        .filter((p) => {
          const totalAttempts = p.review_history.length;
          if (totalAttempts < 3) return false; // ต้องมีการทบทวนอย่างน้อย 3 ครั้ง

          const successCount = p.review_history.filter((r) => r.result).length;
          const successRate = successCount / totalAttempts;
          return successRate < 0.7; // ต่ำกว่า 70% ถือว่ายาก
        })
        .map((p) => p.flashcard_id);

      flashcards = flashcards.filter((card) =>
        difficultProgressIds.some((id) => id.toString() === card._id.toString())
      );
    }

    // กรองตามระดับความยาก
    if (difficulty && difficulty !== "all") {
      flashcards = flashcards.filter(
        (card) => card.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    // ถ้าไม่มีคำศัพท์ที่ตรงตามเงื่อนไข
    if (flashcards.length < 4) {
      return res.status(400).json({
        message:
          "ไม่มีคำศัพท์เพียงพอสำหรับสร้างแบบทดสอบตามเงื่อนไขที่ระบุ (ต้องการอย่างน้อย 4 คำ)",
      });
    }

    // สุ่มคำศัพท์ตามจำนวนที่ต้องการ
    const shuffledCards = flashcards.sort(() => 0.5 - Math.random());
    const selectedCards = shuffledCards.slice(
      0,
      Math.min(questionCount, flashcards.length)
    );

    // สร้างคำถามพร้อมตัวเลือกหลอก
    const questions = await Promise.all(
      selectedCards.map(async (card) => {
        // ดึงคำศัพท์อื่นสำหรับตัวเลือกหลอก
        const otherCards = flashcards.filter(
          (c) => c._id.toString() !== card._id.toString()
        );
        // สุ่มคำศัพท์สำหรับตัวเลือกหลอก
        const shuffledOthers = otherCards
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);

        // สร้างตัวเลือก
        const options = [
          { id: "a", text: card.back },
          { id: "b", text: shuffledOthers[0]?.back || "ตัวเลือกหลอก 1" },
          { id: "c", text: shuffledOthers[1]?.back || "ตัวเลือกหลอก 2" },
          { id: "d", text: shuffledOthers[2]?.back || "ตัวเลือกหลอก 3" },
        ];

        // สุ่มลำดับตัวเลือก
        const shuffledOptions = options.sort(() => 0.5 - Math.random());

        // หาคำตอบที่ถูกต้อง
        const correctOption = shuffledOptions.find(
          (option) => option.text === card.back
        );

        return {
          id: card._id,
          word: card.front,
          phonetic: card.phonetic || "",
          question: `คำว่า "${card.front}" มีความหมายว่าอะไร?`,
          options: shuffledOptions,
          correctAnswer: correctOption.id,
          example: card.example || "",
        };
      })
    );

    const quiz = {
      id: `quiz-${Date.now()}`,
      title: categoryTitle,
      timePerQuestion,
      questions,
    };

    return res.status(200).json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการสร้างแบบทดสอบ" });
  }
};

// บันทึกผลการทำแบบทดสอบ
const submitQuizResult = async (req, res) => {
  try {
    const { results, totalTime } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: "กรุณาระบุผลการทำแบบทดสอบ" });
    }

    // คำนวณคะแนน
    const totalQuestions = results.length;
    const correctAnswers = results.filter((result) => result.isCorrect).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // บันทึกผลการทบทวนสำหรับแต่ละคำศัพท์
    for (const result of results) {
      // ตรวจสอบว่าคำศัพท์มีอยู่จริง
      const flashcard = await Flashcard.findById(result.questionId);
      if (!flashcard) continue;

      // หาหรือสร้างข้อมูลความก้าวหน้า
      let progress = await UserProgress.findOne({
        user_id: req.user._id,
        flashcard_id: result.questionId,
      });

      if (!progress) {
        progress = new UserProgress({
          user_id: req.user._id,
          flashcard_id: result.questionId,
          level: 0,
          next_review: new Date(),
          last_reviewed: new Date(),
          review_history: [],
        });
      }

      // อัปเดตระดับความรู้
      let newLevel = progress.level;
      if (result.isCorrect) {
        // ถ้าตอบถูก เพิ่มระดับ (สูงสุด 5)
        newLevel = Math.min(5, progress.level + 1);
      } else {
        // ถ้าตอบผิด ลดระดับ (ต่ำสุด 0)
        newLevel = Math.max(0, progress.level - 1);
      }

      // คำนวณเวลาทบทวนครั้งถัดไป
      const now = new Date();
      let nextReviewDate = new Date(now);

      if (newLevel === 0) {
        nextReviewDate.setHours(now.getHours() + 4);
      } else if (newLevel === 1) {
        nextReviewDate.setDate(now.getDate() + 1);
      } else if (newLevel === 2) {
        nextReviewDate.setDate(now.getDate() + 3);
      } else if (newLevel === 3) {
        nextReviewDate.setDate(now.getDate() + 7);
      } else if (newLevel === 4) {
        nextReviewDate.setDate(now.getDate() + 14);
      } else {
        nextReviewDate.setMonth(now.getMonth() + 1);
      }

      // บันทึกประวัติการทบทวน
      progress.review_history.push({
        date: now,
        result: result.isCorrect,
        time_taken: result.timeUsed || 0,
      });

      // อัปเดตข้อมูลความก้าวหน้า
      progress.level = newLevel;
      progress.next_review = nextReviewDate;
      progress.last_reviewed = now;

      await progress.save();
    }

    // อัปเดตสถิติการเรียนรู้
    await updateLearningStatsFromQuiz(req.user._id, results, totalTime);

    return res.status(200).json({
      message: "บันทึกผลการทำแบบทดสอบสำเร็จ",
      score,
      totalQuestions,
      correctAnswers,
    });
  } catch (error) {
    console.error("Error submitting quiz result:", error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการบันทึกผลการทำแบบทดสอบ" });
  }
};

// ฟังก์ชั่นช่วยอัปเดตสถิติการเรียนรู้จากแบบทดสอบ
const updateLearningStatsFromQuiz = async (userId, results, totalTime) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // หาหรือสร้างข้อมูลสถิติ
    let stats = await LearningStats.findOne({ user_id: userId });

    if (!stats) {
      stats = new LearningStats({
        user_id: userId,
        total_cards_seen: 0,
        total_cards_mastered: 0,
        total_study_time: 0,
        streak_days: 0,
        last_study_date: new Date(),
        daily_stats: [],
      });
    }

    // ตรวจสอบ streak
    const lastDate = new Date(stats.last_study_date);
    lastDate.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate.getTime() === yesterday.getTime()) {
      stats.streak_days += 1;
    } else if (lastDate.getTime() < yesterday.getTime()) {
      stats.streak_days = 1;
    }

    // อัปเดตวันที่เรียนล่าสุด
    stats.last_study_date = new Date();

    // เพิ่มจำนวนคำศัพท์ที่ได้เรียน
    stats.total_cards_seen += results.length;

    // เพิ่มจำนวนคำศัพท์ที่จำได้
    const correctCount = results.filter((result) => result.isCorrect).length;
    stats.total_cards_mastered += correctCount;

    // เพิ่มเวลาเรียน (หน่วยเป็นวินาที -> นาที)
    stats.total_study_time += Math.round(totalTime / 60);

    // อัปเดตสถิติรายวัน
    let dailyStat = stats.daily_stats.find(
      (stat) => new Date(stat.date).toDateString() === today.toDateString()
    );

    if (!dailyStat) {
      dailyStat = {
        date: today,
        cards_studied: 0,
        cards_mastered: 0,
        study_time: 0,
        accuracy: 0,
      };
      stats.daily_stats.push(dailyStat);
    }

    const dailyIndex = stats.daily_stats.findIndex(
      (stat) => new Date(stat.date).toDateString() === today.toDateString()
    );

    stats.daily_stats[dailyIndex].cards_studied += results.length;
    stats.daily_stats[dailyIndex].cards_mastered += correctCount;
    stats.daily_stats[dailyIndex].study_time += Math.round(totalTime / 60);

    // คำนวณความแม่นยำ
    stats.daily_stats[dailyIndex].accuracy = Math.round(
      (correctCount / results.length) * 100
    );

    await stats.save();
  } catch (error) {
    console.error("Error updating learning stats from quiz:", error);
  }
};

module.exports = {
  createQuiz,
  submitQuizResult,
};
