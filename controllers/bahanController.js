import supabase from "../config/db.js";


export const getAllBahan = async (req, res) => {
  const user = req.user; // Pastikan middleware auth sudah berjalan

  // 1. Ambil Data Master Bahan Baku (Global)
  let { data: bahanData, error } = await supabase
    .from("bahan_baku")
    .select(`
      *,
      kategori_bahan (nama_kategori),
      satuan_bahan (nama_satuan)
    `)
    .order("id", { ascending: false });

  if (error) return res.status(500).json({ message: error.message });

  // 2. Logika Khusus Jika Role = 'cabang'
  if (user.role === "cabang") {
    // Ambil data bahan_masuk khusus untuk cabang ini (berdasarkan user.id)
    const { data: logMasuk, error: errMasuk } = await supabase
      .from("bahan_masuk")
      .select("bahan_id, jumlah")
      .eq("cabang_id", user.id); // Filter berdasarkan ID cabang

    if (errMasuk) return res.status(500).json({ message: errMasuk.message });

    // Hitung total stok per bahan
    // Kita buat Dictionary/Map agar proses pencarian cepat: { bahan_id: total_stok }
    const stokCabangMap = {};
    
    if (logMasuk) {
      logMasuk.forEach((item) => {
        if (!stokCabangMap[item.bahan_id]) {
          stokCabangMap[item.bahan_id] = 0;
        }
        stokCabangMap[item.bahan_id] += item.jumlah;
      });
    }

    // Replace nilai 'stok' global dengan stok hitungan cabang
    bahanData = bahanData.map((bahan) => {
      return {
        ...bahan,
        // Jika ada di map ambil nilainya, jika tidak ada berarti 0
        stok: stokCabangMap[bahan.id] || 0 
      };
    });
  }

  res.json(bahanData);
};

export const addBahan = async (req, res) => {
  // Removed 'stok' from input, added 'stok_minimal'
  const { nama_bahan, kategori_id, satuan_id, stok_minimal } = req.body;

  const { error } = await supabase.from("bahan_baku").insert([
    {
      nama_bahan,
      kategori_id,
      satuan_id,
      stok: 0, // Auto set stok to 0
      stok_minimal: stok_minimal || 0, // Default to 0 if not provided
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