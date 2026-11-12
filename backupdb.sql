BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "broadcasts" (
	"id"	INTEGER,
	"message"	TEXT NOT NULL,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "categories" (
	"id"	INTEGER,
	"name"	TEXT NOT NULL,
	"slug"	TEXT NOT NULL UNIQUE,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id"	INTEGER,
	"user_id"	INTEGER NOT NULL,
	"username"	TEXT NOT NULL,
	"role"	TEXT NOT NULL,
	"message"	TEXT NOT NULL,
	"is_read"	INTEGER DEFAULT 0,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "deposits" (
	"id"	INTEGER,
	"user_id"	INTEGER NOT NULL,
	"amount"	INTEGER NOT NULL,
	"status"	TEXT DEFAULT 'Success',
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"username"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "login_logs" (
	"id"	INTEGER,
	"user_id"	INTEGER NOT NULL,
	"ip_address"	TEXT,
	"user_agent"	TEXT,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "news" (
	"id"	INTEGER,
	"title"	TEXT NOT NULL,
	"content"	TEXT NOT NULL,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "orders" (
	"id"	INTEGER,
	"user_id"	INTEGER NOT NULL,
	"order_code"	TEXT NOT NULL UNIQUE,
	"product"	TEXT NOT NULL,
	"price"	TEXT NOT NULL,
	"method"	TEXT NOT NULL,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"status"	TEXT DEFAULT 'Pending',
	"account_data"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "product_accounts" (
	"id"	INTEGER,
	"product_id"	INTEGER NOT NULL,
	"account_data"	TEXT NOT NULL,
	"status"	TEXT DEFAULT 'Available',
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "products" (
	"id"	INTEGER,
	"name"	TEXT NOT NULL,
	"category"	TEXT NOT NULL,
	"price"	INTEGER NOT NULL,
	"duration"	TEXT,
	"badge"	TEXT,
	"image"	TEXT,
	"data_name"	TEXT,
	"description"	TEXT,
	"sub_category"	TEXT,
	"stock"	INTEGER DEFAULT 0,
	"original_price"	INTEGER,
	"flash_sale_price"	INTEGER DEFAULT 0,
	"flash_sale_end"	DATETIME,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "reviews" (
	"id"	INTEGER,
	"user_id"	INTEGER NOT NULL,
	"username"	TEXT NOT NULL,
	"rating"	INTEGER NOT NULL,
	"comment"	TEXT NOT NULL,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER,
	"username"	TEXT NOT NULL UNIQUE,
	"email"	TEXT NOT NULL UNIQUE,
	"password"	TEXT NOT NULL,
	"role"	TEXT DEFAULT 'user',
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"last_login"	DATETIME,
	"points"	INTEGER DEFAULT 0,
	"saldo"	INTEGER DEFAULT 0,
	"avatar"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);
INSERT INTO "broadcasts" VALUES (1,'woii','2026-11-03 17:30:59');
INSERT INTO "broadcasts" VALUES (2,'off dulu guys','2026-11-03 17:35:13');
INSERT INTO "broadcasts" VALUES (3,'off dulu yaa','2026-11-03 17:35:59');
INSERT INTO "categories" VALUES (5,'Canva','category-1');
INSERT INTO "categories" VALUES (8,'Alight Motion','category-2');
INSERT INTO "categories" VALUES (9,'CapCut','category-3');
INSERT INTO "categories" VALUES (10,'Netflix','category-4');
INSERT INTO "categories" VALUES (11,'Prime Video','category-5');
INSERT INTO "categories" VALUES (12,'Vidio Premium','category-6');
INSERT INTO "categories" VALUES (13,'Spotify','category-7');
INSERT INTO "categories" VALUES (14,'Wink','category-8');
INSERT INTO "chat_messages" VALUES (1,1,'naeldev','user','Bang',0,'2026-11-11 16:55:49');
INSERT INTO "chat_messages" VALUES (2,1,'naeldev','user','Bang',0,'2026-11-11 16:55:53');
INSERT INTO "chat_messages" VALUES (3,1,'naeldev','user','P',0,'2026-11-11 16:56:11');
INSERT INTO "chat_messages" VALUES (4,1,'naeldev','user','Bang',0,'2026-11-11 16:57:09');
INSERT INTO "chat_messages" VALUES (5,1,'naeldev','user','Bang',0,'2026-11-11 16:58:58');
INSERT INTO "chat_messages" VALUES (6,1,'naeldev','user','P',0,'2026-11-11 16:59:02');
INSERT INTO "chat_messages" VALUES (7,1,'naeldev','user','P',0,'2026-11-11 17:00:56');
INSERT INTO "chat_messages" VALUES (8,1,'naeldev','user','p',0,'2026-11-11 17:02:28');
INSERT INTO "chat_messages" VALUES (9,1,'naeldev','user','p',0,'2026-11-11 17:02:31');
INSERT INTO "chat_messages" VALUES (10,1,'naeldev','user','p',0,'2026-11-11 17:02:33');
INSERT INTO "chat_messages" VALUES (11,1,'naeldev','user','p',0,'2026-11-11 17:07:42');
INSERT INTO "chat_messages" VALUES (12,1,'naeldev','user','p',0,'2026-11-11 17:08:41');
INSERT INTO "chat_messages" VALUES (13,1,'naeldev','user','bang',0,'2026-11-11 17:11:57');
INSERT INTO "chat_messages" VALUES (14,1,'naeldev','user','P',0,'2026-11-11 17:14:30');
INSERT INTO "chat_messages" VALUES (15,1,'naeldev','user','Hi',0,'2026-11-11 17:17:01');
INSERT INTO "chat_messages" VALUES (16,1,'naeldev','user','Pa',0,'2026-11-11 17:18:37');
INSERT INTO "chat_messages" VALUES (17,1,'naeldev','user','P',0,'2026-11-11 17:21:02');
INSERT INTO "chat_messages" VALUES (18,1,'naeldev','user','Bang',0,'2026-11-11 17:24:42');
INSERT INTO "chat_messages" VALUES (19,1,'naeldev','user','Tes',0,'2026-11-11 17:26:04');
INSERT INTO "chat_messages" VALUES (20,1,'naeldev','user','Tes',0,'2026-11-11 17:28:07');
INSERT INTO "chat_messages" VALUES (21,1,'naeldev','user','Bang',0,'2026-11-11 17:28:16');
INSERT INTO "chat_messages" VALUES (22,1,'Admin','admin','kenapa',1,'2026-11-11 17:31:30');
INSERT INTO "chat_messages" VALUES (23,1,'naeldev','user','Gpp',0,'2026-11-11 17:31:41');
INSERT INTO "chat_messages" VALUES (24,1,'Admin','admin','ohh ok',1,'2026-11-11 17:31:50');
INSERT INTO "deposits" VALUES (1,1,1000,'Success','2026-11-07 12:51:35',NULL);
INSERT INTO "deposits" VALUES (2,1,1000000,'Success','2026-11-07 13:17:03',NULL);
INSERT INTO "deposits" VALUES (3,1,200000000,'Success','2026-11-07 13:18:50',NULL);
INSERT INTO "deposits" VALUES (4,1,5000,'Success','2026-11-08 14:19:46','naeldev');
INSERT INTO "deposits" VALUES (5,1,5000,'Success','2026-11-11 14:09:46','naeldev');
INSERT INTO "login_logs" VALUES (1,1,'::ffff:192.168.1.71','Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1','2026-11-07 12:15:13');
INSERT INTO "login_logs" VALUES (2,1,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-08 14:14:35');
INSERT INTO "login_logs" VALUES (3,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-08 14:19:59');
INSERT INTO "login_logs" VALUES (4,1,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-08 14:23:08');
INSERT INTO "login_logs" VALUES (5,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 14:38:59');
INSERT INTO "login_logs" VALUES (6,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 15:28:07');
INSERT INTO "login_logs" VALUES (7,1,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 15:41:43');
INSERT INTO "login_logs" VALUES (8,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 15:44:41');
INSERT INTO "login_logs" VALUES (9,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 15:45:18');
INSERT INTO "login_logs" VALUES (10,1,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 15:45:29');
INSERT INTO "login_logs" VALUES (11,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 15:53:46');
INSERT INTO "login_logs" VALUES (12,1,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 16:22:25');
INSERT INTO "login_logs" VALUES (13,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 16:26:33');
INSERT INTO "login_logs" VALUES (14,1,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 16:30:15');
INSERT INTO "login_logs" VALUES (15,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 16:32:34');
INSERT INTO "login_logs" VALUES (16,1,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 16:43:47');
INSERT INTO "login_logs" VALUES (17,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 16:56:05');
INSERT INTO "login_logs" VALUES (18,1,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 17:01:53');
INSERT INTO "login_logs" VALUES (19,1,'::ffff:192.168.1.71','Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1','2026-11-11 17:02:01');
INSERT INTO "login_logs" VALUES (20,2,'::ffff:192.168.1.71','Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1','2026-11-11 17:02:20');
INSERT INTO "login_logs" VALUES (21,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 17:13:54');
INSERT INTO "login_logs" VALUES (22,2,'::ffff:192.168.1.71','Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1','2026-11-11 17:14:11');
INSERT INTO "login_logs" VALUES (23,1,'::ffff:192.168.1.71','Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1','2026-11-11 17:14:25');
INSERT INTO "login_logs" VALUES (24,1,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 17:32:59');
INSERT INTO "login_logs" VALUES (25,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','2026-11-11 17:34:34');
INSERT INTO "news" VALUES (1,'Update Server','Sepenuhnya isi server masih dalam kondisi BETA! Mohon pengertiannya untuk semua supaya bisa menggunakan dengan baik','2026-11-04 02:12:24');
INSERT INTO "news" VALUES (2,'Basic Information','We have some exciting news to share with you all! Stay tuned for a big reveal that will change the game. Keep your eyes on ur page for more details. Get ready for something special!','2026-11-04 04:31:45');
INSERT INTO "orders" VALUES (1,1,'NLS-001883','Canva 1 Bulan','Rp3.000','QRIS','2026-11-06 19:06:43','Success',NULL);
INSERT INTO "orders" VALUES (2,1,'NLS-494894','Canva 1 Bulan Invite','1999','Saldo','2026-11-07 13:01:35','Success',NULL);
INSERT INTO "orders" VALUES (3,1,'NLS-138742','Alight Motion 1 Tahun','999','Saldo','2026-11-07 13:12:20','Success',NULL);
INSERT INTO "orders" VALUES (4,2,'NLS-210578','Canva 1 Bulan Invite','Rp1.999','QRIS','2026-11-07 13:13:37','Success',NULL);
INSERT INTO "orders" VALUES (5,1,'NLS-431958','Alight Motion 1 Tahun','999','Saldo','2026-11-07 13:17:13','Success',NULL);
INSERT INTO "orders" VALUES (6,1,'NLS-200566','Canva 1 Bulan Invite','3000','Saldo','2026-11-11 16:23:24','Success','naelpatinson@gmail.com|nael123');
INSERT INTO "orders" VALUES (7,1,'NLS-437580','Canva 1 Bulan Invite','3000','Saldo','2026-11-11 16:27:19','Success','naelishere@gmail.com|nael123');
INSERT INTO "orders" VALUES (8,1,'NLS-621665','Canva 1 Bulan Invite','3000','Saldo','2026-11-11 16:30:25','Success','naelpantse@gmail.com|nael123');
INSERT INTO "orders" VALUES (9,1,'NLS-776292','Canva 1 Bulan Invite','3000','Saldo','2026-11-11 16:32:58','Success','naelshere@gmail.com|nael123');
INSERT INTO "orders" VALUES (10,1,'NLS-809041','Canva 1 Bulan Invite','3000','Saldo','2026-11-11 16:33:30','Success','naelpsuk@gmail.com|nael123');
INSERT INTO "orders" VALUES (11,1,'NLS-977186','Canva 1 Bulan Invite','3000','Saldo','2026-11-11 16:36:18','Success','naelmas@gmail.com|nael123');
INSERT INTO "orders" VALUES (12,1,'NLS-006284','Canva 1 Bulan Invite','3000','Saldo','2026-11-11 16:36:47','Success','tes');
INSERT INTO "orders" VALUES (13,1,'NLS-085165','Canva 1 Bulan Invite','3000','Saldo','2026-11-11 16:38:06','Success','woi');
INSERT INTO "orders" VALUES (14,1,'NLS-108864','Canva 1 Bulan Invite','3000','Saldo','2026-11-11 16:38:31','Success','kan');
INSERT INTO "orders" VALUES (15,1,'NLS-123364','Canva 1 Bulan Invite','Rp3.000','QRIS','2026-11-11 16:38:45','Success',NULL);
INSERT INTO "product_accounts" VALUES (1,9,'naelpatinson@gmail.com|nael123','Sold','2026-11-11 16:21:59');
INSERT INTO "product_accounts" VALUES (2,9,'naelishere@gmail.com|nael123','Sold','2026-11-11 16:26:58');
INSERT INTO "product_accounts" VALUES (3,9,'naelpantse@gmail.com|nael123','Sold','2026-11-11 16:29:49');
INSERT INTO "product_accounts" VALUES (4,9,'naelshere@gmail.com|nael123','Sold','2026-11-11 16:32:51');
INSERT INTO "product_accounts" VALUES (5,9,'naelpsuk@gmail.com|nael123','Sold','2026-11-11 16:33:25');
INSERT INTO "product_accounts" VALUES (6,9,'naelmas@gmail.com|nael123','Sold','2026-11-11 16:36:10');
INSERT INTO "product_accounts" VALUES (7,9,'tes','Sold','2026-11-11 16:36:42');
INSERT INTO "product_accounts" VALUES (8,9,'woi','Sold','2026-11-11 16:37:53');
INSERT INTO "product_accounts" VALUES (9,9,'kan','Sold','2026-11-11 16:37:55');
INSERT INTO "product_accounts" VALUES (10,9,'afafada','Available','2026-11-11 16:37:57');
INSERT INTO "product_accounts" VALUES (11,9,'fufufafa','Available','2026-11-11 16:38:00');
INSERT INTO "products" VALUES (9,'Canva 1 Bulan Invite','category-1',5000,'30 Hari','Premium','images/1794412804851-974815552-unnamed.png','canva 1 bulan','','50% OFF',7,8000,3000,'2026-11-12T22:56');
INSERT INTO "products" VALUES (11,'Alight Motion 1 Tahun','category-2',999,'30 Hari','Premium','images/1794412955167-281845458-images.png','alight motion 1 tahun','','50% OFF',198,2000,0,NULL);
INSERT INTO "products" VALUES (12,'CapCut 1 Minggu Private','category-3',10000,'30 Hari','Premium','images/1794413194880-292611489-capcut-logo-png_seeklogo-437025.png','capcut 1 minggu','','HOT',10,20000,0,NULL);
INSERT INTO "products" VALUES (13,'Netflix 20 Hari+','category-4',25000,'30 Hari','Premium','images/1794413207591-835288313-Netflix_icon.svg.png','netflix 20 hari+','Sharing 1P2U','HOT',10,50000,0,NULL);
INSERT INTO "products" VALUES (14,'Prime Video 1 Bulan','category-5',10000,'30 Hari','Premium','images/1794413334914-177398288-images-(1).png','prime video 1 bulan','PRIVATE','AUTO',10,0,0,NULL);
INSERT INTO "products" VALUES (15,'Vidio Mobile 1 Bulan','category-6',30000,'30 Hari','Premium','images/1794413342578-617779422-unnamed-(1).png','vidio mobile 1 bulan','','AUTO',10,0,0,NULL);
INSERT INTO "products" VALUES (16,'Spotify 1 Bulan','category-7',10000,'30 Hari','Premium','images/1794413352547-708714846-Spotify_App_Logo.svg.webp','spotify 1 bulan','Garansi Aktif','50% OFF',10,15000,0,NULL);
INSERT INTO "products" VALUES (17,'Wink 3-7 Hari','category-8',5000,'30 Hari','Premium','images/1794413358469-213300123-unnamed-(2).png','wink 3-7 hari','All Device','AUTO',10,8000,0,NULL);
INSERT INTO "products" VALUES (18,'Canva 3 Bulan invite','category-1',3000,'30 Hari','Premium','images/1794412976398-138349125-unnamed.png','canva 3 bulan','','',30,0,0,NULL);
INSERT INTO "products" VALUES (19,'Canva 2 Minggu Head','category-1',5000,'30 Hari','Premium','images/1794412987685-994291971-unnamed.png','canva 2 minggu','','',10,0,0,NULL);
INSERT INTO "products" VALUES (20,'Canva 1 Bulan Head','category-1',6000,'30 Hari','Premium','images/1794412996895-654641447-unnamed.png','canva 1 bulan','','',20,0,0,NULL);
INSERT INTO "reviews" VALUES (2,1,'naeldev',5,'Sejauh ini sangat bagus layanannya!','2026-11-07 11:10:42');
INSERT INTO "users" VALUES (1,'naeldev','kprlbdt@gmail.com','$2a$10$XkxBX720dgkhMK49pPDSxuJ3oF0tJB2.VWKzhMU8qcHJbmFKYuC1m','user','2026-11-03 15:02:27','2026-11-11 17:32:59',30,200982003,NULL);
INSERT INTO "users" VALUES (2,'naelpatinson','nicegang@gmail.com','$2a$10$v57AQSOB5Ej61vE/YJ2snOLVKTZynZ31uKptFWtvxvBz1Y69W905.','admin','2026-11-03 15:09:36','2026-11-11 17:34:34',30,0,NULL);
COMMIT;
