export function useBosHonor() {
  const jenisHonorOptions: string[] = [
    "HONOR OPERATOR MADRASAH",
    "HONOR BENDAHARA MADRASAH",
    "HONOR KEPALA MADRASAH",
    "HONOR GURU MADRASAH",
    "HONOR EKSTRAKULIKULER PRAMUKA",
    "HONOR EKSTRAKULIKULER TAHFIDZ",
    "PANITIA TES KEMAMONTAN AKADEMIK ( TKA )",
    "PANITIA UJIAN MADRASAH ( UM )",
    "PENGAWAS UJIAN MADRASAH ( UM )",
    "PENYUSUN KISI-KISI DAN SOAL UM",
    "HONOR PENGUJI UJIAN PRAKTIK UM",
    "BIAYA TRANSPORT",
    "HONOR RAPAT",
    "PENGIMPUTAN NILAI RDM",
    "PENYUSUN EDM",
    "LAINNYA (INPUT MANUAL)",
  ];

  const bulanList: string[] = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return {
    jenisHonorOptions,
    bulanList,
  };
}
