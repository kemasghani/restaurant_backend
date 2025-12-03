import { supabase } from "../config/supabase.js";
import bcrypt from "bcrypt";

export const getAllUsers = async (req, res) => {
    const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .order("id", { ascending: false });

    if (error) return res.status(500).json({ message: "Gagal mengambil data user" });
    res.json(data);
};

export const addUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role)
        return res.status(400).json({ message: "Semua field wajib diisi" });

    const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .limit(1);

    if (existing && existing.length > 0)
        return res.status(400).json({ message: "Email sudah terdaftar" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase.from("users").insert([
        { name, email, password: hashedPassword, role }
    ]);

    if (error) return res.status(500).json({ message: "Gagal menambahkan user" });
    res.status(201).json({ message: "User berhasil ditambahkan" });
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    if (!name || !email || !role)
        return res.status(400).json({ message: "Field wajib diisi" });

    const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .limit(1);

    if (!user || user.length === 0)
        return res.status(404).json({ message: "User tidak ditemukan" });

    const { data: duplicate } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .neq("id", id);

    if (duplicate && duplicate.length > 0)
        return res.status(400).json({ message: "Email sudah digunakan user lain" });

    let updatePayload = { name, email, role };

    if (password && password.trim() !== "") {
        updatePayload.password = await bcrypt.hash(password, 10);
    }

    const { error } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", id);

    if (error) return res.status(500).json({ message: "Gagal memperbarui user" });
    res.json({ message: "User berhasil diperbarui" });
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("id", id)
        .limit(1);

    if (!existing || existing.length === 0)
        return res.status(404).json({ message: "User tidak ditemukan" });

    const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);

    if (error) return res.status(500).json({ message: "Gagal menghapus user" });
    res.json({ message: "User berhasil dihapus" });
};
