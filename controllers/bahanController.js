import supabase from "../config/db.js";

export const getAllBahan = async (req, res) => {
  const { data, error } = await supabase
    .from("bahan_baku")
    .select(`
      *,
      kategori_bahan (nama_kategori),
      satuan_bahan (nama_satuan)
    `)
    .order("id", { ascending: false });

  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

export const addBahan = async (req, res) => {
  // Removed 'stok' from input, added 'stok_minimal'
  const { nama_bahan, kategori_id, satuan_id, stok_minimal } = req.body;
  const userId = req.user.id;

  const { error } = await supabase.from("bahan_baku").insert([
    {
      nama_bahan,
      kategori_id,
      satuan_id,
      stok: 0, // Auto set stok to 0
      stok_minimal: stok_minimal || 0, // Default to 0 if not provided
      created_by: userId,
    },
  ]);

  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json({ message: "Bahan baku berhasil ditambahkan" });
};

export const updateBahan = async (req, res) => {
  const { id } = req.params;
  // Removed 'stok' from input so it cannot be edited here
  const { nama_bahan, kategori_id, satuan_id, stok_minimal } = req.body;

  const { data: existing } = await supabase
    .from("bahan_baku")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return res.status(404).json({ message: "Bahan tidak ditemukan" });

  const { error } = await supabase
    .from("bahan_baku")
    .update({
      nama_bahan,
      kategori_id,
      satuan_id,
      stok_minimal, // Only update stok_minimal
    })
    .eq("id", id);

  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: "Bahan baku berhasil diperbarui" });
};

export const deleteBahan = async (req, res) => {
  const { id } = req.params;

  const { data: existing } = await supabase
    .from("bahan_baku")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return res.status(404).json({ message: "Bahan tidak ditemukan" });

  const { error } = await supabase.from("bahan_baku").delete().eq("id", id);

  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: "Bahan baku berhasil dihapus" });
};