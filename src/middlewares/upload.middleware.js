const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads');

// ตรวจสอบว่ามีโฟลเดอร์ uploads หรือไม่ ถ้าไม่มีให้สร้าง
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // กำหนดโฟลเดอร์สำหรับเก็บไฟล์ที่อัปโหลด
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // ตั้งชื่อไฟล์ตามเวลาและชื่อเดิม
  },
});

//*----------------- Filters -----------------------
// กำหนดฟังก์ชันการตรวจสอบไฟล์
const excelFilter = (req, file, cb) => {
  // ตรวจสอบ MIME type ของไฟล์
  if (
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel'
  ) {
    cb(null, true); // อนุญาตให้ไฟล์ Excel ผ่าน
  } else {
    cb(new Error('รองรับเฉพาะไฟล์ excel เท่านั้น'), false); // ถ้าไม่ใช่ไฟล์ Excel
  }
};

// filter for allowing only ZIP files
const zipFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/zip' ||
    file.mimetype === 'application/x-zip-compressed'
  ) {
    cb(null, true); // Allow ZIP files
  } else {
    cb(new Error('รองรับเฉพาะไฟล์ภาพนามสกุล .zip เท่านั้น'), false); // Reject non-ZIP files
  }
};

const imageFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png'
  ) {
    cb(null, true); // อนุญาตให้ไฟล์ภาพผ่าน
  } else {
    cb(
      new Error('รองรับเฉพาะไฟล์ภาพนามสกุล .jpg, .jpeg หรือ .png เท่านั้น'),
      false
    ); // ถ้าไม่ใช่ไฟล์ภาพ
  }
};

//*-------------------------------------------------

const uploadSingleFile = (filter_fn) => {
  const upload = multer({
    storage: storage,
    fileFilter: filter_fn,
    limits: { fileSize: 10 * 1024 * 1024 }, // ขนาดไฟล์สูงสุดที่อนุญาต 10MB
  });

  return (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Handle Multer-specific errors
        return res.status(400).json({ message: err.message });
      } else if (err) {
        // Handle other errors (e.g., file type validation)
        return res.status(400).json({ message: err.message });
      }
      next(); // Proceed to the next middleware if no errors
    });
  };
};

module.exports = {
  uploadSingleFile,
  excelFilter,
  zipFilter,
  imageFilter,
};
