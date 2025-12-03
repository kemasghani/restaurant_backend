import supabase from "../config/db.js";

export const createOrder = async (req, res) => {
  const { bahan_id, jumlah } = req.body;
  const cabang_id = req.user.id;

  // pastikan bahan ada
  const { data: bahan, error: e1 } = await supabase
    .from("bahan_baku")
    .select("id")
    .eq("id", bahan_id)
    .single();

  if (e1) return res.status(500).json({ message: e1.message });
  if (!bahan) return res.status(404).json({ message: "Bahan tidak ditemukan" });

  const { data, error: e2 } = await supabase
    .from("bahan_masuk")
    .insert([
      {
        cabang_id,
        bahan_id,
        jumlah,
        status: "pending",
        action_by: null,
      },
    ])
    .select()
    .single();

  if (e2) return res.status(500).json({ message: e2.message });

  res.status(201).json({
    message: "Order dibuat",
    orderId: data.id,
  });
};

export const listOrders = async (req, res) => {
  const user = req.user;

  let query = supabase
    .from("bahan_masuk")
    .select(`
      *,
      bahan_baku (nama_bahan),
      cabang:users!bahan_masuk_cabang_id_fkey (name),
      supplier:users!bahan_masuk_action_by_fkey (name)
    `)
    .order("created_at", { ascending: false });

  if (user.role === "cabang") {
    query = query.eq("cabang_id", user.id);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

export const getOrder = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("bahan_masuk")
    .select(`
      *,
      bahan_baku (nama_bahan),
      cabang:users!bahan_masuk_cabang_id_fkey (name)
    `)
    .eq("id", id)
    .single();

  if (error) return res.status(500).json({ message: error.message });
  if (!data) return res.status(404).json({ message: "Order not found" });

  res.json(data);
};

export const acceptOrder = async (req, res) => {
  const { id } = req.params;
  const supplierId = req.user.id;

  const { data: order, error: e1 } = await supabase
    .from("bahan_masuk")
    .select("*")
    .eq("id", id)
    .single();

  if (e1) return res.status(500).json({ message: e1.message });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status !== "pending")
    return res.status(400).json({ message: "Order bukan status pending" });

  const { error: e2 } = await supabase
    .from("bahan_masuk")
    .update({ status: "approved", action_by: supplierId, updated_at: new Date() })
    .eq("id", id);

  if (e2) return res.status(500).json({ message: e2.message });
  res.json({ message: "Order diterima" });
};

export const rejectOrder = async (req, res) => {
  const { id } = req.params;
  const supplierId = req.user.id;

  const { data: order, error: e1 } = await supabase
    .from("bahan_masuk")
    .select("*")
    .eq("id", id)
    .single();

  if (e1) return res.status(500).json({ message: e1.message });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status !== "pending")
    return res.status(400).json({ message: "Order bukan status pending" });

  const { error: e2 } = await supabase
    .from("bahan_masuk")
    .update({ status: "rejected", action_by: supplierId, updated_at: new Date() })
    .eq("id", id);

  if (e2) return res.status(500).json({ message: e2.message });
  res.json({ message: "Order ditolak" });
};

export const deliverOrder = async (req, res) => {
  const { id } = req.params;
  const supplierId = req.user.id;

  const { data: order, error: e1 } = await supabase
    .from("bahan_masuk")
    .select("*")
    .eq("id", id)
    .single();

  if (e1) return res.status(500).json({ message: e1.message });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.action_by !== supplierId)
    return res.status(403).json({ message: "Bukan order milik supplier" });
  if (order.status !== "approved")
    return res.status(400).json({ message: "Order harus disetujui sebelum dikirim" });

  const { error: e2 } = await supabase
    .from("bahan_masuk")
    .update({ status: "delivered", updated_at: new Date() })
    .eq("id", id);

  if (e2) return res.status(500).json({ message: e2.message });

  const { error: e3 } = await supabase
    .from("bahan_baku")
    .update({ stok: order.jumlah + (order.stok || 0) })
    .eq("id", order.bahan_id);

  if (e3) return res.status(500).json({ message: e3.message });

  res.json({ message: "Order dikirim dan stok diperbarui" });
};
