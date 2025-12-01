import db from "../config/db.js";

// ✅ Ambil semua kategori bahan
export const getAllKategori = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM kategori_bahan ORDER BY id DESC"
        );
        res.json(rows);
    } catch (err) {
        console.error("❌ getAllKategori error:", err);
        res.status(500).json({ message: "Gagal mengambil data kategori bahan" });
    }
};

// ✅ Tambah kategori bahan baru
export const addKategori = async (req, res) => {
    const { nama_kategori } = req.body;

    if (!nama_kategori || nama_kategori.trim() === "") {
        return res.status(400).json({ message: "Nama kategori wajib diisi" });
    }

    try {
        // Cek apakah nama sudah ada
        const [existing] = await db.query(
            "SELECT id FROM kategori_bahan WHERE nama_kategori = ?",
            [nama_kategori]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: "Kategori sudah ada" });
        }

        await db.query(
            "INSERT INTO kategori_bahan (nama_kategori) VALUES (?, ?)",
            [nama_kategori]
        );
        res.json({ message: "Kategori bahan berhasil ditambahkan" });
    } catch (err) {
        console.error("❌ addKategori error:", err);
        res.status(500).json({ message: "Gagal menambahkan kategori bahan" });
    }
};

// ✅ Update kategori bahan
export const updateKategori = async (req, res) => {
    const { id } = req.params;
    const { nama_kategori } = req.body;

    if (!nama_kategori || nama_kategori.trim() === "") {
        return res.status(400).json({ message: "Nama kategori wajib diisi" });
    }

    try {
        // Pastikan data ada
        const [existing] = await db.query("SELECT * FROM kategori_bahan WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Kategori tidak ditemukan" });
        }

        // Cek duplikasi nama (kecuali dirinya sendiri)
        const [duplicate] = await db.query(
            "SELECT id FROM kategori_bahan WHERE nama_kategori = ? AND id != ?",
            [nama_kategori, id]
        );
        if (duplicate.length > 0) {
            return res.status(400).json({ message: "Nama kategori sudah digunakan" });
        }

        await db.query(
            "UPDATE kategori_bahan SET nama_kategori = ? WHERE id = ?",
            [nama_kategori, id]
        );

        res.json({ message: "Kategori bahan berhasil diperbarui" });
    } catch (err) {
        console.error("❌ updateKategori error:", err);
        res.status(500).json({ message: "Gagal memperbarui kategori bahan" });
    }
};

// ✅ Hapus kategori bahan
export const deleteKategori = async (req, res) => {
    const { id } = req.params;

    try {
        // Pastikan data ada
        const [existing] = await db.query("SELECT * FROM kategori_bahan WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Kategori tidak ditemukan" });
        }

        // Cek apakah kategori masih digunakan di bahan_baku
        const [used] = await db.query(
            "SELECT id FROM bahan_baku WHERE kategori_id = ? LIMIT 1",
            [id]
        );
        if (used.length > 0) {
            return res
                .status(400)
                .json({ message: "Kategori ini masih digunakan di data bahan baku" });
        }

        await db.query("DELETE FROM kategori_bahan WHERE id = ?", [id]);
        res.json({ message: "Kategori bahan berhasil dihapus" });
    } catch (err) {
        console.error("❌ deleteKategori error:", err);
        res.status(500).json({ message: "Gagal menghapus kategori bahan" });
    }
};
