const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;
require('winston-daily-rotate-file');
const path = require('path');

// กำหนดรูปแบบของข้อความล็อก
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} ${level}: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  }`;
});

// สร้างไฟล์ล็อกรายวัน
const fileRotateTransport = new transports.DailyRotateFile({
  filename: path.join('logs', 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d', // เก็บล็อก 14 วัน
  maxSize: '20m', // ขนาดสูงสุดของไฟล์ล็อก
  zippedArchive: true
});

// สร้าง logger
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // บันทึกล็อกทั้งหมดลงไฟล์
    fileRotateTransport,
    // บันทึกล็อกข้อผิดพลาดลงไฟล์แยกต่างหาก
    new transports.DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      maxSize: '20m',
      zippedArchive: true
    }),
    // แสดงล็อกในคอนโซลเมื่ออยู่ในโหมดพัฒนา
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ],
  exitOnError: false
});

// เพิ่มเมธอดสำหรับบันทึกข้อมูลการเรียก API
logger.logApiRequest = (req, res, next) => {
  const startHrTime = process.hrtime();
  
  // บันทึกข้อมูลเมื่อตอบกลับ
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1000000;
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${elapsedTimeInMs.toFixed(3)}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent') || '-'
    };
    
    // ไม่บันทึกข้อมูลที่ละเอียดอ่อน
    if (req.user) {
      logData.userId = req.user._id;
      logData.userRole = req.user.role;
    }
    
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} [${elapsedTimeInMs.toFixed(3)}ms]`;
    
    // บันทึกตามระดับความสำคัญของสถานะ HTTP
    if (res.statusCode >= 500) {
      logger.error(logMessage, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(logMessage, logData);
    } else {
      logger.info(logMessage, logData);
    }
  });
  
  next();
};

// สร้างโฟลเดอร์สำหรับล็อกถ้ายังไม่มี
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

module.exports = logger;