-- เพิ่มคอลัมน์ student_id ให้กับตารางที่มีอยู่แล้ว
ALTER TABLE lost_items 
ADD COLUMN IF NOT EXISTS student_id VARCHAR(20);

-- เพิ่ม index สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_lost_items_student_id ON lost_items(student_id);

-- อัปเดตข้อมูลเก่าที่ไม่มี student_id ให้มีค่าเริ่มต้น
UPDATE lost_items 
SET student_id = 'UNKNOWN' 
WHERE student_id IS NULL;
