<template>
  <div class="min-h-screen">
    <div class="relative page-layout">
      <FormStandard :templates="templatesData" jenis_doc="Sampul" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import FormStandard from "~/components/form/FormStandard.vue";

import { useTableData } from "~/composables/data/useTableData";

// 1. Deklarasikan data pendukung (Options) di awal
const waliOptions = ref([
  { value: "Ahmad Santoso", label: "Ahmad Santoso" },
  { value: "Budi Prasetyo", label: "Budi Prasetyo" },
  { value: "Citra Lestari", label: "Citra Lestari" },
  { value: "Dewi Anggraini", label: "Dewi Anggraini" },
  { value: "Eko Widodo", label: "Eko Widodo" },
]);

// 2. Deklarasikan templatesData sebagai ref agar UI terupdate saat data berubah
const templatesData = ref([
  {
    type: "cover",
    title: "Pemberkasan",
    preview: "/images/preview_pelatihan.jpg",
    inputs: [
      {
        name: "bulan",
        label: "Bulan Pemberkasan",
        type: "select",
        options: [
          { value: "JANUARI", label: "Januari" },
          { value: "FEBRUARI", label: "Februari" },
          { value: "MARET", label: "Maret" },
          { value: "APRIL", label: "April" },
          { value: "MEI", label: "Mei" },
          { value: "JUNI", label: "Juni" },
          { value: "JULI", label: "Juli" },
          { value: "AGUSTUS", label: "Agustus" },
          { value: "SEPTEMBER", label: "September" },
          { value: "OKTOBER", label: "Oktober" },
          { value: "NOVEMBER", label: "November" },
          { value: "DESEMBER", label: "Desember" },
        ],
      },
      {
        name: "verifikasi",
        label: "Link Berkas/Kode Verifikasi",
        type: "text",
      },
    ],
  },
  {
    type: "sampulAbsenSiswa",
    title: "Sampul Absen Siswa",
    preview: "/images/preview_pelatihan.jpg",
    inputs: [
      {
        name: "kelas",
        label: "Kelas",
        type: "select",
        options: [
          { value: "I ( Satu )", label: "I ( Satu )" },
          { value: "II ( Dua )", label: "II ( Dua )" },
          { value: "III ( Tiga )", label: "III ( Tiga )" },
          { value: "IV ( Empat )", label: "IV ( Empat )" },
          { value: "V ( Lima )", label: "V ( Lima )" },
          { value: "VI-A ( Enam A )", label: "VI-A ( Enam A )" },
          { value: "VI-B ( Enam B )", label: "VI-B ( Enam B )" },
        ],
      },
      // Mengacu pada waliOptions yang sudah dideklarasikan di atas
      {
        name: "wali_kelas",
        label: "Wali Kelas",
        type: "select",
        options: waliOptions,
      },
      { name: "jml_siswa", label: "Jumlah Siswa", type: "number" },
    ],
  },
  {
    type: "sampulAbsenSiswaGuruMapel",
    title: "Sampul Absen Siswa Guru Mapel",
    preview: "/images/preview_pelatihan.jpg",
    inputs: [
      {
        name: "kelas",
        label: "Kelas",
        type: "select",
        options: [
          { value: "I ( Satu )", label: "I ( Satu )" },
          { value: "II ( Dua )", label: "II ( Dua )" },
          { value: "III ( Tiga )", label: "III ( Tiga )" },
          { value: "IV ( Empat )", label: "IV ( Empat )" },
          { value: "V ( Lima )", label: "V ( Lima )" },
          { value: "VI-A ( Enam A )", label: "VI-A ( Enam A )" },
          { value: "VI-B ( Enam B )", label: "VI-B ( Enam B )" },
          { value: "I - VI ( Semua Kelas )", label: "I - VI ( Semua Kelas )" },
        ],
      },
      // Mengacu pada waliOptions yang sudah dideklarasikan di atas
      {
        name: "nama_guru",
        label: "Nama Guru",
        type: "select",
        options: waliOptions,
      },
      {
        name: "mapel",
        label: "Mata Pelajaran",
        type: "text",
      },
    ],
  },
]);

const { loadData, cardData } = useTableData();

onMounted(() => {
  loadData("DataGtk");

  if (
    cardData.value &&
    Array.isArray(cardData.value) &&
    cardData.value.length > 0
  ) {
    // Update waliOptions dengan data dari localStorage
    const mappedData = cardData.value.map((item) => ({
      value: item.title || item.nama_lengkap || item.name || "Unknown",
      label: item.title || item.nama_lengkap || item.name || "Unknown",
    }));

    // Karena waliOptions digunakan di dalam templatesData sebagai ref,
    // pembaruan di sini akan otomatis merefresh isi dropdown di form.
    waliOptions.value = mappedData;
  }
});
</script>
