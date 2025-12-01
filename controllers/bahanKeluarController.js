import db from "../config/db.js";

export const listBahanKeluar = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT bk.*, b.nama_bahan, u.name AS action_by_name
            FROM bahan_keluar bk
            JOIN bahan_baku b ON bk.bahan_id = b.id
            LEFT JOIN users u ON bk.action_by = u.id
            ORDER BY bk.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const createBahanKeluar = async (req, res) => {
    const { bahan_id, jumlah, keterangan } = req.body;
    const user_id = req.user.id;

    const conn = await db.getConnection(); 

    try {
        await conn.beginTransaction();

        // 1️⃣ Cek stok bahan
        const [bahanRows] = await conn.query("SELECT stok FROM bahan_baku WHERE id = ?", [bahan_id]);
        if (!bahanRows.length) {
            throw new Error("Bahan tidak ditemukan");
        }

        const stokSekarang = bahanRows[0].stok;
        if (stokSekarang < jumlah) {
            throw new Error("Stok tidak mencukupi");
        }

        // 2️⃣ Kurangi stok bahan
        await conn.query("UPDATE bahan_baku SET stok = stok - ? WHERE id = ?", [jumlah, bahan_id]);

        // 3️⃣ Simpan ke tabel bahan_keluar
        await conn.query(
            `
      INSERT INTO bahan_keluar (bahan_id, jumlah, keterangan, action_by)
      VALUES (?, ?, ?, ?)
      `,
            [bahan_id, jumlah, keterangan || null, user_id]
        );

        await conn.commit(); // ✅ commit transaksi

        res.json({ message: "Bahan keluar berhasil ditambahkan" });
    } catch (err) {
        await conn.rollback(); // ❌ rollback jika error
        console.error("❌ Error createBahanKeluar:", err);
        res.status(500).json({ message: err.message });
    } finally {
        conn.release(); // 🔁 kembalikan koneksi ke pool
    }
};

