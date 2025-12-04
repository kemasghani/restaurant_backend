import supabase from "../config/db.js";

// --- 1. NOTIFIKASI STOK MENIPIS (LOW STOCK ALERT) ---
export const getLowStockAlerts = async (req, res) => {
  try {
    // Ambil semua bahan baku
    const { data: bahan, error } = await supabase
      .from("bahan_baku")
      .select("id, nama_bahan, stok, stok_minimal, satuan:satuan_bahan(nama_satuan)");

    if (error) throw error;

    // Filter logic: Cari yang stok <= stok_minimal
    // Kita filter di level JS karena membandingkan dua kolom (col A <= col B) 
    // di query builder standar Supabase sedikit rumit tanpa RPC.
    const lowStockItems = bahan.filter((item) => item.stok <= item.stok_minimal);

    res.json({
      message: "Data stok menipis berhasil diambil",
      total_alerts: lowStockItems.length,
      data: lowStockItems.map(item => ({
        id: item.id,
        nama_bahan: item.nama_bahan,
        sisa_stok: item.stok,
        batas_minimum: item.stok_minimal,
        satuan: item.satuan?.nama_satuan,
        status: item.stok === 0 ? "HABIS" : "MENIPIS" // Status tambahan
      }))
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 2. LAPORAN TOTAL ORDER PER CABANG ---
export const getBranchOrderStats = async (req, res) => {
  try {
    // Ambil data bahan_masuk yang statusnya sudah 'delivered' (sudah diterima cabang)
    // Atau 'approved' tergantung aturan bisnis kamu. Di sini saya pakai 'approved'.
    const { data: orders, error } = await supabase
      .from("bahan_masuk")
      .select(`
        id,
        jumlah,
        created_at,
        bahan:bahan_baku(nama_bahan, satuan:satuan_bahan(nama_satuan)),
        cabang:users!bahan_masuk_cabang_id_fkey(id, name)
      `)
      .in('status', ['approved', 'delivered']); // Hanya hitung yang valid

    if (error) throw error;

    // PENGELOMPOKAN DATA (Grouping by Cabang)
    // Kita olah data mentah menjadi format laporan yang rapi
    const report = {};

    orders.forEach((order) => {
      const branchName = order.cabang?.name || "Unknown Branch";
      const branchId = order.cabang?.id;

      if (!report[branchName]) {
        report[branchName] = {
          cabang_id: branchId,
          cabang_name: branchName,
          total_transaksi: 0,
          detail_bahan: {}
        };
      }

      report[branchName].total_transaksi += 1;

      // Grouping per bahan di dalam cabang tersebut
      const bahanName = order.bahan?.nama_bahan;
      if (!report[branchName].detail_bahan[bahanName]) {
        report[branchName].detail_bahan[bahanName] = {
          jumlah_total: 0,
          satuan: order.bahan?.satuan?.nama_satuan
        };
      }
      
      report[branchName].detail_bahan[bahanName].jumlah_total += order.jumlah;
    });

    // Convert Object ke Array supaya lebih enak dikonsumsi Frontend
    const finalReport = Object.values(report).map(branch => ({
      ...branch,
      detail_bahan: Object.entries(branch.detail_bahan).map(([key, val]) => ({
        nama_bahan: key,
        ...val
      }))
    }));

    res.json({
      message: "Laporan order cabang berhasil dibuat",
      data: finalReport
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};