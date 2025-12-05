import supabase from "../config/db.js";

// --- 1. NOTIFIKASI STOK MENIPIS (GUDANG PUSAT & CABANG) ---
export const getLowStockAlerts = async (req, res) => {
  try {
    const [bahanRes, cabangRes, masukRes, keluarRes] = await Promise.all([
      supabase.from("bahan_baku").select("id, nama_bahan, stok, stok_minimal, satuan:satuan_bahan(nama_satuan)"),
      supabase.from("users").select("id, name").eq("role", "cabang"),
      supabase.from("bahan_masuk").select("bahan_id, cabang_id, jumlah"),
      supabase.from("bahan_keluar").select("bahan_id, action_by, jumlah")
    ]);

    if (bahanRes.error) throw bahanRes.error;
    
    const allAlerts = [];
    const bahanList = bahanRes.data;
    const cabangList = cabangRes.data || [];
    const logMasuk = masukRes.data || [];
    const logKeluar = keluarRes.data || [];

    // A. Stok Gudang Pusat
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

    // B. Stok Cabang
    cabangList.forEach((cabang) => {
      bahanList.forEach((item) => {
        const totalMasuk = logMasuk
          .filter(m => m.cabang_id === cabang.id && m.bahan_id === item.id)
          .reduce((sum, cur) => sum + cur.jumlah, 0);

        const totalKeluar = logKeluar
          .filter(k => k.action_by === cabang.id && k.bahan_id === item.id)
          .reduce((sum, cur) => sum + cur.jumlah, 0);

        const stokCabang = totalMasuk - totalKeluar;

        if (stokCabang <= item.stok_minimal) {
          allAlerts.push({
            lokasi: cabang.name,
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

// --- 2. LAPORAN TOTAL ORDER PER CABANG ---
export const getBranchOrderStats = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from("bahan_masuk")
      .select(`
        id,
        jumlah,
        created_at,
        bahan:bahan_baku(nama_bahan, satuan:satuan_bahan(nama_satuan)),
        cabang:users!bahan_masuk_cabang_id_fkey(id, name)
      `)
      // Hanya hitung yang valid, sesuaikan status dengan data kamu (misal: 'completed', 'delivered', atau 'approved')
      // .in('status', ['disetujui', 'delivered']); 
      // Jika tidak ada filter status, hapus baris .in() di atas

    if (error) throw error;

    const report = {};

    orders.forEach((order) => {
      // Skip jika tidak ada data cabang (misal data lama/corrupt)
      if (!order.cabang) return;

      const branchName = order.cabang.name;
      
      if (!report[branchName]) {
        report[branchName] = {
          cabang_id: order.cabang.id,
          cabang_name: branchName,
          total_transaksi: 0,
          detail_bahan: {}
        };
      }

      report[branchName].total_transaksi += 1;

      const bahanName = order.bahan?.nama_bahan || "Unknown Item";
      if (!report[branchName].detail_bahan[bahanName]) {
        report[branchName].detail_bahan[bahanName] = {
          jumlah_total: 0,
          satuan: order.bahan?.satuan?.nama_satuan || '-'
        };
      }
      
      report[branchName].detail_bahan[bahanName].jumlah_total += order.jumlah;
    });

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