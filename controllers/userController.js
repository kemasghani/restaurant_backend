// controllers/userController.js
import db from "../config/db.js";
import bcrypt from "bcrypt";

// ✅ Ambil semua user
export const getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, name, email, role, created_at FROM users ORDER BY id DESC"
        );
        res.json(rows);
    } catch (err) {
        console.error("❌ getAllUsers error:", err);
        res.status(500).json({ message: "Gagal mengambil data user" });
    }
};

// ✅ Tambah user baru
export const addUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    try {
        // Cek apakah email sudah digunakan
        const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
            email,
        ]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role]
        );

        res.status(201).json({ message: "User berhasil ditambahkan" });
    } catch (err) {
        console.error("❌ addUser error:", err);
        res.status(500).json({ message: "Gagal menambahkan user" });
    }
};

// ✅ Update user
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({ message: "Field wajib diisi" });
    }

    try {
        // Cek user ada atau tidak
        const [user] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        if (user.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Cek jika email baru sudah dipakai user lain
        const [duplicate] = await db.query(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            [email, id]
        );
        if (duplicate.length > 0) {
            return res.status(400).json({ message: "Email sudah digunakan user lain" });
        }

        // Jika password diisi, hash ulang
        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.query(
                "UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?",
                [name, email, hashedPassword, role, id]
            );
        } else {
            await db.query(
                "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
                [name, email, role, id]
            );
        }

        res.json({ message: "User berhasil diperbarui" });
    } catch (err) {
        console.error("❌ updateUser error:", err);
        res.status(500).json({ message: "Gagal memperbarui user" });
    }
};

// ✅ Hapus user
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const [user] = await db.query("SELECT id FROM users WHERE id = ?", [id]);
        if (user.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        await db.query("DELETE FROM users WHERE id = ?", [id]);
        res.json({ message: "User berhasil dihapus" });
    } catch (err) {
        console.error("❌ deleteUser error:", err);
        res.status(500).json({ message: "Gagal menghapus user" });
    }
};
