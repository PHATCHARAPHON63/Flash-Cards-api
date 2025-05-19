// src/controllers/flashcards/review.controller.js
const UserProgress = require("../../models/user_progress");
const Flashcard = require("../../models/flashcard");
const LearningStats = require("../../models/learning_stats");

// ดึงคำศัพท์ที่ต้องทบทวนวันนี้
const getDueReviewCards = async (req, res) => {
  try {
    const now = new Date();

    // ดึงข้อมูลความก้าวหน้าของคำศัพท์ที่ถึงเวลาทบทวน
    const dueProgress = await UserProgress.find({
      user_id: req.user._id,
      next_review: { $lte: now },
    }).sort({ next_review: 1 });

    // ดึงข้อมูลคำศัพท์ที่เกี่ยวข้อง
    const dueCards = await Promise.all(
      dueProgress.map(async (progress) => {
        const card = await Flashcard.findById(progress.flashcard_id);
        if (!card) return null; // กรณีคำศัพท์ถูกลบไปแล้ว

        return {
          ...card.toObject(),
          progress: {
            id: progress._id,
            level: progress.level,
            is_favorite: progress.is_favorite,
            next_review: progress.next_review,
            last_reviewed: progress.last_reviewed,
          },
        };
      })
    );

    // กรองกรณีคำศัพท์ถูกลบ
    const filteredDueCards = dueCards.filter((card) => card !== null);

    return res.status(200).json(filteredDueCards);
  } catch (error) {
    console.error("Error getting due review cards:", error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำศัพท์ที่ต้องทบทวน" });
  }
};

// บันทึกผลการทบทวน
const submitReviewResult = async (req, res) => {
  try {
    const { flashcardId } = req.params;
    const { isCorrect, timeTaken } = req.body;

    // ตรวจสอบว่าคำศัพท์มีอยู่จริง
    const flashcard = await Flashcard.findById(flashcardId);
    if (!flashcard) {
      return res.status(404).json({ message: "ไม่พบคำศัพท์ที่ระบุ" });
    }

    // หาหรือสร้างข้อมูลความก้าวหน้า
    let progress = await UserProgress.findOne({
      user_id: req.user._id,
      flashcard_id: flashcardId,
    });

    if (!progress) {
      progress = new UserProgress({
        user_id: req.user._id,
        flashcard_id: flashcardId,
        level: 0,
        next_review: new Date(),
        last_reviewed: new Date(),
        review_history: [],
      });
    }

    // คำนวณระดับความรู้ใหม่
    let newLevel = progress.level;
    if (isCorrect) {
      // ถ้าตอบถูก เพิ่มระดับ (สูงสุด 5)
      newLevel = Math.min(5, progress.level + 1);
    } else {
      // ถ้าตอบผิด ลดระดับ (ต่ำสุด 0)
      newLevel = Math.max(0, progress.level - 1);
    }

    // คำนวณเวลาทบทวนครั้งถัดไปตามระดับ
    const now = new Date();
    let nextReviewDate = new Date(now);

    if (newLevel === 0) {
      // ระดับ 0: ทบทวนใน 4 ชั่วโมง
      nextReviewDate.setHours(now.getHours() + 4);
    } else if (newLevel === 1) {
      // ระดับ 1: ทบทวนในวันถัดไป
      nextReviewDate.setDate(now.getDate() + 1);
    } else if (newLevel === 2) {
      // ระดับ 2: ทบทวนใน 3 วัน
      nextReviewDate.setDate(now.getDate() + 3);
    } else if (newLevel === 3) {
      // ระดับ 3: ทบทวนใน 1 สัปดาห์
      nextReviewDate.setDate(now.getDate() + 7);
    } else if (newLevel === 4) {
      // ระดับ 4: ทบทวนใน 2 สัปดาห์
      nextReviewDate.setDate(now.getDate() + 14);
    } else {
      // ระดับ 5: ทบทวนใน 1 เดือน
      nextReviewDate.setMonth(now.getMonth() + 1);
    }

    // บันทึกประวัติการทบทวน
    progress.review_history.push({
      date: now,
      result: isCorrect,
      time_taken: timeTaken,
    });

    // อัปเดตข้อมูลความก้าวหน้า
    progress.level = newLevel;
    progress.next_review = nextReviewDate;
    progress.last_reviewed = now;

    await progress.save();

    // อัปเดตสถิติการเรียนรู้
    await updateLearningStats(req.user._id, isCorrect, timeTaken);

    return res.status(200).json({
      message: "บันทึกผลการทบทวนสำเร็จ",
      progress: {
        level: progress.level,
        next_review: progress.next_review,
        last_reviewed: progress.last_reviewed,
      },
    });
  } catch (error) {
    console.error("Error submitting review result:", error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการบันทึกผลการทบทวน" });
  }
};

// ฟังก์ชั่นช่วยอัปเดตสถิติการเรียนรู้
const updateLearningStats = async (userId, isCorrect, timeTaken) => {
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
      // เรียนต่อเนื่องจากเมื่อวาน เพิ่ม streak
      stats.streak_days += 1;
    } else if (lastDate.getTime() < yesterday.getTime()) {
      // ขาดช่วง เริ่มนับ streak ใหม่
      stats.streak_days = 1;
    }
    // ถ้าเป็นวันเดียวกัน ไม่ต้องเปลี่ยน streak

    // อัปเดตวันที่เรียนล่าสุด
    stats.last_study_date = new Date();

    // เพิ่มจำนวนคำศัพท์ที่ได้เรียน
    stats.total_cards_seen += 1;

    // เพิ่มเวลาเรียน (หน่วยเป็นวินาที -> นาที)
    stats.total_study_time += Math.round(timeTaken / 60);

    // อัปเดตสถิติรายวัน
    let dailyStat = stats.daily_stats.find(
      (stat) => new Date(stat.date).toDateString() === today.toDateString()
    );

    if (!dailyStat) {
      // ถ้ายังไม่มีสถิติของวันนี้ ให้สร้างใหม่
      dailyStat = {
        date: today,
        cards_studied: 0,
        cards_mastered: 0,
        study_time: 0,
        accuracy: 0,
      };
      stats.daily_stats.push(dailyStat);
    }

    // อัปเดตสถิติของวันนี้
    const dailyIndex = stats.daily_stats.findIndex(
      (stat) => new Date(stat.date).toDateString() === today.toDateString()
    );

    stats.daily_stats[dailyIndex].cards_studied += 1;
    stats.daily_stats[dailyIndex].study_time += Math.round(timeTaken / 60);

    // คำนวณความแม่นยำ
    const totalAnswers =
      (stats.daily_stats[dailyIndex].accuracy *
        (stats.daily_stats[dailyIndex].cards_studied - 1)) /
      100;
    const correctAnswers = isCorrect ? totalAnswers + 1 : totalAnswers;
    stats.daily_stats[dailyIndex].accuracy = Math.round(
      (correctAnswers / stats.daily_stats[dailyIndex].cards_studied) * 100
    );

    if (isCorrect) {
      stats.daily_stats[dailyIndex].cards_mastered += 1;
      stats.total_cards_mastered += 1;
    }

    await stats.save();
  } catch (error) {
    console.error("Error updating learning stats:", error);
  }
};

// ตั้งค่าเป็นรายการโปรด
const toggleFavorite = async (req, res) => {
  try {
    const { flashcardId } = req.params;

    // ตรวจสอบว่าคำศัพท์มีอยู่จริง
    const flashcard = await Flashcard.findById(flashcardId);
    if (!flashcard) {
      return res.status(404).json({ message: "ไม่พบคำศัพท์ที่ระบุ" });
    }

    // หาหรือสร้างข้อมูลความก้าวหน้า
    let progress = await UserProgress.findOne({
      user_id: req.user._id,
      flashcard_id: flashcardId,
    });

    if (!progress) {
      progress = new UserProgress({
        user_id: req.user._id,
        flashcard_id: flashcardId,
        level: 0,
        next_review: new Date(),
        last_reviewed: new Date(),
        is_favorite: false,
        review_history: [],
      });
    }

    // สลับสถานะรายการโปรด
    progress.is_favorite = !progress.is_favorite;

    await progress.save();

    return res.status(200).json({
      message: `${
        progress.is_favorite ? "เพิ่มเข้า" : "ลบออกจาก"
      }รายการโปรดสำเร็จ`,
      is_favorite: progress.is_favorite,
    });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการจัดการรายการโปรด" });
  }
};
// เพิ่มฟังก์ชันใหม่สำหรับดึงคำศัพท์ทั้งหมดโดยไม่จำกัดเวลาทบทวน
const getAllReviewableCards = async (req, res) => {
  try {
    // ดึงข้อมูลความก้าวหน้าของผู้ใช้
    const userProgress = await UserProgress.find({ user_id: req.user._id })
      .sort({ last_reviewed: -1 }) // เรียงตามเวลาที่ทบทวนล่าสุด
      .limit(100); // จำกัดจำนวนเพื่อประสิทธิภาพ

    // ถ้าไม่มีข้อมูลความก้าวหน้าเลย ให้สร้างข้อมูลเริ่มต้นจากคำศัพท์ล่าสุด
    if (userProgress.length === 0) {
      // ดึงคำศัพท์ล่าสุด 10 คำ
      const recentFlashcards = await Flashcard.find()
        .sort({ created_at: -1 })
        .limit(10);

      // สร้างข้อมูลความก้าวหน้าเริ่มต้น
      for (const card of recentFlashcards) {
        await UserProgress.create({
          user_id: req.user._id,
          flashcard_id: card._id,
          level: 0,
          next_review: new Date(), // ให้ทบทวนได้ทันที
          last_reviewed: new Date(),
          review_history: [],
          is_favorite: false,
        });
      }

      // ดึงข้อมูลความก้าวหน้าอีกครั้ง
      return await getAllReviewableCards(req, res);
    }

    // ดึงข้อมูลคำศัพท์ตาม flashcard_id
    const flashcardIds = userProgress.map((progress) => progress.flashcard_id);
    const flashcards = await Flashcard.find({ _id: { $in: flashcardIds } });

    // รวมข้อมูลคำศัพท์และความก้าวหน้าเข้าด้วยกัน
    const cardsWithProgress = flashcards.map((card) => {
      const progress = userProgress.find(
        (p) => p.flashcard_id.toString() === card._id.toString()
      );

      return {
        ...card.toObject(),
        progress: {
          id: progress._id,
          level: progress.level,
          is_favorite: progress.is_favorite,
          next_review: progress.next_review,
          last_reviewed: progress.last_reviewed,
          is_due: progress.next_review <= new Date(),
        },
      };
    });

    return res.status(200).json(cardsWithProgress);
  } catch (error) {
    console.error("Error getting reviewable cards:", error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำศัพท์" });
  }
};

// ฟังก์ชันสำหรับเพิ่มคำศัพท์ไปยังรายการทบทวน
const addCardToReview = async (req, res) => {
  try {
    const { flashcardId } = req.params;

    // ตรวจสอบว่าคำศัพท์มีอยู่จริง
    const flashcard = await Flashcard.findById(flashcardId);
    if (!flashcard) {
      return res.status(404).json({ message: "ไม่พบคำศัพท์ที่ระบุ" });
    }

    // ตรวจสอบว่ามีข้อมูลความก้าวหน้าแล้วหรือไม่
    let progress = await UserProgress.findOne({
      user_id: req.user._id,
      flashcard_id: flashcardId,
    });

    if (!progress) {
      // สร้างข้อมูลความก้าวหน้าใหม่
      progress = new UserProgress({
        user_id: req.user._id,
        flashcard_id: flashcardId,
        level: 0,
        next_review: new Date(), // ให้ทบทวนได้ทันที
        last_reviewed: new Date(),
        review_history: [],
        is_favorite: false,
      });

      await progress.save();

      return res.status(201).json({
        message: "เพิ่มคำศัพท์ไปยังรายการทบทวนสำเร็จ",
        progress,
      });
    } else {
      // อัปเดตเวลาทบทวนให้เป็นปัจจุบัน
      progress.next_review = new Date();
      await progress.save();

      return res.status(200).json({
        message: "อัปเดตเวลาทบทวนสำเร็จ",
        progress,
      });
    }
  } catch (error) {
    console.error("Error adding card to review:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มคำศัพท์" });
  }
};
module.exports = {
  getDueReviewCards,
  submitReviewResult,
  toggleFavorite,
  addCardToReview,
  getAllReviewableCards,
};
