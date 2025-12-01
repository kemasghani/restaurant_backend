// controllers/satuanController.js
import db from "../config/db.js";

// ✅ Ambil semua satuan
export const getAllSatuan = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM satuan_bahan ORDER BY id DESC");
        res.json(rows);
    } catch (err) {
        console.error("❌ getAllSatuan error:", err);
        res.status(500).json({ message: "Gagal mengambil data satuan" });
    }
};

// ✅ Tambah satuan baru
export const addSatuan = async (req, res) => {
    const { nama_satuan, keterangan } = req.body;

    if (!nama_satuan || nama_satuan.trim() === "") {
        return res.status(400).json({ message: "Nama satuan wajib diisi" });
    }

    try {
        // Cek apakah nama sudah ada
        const [existing] = await db.query(
            "SELECT id FROM satuan_bahan WHERE nama_satuan = ?",
            [nama_satuan]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: "Nama satuan sudah digunakan" });
        }

        await db.query(
            "INSERT INTO satuan_bahan (nama_satuan, keterangan) VALUES (?, ?)",
            [nama_satuan, keterangan || null]
        );
        res.status(201).json({ message: "Satuan berhasil ditambahkan" });
    } catch (err) {
        console.error("❌ addSatuan error:", err);
        res.status(500).json({ message: "Gagal menambahkan satuan" });
    }
};

// ✅ Edit satuan
export const updateSatuan = async (req, res) => {
    const { id } = req.params;
    const { nama_satuan, keterangan } = req.body;

    if (!nama_satuan || nama_satuan.trim() === "") {
        return res.status(400).json({ message: "Nama satuan wajib diisi" });
    }

    try {
        const [existing] = await db.query("SELECT id FROM satuan_bahan WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Satuan tidak ditemukan" });
        }

        await db.query(
            "UPDATE satuan_bahan SET nama_satuan = ?, keterangan = ? WHERE id = ?",
            [nama_satuan, keterangan || null, id]
        );
        res.json({ message: "Satuan berhasil diperbarui" });
    } catch (err) {
        console.error("❌ updateSatuan error:", err);
        res.status(500).json({ message: "Gagal memperbarui satuan" });
    }
};

// ✅ Hapus satuan
export const deleteSatuan = async (req, res) => {
    const { id } = req.params;

    try {
        const [existing] = await db.query("SELECT id FROM satuan_bahan WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Satuan tidak ditemukan" });
        }

        await db.query("DELETE FROM satuan_bahan WHERE id = ?", [id]);
        res.json({ message: "Satuan berhasil dihapus" });
    } catch (err) {
        console.error("❌ deleteSatuan error:", err);
        res.status(500).json({ message: "Gagal menghapus satuan" });
    }
};
