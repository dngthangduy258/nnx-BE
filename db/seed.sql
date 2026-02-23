-- seed.sql
INSERT INTO categories (id, name, icon) VALUES ('pesticides', 'Thuốc Trừ Sâu', 'Bug');
INSERT INTO categories (id, name, icon) VALUES ('fertilizers', 'Phân Bón', 'Leaf');
INSERT INTO categories (id, name, icon) VALUES ('plant-protection', 'Bảo Vệ Thực Vật', 'Shield');
INSERT INTO categories (id, name, icon) VALUES ('seeds', 'Hạt Giống', 'Sprout');

INSERT INTO products (name, category, price, description, image, stock, rating) VALUES 
('Thuốc trừ sâu Sinh học BT', 'pesticides', 150000, 'Thuốc trừ sâu sinh học an toàn cho người và vật nuôi, tiêu diệt sâu tơ, sâu cuốn lá diện rộng.', 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=600', 50, 4.8),
('Phân bón NPK 20-20-15', 'fertilizers', 450000, 'Sản phẩm giúp cây trồng phát triển cân đối, tăng năng suất và chất lượng nông sản vượt trội.', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600', 100, 4.5),
('Thuốc diệt cỏ Glyphosate', 'plant-protection', 220000, 'Diệt trừ tận gốc các loại cỏ dại cứng đầu, hiệu quả nhanh chóng và kéo dài.', 'https://images.unsplash.com/photo-1599301824707-16016335122e?auto=format&fit=crop&q=80&w=600', 30, 4.2),
('Phân hữu cơ vi sinh cao cấp', 'fertilizers', 120000, 'Cải tạo đất cực tốt, cung cấp hệ vi sinh vật có lợi cho bộ rễ cây trồng phát triển mạnh.', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600', 200, 4.9),
('Thuốc trừ bệnh đạo ôn lúa', 'pesticides', 180000, 'Đặc trị bệnh đạo ôn, khô vằn trên cây lúa và các loại cây lương thực khác.', 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=600', 45, 4.7);

-- Default Admin is already in schema.sql, but we can add more if needed.
