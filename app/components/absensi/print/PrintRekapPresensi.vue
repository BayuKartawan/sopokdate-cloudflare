<template>
  <div class="p-10 mx-auto bg-white text-black font-sans">
    <!-- Kop Surat -->
    <KopSurat class="mb-4" />

    <!-- Header -->
    <div class="text-center mb-6">
      <h1 class="font-bold uppercase text-lg">
        REKAPITULASI PRESENSI SISWA
      </h1>
      <p class="text-sm font-semibold mt-1" v-if="rekapType === 'semester'">
        Kelas: {{ currentClassName }} | Semester:
        {{ selectedSemester }} | Tahun Pelajaran: {{ selectedTapel }}
      </p>
      <p class="text-sm font-semibold mt-1" v-else-if="rekapType === 'bulanan'">
        Kelas: {{ currentClassName }} | Bulan:
        {{ monthNames[selectedMonth - 1] }} | Tahun Pelajaran: {{ selectedTapel }}
      </p>
      <p class="text-sm font-semibold mt-1" v-else-if="rekapType === 'mingguan'">
        Kelas: {{ currentClassName }} | Periode:
        {{ formatDateIndo(startDate) }} s.d. {{ formatDateIndo(endDate) }} | Tahun Pelajaran: {{ selectedTapel }}
      </p>
    </div>

    <!-- Tabel Cetak -->
    <table class="w-full table-auto border border-gray-800 mb-6 text-xs">
      <thead class="bg-gray-100">
        <tr>
          <th class="border border-gray-800 px-2 py-2 text-center w-8" rowspan="2">
            No
          </th>
          <th class="border border-gray-800 px-2 py-2 text-left" rowspan="2">
            Nama Siswa
          </th>
          <th class="border border-gray-800 px-2 py-2 text-center w-24" rowspan="2">
            NISN
          </th>
          <th class="border border-gray-800 px-2 py-1 text-center" colspan="4">
            Kehadiran (Hari)
          </th>
          <th class="border border-gray-800 px-2 py-2 text-center w-16" rowspan="2">
            H. Efektif
          </th>
          <th class="border border-gray-800 px-2 py-2 text-center w-16" rowspan="2">
            Persentase
          </th>
        </tr>
        <tr>
          <th class="border border-gray-800 px-1 py-1 text-center w-10">H</th>
          <th class="border border-gray-800 px-1 py-1 text-center w-10">S</th>
          <th class="border border-gray-800 px-1 py-1 text-center w-10">I</th>
          <th class="border border-gray-800 px-1 py-1 text-center w-10">A</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(siswa, index) in rekapData" :key="siswa.siswa_id">
          <td class="border border-gray-800 px-2 py-1.5 text-center">
            {{ index + 1 }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 font-semibold">
            {{ toTitleCase(siswa.nama) }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center font-mono">
            {{ siswa.nisn || "-" }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center">
            {{ siswa.total_hadir }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center">
            {{ siswa.total_sakit }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center">
            {{ siswa.total_izin }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center">
            {{ siswa.total_alpa }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center font-bold">
            {{ siswa.total_hari_efektif }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center font-bold">
            {{ hitungPersentase(siswa.total_hadir, siswa.total_hari_efektif) }}%
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Footer Cetak -->
    <div class="flex justify-between items-end mt-12 text-xs">
      <div>
        <p class="italic">
          Dicetak otomatis via SopokDate pada {{ printTimestamp }}
        </p>
      </div>
      <div class="text-center w-48">
        <p class="mb-16">Wali Kelas {{ currentClassName }}</p>
        <p class="font-bold underline">
          {{ waliKelasName || "_________________" }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KopSurat from "~/components/document/KopSurat.vue";
import type { RekapSiswa } from "~/types/absensi";

defineProps<{
  rekapData: RekapSiswa[];
  currentClassName: string;
  rekapType: string;
  selectedSemester: string;
  selectedTapel: string;
  selectedMonth: number;
  monthNames: string[];
  startDate: string;
  endDate: string;
  printTimestamp: string;
  waliKelasName: string;
}>();

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateIndo = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const hitungPersentase = (hadir: number | string, total: number | string) => {
  const numTotal = Number(total);
  const numHadir = Number(hadir);
  if (!numTotal || numTotal === 0) return "0.0";
  return ((numHadir / numTotal) * 100).toFixed(1);
};
</script>
