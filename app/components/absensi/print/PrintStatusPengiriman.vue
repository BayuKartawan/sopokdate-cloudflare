<template>
  <div class="p-10 mx-auto bg-white text-black font-sans">
    <!-- Kop Surat -->
    <KopSurat class="mb-4" />

    <!-- Header -->
    <div class="text-center mb-6">
      <h1 class="font-bold uppercase text-lg">
        STATUS PENGIRIMAN ABSENSI
      </h1>
      <p class="text-sm font-semibold mt-1">
        Semester: {{ statusSemester }} | Tahun Pelajaran: {{ statusTapel }}
      </p>
      <p class="text-xs text-gray-600 mt-0.5">
        Periode: {{ statusPeriodeLabel }}
      </p>
    </div>

    <!-- Tabel Cetak Status -->
    <table class="w-full table-auto border border-gray-800 mb-6 text-xs">
      <thead class="bg-gray-100">
        <tr>
          <th class="border border-gray-800 px-2 py-2 text-center w-8">No</th>
          <th class="border border-gray-800 px-2 py-2 text-left">Kelas</th>
          <th class="border border-gray-800 px-2 py-2 text-left">Wali Kelas</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-20">Hari Efektif</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-20">Sudah Diabsen</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-20">Belum Diabsen</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-20">Persentase</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-16">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in statusTableData" :key="row.kelas_id">
          <td class="border border-gray-800 px-2 py-1.5 text-center">{{ index + 1 }}</td>
          <td class="border border-gray-800 px-2 py-1.5 font-semibold">{{ row.namaKelas }}</td>
          <td class="border border-gray-800 px-2 py-1.5">{{ row.waliKelas || '-' }}</td>
          <td class="border border-gray-800 px-2 py-1.5 text-center font-bold">{{ row.hariEfektif }}</td>
          <td class="border border-gray-800 px-2 py-1.5 text-center">{{ row.sudahDiabsen }}</td>
          <td class="border border-gray-800 px-2 py-1.5 text-center">{{ row.belumDiabsen }}</td>
          <td class="border border-gray-800 px-2 py-1.5 text-center font-bold">{{ row.persentase.toFixed(1) }}%</td>
          <td class="border border-gray-800 px-2 py-1.5 text-center font-semibold">
            {{ row.persentase >= 90 ? 'Baik' : row.persentase >= 75 ? 'Cukup' : 'Kurang' }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Ringkasan -->
    <div class="flex gap-8 text-xs mb-6">
      <div>Total Kelas: <strong>{{ statusTableData.length }}</strong></div>
      <div>Rata-rata Pengiriman: <strong>{{ avgPersentaseStatus }}%</strong></div>
      <div>Kelas Belum Lengkap (&lt;75%): <strong>{{ kelasRendahCount }}</strong></div>
    </div>

    <!-- Footer Cetak -->
    <div class="flex justify-between items-end mt-12 text-xs">
      <div>
        <p class="italic">
          Dicetak otomatis via SopokDate pada {{ printTimestamp }}
        </p>
      </div>
      <div class="text-center w-48">
        <p class="mb-16">Kepala Sekolah</p>
        <p class="font-bold underline">_______________________</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KopSurat from "~/components/document/KopSurat.vue";
import type { StatusRow } from "~/types/absensi";

defineProps<{
  statusTableData: StatusRow[];
  statusSemester: string;
  statusTapel: string;
  statusPeriodeLabel: string;
  avgPersentaseStatus: string;
  kelasRendahCount: number;
  printTimestamp: string;
}>();
</script>
