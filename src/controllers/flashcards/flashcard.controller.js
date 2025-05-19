// src/controllers/flashcards/flashcard.controller.js
const Flashcard = require("../../models/flashcard");
const FlashcardCategory = require("../../models/flashcard_category");
const UserProgress = require("../../models/user_progress");
const LearningStats = require("../../models/learning_stats");

// ดึงคำศัพท์ทั้งหมดในหมวดหมู่
const getFlashcardsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // ตรวจสอบว่าหมวดหมู่มีอยู่จริง
    const category = await FlashcardCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "ไม่พบหมวดหมู่ที่ระบุ" });
    }

    // ตรวจสอบสิทธิ์การเข้าถึง
    if (
      !category.is_public &&
      category.creator.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "คุณไม่มีสิทธิ์เข้าถึงหมวดหมู่นี้" });
    }

    // ดึงคำศัพท์ทั้งหมดในหมวดหมู่
    const flashcards = await Flashcard.find({ category_id: categoryId });

    // ดึงข้อมูลความก้าวหน้าของผู้ใช้
    const flashcardsWithProgress = await Promise.all(
      flashcards.map(async (card) => {
        const progress = await UserProgress.findOne({
          user_id: req.user._id,
          flashcard_id: card._id,
        });

        return {
          ...card.toObject(),
          progress: progress
            ? {
                level: progress.level,
                is_favorite: progress.is_favorite,
                next_review: progress.next_review,
              }
            : {
                level: 0,
                is_favorite: false,
                next_review: new Date(),
              },
        };
      })
    );

    return res.status(200).json(flashcardsWithProgress);
  } catch (error) {
    console.error("Error getting flashcards:", error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำศัพท์" });
  }
};

const createFlashcard = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      front,
      back,
      phonetic,
      part_of_speech,
      example,
      example_translation,
      difficulty,
    } = req.body;

    // ตรวจสอบสิทธิ์ในการเขียนข้อมูลลงในหมวดหมู่
    const category = await FlashcardCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "ไม่พบหมวดหมู่ที่ระบุ" });
    }

    if (category.creator.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "คุณไม่มีสิทธิ์เพิ่มคำศัพท์ในหมวดหมู่นี้" });
    }

    const newFlashcard = new Flashcard({
      category_id: categoryId,
      front,
      back,
      phonetic,
      part_of_speech,
      example,
      example_translation,
      difficulty,
    });

    await newFlashcard.save();

    return res.status(201).json({
      message: "สร้างคำศัพท์สำเร็จ",
      flashcard: newFlashcard,
    });
  } catch (error) {
    console.error("Error creating flashcard:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำศัพท์" });
  }
};

// ปรับปรุงฟังก์ชัน createMultipleFlashcards เพื่อรองรับข้อมูลเพิ่มเติม
const createMultipleFlashcards = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { cards } = req.body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return res
        .status(400)
        .json({ message: "กรุณาระบุรายการคำศัพท์ที่ต้องการสร้าง" });
    }

    // ตรวจสอบสิทธิ์ในการเขียนข้อมูลลงในหมวดหมู่
    const category = await FlashcardCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "ไม่พบหมวดหมู่ที่ระบุ" });
    }

    if (category.creator.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "คุณไม่มีสิทธิ์เพิ่มคำศัพท์ในหมวดหมู่นี้" });
    }

    // เตรียมข้อมูลสำหรับการบันทึกพร้อมกัน
    const flashcardsToInsert = cards.map((card) => ({
      category_id: categoryId,
      front: card.front,
      back: card.back,
      phonetic: card.phonetic || "",
      part_of_speech: card.part_of_speech || "n.",
      example: card.example || "",
      example_translation: card.example_translation || "",
      difficulty: card.difficulty || "Medium",
    }));

    const insertedFlashcards = await Flashcard.insertMany(flashcardsToInsert);

    return res.status(201).json({
      message: `สร้างคำศัพท์สำเร็จ ${insertedFlashcards.length} คำ`,
      flashcards: insertedFlashcards,
    });
  } catch (error) {
    console.error("Error creating multiple flashcards:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำศัพท์" });
  }
};

// ปรับปรุงฟังก์ชัน updateFlashcard เพื่อรองรับข้อมูลเพิ่มเติม
const updateFlashcard = async (req, res) => {
  try {
    const { flashcardId } = req.params;
    const {
      front,
      back,
      phonetic,
      part_of_speech,
      example,
      example_translation,
      difficulty,
    } = req.body;

    const flashcard = await Flashcard.findById(flashcardId);
    if (!flashcard) {
      return res.status(404).json({ message: "ไม่พบคำศัพท์ที่ต้องการแก้ไข" });
    }

    // ตรวจสอบสิทธิ์ผ่านหมวดหมู่
    const category = await FlashcardCategory.findById(flashcard.category_id);
    if (category.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไขคำศัพท์นี้" });
    }

    const updatedFlashcard = await Flashcard.findByIdAndUpdate(
      flashcardId,
      {
        front,
        back,
        phonetic,
        part_of_speech,
        example,
        example_translation,
        difficulty,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "อัปเดตคำศัพท์สำเร็จ",
      flashcard: updatedFlashcard,
    });
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการอัปเดตคำศัพท์" });
  }
};

// ลบคำศัพท์
const deleteFlashcard = async (req, res) => {
  try {
    const { flashcardId } = req.params;

    const flashcard = await Flashcard.findById(flashcardId);
    if (!flashcard) {
      return res.status(404).json({ message: "ไม่พบคำศัพท์ที่ต้องการลบ" });
    }

    // ตรวจสอบสิทธิ์ผ่านหมวดหมู่
    const category = await FlashcardCategory.findById(flashcard.category_id);
    if (category.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบคำศัพท์นี้" });
    }

    // ลบข้อมูลความก้าวหน้าของผู้ใช้ทุกคนสำหรับคำศัพท์นี้
    await UserProgress.deleteMany({ flashcard_id: flashcardId });

    // ลบคำศัพท์
    await Flashcard.findByIdAndDelete(flashcardId);

    return res.status(200).json({
      message: "ลบคำศัพท์สำเร็จ",
    });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบคำศัพท์" });
  }
};

module.exports = {
  getFlashcardsByCategory,
  createFlashcard,
  createMultipleFlashcards,
  updateFlashcard,
  deleteFlashcard,
};
