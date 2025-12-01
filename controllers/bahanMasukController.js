// controllers/orderController.js
import db from "../config/db.js";

export const createOrder = async (req, res) => {
    const { bahan_id, jumlah } = req.body;
    const cabang_id = req.user.id;

    try {
        // Ambil harga bahan
        const [bahanRows] = await db.query("SELECT harga FROM bahan_baku WHERE id = ?", [bahan_id]);
        if (!bahanRows[0]) return res.status(404).json({ message: "Bahan tidak ditemukan" });

        const harga = bahanRows[0].harga || 0;
        const subtotal = Number(jumlah) * Number(harga);

        const randomLetters = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 huruf acak
        const datePart = new Date()
            .toISOString()
            .replace(/[-:TZ.]/g, "")
            .slice(2, 12); // YYMMDDHHMM
        const kode_order = `${randomLetters}${datePart}`;

        // Pastikan kode_order unik
        const [existing] = await db.query("SELECT id FROM order_bahan WHERE kode_order = ?", [kode_order]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Gagal membuat order, kode duplikat. Coba lagi." });
        }

        // Insert data order
        const [result] = await db.query(
            `INSERT INTO order_bahan (kode_order, cabang_id, bahan_id, jumlah, total_harga, status, action_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [kode_order, cabang_id, bahan_id, jumlah, subtotal, 'pending', null]
        );

        res.status(201).json({ message: "Order dibuat", orderId: result.insertId, kode_order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


export const listOrders = async (req, res) => {
    const user = req.user;
    try {
        let rows;
        console.log("✅ Detected user role:", user.role);

        if (user.role === "cabang") {
            console.log("➡️ Masuk ke kondisi CABANG");
            const [r] = await db.query(
                `SELECT
                    o.*,
                    b.nama_bahan,
                    u2.name AS supplier_name
                 FROM order_bahan o
                 JOIN bahan_baku b ON o.bahan_id = b.id
                 LEFT JOIN users u2 ON o.action_by = u2.id
                 WHERE o.cabang_id = ?
                 ORDER BY o.created_at DESC`,
                [user.id]
            );
            rows = r;
        } else {
            console.log("➡️ Masuk ke kondisi ADMIN / DEFAULT");
            const [r] = await db.query(
                `SELECT
                    o.*,
                    b.nama_bahan,
                    u.name AS cabang_name,
                    u2.name AS supplier_name
                 FROM order_bahan o
                 JOIN bahan_baku b ON o.bahan_id = b.id
                 LEFT JOIN users u ON o.cabang_id = u.id
                 LEFT JOIN users u2 ON o.action_by = u2.id
                 ORDER BY o.created_at DESC`
            );
            rows = r;
        }
        res.json(rows);
    } catch (err) {
        console.error("❌ listOrders error:", err);
        res.status(500).json({ message: err.message });
    }
};


export const getOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT o.*, b.nama_bahan, u.name as cabang_name
             FROM order_bahan o
             JOIN bahan_baku b ON o.bahan_id = b.id
             LEFT JOIN users u ON o.cabang_id = u.id
             WHERE o.id = ?`,
            [id]
        );
        if (!rows[0]) return res.status(404).json({ message: "Order not found" });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// supplier accept order
export const acceptOrder = async (req, res) => {
    const { id } = req.params;
    const supplierId = req.user.id;

    try {
        const [orders] = await db.query("SELECT * FROM order_bahan WHERE id = ?", [id]);
        const order = orders[0];
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.status !== "pending") return res.status(400).json({ message: "Order bukan status pending" });

        await db.query(
            "UPDATE order_bahan SET status = 'approved', action_by = ?, updated_at = NOW() WHERE id = ?",
            [supplierId, id]
        );

        res.json({ message: "Order diterima" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const rejectOrder = async (req, res) => {
    const { id } = req.params;
    const supplierId = req.user.id;

    try {
        const [orders] = await db.query("SELECT * FROM order_bahan WHERE id = ?", [id]);
        const order = orders[0];
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.status !== "pending") return res.status(400).json({ message: "Order bukan status pending" });

        await db.query(
            "UPDATE order_bahan SET status = 'rejected', action_by = ?, updated_at = NOW() WHERE id = ?",
            [supplierId, id]
        );

        res.json({ message: "Order ditolak" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const deliverOrder = async (req, res) => {
    const { id } = req.params;
    const supplierId = req.user.id;

    try {
        const [orders] = await db.query("SELECT * FROM order_bahan WHERE id = ?", [id]);
        const order = orders[0];
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.supplier_id !== supplierId) return res.status(403).json({ message: "Bukan order milik supplier" });
        if (order.status !== "approved") return res.status(400).json({ message: "Order harus disetujui sebelum dikirim" });

        await db.query(
            "UPDATE order_bahan SET status = 'delivered', action_by = ?, updated_at = NOW() WHERE id = ?",
            [supplierId, id]
        );

        // update stok bahan
        await db.query("UPDATE bahan_baku SET stok = stok + ? WHERE id = ?", [order.jumlah, order.bahan_id]);

        res.json({ message: "Order dikirim dan stok diperbarui" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
