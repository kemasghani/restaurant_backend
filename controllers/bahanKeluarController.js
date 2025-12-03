import supabase from "../config/db.js";

export const listBahanKeluar = async (req, res) => {
  const { data, error } = await supabase
    .from("bahan_keluar")
    .select(`
      *,
      bahan_baku (nama_bahan),
      users (name)
    `)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

export const createBahanKeluar = async (req, res) => {
  const { bahan_id, jumlah, keterangan } = req.body;
  const user_id = req.user.id;

  const { data: bahan, error: e1 } = await supabase
    .from("bahan_baku")
    .select("stok")
    .eq("id", bahan_id)
    .single();

  if (e1) return res.status(500).json({ message: e1.message });
  if (!bahan) return res.status(404).json({ message: "Bahan tidak ditemukan" });
  if (bahan.stok < jumlah)
    return res.status(400).json({ message: "Stok tidak mencukupi" });

  const { error: e2 } = await supabase
    .from("bahan_baku")
    .update({ stok: bahan.stok - jumlah })
    .eq("id", bahan_id);

  if (e2) return res.status(500).json({ message: e2.message });

  const { error: e3 } = await supabase.from("bahan_keluar").insert([
    {
      bahan_id,
      jumlah,
      keterangan: keterangan || null,
      action_by: user_id,
    },
  ]);

  if (e3) return res.status(500).json({ message: e3.message });

  res.json({ message: "Bahan keluar berhasil ditambahkan" });
};
