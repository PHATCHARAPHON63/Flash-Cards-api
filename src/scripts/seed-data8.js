const mongoose = require("mongoose");
const FlashcardCategory = require("../models/flashcard_category");
const Flashcard = require("../models/flashcard");
require("dotenv").config();

// Database connection (unchanged)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    });
    console.log("🚀 MongoDB เชื่อมต่อสำเร็จ");
  } catch (error) {
    console.error("❌ การเชื่อมต่อ MongoDB ล้มเหลว:", error);
    process.exit(1);
  }
};

// Enhanced category data
const basicCategories = [
  {
    title: "คำศัพท์ชีวิตประจำวัน",
    description:
      "คำศัพท์พื้นฐานที่ใช้บ่อยในชีวิตประจำวัน ครอบคลุมสถานการณ์ต่างๆ",
    difficulty: "easy",
    color: "#4CAF50",
    icon: "🏠",
    is_public: true,
  },
  {
    title: "คำศัพท์ทางการศึกษา",
    description: "คำศัพท์เกี่ยวกับการศึกษา การเรียน และโรงเรียน",
    difficulty: "medium",
    color: "#2196F3",
    icon: "🎓",
    is_public: true,
  },
  {
    title: "คำคุณศัพท์ (Adjectives)",
    description: "คำศัพท์ที่ใช้บรรยายลักษณะ สภาพ และความรู้สึก",
    difficulty: "medium",
    color: "#9C27B0",
    icon: "🌈",
    is_public: true,
  },
  {
    title: "คำกริยา (Verbs)",
    description: "คำกริยาที่ใช้บ่อยในภาษาอังกฤษ ทั้งกริยาการกระทำและกริยาสภาวะ",
    difficulty: "medium",
    color: "#FF9800",
    icon: "🏃",
    is_public: true,
  },
  {
    title: "คำนามทั่วไป (Common Nouns)",
    description: "คำนามที่พบบ่อยในชีวิตประจำวัน",
    difficulty: "easy",
    color: "#607D8B",
    icon: "📦",
    is_public: true,
  },
  {
    title: "คำศัพท์ในที่ทำงาน",
    description: "คำศัพท์ที่ใช้ในสภาพแวดล้อมการทำงาน",
    difficulty: "hard",
    color: "#795548",
    icon: "💼",
    is_public: true,
  },
];

// Enhanced flashcard data with more vocabulary
const basicFlashcards = {
  คำศัพท์ชีวิตประจำวัน: [
    {
      front: "hello",
      back: "สวัสดี",
      phonetic: "/həˈləʊ/",
      part_of_speech: "interjection",
      example: "Hello, how are you today?",
      example_translation: "สวัสดี คุณสบายดีไหมวันนี้",
      difficulty: "Easy",
      synonyms: ["hi", "greetings"],
    },
    {
      front: "goodbye",
      back: "ลาก่อน",
      phonetic: "/ˌɡʊdˈbaɪ/",
      part_of_speech: "interjection",
      example: "I have to go now, goodbye!",
      example_translation: "ฉันต้องไปแล้ว ลาก่อน!",
      difficulty: "Easy",
      synonyms: ["farewell", "see you"],
    },
    // ... (keep your existing 10 words)
    // Adding 10 more words
    {
      front: "market",
      back: "ตลาด",
      phonetic: "/ˈmɑːr.kɪt/",
      part_of_speech: "noun",
      example: "We buy fresh vegetables at the local market.",
      example_translation: "เราซื้อผักสดที่ตลาดใกล้บ้าน",
      difficulty: "Easy",
    },
    {
      front: "price",
      back: "ราคา",
      phonetic: "/praɪs/",
      part_of_speech: "noun",
      example: "What's the price of this shirt?",
      example_translation: "เสื้อตัวนี้ราคาเท่าไหร่",
      difficulty: "Easy",
    },
    {
      front: "shopping",
      back: "การช้อปปิ้ง",
      phonetic: "/ˈʃɒp.ɪŋ/",
      part_of_speech: "noun",
      example: "I go shopping every weekend.",
      example_translation: "ฉันไปช้อปปิ้งทุกสุดสัปดาห์",
      difficulty: "Easy",
    },
    {
      front: "restaurant",
      back: "ร้านอาหาร",
      phonetic: "/ˈres.tə.rɒnt/",
      part_of_speech: "noun",
      example: "Let's meet at the Italian restaurant.",
      example_translation: "เจอกันที่ร้านอาหารอิตาเลียนนะ",
      difficulty: "Medium",
    },
    {
      front: "menu",
      back: "เมนู",
      phonetic: "/ˈmen.juː/",
      part_of_speech: "noun",
      example: "Could I see the menu, please?",
      example_translation: "ขอดูเมนูหน่อยได้ไหมคะ",
      difficulty: "Easy",
    },
    {
      front: "delicious",
      back: "อร่อย",
      phonetic: "/dɪˈlɪʃ.əs/",
      part_of_speech: "adjective",
      example: "This cake is absolutely delicious!",
      example_translation: "เค้กนี้อร่อยมากๆ!",
      difficulty: "Easy",
    },
    {
      front: "bill",
      back: "ใบเสร็จ",
      phonetic: "/bɪl/",
      part_of_speech: "noun",
      example: "Could we have the bill, please?",
      example_translation: "ขอใบเสร็จหน่อยได้ไหมคะ",
      difficulty: "Easy",
    },
    {
      front: "cash",
      back: "เงินสด",
      phonetic: "/kæʃ/",
      part_of_speech: "noun",
      example: "Do you accept cash or card only?",
      example_translation: "รับเงินสดหรือต้องจ่ายด้วยบัตรเท่านั้น",
      difficulty: "Easy",
    },
    {
      front: "change",
      back: "เงินทอน",
      phonetic: "/tʃeɪndʒ/",
      part_of_speech: "noun",
      example: "Here's your change, 20 baht.",
      example_translation: "เงินทอนของคุณ 20 บาทค่ะ",
      difficulty: "Easy",
    },
    {
      front: "receipt",
      back: "ใบเสร็จรับเงิน",
      phonetic: "/rɪˈsiːt/",
      part_of_speech: "noun",
      example: "Could I have a receipt for this purchase?",
      example_translation: "ขอใบเสร็จสำหรับการซื้อครั้งนี้ได้ไหมคะ",
      difficulty: "Medium",
    },
  ],
  คำศัพท์ทางการศึกษา: [
    // ... (keep your existing 10 words)
    // Adding 10 more education words
    {
      front: "university",
      back: "มหาวิทยาลัย",
      phonetic: "/ˌjuː.nɪˈvɜː.sə.ti/",
      part_of_speech: "noun",
      example: "She studies engineering at the university.",
      example_translation: "เธอเรียนวิศวกรรมศาสตร์ที่มหาวิทยาลัย",
      difficulty: "Medium",
    },
    {
      front: "professor",
      back: "ศาสตราจารย์",
      phonetic: "/prəˈfes.ər/",
      part_of_speech: "noun",
      example: "Professor Smith teaches advanced physics.",
      example_translation: "ศาสตราจารย์สมิธสอนฟิสิกส์ระดับสูง",
      difficulty: "Medium",
    },
    {
      front: "lecture",
      back: "การบรรยาย",
      phonetic: "/ˈlek.tʃər/",
      part_of_speech: "noun",
      example: "We have a lecture at 9 AM tomorrow.",
      example_translation: "เรามีการบรรยายเวลา 9 โมงเช้าวันพรุ่งนี้",
      difficulty: "Medium",
    },
    {
      front: "assignment",
      back: "งานที่ได้รับมอบหมาย",
      phonetic: "/əˈsaɪn.mənt/",
      part_of_speech: "noun",
      example: "The assignment is due next Monday.",
      example_translation: "งานที่ได้รับมอบหมายต้องส่งวันจันทร์หน้า",
      difficulty: "Medium",
    },
    {
      front: "research",
      back: "การวิจัย",
      phonetic: "/rɪˈsɜːtʃ/",
      part_of_speech: "noun",
      example: "He's doing research on renewable energy.",
      example_translation: "เขากำลังทำวิจัยเกี่ยวกับพลังงานหมุนเวียน",
      difficulty: "Hard",
    },
    {
      front: "thesis",
      back: "วิทยานิพนธ์",
      phonetic: "/ˈθiː.sɪs/",
      part_of_speech: "noun",
      example: "I'm writing my master's thesis this semester.",
      example_translation: "ฉันกำลังเขียนวิทยานิพนธ์ปริญญาโทเทอมนี้",
      difficulty: "Hard",
    },
    {
      front: "scholarship",
      back: "ทุนการศึกษา",
      phonetic: "/ˈskɒl.ə.ʃɪp/",
      part_of_speech: "noun",
      example: "She won a scholarship to study abroad.",
      example_translation: "เธอได้รับทุนการศึกษาเพื่อไปเรียนต่างประเทศ",
      difficulty: "Medium",
    },
    {
      front: "graduation",
      back: "การสำเร็จการศึกษา",
      phonetic: "/ˌɡrædʒ.uˈeɪ.ʃən/",
      part_of_speech: "noun",
      example: "My graduation ceremony is next month.",
      example_translation: "พิธีสำเร็จการศึกษาของฉันเดือนหน้า",
      difficulty: "Medium",
    },
    {
      front: "degree",
      back: "ปริญญา",
      phonetic: "/dɪˈɡriː/",
      part_of_speech: "noun",
      example: "He earned a degree in computer science.",
      example_translation: "เขาได้รับปริญญาด้านวิทยาการคอมพิวเตอร์",
      difficulty: "Medium",
    },
    {
      front: "campus",
      back: "พื้นที่มหาวิทยาลัย",
      phonetic: "/ˈkæm.pəs/",
      part_of_speech: "noun",
      example: "The university campus is very beautiful.",
      example_translation: "พื้นที่มหาวิทยาลัยสวยมาก",
      difficulty: "Medium",
    },
  ],
  "คำคุณศัพท์ (Adjectives)": [
    // ... (keep your existing 10 adjectives)
    // Adding 10 more adjectives
    {
      front: "generous",
      back: "เอื้อเฟื้อเผื่อแผ่",
      phonetic: "/ˈdʒen.ər.əs/",
      part_of_speech: "adjective",
      example: "She's very generous with her time.",
      example_translation: "เธอเอื้อเฟื้อเผื่อแผ่เรื่องเวลามาก",
      difficulty: "Medium",
    },
    {
      front: "selfish",
      back: "เห็นแก่ตัว",
      phonetic: "/ˈsel.fɪʃ/",
      part_of_speech: "adjective",
      example: "It was selfish of him to take the last piece.",
      example_translation: "มันเห็นแก่ตัวของเขาที่จะเอาเศษชิ้นสุดท้ายไป",
      difficulty: "Medium",
    },
    {
      front: "reliable",
      back: "น่าเชื่อถือ",
      phonetic: "/rɪˈlaɪ.ə.bəl/",
      part_of_speech: "adjective",
      example: "He's the most reliable person I know.",
      example_translation: "เขาเป็นคนที่น่าเชื่อถือที่สุดที่ฉันรู้จัก",
      difficulty: "Medium",
    },
    {
      front: "honest",
      back: "ซื่อสัตย์",
      phonetic: "/ˈɒn.ɪst/",
      part_of_speech: "adjective",
      example: "Always be honest with your friends.",
      example_translation: "จงซื่อสัตย์กับเพื่อนของคุณเสมอ",
      difficulty: "Easy",
    },
    {
      front: "brave",
      back: "กล้าหาญ",
      phonetic: "/breɪv/",
      part_of_speech: "adjective",
      example: "The firefighter was very brave.",
      example_translation: "พนักงานดับเพลิงคนนั้นกล้าหาญมาก",
      difficulty: "Medium",
    },
    {
      front: "cowardly",
      back: "ขี้ขลาด",
      phonetic: "/ˈkaʊ.əd.li/",
      part_of_speech: "adjective",
      example: "That was a cowardly thing to do.",
      example_translation: "นั่นเป็นการกระทำที่ขี้ขลาด",
      difficulty: "Medium",
    },
    {
      front: "intelligent",
      back: "ฉลาด",
      phonetic: "/ɪnˈtel.ɪ.dʒənt/",
      part_of_speech: "adjective",
      example: "She's one of the most intelligent students in class.",
      example_translation: "เธอเป็นหนึ่งในนักเรียนที่ฉลาดที่สุดในชั้นเรียน",
      difficulty: "Medium",
    },
    {
      front: "foolish",
      back: "โง่เขลา",
      phonetic: "/ˈfuː.lɪʃ/",
      part_of_speech: "adjective",
      example: "It would be foolish to go out in this storm.",
      example_translation: "มันโง่เขลาที่จะออกไปข้างนอกในพายุนี้",
      difficulty: "Medium",
    },
    {
      front: "polite",
      back: "สุภาพ",
      phonetic: "/pəˈlaɪt/",
      part_of_speech: "adjective",
      example: "The child was very polite to the guests.",
      example_translation: "เด็กคนนั้นสุภาพกับแขกมาก",
      difficulty: "Easy",
    },
    {
      front: "rude",
      back: "หยาบคาย",
      phonetic: "/ruːd/",
      part_of_speech: "adjective",
      example: "It's rude to interrupt people when they're speaking.",
      example_translation: "มันหยาบคายที่จะขัดจังหวะคนอื่นขณะที่พวกเขากำลังพูด",
      difficulty: "Easy",
    },
  ],
  "คำกริยา (Verbs)": [
    // ... (keep your existing 10 verbs)
    // Adding 10 more verbs
    {
      front: "speak",
      back: "พูด",
      phonetic: "/spiːk/",
      part_of_speech: "verb",
      example: "Do you speak English?",
      example_translation: "คุณพูดภาษาอังกฤษได้ไหม",
      difficulty: "Easy",
    },
    {
      front: "listen",
      back: "ฟัง",
      phonetic: "/ˈlɪs.ən/",
      part_of_speech: "verb",
      example: "Listen carefully to the instructions.",
      example_translation: "ฟังคำแนะนำอย่างระมัดระวัง",
      difficulty: "Easy",
    },
    {
      front: "understand",
      back: "เข้าใจ",
      phonetic: "/ˌʌn.dəˈstænd/",
      part_of_speech: "verb",
      example: "I don't understand this question.",
      example_translation: "ฉันไม่เข้าใจคำถามข้อนี้",
      difficulty: "Easy",
    },
    {
      front: "explain",
      back: "อธิบาย",
      phonetic: "/ɪkˈspleɪn/",
      part_of_speech: "verb",
      example: "Could you explain that again, please?",
      example_translation: "คุณช่วยอธิบายอีกครั้งได้ไหมคะ",
      difficulty: "Medium",
    },
    {
      front: "remember",
      back: "จำได้",
      phonetic: "/rɪˈmem.bər/",
      part_of_speech: "verb",
      example: "I can't remember where I put my keys.",
      example_translation: "ฉันจำไม่ได้ว่าวางกุญแจไว้ที่ไหน",
      difficulty: "Medium",
    },
    {
      front: "forget",
      back: "ลืม",
      phonetic: "/fəˈɡet/",
      part_of_speech: "verb",
      example: "Don't forget to call your mother.",
      example_translation: "อย่าลืมโทรหาแม่ของคุณ",
      difficulty: "Medium",
    },
    {
      front: "decide",
      back: "ตัดสินใจ",
      phonetic: "/dɪˈsaɪd/",
      part_of_speech: "verb",
      example: "We need to decide by tomorrow.",
      example_translation: "เราต้องตัดสินใจให้ได้ภายในพรุ่งนี้",
      difficulty: "Medium",
    },
    {
      front: "choose",
      back: "เลือก",
      phonetic: "/tʃuːz/",
      part_of_speech: "verb",
      example: "You can choose any color you like.",
      example_translation: "คุณสามารถเลือกสีใดก็ได้ที่คุณชอบ",
      difficulty: "Easy",
    },
    {
      front: "travel",
      back: "เดินทาง",
      phonetic: "/ˈtræv.əl/",
      part_of_speech: "verb",
      example: "I love to travel to new countries.",
      example_translation: "ฉันชอบเดินทางไปประเทศใหม่ๆ",
      difficulty: "Medium",
    },
    {
      front: "arrive",
      back: "มาถึง",
      phonetic: "/əˈraɪv/",
      part_of_speech: "verb",
      example: "What time does your flight arrive?",
      example_translation: "เที่ยวบินของคุณมาถึงกี่โมง",
      difficulty: "Medium",
    },
  ],
  "คำนามทั่วไป (Common Nouns)": [
    {
      front: "time",
      back: "เวลา",
      phonetic: "/taɪm/",
      part_of_speech: "noun",
      example: "Time passes quickly when you're having fun.",
      example_translation: "เวลาเดินเร็วเมื่อคุณกำลังสนุก",
      difficulty: "Easy",
    },
    {
      front: "person",
      back: "บุคคล",
      phonetic: "/ˈpɜː.sən/",
      part_of_speech: "noun",
      example: "She's a very kind person.",
      example_translation: "เธอเป็นคนที่ใจดีมาก",
      difficulty: "Easy",
    },
    {
      front: "year",
      back: "ปี",
      phonetic: "/jɪər/",
      part_of_speech: "noun",
      example: "We moved here three years ago.",
      example_translation: "เราย้ายมาอยู่ที่นี่เมื่อสามปีที่แล้ว",
      difficulty: "Easy",
    },
    {
      front: "way",
      back: "ทาง, วิธี",
      phonetic: "/weɪ/",
      part_of_speech: "noun",
      example: "There's more than one way to solve this problem.",
      example_translation: "มีมากกว่าหนึ่งวิธีที่จะแก้ปัญหานี้",
      difficulty: "Medium",
    },
    {
      front: "day",
      back: "วัน",
      phonetic: "/deɪ/",
      part_of_speech: "noun",
      example: "I'll see you the day after tomorrow.",
      example_translation: "ฉันจะพบคุณวันมะรืนนี้",
      difficulty: "Easy",
    },
    {
      front: "thing",
      back: "สิ่งของ",
      phonetic: "/θɪŋ/",
      part_of_speech: "noun",
      example: "Put your things away when you're done.",
      example_translation: "เก็บสิ่งของของคุณเมื่อคุณทำเสร็จแล้ว",
      difficulty: "Easy",
    },
    {
      front: "man",
      back: "ผู้ชาย",
      phonetic: "/mæn/",
      part_of_speech: "noun",
      example: "That man is my uncle.",
      example_translation: "ผู้ชายคนนั้นเป็นลุงของฉัน",
      difficulty: "Easy",
    },
    {
      front: "world",
      back: "โลก",
      phonetic: "/wɜːld/",
      part_of_speech: "noun",
      example: "She wants to travel around the world.",
      example_translation: "เธอต้องการเดินทางรอบโลก",
      difficulty: "Medium",
    },
    {
      front: "life",
      back: "ชีวิต",
      phonetic: "/laɪf/",
      part_of_speech: "noun",
      example: "Life is full of surprises.",
      example_translation: "ชีวิตเต็มไปด้วยความประหลาดใจ",
      difficulty: "Medium",
    },
    {
      front: "hand",
      back: "มือ",
      phonetic: "/hænd/",
      part_of_speech: "noun",
      example: "Raise your hand if you know the answer.",
      example_translation: "ยกมือขึ้นถ้าคุณรู้คำตอบ",
      difficulty: "Easy",
    },
  ],
  คำศัพท์ในที่ทำงาน: [
    {
      front: "meeting",
      back: "การประชุม",
      phonetic: "/ˈmiː.tɪŋ/",
      part_of_speech: "noun",
      example: "We have a team meeting at 2 PM.",
      example_translation: "เรามีการประชุมทีมเวลาบ่ายสองโมง",
      difficulty: "Medium",
    },
    {
      front: "deadline",
      back: "เส้นตาย",
      phonetic: "/ˈded.laɪn/",
      part_of_speech: "noun",
      example: "The project deadline is next Friday.",
      example_translation: "เส้นตายของโครงการคือวันศุกร์หน้า",
      difficulty: "Medium",
    },
    {
      front: "colleague",
      back: "เพื่อนร่วมงาน",
      phonetic: "/ˈkɒl.iːɡ/",
      part_of_speech: "noun",
      example: "My colleagues are very supportive.",
      example_translation: "เพื่อนร่วมงานของฉันให้การสนับสนุนมาก",
      difficulty: "Medium",
    },
    {
      front: "salary",
      back: "เงินเดือน",
      phonetic: "/ˈsæl.ər.i/",
      part_of_speech: "noun",
      example: "The company offers a competitive salary.",
      example_translation: "บริษัทเสนอเงินเดือนที่แข่งขันได้",
      difficulty: "Medium",
    },
    {
      front: "promotion",
      back: "การเลื่อนตำแหน่ง",
      phonetic: "/prəˈməʊ.ʃən/",
      part_of_speech: "noun",
      example: "She got a promotion to manager last month.",
      example_translation: "เธอได้เลื่อนตำแหน่งเป็นผู้จัดการเมื่อเดือนที่แล้ว",
      difficulty: "Medium",
    },
    {
      front: "resign",
      back: "ลาออก",
      phonetic: "/rɪˈzaɪn/",
      part_of_speech: "verb",
      example: "He resigned from his position yesterday.",
      example_translation: "เขาลาออกจากตำแหน่งเมื่อวานนี้",
      difficulty: "Medium",
    },
    {
      front: "interview",
      back: "การสัมภาษณ์",
      phonetic: "/ˈɪn.tə.vjuː/",
      part_of_speech: "noun",
      example: "I have a job interview tomorrow.",
      example_translation: "ฉันมีการสัมภาษณ์งานพรุ่งนี้",
      difficulty: "Medium",
    },
    {
      front: "contract",
      back: "สัญญา",
      phonetic: "/ˈkɒn.trækt/",
      part_of_speech: "noun",
      example: "Please review the contract before signing.",
      example_translation: "กรุณาตรวจสอบสัญญาก่อนลงนาม",
      difficulty: "Hard",
    },
    {
      front: "performance",
      back: "ผลการปฏิบัติงาน",
      phonetic: "/pəˈfɔː.məns/",
      part_of_speech: "noun",
      example: "Your performance this quarter has been excellent.",
      example_translation: "ผลการปฏิบัติงานของคุณในไตรมาสนี้ยอดเยี่ยมมาก",
      difficulty: "Hard",
    },
    {
      front: "negotiate",
      back: "เจรจาต่อรอง",
      phonetic: "/nɪˈɡəʊ.ʃi.eɪt/",
      part_of_speech: "verb",
      example: "We need to negotiate better terms.",
      example_translation: "เราต้องเจรจาต่อรองเงื่อนไขที่ดีขึ้น",
      difficulty: "Hard",
    },
  ],
};

// Database seeding function (unchanged)
const seedDatabase = async () => {
  try {
    // await FlashcardCategory.deleteMany({ is_public: true });
    // console.log("ลบข้อมูลหมวดหมู่เดิมที่เป็นสาธารณะแล้ว");

    for (const category of basicCategories) {
      console.log(`กำลังเพิ่มหมวดหมู่: ${category.title}...`);

      const adminUserId = new mongoose.Types.ObjectId(
        "000000000000000000000001"
      );
      category.creator = adminUserId;

      const newCategory = await FlashcardCategory.create(category);

      const flashcardsToAdd = basicFlashcards[category.title] || [];

      if (flashcardsToAdd.length > 0) {
        const flashcardsWithCategory = flashcardsToAdd.map((card) => ({
          ...card,
          category_id: newCategory._id,
        }));

        await Flashcard.insertMany(flashcardsWithCategory);
        console.log(
          `เพิ่มคำศัพท์จำนวน ${flashcardsToAdd.length} คำในหมวดหมู่ "${category.title}" เรียบร้อยแล้ว`
        );
      }
    }

    console.log("✅ เพิ่มข้อมูลเริ่มต้นสำเร็จ!");
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการเพิ่มข้อมูล:", error);
  } finally {
    mongoose.connection.close();
    console.log("ปิดการเชื่อมต่อฐานข้อมูล");
  }
};

// Run the seeder
const runSeeder = async () => {
  await connectDB();
  await seedDatabase();
  console.log("เสร็จสิ้นการทำงาน");
};

runSeeder();
