import db from "../config/db.js";

// ✅ Ambil semua bahan
export const getAllBahan = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT b.*, k.nama_kategori, s.nama_satuan
       FROM bahan_baku b
       LEFT JOIN kategori_bahan k ON b.kategori_id = k.id
       LEFT JOIN satuan_bahan s ON b.satuan_id = s.id
       ORDER BY b.id DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ Tambah bahan baru
export const addBahan = async (req, res) => {
    const { nama_bahan, kategori_id, satuan_id, stok } = req.body;
    const userId = req.user.id;
    try {
        await db.query(
            `INSERT INTO bahan_baku (nama_bahan, kategori_id, satuan_id, stok, created_by)
       VALUES (?, ?, ?, ?, ?)`,
            [nama_bahan, kategori_id, satuan_id, stok, userId]
        );
        res.status(201).json({ message: "Bahan baku berhasil ditambahkan" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ Update bahan
export const updateBahan = async (req, res) => {
    const { id } = req.params;
    const { nama_bahan, kategori_id, satuan_id, stok } = req.body;

    try {
        // pastikan bahan ada
        const [existing] = await db.query("SELECT id FROM bahan_baku WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Bahan tidak ditemukan" });
        }

        await db.query(
            `UPDATE bahan_baku
       SET nama_bahan = ?, kategori_id = ?, satuan_id = ?, stok = ?
       WHERE id = ?`,
            [nama_bahan, kategori_id, satuan_id, stok, id]
        );

        res.json({ message: "Bahan baku berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ Hapus bahan
export const deleteBahan = async (req, res) => {
    const { id } = req.params;

    try {
        // pastikan bahan ada
        const [existing] = await db.query("SELECT id FROM bahan_baku WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Bahan tidak ditemukan" });
        }

        await db.query("DELETE FROM bahan_baku WHERE id = ?", [id]);
        res.json({ message: "Bahan baku berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
