const xlsx = require('xlsx');
const fs = require('fs');
const ClassRoom = require('../models/class_room');

// Middleware for reading data from the Excel file
const read_students_excel_data = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Fetch all classrooms from the database
    const class_rooms = await ClassRoom.find();

    const classRoomMap = new Map();
    class_rooms.forEach((item) => {
      const key = `${item.level}/${item.room}`;
      classRoomMap.set(key, item._id);
    });

    // Read the uploaded Excel file
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // 🧼 Filter out empty rows
    const filteredData = data.filter((item) =>
      Object.values(item).some((value) =>
        typeof value === 'string' ? value.trim() !== '' : value != null
      )
    );

    // Function to convert date from dd/mm/yyyy to yyyy-mm-dd
    const reverseDmyToYmd = (dmy) => {
      if (!dmy) return null;
      const dmyPattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      if (!dmyPattern.test(dmy)) {
        console.error('Invalid date format:', dmy);
        return null;
      }

      const [d, m, y] = dmy.split('/');
      const paddedDay = d.padStart(2, '0');
      const paddedMonth = m.padStart(2, '0');
      return `${y}-${paddedMonth}-${paddedDay}`;
    };

    // Helper to trim or convert number to string
    const getTrimmed = (item, key) => {
      const value = item[key];
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'number') return String(value);
      return value;
    };

    const students_array = [];

    // Process each student row
    filteredData.forEach((item) => {
      const classRoomKey = `${item['ระดับชั้นเรียน']}/${item['ห้อง']}`;
      const class_room_id = classRoomMap.get(classRoomKey) || '';

      if (!class_room_id) {
        console.warn(`Classroom mapping missing for key: ${classRoomKey}`);
      }

      const student = {
        id_card: getTrimmed(item, 'เลขประจำตัวประชาชน'),
        student_id: getTrimmed(item, 'รหัสนักเรียน'),
        application_date: reverseDmyToYmd(
          getTrimmed(item, 'วันที่สมัคร(วัน/เดือน/ปี พ.ศ.)')
        ),
        date_of_birth: reverseDmyToYmd(
          getTrimmed(item, 'วันเกิด(วัน/เดือน/ปี พ.ศ.)')
        ),
        prefix: getTrimmed(item, 'คำนำหน้าชื่อ'),
        first_name: getTrimmed(item, 'ชื่อ'),
        last_name: getTrimmed(item, 'นามสกุล'),
        nickname: getTrimmed(item, 'ชื่อเล่น'),
        gender: getTrimmed(item, 'เพศ'),
        phone_number: getTrimmed(item, 'เบอร์โทรศัพท์'),
        email: getTrimmed(item, 'อีเมล'),
        nationality: getTrimmed(item, 'สัญชาติ'),
        ethnicity: getTrimmed(item, 'เชื้อชาติ'),
        religion: getTrimmed(item, 'ศาสนา'),
        home_number: getTrimmed(item, 'บ้านเลขที่'),
        moo: getTrimmed(item, 'หมู่ที่'),
        soi: getTrimmed(item, 'ซอย'),
        road: getTrimmed(item, 'ถนน'),
        tambon: getTrimmed(item, 'ตำบล/แขวง'),
        amphoe: getTrimmed(item, 'อำเภอ/เขต'),
        province: getTrimmed(item, 'จังหวัด'),
        postal_code: getTrimmed(item, 'รหัสไปรษณีย์'),
        relationship: getTrimmed(item, 'ความสัมพันธ์'),
        previous_school: {
          level: getTrimmed(item, 'ระดับชั้นเรียนเดิม'),
          school_name: getTrimmed(item, 'ชื่อสถานศึกษา'),
          school_province: getTrimmed(item, 'จังหวัดสถานศึกษาเดิม'),
          gpa: item['ผลการเรียนเฉลี่ย GPA'],
        },
        class_room: [
          {
            year: getTrimmed(item, 'ปีการศึกษา(พ.ศ.)'),
            semester: getTrimmed(item, 'ภาคการศึกษา(1 หรือ 2)'),
            level: getTrimmed(item, 'ระดับชั้นเรียน'),
            class_room_id: class_room_id,
          },
        ],
      };

      const parent = {
        prefix: getTrimmed(item, 'คำนำหน้าชื่อผู้ปกครอง'),
        first_name: getTrimmed(item, 'ชื่อผู้ปกครอง'),
        last_name: getTrimmed(item, 'นามสกุลผู้ปกครอง'),
        occupation: getTrimmed(item, 'อาชีพ'),
        phone_number: getTrimmed(item, 'เบอร์โทรศัพท์ผู้ปกครอง'),
        email: getTrimmed(item, 'อีเมลผู้ปกครอง'),
        home_number: getTrimmed(item, 'บ้านเลขที่(ผู้ปกครอง)'),
        moo: getTrimmed(item, 'หมู่ที่(ผู้ปกครอง)'),
        soi: getTrimmed(item, 'ซอย(ผู้ปกครอง)'),
        road: getTrimmed(item, 'ถนน(ผู้ปกครอง)'),
        tambon: getTrimmed(item, 'ตำบล/แขวง(ผู้ปกครอง)'),
        amphoe: getTrimmed(item, 'อำเภอ/เขต(ผู้ปกครอง)'),
        province: getTrimmed(item, 'จังหวัด(ผู้ปกครอง)'),
        postal_code: getTrimmed(item, 'รหัสไปรษณีย์(ผู้ปกครอง)'),
      };

      students_array.push({ student, parent, room: item['ห้อง'] });
    });

    req.student_upload_data = students_array;

    // Clean up the file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      } else {
        console.log('Uploaded file deleted successfully');
      }
    });

    console.log('Student excel processed successfully');

    next();
  } catch (error) {
    console.error('Error reading student excel:', error);
    res.status(500).json({
      message: 'Error processing Excel file',
      error: error.message,
    });
  }
};

module.exports = read_students_excel_data;
