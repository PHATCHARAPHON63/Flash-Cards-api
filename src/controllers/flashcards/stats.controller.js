// src/controllers/flashcards/stats.controller.js
const LearningStats = require('../../models/learning_stats');
const UserProgress = require('../../models/user_progress');
const Flashcard = require('../../models/flashcard');
const FlashcardCategory = require('../../models/flashcard_category');

// ดึงสถิติการเรียนรู้ภาพรวม
const getLearningStats = async (req, res) => {
  try {
    // หาข้อมูลสถิติ
    let stats = await LearningStats.findOne({ user_id: req.user._id });
    
    if (!stats) {
      stats = {
        total_cards_seen: 0,
        total_cards_mastered: 0,
        total_study_time: 0,
        streak_days: 0,
        last_study_date: new Date(),
        daily_stats: []
      };
    }
    
    // นับจำนวนคำศัพท์ที่ต้องทบทวนวันนี้
    const now = new Date();
    const dueCount = await UserProgress.countDocuments({
      user_id: req.user._id,
      next_review: { $lte: now }
    });
    
    // นับจำนวนคำศัพท์ที่เป็นรายการโปรด
    const favoriteCount = await UserProgress.countDocuments({
      user_id: req.user._id,
      is_favorite: true
    });
    
    // นับจำนวนหมวดหมู่ที่เรียน
    const userProgress = await UserProgress.find({ user_id: req.user._id });
    const flashcardIds = userProgress.map(progress => progress.flashcard_id);
    
    // ดึงคำศัพท์เพื่อหาหมวดหมู่
    const flashcards = await Flashcard.find({ _id: { $in: flashcardIds } });
    const categoryIds = [...new Set(flashcards.map(card => card.category_id.toString()))];
    
    return res.status(200).json({
      totalCards: stats.total_cards_seen,
      masteredCards: stats.total_cards_mastered,
      reviewDue: dueCount,
      streakDays: stats.streak_days,
      totalStudyTime: stats.total_study_time, // เวลาเรียนสะสมเป็นนาที
      categoriesLearned: categoryIds.length,
      favoriteCards: favoriteCount,
      lastStudyDate: stats.last_study_date,
      dailyStats: stats.daily_stats
    });
  } catch (error) {
    console.error('Error getting learning stats:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติการเรียนรู้' });
  }
};

// ดึงข้อมูลคำศัพท์ที่เรียนล่าสุด
const getRecentStudiedCards = async (req, res) => {
  try {
    // ดึงข้อมูลความก้าวหน้าเรียงตามเวลาที่ทบทวนล่าสุด
    const recentProgress = await UserProgress.find({
      user_id: req.user._id
    })
    .sort({ last_reviewed: -1 })
    .limit(5);
    
    // ดึงข้อมูลคำศัพท์ที่เกี่ยวข้อง
    const recentCards = await Promise.all(
      recentProgress.map(async (progress) => {
        const card = await Flashcard.findById(progress.flashcard_id);
        if (!card) return null; // กรณีคำศัพท์ถูกลบไปแล้ว
        
        const category = await FlashcardCategory.findById(card.category_id);
        
        // คำนวณเวลาที่ผ่านมา
        const timeDiff = new Date().getTime() - progress.last_reviewed.getTime();
        let timeAgo;
        
        if (timeDiff < 60 * 1000) {
          timeAgo = `${Math.floor(timeDiff / 1000)} วินาทีที่แล้ว`;
        } else if (timeDiff < 60 * 60 * 1000) {
          timeAgo = `${Math.floor(timeDiff / (60 * 1000))} นาทีที่แล้ว`;
        } else if (timeDiff < 24 * 60 * 60 * 1000) {
          timeAgo = `${Math.floor(timeDiff / (60 * 60 * 1000))} ชั่วโมงที่แล้ว`;
        } else {
          timeAgo = `${Math.floor(timeDiff / (24 * 60 * 60 * 1000))} วันที่แล้ว`;
        }
        
        return {
          id: card._id,
          word: card.front,
          phonetic: card.phonetic,
          translation: card.back,
          category: category?.title || 'ไม่ระบุหมวดหมู่',
          timeAgo: timeAgo,
          level: progress.level,
          is_favorite: progress.is_favorite
        };
      })
    );
    
    // กรองกรณีคำศัพท์ถูกลบ
    const filteredCards = recentCards.filter(card => card !== null);
    
    return res.status(200).json(filteredCards);
  } catch (error) {
    console.error('Error getting recent studied cards:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำศัพท์ที่เรียนล่าสุด' });
  }
};

// ดึงข้อมูลคำศัพท์ที่ยากที่สุด
const getHardestCards = async (req, res) => {
  try {
    // ดึงข้อมูลความก้าวหน้าที่มีประวัติการทบทวน
    const userProgress = await UserProgress.find({
      user_id: req.user._id,
      'review_history.0': { $exists: true }  // มีประวัติการทบทวนอย่างน้อย 1 รายการ
    });
    
    // คำนวณอัตราความสำเร็จสำหรับแต่ละคำศัพท์
    const cardsWithDifficulty = userProgress.map(progress => {
      const totalAttempts = progress.review_history.length;
      if (totalAttempts === 0) return null;
      
      const successCount = progress.review_history.filter(review => review.result).length;
      const successRate = (successCount / totalAttempts) * 100;
      
      return {
        progressId: progress._id,
        flashcardId: progress.flashcard_id,
        attempts: totalAttempts,
        success: successCount,
        successRate: successRate
      };
    }).filter(card => card !== null);
    
    // เรียงลำดับตามอัตราความสำเร็จจากน้อยไปมาก
    cardsWithDifficulty.sort((a, b) => a.successRate - b.successRate);
    
    // ดึงข้อมูลคำศัพท์ 5 คำที่ยากที่สุด
    const hardestCards = await Promise.all(
      cardsWithDifficulty.slice(0, 5).map(async (card) => {
        const flashcard = await Flashcard.findById(card.flashcardId);
        if (!flashcard) return null;
        
        return {
          id: flashcard._id,
          word: flashcard.front,
          meaning: flashcard.back,
          attempts: card.attempts,
          success: card.success,
          successRate: Math.round(card.successRate)
        };
      })
    );
    
    // กรองกรณีคำศัพท์ถูกลบ
    const filteredCards = hardestCards.filter(card => card !== null);
    
    return res.status(200).json(filteredCards);
  } catch (error) {
    console.error('Error getting hardest cards:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำศัพท์ที่ยากที่สุด' });
  }
};

// ดึงข้อมูลการกระจายตัวของหมวดหมู่
const getCategoryDistribution = async (req, res) => {
  try {
    // ดึงข้อมูลความก้าวหน้า
    const userProgress = await UserProgress.find({ user_id: req.user._id });
    const flashcardIds = userProgress.map(progress => progress.flashcard_id);
    
    // ดึงคำศัพท์เพื่อหาหมวดหมู่
    const flashcards = await Flashcard.find({ _id: { $in: flashcardIds } });
    
    // นับจำนวนคำศัพท์ในแต่ละหมวดหมู่
    const categoryCounts = {};
    flashcards.forEach(card => {
      const categoryId = card.category_id.toString();
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    });
    
    // ดึงข้อมูลหมวดหมู่
    const categoryIds = Object.keys(categoryCounts);
    const categories = await FlashcardCategory.find({ _id: { $in: categoryIds } });
    
    // สร้างข้อมูลการกระจายตัว
    const distribution = categories.map(category => ({
      name: category.title,
      value: categoryCounts[category._id.toString()],
      color: category.color
    }));
    
    return res.status(200).json(distribution);
  } catch (error) {
    console.error('Error getting category distribution:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการกระจายตัวของหมวดหมู่' });
  }
};

module.exports = {
  getLearningStats,
  getRecentStudiedCards,
  getHardestCards,
  getCategoryDistribution
};