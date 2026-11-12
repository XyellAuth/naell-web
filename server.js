const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { createClient } = require("@libsql/client");
const path = require("path");

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN
});

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = "naell-store-secret-change-me-2026";

app.use(cors());
app.use(express.json());
if (!fs.existsSync("./images")) {
  fs.mkdirSync("./images");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./images/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, '-'));
  }
});

const upload = multer({ storage: storage });

app.use(express.static(__dirname));

async function initDatabase() {
  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    saldo INTEGER DEFAULT 0
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_code TEXT UNIQUE NOT NULL,
    product TEXT NOT NULL,
    price TEXT NOT NULL,
    method TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration TEXT,
    badge TEXT,
    image TEXT,
    data_name TEXT,
    description TEXT,
    sub_category TEXT,
    stock INTEGER DEFAULT 0
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS product_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    account_data TEXT NOT NULL,
    status TEXT DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log("✅ Database Turso siap.");
}

initDatabase();

async function dbGet(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return result.rows[0];
}

async function dbRun(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return { lastID: Number(result.lastInsertRowid), changes: result.rowsAffected };
}

async function dbAll(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return result.rows;
}

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Semua field wajib diisi." });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: "Username minimal 3 karakter." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Format email tidak valid." });
    }

    const existing = await dbGet(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existing) {
      return res.status(409).json({ error: "Username atau email sudah terdaftar." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await dbRun(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.lastID, username, email, role: "user" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Pendaftaran berhasil!",
      token,
      user: { id: result.lastID, username, email, role: "user", saldo: 0 }
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi." });
    }

    const user = await dbGet(
      "SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)",
      [username, username]
    );

    if (!user) {
      return res.status(401).json({ error: "Username/email atau password salah." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Username/email atau password salah." });
    }

    await dbRun("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    await dbRun(
      "INSERT INTO login_logs (user_id, ip_address, user_agent) VALUES (?, ?, ?)",
      [user.id, ipAddress, userAgent]
    );

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login berhasil!",
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role, 
        points: user.points || 0,
        saldo: user.saldo || 0,
        avatar: user.avatar || null
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.get("/api/users/login-logs", verifyToken, async (req, res) => {
  try {
    const logs = await dbAll(
      "SELECT * FROM login_logs WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil riwayat login." });
  }
});

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token tidak ditemukan." });
  }
  try {
    req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token tidak valid atau kadaluarsa." });
  }
}

app.get("/api/me", verifyToken, async (req, res) => {
  try {
    const user = await dbGet(
      "SELECT id, username, email, role, created_at, last_login, saldo FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: "User tidak ditemukan." });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.put("/api/users/profile", verifyToken, async (req, res) => {
  try {
    const { fullName, whatsapp } = req.body;
      
    res.json({ message: "Profil berhasil diperbarui." });
  } catch (err) {
    res.status(500).json({ error: "Gagal memperbarui profil." });
  }
});

app.put("/api/users/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Semua field wajib diisi." });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter." });
    }

    const user = await dbGet("SELECT password FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan." });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Kata sandi saat ini salah." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbRun("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);

    res.json({ message: "Kata sandi berhasil diubah." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Gagal mengubah kata sandi." });
  }
});

app.get("/api/users/profile-stats", verifyToken, async (req, res) => {
  try {
    const user = await dbGet("SELECT username, email, role, created_at, last_login, saldo, avatar FROM users WHERE id = ?", [req.user.id]);    
    const orderStats = await dbGet(
      "SELECT COUNT(*) as total_orders, SUM(CAST(REPLACE(REPLACE(price, 'Rp', ''), '.', '') AS INTEGER)) as total_spent FROM orders WHERE user_id = ? AND status = 'Success'",
      [req.user.id]
    );

    res.json({
      user,
      stats: {
        total_orders: orderStats.total_orders || 0,
        total_spent: orderStats.total_spent || 0
      }
    });
  } catch (err) {
    console.error("Profile stats error:", err);
    res.status(500).json({ error: "Gagal mengambil data profil." });
  }
});

app.put("/api/users/update-profile", verifyToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) return res.status(400).json({ error: "Username dan Email wajib diisi." });

    const existing = await dbGet(
      "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?",
      [username, email, req.user.id]
    );
    if (existing) return res.status(409).json({ error: "Username atau Email sudah dipakai user lain." });

    await dbRun("UPDATE users SET username = ?, email = ? WHERE id = ?", [username, email, req.user.id]);
    
    const updatedUser = await dbGet("SELECT id, username, email, role, saldo, points FROM users WHERE id = ?", [req.user.id]);
    
    res.json({ message: "Profil berhasil diperbarui.", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui profil." });
  }
});

app.post("/api/users/upload-avatar", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Pilih gambar terlebih dahulu." });
    }

    // Simpan path relatif untuk database
    const avatarPath = `images/${req.file.filename}`;

    // Update database
    await dbRun("UPDATE users SET avatar = ? WHERE id = ?", [avatarPath, req.user.id]);

    // Ambil data user terbaru
    const updatedUser = await dbGet("SELECT id, username, email, role, saldo, points, avatar FROM users WHERE id = ?", [req.user.id]);

    if (!updatedUser.avatar) {
      return res.status(500).json({ error: "Gagal menyimpan path gambar ke database." });
    }

    res.json({ message: "Foto profil berhasil diubah.", user: updatedUser });
  } catch (err) {
    console.error("Upload avatar error:", err);
    res.status(500).json({ error: "Gagal mengunggah foto: " + err.message });
  }
});

app.delete("/api/users/delete-avatar", verifyToken, async (req, res) => {
  try {
    const user = await dbGet("SELECT avatar FROM users WHERE id = ?", [req.user.id]);
    
    if (user && user.avatar) {
      const fs = require("fs");
      const path = require("path");
      
      const filePath = path.join(__dirname, user.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await dbRun("UPDATE users SET avatar = NULL WHERE id = ?", [req.user.id]);
    
    const updatedUser = await dbGet("SELECT id, username, email, role, saldo, points, avatar FROM users WHERE id = ?", [req.user.id]);
    
    res.json({ message: "Foto profil berhasil dihapus.", user: updatedUser });
  } catch (err) {
    console.error("Delete avatar error:", err);
    res.status(500).json({ error: "Gagal menghapus foto profil." });
  }
});

app.post("/api/users/deposit", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 1000) {
      return res.status(400).json({ error: "Minimal deposit adalah Rp 1.000" });
    }

    await dbRun(
      "INSERT INTO deposits (user_id, username, amount, status) VALUES (?, ?, ?, 'Pending')",
      [req.user.id, req.user.username, amount]
    );
    
    res.json({ message: "Konfirmasi diterima. Mohon tunggu verifikasi dari Admin." });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ error: "Gagal memproses konfirmasi deposit." });
  }
});

app.get("/api/admin/deposits", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  
  try {
    const deposits = await dbAll("SELECT * FROM deposits WHERE status = 'Pending' ORDER BY created_at ASC");
    res.json({ deposits });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data deposit." });
  }
});

app.put("/api/admin/deposits/:id/approve", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });

  try {
    const depositId = req.params.id;
    
    const deposit = await dbGet("SELECT * FROM deposits WHERE id = ? AND status = 'Pending'", [depositId]);
    if (!deposit) return res.status(404).json({ error: "Deposit tidak ditemukan atau sudah diproses." });

    await dbRun("UPDATE deposits SET status = 'Success' WHERE id = ?", [depositId]);
    
    await dbRun("UPDATE users SET saldo = saldo + ? WHERE id = ?", [deposit.amount, deposit.user_id]);

    res.json({ message: "Deposit berhasil disetujui dan saldo telah ditambahkan." });
  } catch (err) {
    res.status(500).json({ error: "Gagal memproses persetujuan." });
  }
});
app.get("/api/users/deposit-history", verifyToken, async (req, res) => {
  try {
    const deposits = await dbAll(
      "SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ deposits });
  } catch (err) {
    console.error("Error deposit history:", err);
    res.status(500).json({ error: "Gagal mengambil riwayat deposit." });
  }
});

app.get("/api/news", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM news ORDER BY id DESC");
    res.json({ news: rows });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil berita." });
  }
});

app.post("/api/news", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Judul dan isi wajib diisi." });

  db.run("INSERT INTO news (title, content) VALUES (?, ?)", [title, content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Berita ditambahkan." });
  });
});

app.delete("/api/news/:id", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  
  db.run("DELETE FROM news WHERE id = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Berita dihapus." });
  });
});

app.post("/api/users/pay-with-saldo", verifyToken, async (req, res) => {
  try {
    const { amount, product, order_code } = req.body;
    
    if (!amount || amount <= 0) return res.status(400).json({ error: "Nominal tidak valid." });

    const user = await dbGet("SELECT saldo FROM users WHERE id = ?", [req.user.id]);
    if (!user || user.saldo < amount) return res.status(400).json({ error: "Saldo tidak mencukupi." });

    const prodData = await dbGet("SELECT id FROM products WHERE name = ?", [product]);
    let deliveredAccount = null;

    if (prodData) {
      const account = await dbGet("SELECT id, account_data FROM product_accounts WHERE product_id = ? AND status = 'Available' LIMIT 1", [prodData.id]);
      
      if (!account) {
        return res.status(400).json({ error: "Stok akun untuk produk ini sedang habis." });
      }

      await dbRun("UPDATE product_accounts SET status = 'Sold' WHERE id = ?", [account.id]);
      deliveredAccount = account.account_data;
    }

    await dbRun("UPDATE users SET saldo = saldo - ? WHERE id = ?", [amount, req.user.id]);

    await dbRun(
      "INSERT INTO orders (user_id, order_code, product, price, method, status, account_data) VALUES (?, ?, ?, ?, 'Saldo', 'Success', ?)",
      [req.user.id, order_code, product, amount, deliveredAccount]
    );

    const updatedUser = await dbGet("SELECT saldo FROM users WHERE id = ?", [req.user.id]);
    
    res.json({ 
      message: "Pembayaran berhasil.", 
      total_saldo: updatedUser.saldo,
      account_data: deliveredAccount
    });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ error: "Gagal memproses pembayaran." });
  }
});

app.post("/api/orders", verifyToken, async (req, res) => {
  try {
    const { order_code, product, price, method } = req.body;
    if (!order_code || !product || !price || !method) {
      return res.status(400).json({ error: "Data pesanan tidak lengkap." });
    }

    await dbRun(
      "INSERT INTO orders (user_id, order_code, product, price, method) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, order_code, product, price, method]
    );

    res.status(201).json({ message: "Pesanan tersimpan." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan pesanan." });
  }
});

app.get("/api/orders", verifyToken, async (req, res) => {
  try {
    const orders = await dbAll(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil pesanan." });
  }
});

app.get("/api/orders/history", verifyToken, async (req, res) => {
  try {
    const orders = await dbAll(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil riwayat pesanan." });
  }
});

app.get("/api/orders/track/:code", async (req, res) => {
  try {
    const row = await dbGet("SELECT * FROM orders WHERE order_code = ?", [req.params.code]);
    if (!row) return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    res.json({ order: row });
  } catch (err) {
    res.status(500).json({ error: "Gagal melacak pesanan." });
  }
});

app.get("/api/orders/all", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  try {
    const rows = await dbAll(`
      SELECT orders.*, users.username 
      FROM orders 
      LEFT JOIN users ON orders.user_id = users.id 
      ORDER BY orders.id DESC
    `);
    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil pesanan." });
  }
});

app.put("/api/orders/:id/status", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  const { status } = req.body;
  
  db.get("SELECT product, status FROM orders WHERE id = ?", [req.params.id], (err, order) => {
    if (err || !order) return res.status(500).json({ error: "Pesanan tidak ditemukan." });

    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      if (status === "Success" && order.status !== "Success") {
        db.run(
          "UPDATE products SET stock = stock - 1 WHERE name = ? AND stock > 0",
          [order.product],
          (err) => {
            if (err) console.error("Gagal mengurangi stok:", err);
            res.json({ message: "Status diperbarui & stok dikurangi." });
          }
        );
      } else {
        res.json({ message: "Status pesanan diperbarui." });
      }
    });
  });
});

app.get("/api/chat/messages", verifyToken, async (req, res) => {
  try {
    let messages;
    if (req.user.role === "admin") {
      const targetUserId = req.query.user_id;
      if (targetUserId) {
        messages = await dbAll("SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC", [targetUserId]);
      } else {
        // Ambil pesan terakhir dari setiap user
        messages = await dbAll(`
          SELECT cm.* FROM chat_messages cm
          INNER JOIN (
            SELECT user_id, MAX(id) as max_id 
            FROM chat_messages 
            GROUP BY user_id
          ) latest ON cm.id = latest.max_id
          ORDER BY cm.created_at DESC
        `);
      }
    } else {
      messages = await dbAll("SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC", [req.user.id]);
      await dbRun("UPDATE chat_messages SET is_read = 1 WHERE user_id = ? AND role = 'admin'", [req.user.id]);
    }
    res.json({ messages });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Gagal memuat pesan." });
  }
});

app.post("/api/chat/send", verifyToken, async (req, res) => {
  try {
    const { message, target_user_id } = req.body;
    console.log("Menerima pesan chat:", req.body); // Debug log

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Pesan tidak boleh kosong." });
    }

    const isAdmin = req.user.role === "admin";
    const userId = isAdmin ? target_user_id : req.user.id;
    const username = isAdmin ? "Admin" : req.user.username;
    const role = isAdmin ? "admin" : "user";

    if (!userId) return res.status(400).json({ error: "Target user tidak ditemukan." });

    await dbRun(
      "INSERT INTO chat_messages (user_id, username, role, message) VALUES (?, ?, ?, ?)",
      [userId, username, role, message.trim()]
    );

    console.log("Pesan berhasil disimpan."); // Debug log
    res.json({ message: "Pesan terkirim." });
  } catch (err) {
    console.error("Error Kirim Chat:", err); // Tampilkan error asli
    res.status(500).json({ error: "Gagal mengirim pesan: " + err.message });
  }
});

app.get("/api/chat/unread-count", verifyToken, async (req, res) => {
  try {
    let count = 0;
    if (req.user.role === "admin") {
      const result = await dbGet("SELECT COUNT(*) as count FROM chat_messages WHERE role = 'user' AND is_read = 0");
      count = result.count;
    } else {
      const result = await dbGet("SELECT COUNT(*) as count FROM chat_messages WHERE user_id = ? AND role = 'admin' AND is_read = 0", [req.user.id]);
      count = result.count;
    }
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Gagal cek pesan." });
  }
});

app.get("/api/broadcast", async (req, res) => {
  try {
    const row = await dbGet("SELECT message FROM broadcasts ORDER BY id DESC LIMIT 1");
    res.json({ message: row ? row.message : null });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil broadcast." });
  }
});

app.post("/api/broadcast", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Pesan tidak boleh kosong." });

  db.run("INSERT INTO broadcasts (message) VALUES (?)", [message], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Broadcast terkirim!" });
  });
});

app.get("/api/products", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM products ORDER BY id ASC");
    res.json({ products: rows });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil produk." });
  }
});

app.post("/api/products", verifyToken, upload.single("image"), (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  
  const { name, category, price, original_price, duration, badge, data_name, description, sub_category, stock, flash_sale_price, flash_sale_end } = req.body;
  const imagePath = req.file ? `images/${req.file.filename}` : "";

  db.run(
    "INSERT INTO products (name, category, price, original_price, duration, badge, image, data_name, description, sub_category, stock, flash_sale_price, flash_sale_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [name, category, price, original_price || 0, duration, badge, imagePath, data_name, description || "", sub_category || "", stock || 0, flash_sale_price || 0, flash_sale_end || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Produk ditambahkan.", id: this.lastID });
    }
  );
});

app.put("/api/products/:id", verifyToken, upload.single("image"), async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  
  try {
    const { name, price, original_price, stock, description, sub_category, flash_sale_price, flash_sale_end } = req.body;
    
    const product = await dbGet("SELECT image FROM products WHERE id = ?", [req.params.id]);
    if (!product) return res.status(404).json({ error: "Produk tidak ditemukan." });

    const imagePath = req.file ? `images/${req.file.filename}` : product.image;

    await dbRun(
      "UPDATE products SET name = ?, price = ?, original_price = ?, stock = ?, description = ?, sub_category = ?, flash_sale_price = ?, flash_sale_end = ?, image = ? WHERE id = ?",
      [name, parseInt(price), parseInt(original_price) || 0, parseInt(stock), description, sub_category, parseInt(flash_sale_price) || 0, flash_sale_end || null, imagePath, req.params.id]
    );

    res.json({ message: "Produk berhasil diperbarui." });
  } catch (err) {
    console.error("Edit product error:", err);
    res.status(500).json({ error: "Gagal memperbarui produk." });
  }
});

app.delete("/api/products/:id", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  
  db.run("DELETE FROM products WHERE id = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Produk dihapus." });
  });
});

app.get("/api/stats", async (req, res) => {
  try {
    const userCount = await dbGet("SELECT COUNT(*) as count FROM users");
    const orderCount = await dbGet("SELECT COUNT(*) as count FROM orders WHERE status = 'Success'");
    const productCount = await dbGet("SELECT COUNT(*) as count FROM products");

    res.json({
      users: userCount.count,
      orders: orderCount.count,
      products: productCount.count
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil statistik." });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM categories ORDER BY id ASC");
    res.json({ categories: rows });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil kategori." });
  }
});

app.post("/api/categories", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ error: "Nama dan slug wajib diisi." });

  db.run("INSERT INTO categories (name, slug) VALUES (?, ?)", [name, slug], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Kategori ditambahkan.", id: this.lastID });
  });
});

app.delete("/api/categories/:id", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  
  db.run("DELETE FROM categories WHERE id = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Kategori dihapus." });
  });
});

app.get("/api/reviews", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM reviews ORDER BY id DESC LIMIT 10");
    res.json({ reviews: rows });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil ulasan." });
  }
});

app.post("/api/reviews", verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ error: "Rating dan komentar wajib diisi." });

    const existingReview = await dbGet("SELECT id FROM reviews WHERE user_id = ?", [req.user.id]);
    if (existingReview) {
      return res.status(403).json({ error: "Anda sudah pernah memberikan ulasan." });
    }

    await dbRun(
      "INSERT INTO reviews (user_id, username, rating, comment) VALUES (?, ?, ?, ?)",
      [req.user.id, req.user.username, rating, comment]
    );

    res.json({ message: "Ulasan berhasil ditambahkan." });
  } catch (err) {
    res.status(500).json({ error: "Gagal menambahkan ulasan." });
  }
});

app.delete("/api/reviews/:id", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  db.run("DELETE FROM reviews WHERE id = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Ulasan dihapus." });
  });
});

app.post("/api/users/pay-with-saldo", verifyToken, async (req, res) => {
  try {
    const { amount, product, order_code } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Nominal tidak valid." });
    }

    const user = await dbGet("SELECT saldo FROM users WHERE id = ?", [req.user.id]);
    
    if (!user || user.saldo < amount) {
      return res.status(400).json({ error: "Saldo tidak mencukupi." });
    }

    await dbRun("UPDATE users SET saldo = saldo - ? WHERE id = ?", [amount, req.user.id]);

    await dbRun(
      "INSERT INTO orders (user_id, order_code, product, price, method) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, order_code, product, amount, "Saldo"]
    );

    const updatedUser = await dbGet("SELECT saldo FROM users WHERE id = ?", [req.user.id]);
    
    res.json({ 
      message: "Pembayaran berhasil.", 
      total_saldo: updatedUser.saldo 
    });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ error: "Gagal memproses pembayaran." });
  }
});

app.post("/api/admin/product-accounts", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  
  try {
    const { product_id, accounts } = req.body; // accounts berupa array of string
    if (!product_id || !accounts || accounts.length === 0) {
      return res.status(400).json({ error: "Data tidak lengkap." });
    }

    for (const acc of accounts) {
      await dbRun("INSERT INTO product_accounts (product_id, account_data) VALUES (?, ?)", [product_id, acc]);
    }

    res.json({ message: `${accounts.length} akun berhasil ditambahkan ke stok.` });
  } catch (err) {
    res.status(500).json({ error: "Gagal menambah stok akun." });
  }
});

app.get("/api/admin/product-accounts/:productId", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak." });
  
  try {
    const available = await dbAll("SELECT id, account_data, created_at FROM product_accounts WHERE product_id = ? AND status = 'Available'", [req.params.productId]);
    const sold = await dbGet("SELECT COUNT(*) as count FROM product_accounts WHERE product_id = ? AND status = 'Sold'", [req.params.productId]);
    res.json({ available, total_sold: sold.count });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data stok." });
  }
});

app.get("/api/notes", verifyToken, async (req, res) => {
  try {
    const notes = await dbAll(
      "SELECT * FROM notes WHERE user_id = ? OR is_public = 1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil catatan." });
  }
});

app.post("/api/notes", verifyToken, async (req, res) => {
  try {
    const { title, content, is_public } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Judul dan isi wajib diisi." });

    await dbRun(
      "INSERT INTO notes (user_id, title, content, is_public) VALUES (?, ?, ?, ?)",
      [req.user.id, title, content, is_public ? 1 : 0]
    );
    res.json({ message: "Catatan berhasil disimpan." });
  } catch (err) {
    res.status(500).json({ error: "Gagal menyimpan catatan." });
  }
});

app.put("/api/notes/:id", verifyToken, async (req, res) => {
  try {
    const { title, content, is_public } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Judul dan isi wajib diisi." });

    await dbRun(
      "UPDATE notes SET title = ?, content = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
      [title, content, is_public ? 1 : 0, req.params.id, req.user.id]
    );
    res.json({ message: "Catatan berhasil diperbarui." });
  } catch (err) {
    res.status(500).json({ error: "Gagal memperbarui catatan." });
  }
});

app.delete("/api/notes/:id", verifyToken, async (req, res) => {
  try {
    await dbRun("DELETE FROM notes WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ message: "Catatan berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus catatan." });
  }
});

const server = app.listen(PORT, () => {
  console.clear();
  
  const green = "\x1b[32m";
  const gray = "\x1b[90m";
  const reset = "\x1b[0m";

  console.log(`\n  ${green}●${reset} ${gray}Status   :${reset} Online`);
  console.log(`  ${green}●${reset} ${gray}Database :${reset} SQLite (Connected)`);
  console.log(`  ${green}●${reset} ${gray}API URL  :${reset} http://localhost:${PORT}\n`);
});

process.on("SIGINT", () => {
  const red = "\x1b[31m";
  const reset = "\x1b[0m";
  console.log(`\n  ${red}● Server stopped.${reset}\n`);
  server.close(() => {
    db.close(() => {
      process.exit(0);
    });
  });
});
