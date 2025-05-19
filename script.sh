#!/bin/bash
# สร้างโฟลเดอร์ code_review บน Desktop
mkdir -p ~/Desktop/code_review
# สร้างไฟล์ main_code.txt พร้อมหัวข้อ
echo "# โค้ดหลักของโปรเจค API Web" > ~/Desktop/code_review/main_code.txt
# หาไฟล์นามสกุล .js, .env, .md (ไม่เอา .json) และไม่เอา node_modules
find . -type f \( -name "*.js" -o -name "*.env" -o -name "*.md" \) ! -path "./node_modules/*" | while read file; do
  echo -e "\n\n## $file\n" >> ~/Desktop/code_review/main_code.txt
  cat "$file" >> ~/Desktop/code_review/main_code.txt
done
# แจ้งเตือนว่าทำเสร็จแล้ว
echo "✅ รวมไฟล์โค้ดสำเร็จ! อยู่ที่: ~/Desktop/code_review/main_code.txt"

# พิม bash script.sh
