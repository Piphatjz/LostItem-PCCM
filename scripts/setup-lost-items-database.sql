-- สร้างตาราง lost_items สำหรับเก็บข้อมูลของหาย
CREATE TABLE IF NOT EXISTS lost_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  date_found DATE NOT NULL DEFAULT CURRENT_DATE,
  image_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- เพิ่มคอลัมน์ student_id หากยังไม่มี
ALTER TABLE lost_items 
ADD COLUMN IF NOT EXISTS student_id VARCHAR(20);

-- เพิ่ม index สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_lost_items_student_id ON lost_items(student_id);
CREATE INDEX IF NOT EXISTS idx_lost_items_date_found ON lost_items(date_found);
CREATE INDEX IF NOT EXISTS idx_lost_items_name ON lost_items(name);

-- เพิ่ม trigger สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lost_items_updated_at 
    BEFORE UPDATE ON lost_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- เพิ่มข้อมูลตัวอย่าง (ถ้าต้องการ)
INSERT INTO lost_items (name, description, location, student_id, image_data) 
VALUES 
  ('กระเป๋าเป้สีน้ำเงิน', 'กระเป๋าเป้สีน้ำเงินเข้ม มีซิปหน้า', 'อาคาร A ชั้น 2', '65001234', '/placeholder.svg?height=80&width=80'),
  ('หูฟัง Sony', 'หูฟังสีดำ ยี่ห้อ Sony รุ่น WH-1000XM4', 'ห้องสมุด', '65005678', '/placeholder.svg?height=80&width=80'),
  ('กล่องข้าว Hello Kitty', 'กล่องข้าวสีชมพู ลาย Hello Kitty', 'โรงอาหาร', '65009012', '/placeholder.svg?height=80&width=80')
ON CONFLICT DO NOTHING;
