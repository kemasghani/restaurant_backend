import { supabase } from "../config/db.js";

export const getAllKategori = async (req, res) => {
    const { data, error } = await supabase
        .from("kategori_bahan")
        .select("*")
        .order("id", { ascending: false });

    if (error) return res.status(500).json({ message: "Gagal mengambil data kategori bahan" });
    res.json(data);
};

export const addKategori = async (req, res) => {
    const { nama_kategori } = req.body;

    if (!nama_kategori || nama_kategori.trim() === "")
        return res.status(400).json({ message: "Nama kategori wajib diisi" });

    const { data: existing } = await supabase
        .from("kategori_bahan")
        .select("id")
        .eq("nama_kategori", nama_kategori)
        .limit(1);

    if (existing && existing.length > 0)
        return res.status(400).json({ message: "Kategori sudah ada" });

    const { error } = await supabase
        .from("kategori_bahan")
        .insert([{ nama_kategori }]);

    if (error) return res.status(500).json({ message: "Gagal menambahkan kategori bahan" });
    res.json({ message: "Kategori bahan berhasil ditambahkan" });
};

export const updateKategori = async (req, res) => {
    const { id } = req.params;
    const { nama_kategori } = req.body;

    if (!nama_kategori || nama_kategori.trim() === "")
        return res.status(400).json({ message: "Nama kategori wajib diisi" });

    const { data: existing } = await supabase
        .from("kategori_bahan")
        .select("*")
        .eq("id", id)
        .limit(1);

    if (!existing || existing.length === 0)
        return res.status(404).json({ message: "Kategori tidak ditemukan" });

    const { data: duplicate } = await supabase
        .from("kategori_bahan")
        .select("id")
        .eq("nama_kategori", nama_kategori)
        .neq("id", id)
        .limit(1);

    if (duplicate && duplicate.length > 0)
        return res.status(400).json({ message: "Nama kategori sudah digunakan" });

    const { error } = await supabase
        .from("kategori_bahan")
        .update({ nama_kategori })
        .eq("id", id);

    if (error) return res.status(500).json({ message: "Gagal memperbarui kategori bahan" });
    res.json({ message: "Kategori bahan berhasil diperbarui" });
};

export const deleteKategori = async (req, res) => {
    const { id } = req.params;

    const { data: existing } = await supabase
        .from("kategori_bahan")
        .select("id")
        .eq("id", id)
        .limit(1);

    if (!existing || existing.length === 0)
        return res.status(404).json({ message: "Kategori tidak ditemukan" });

    const { data: used } = await supabase
        .from("bahan_baku")
        .select("id")
        .eq("kategori_id", id)
        .limit(1);

    if (used && used.length > 0)
        return res.status(400).json({ message: "Kategori ini masih digunakan di data bahan baku" });

    const { error } = await supabase
        .from("kategori_bahan")
        .delete()
        .eq("id", id);

    if (error) return res.status(500).json({ message: "Gagal menghapus kategori bahan" });
    res.json({ message: "Kategori bahan berhasil dihapus" });
};
