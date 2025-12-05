import supabase from "../config/db.js";

// --- 1. NOTIFIKASI STOK MENIPIS (GUDANG PUSAT & CABANG) ---
export const getLowStockAlerts = async (req, res) => {
  try {
    // 1. Ambil Data Master (Bahan, Cabang, Transaksi) secara paralel agar cepat
    const [bahanRes, cabangRes, masukRes, keluarRes] = await Promise.all([
      supabase.from("bahan_baku").select("id, nama_bahan, stok, stok_minimal, satuan:satuan_bahan(nama_satuan)"),
      supabase.from("users").select("id, name").eq("role", "cabang"),
      supabase.from("bahan_masuk").select("bahan_id, cabang_id, jumlah"),
      supabase.from("bahan_keluar").select("bahan_id, action_by, jumlah")
    ]);

    if (bahanRes.error) throw bahanRes.error;
    if (cabangRes.error) throw cabangRes.error;

    const allAlerts = [];
    const bahanList = bahanRes.data;
    const cabangList = cabangRes.data;
    const logMasuk = masukRes.data || [];
    const logKeluar = keluarRes.data || [];

    // --- A. CEK STOK GUDANG PUSAT (Dari tabel bahan_baku) ---
    bahanList.forEach((item) => {
      if (item.stok <= item.stok_minimal) {
        allAlerts.push({
          lokasi: "GUDANG PUSAT",
          cabang_id: null,
          nama_bahan: item.nama_bahan,
          sisa_stok: item.stok,
          batas_minimum: item.stok_minimal,
          satuan: item.satuan?.nama_satuan,
          status: item.stok <= 0 ? "HABIS" : "MENIPIS"
        });
      }
    });

    // --- B. CEK STOK PER CABANG (Hitung Manual: Masuk - Keluar) ---
    cabangList.forEach((cabang) => {
      bahanList.forEach((item) => {
        // 1. Hitung Total Masuk ke Cabang ini
        const totalMasuk = logMasuk
          .filter(m => m.cabang_id === cabang.id && m.bahan_id === item.id)
          .reduce((sum, current) => sum + current.jumlah, 0);

        // 2. Hitung Total Keluar/Terpakai oleh Cabang ini
        const totalKeluar = logKeluar
          .filter(k => k.action_by === cabang.id && k.bahan_id === item.id)
          .reduce((sum, current) => sum + current.jumlah, 0);

        // 3. Stok Akhir Cabang
        const stokCabang = totalMasuk - totalKeluar;

        // 4. Cek apakah menipis (Menggunakan standar stok_minimal global)
        // Note: Stok cabang bisa negatif jika lupa input barang masuk tapi sudah input keluar
        if (stokCabang <= item.stok_minimal) {
          allAlerts.push({
            lokasi: cabang.name, // Nama Cabang (misal: "Cabang Jakarta")
            cabang_id: cabang.id,
            nama_bahan: item.nama_bahan,
            sisa_stok: stokCabang,
            batas_minimum: item.stok_minimal,
            satuan: item.satuan?.nama_satuan,
            status: stokCabang <= 0 ? "HABIS" : "MENIPIS"
          });
        }
      });
    });

    res.json({
      message: "Data alert stok berhasil diambil",
      total_alerts: allAlerts.length,
      data: allAlerts
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};