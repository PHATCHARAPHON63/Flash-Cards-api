const validateRequest = (schema) => {
    return (req, res, next) => {
      const options = {
        abortEarly: false, // รวบรวมข้อผิดพลาดทั้งหมด
        allowUnknown: true, // อนุญาตให้มีฟิลด์ที่ไม่ได้ระบุใน schema
        stripUnknown: true // ลบฟิลด์ที่ไม่ได้ระบุใน schema
      };
  
      const { error, value } = schema.validate(req.body, options);
      
      if (error) {
        const errorMessages = error.details.map(detail => ({
          message: detail.message,
          path: detail.path
        }));
        
        return res.status(400).json({ 
          status: 'error',
          message: 'ข้อมูลไม่ถูกต้อง',
          errors: errorMessages
        });
      }
  
      // กำหนดค่าที่ถูกต้องให้กับ req.body
      req.body = value;
      next();
    };
  };
  
  module.exports = validateRequest;