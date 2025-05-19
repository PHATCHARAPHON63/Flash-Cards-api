// src/controllers/flashcards/category.controller.js
const FlashcardCategory = require('../../models/flashcard_category');
const Flashcard = require('../../models/flashcard');

// ดึงหมวดหมู่ทั้งหมด
const getAllCategories = async (req, res) => {
  try {
    const categories = await FlashcardCategory.find({ 
      $or: [
        { is_public: true },
        { creator: req.user._id }
      ]
    });
    
    // เพิ่มจำนวนคำศัพท์ในแต่ละหมวดหมู่
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Flashcard.countDocuments({ category_id: category._id });
        return {
          ...category.toObject(),
          cardCount: count
        };
      })
    );
    
    return res.status(200).json(categoriesWithCount);
  } catch (error) {
    console.error('Error getting categories:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' });
  }
};

// สร้างหมวดหมู่ใหม่
const createCategory = async (req, res) => {
  try {
    const { title, description, difficulty, color, icon, is_public } = req.body;
    
    const newCategory = new FlashcardCategory({
      title,
      description,
      difficulty,
      color,
      icon,
      creator: req.user._id,
      is_public
    });
    
    await newCategory.save();
    
    return res.status(201).json({
      message: 'สร้างหมวดหมู่สำเร็จ',
      category: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' });
  }
};

// ดึงข้อมูลหมวดหมู่ตาม ID
const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await FlashcardCategory.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่ที่ค้นหา' });
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!category.is_public && category.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงหมวดหมู่นี้' });
    }
    
    // นับจำนวนการ์ด
    const cardCount = await Flashcard.countDocuments({ category_id: categoryId });
    
    return res.status(200).json({
      ...category.toObject(),
      cardCount
    });
  } catch (error) {
    console.error('Error getting category:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' });
  }
};

// อัปเดตหมวดหมู่
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { title, description, difficulty, color, icon, is_public } = req.body;
    
    const category = await FlashcardCategory.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' });
    }
    
    // ตรวจสอบสิทธิ์
    if (category.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขหมวดหมู่นี้' });
    }
    
    const updatedCategory = await FlashcardCategory.findByIdAndUpdate(
      categoryId,
      {
        title,
        description,
        difficulty,
        color,
        icon,
        is_public
      },
      { new: true }
    );
    
    return res.status(200).json({
      message: 'อัปเดตหมวดหมู่สำเร็จ',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่' });
  }
};

// ลบหมวดหมู่
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await FlashcardCategory.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่ที่ต้องการลบ' });
    }
    
    // ตรวจสอบสิทธิ์
    if (category.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบหมวดหมู่นี้' });
    }
    
    // ลบการ์ดทั้งหมดในหมวดหมู่
    await Flashcard.deleteMany({ category_id: categoryId });
    
    // ลบหมวดหมู่
    await FlashcardCategory.findByIdAndDelete(categoryId);
    
    return res.status(200).json({
      message: 'ลบหมวดหมู่และคำศัพท์ทั้งหมดสำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory
};