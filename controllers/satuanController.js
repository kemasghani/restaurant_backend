import { supabase } from "../config/supabase.js";

export const getAllSatuan = async (req, res) => {
    const { data, error } = await supabase
        .from("satuan_bahan")
        .select("*")
        .order("id", { ascending: false });

    if (error) return res.status(500).json({ message: "Gagal mengambil data satuan" });
    res.json(data);
};

export const addSatuan = async (req, res) => {
    const { nama_satuan, keterangan } = req.body;

    if (!nama_satuan || nama_satuan.trim() === "")
        return res.status(400).json({ message: "Nama satuan wajib diisi" });

    const { data: existing } = await supabase
        .from("satuan_bahan")
        .select("id")
        .eq("nama_satuan", nama_satuan)
        .limit(1);

    if (existing && existing.length > 0)
        return res.status(400).json({ message: "Nama satuan sudah digunakan" });

    const { error } = await supabase
        .from("satuan_bahan")
        .insert([{ nama_satuan, keterangan: keterangan || null }]);

    if (error) return res.status(500).json({ message: "Gagal menambahkan satuan" });
    res.status(201).json({ message: "Satuan berhasil ditambahkan" });
};

export const updateSatuan = async (req, res) => {
    const { id } = req.params;
    const { nama_satuan, keterangan } = req.body;

    if (!nama_satuan || nama_satuan.trim() === "")
        return res.status(400).json({ message: "Nama satuan wajib diisi" });

    const { data: existing } = await supabase
        .from("satuan_bahan")
        .select("id")
        .eq("id", id)
        .limit(1);

    if (!existing || existing.length === 0)
        return res.status(404).json({ message: "Satuan tidak ditemukan" });

    const { error } = await supabase
        .from("satuan_bahan")
        .update({ nama_satuan, keterangan: keterangan || null })
        .eq("id", id);

    if (error) return res.status(500).json({ message: "Gagal memperbarui satuan" });
    res.json({ message: "Satuan berhasil diperbarui" });
};

export const deleteSatuan = async (req, res) => {
    const { id } = req.params;

    const { data: existing } = await supabase
        .from("satuan_bahan")
        .select("id")
        .eq("id", id)
        .limit(1);

    if (!existing || existing.length === 0)
        return res.status(404).json({ message: "Satuan tidak ditemukan" });

    const { error } = await supabase
        .from("satuan_bahan")
        .delete()
        .eq("id", id);

    if (error) return res.status(500).json({ message: "Gagal menghapus satuan" });
    res.json({ message: "Satuan berhasil dihapus" });
};
