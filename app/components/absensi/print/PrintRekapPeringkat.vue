<template>
  <div id="print-template-peringkat" class="p-10 mx-auto bg-white text-black font-sans">
    <!-- Kop Surat -->
    <KopSurat class="mb-4" />

    <!-- Header -->
    <div class="text-center mb-6">
      <h1 class="font-bold uppercase text-lg">
        LAPORAN PERINGKAT KETIDAKHADIRAN SISWA
      </h1>
      <p class="text-sm font-semibold mt-1">
        Kategori: {{ kategoriLabel }} (Top {{ topLimit }})
      </p>
      <p class="text-xs text-gray-600 mt-0.5">
        Semester: {{ peringkatSemester }} | Tahun Pelajaran: {{ peringkatTapel }} | Kelas: {{ filterKelasName }}
      </p>
    </div>

    <!-- Tabel Cetak Peringkat -->
    <table class="w-full table-auto border border-gray-800 mb-6 text-xs">
      <thead class="bg-gray-100">
        <tr>
          <th class="border border-gray-800 px-2 py-2 text-center w-12">Peringkat</th>
          <th class="border border-gray-800 px-2 py-2 text-left">Nama Siswa</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-24">NISN</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-24">Kelas</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-16">Alpa (A)</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-16">Sakit (S)</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-16">Izin (I)</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-20">Total Absen</th>
          <th class="border border-gray-800 px-2 py-2 text-center w-16">Hadir</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in rankedList" :key="item.siswa_id">
          <td class="border border-gray-800 px-2 py-1.5 text-center font-bold">
            #{{ item.rank }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 font-semibold">
            {{ toTitleCase(item.nama) }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center font-mono">
            {{ item.nisn || "-" }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center">
            {{ item.namaKelas }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center font-bold"
            :class="kategoriPeringkat === 'alpa' ? 'bg-red-50 text-red-700' : ''">
            {{ item.total_alpa }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center"
            :class="kategoriPeringkat === 'sakit' ? 'bg-amber-50 text-amber-700 font-bold' : ''">
            {{ item.total_sakit }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center"
            :class="kategoriPeringkat === 'izin' ? 'bg-blue-50 text-blue-700 font-bold' : ''">
            {{ item.total_izin }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center font-bold"
            :class="kategoriPeringkat === 'total' ? 'bg-purple-50 text-purple-700' : ''">
            {{ item.total_tidak_hadir }}
          </td>
          <td class="border border-gray-800 px-2 py-1.5 text-center text-gray-700">
            {{ item.total_hadir }}
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
        <p class="mb-16">Kepala Sekolah</p>
        <p class="font-bold underline">_______________________</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KopSurat from "~/components/document/KopSurat.vue";
import type { PeringkatSiswaItem, KategoriPeringkat } from "~/types/absensi";

defineProps<{
  rankedList: (PeringkatSiswaItem & { rank: number; namaKelas: string })[];
  kategoriLabel: string;
  kategoriPeringkat: KategoriPeringkat;
  topLimit: number;
  peringkatSemester: string;
  peringkatTapel: string;
  filterKelasName: string;
  printTimestamp: string;
  toTitleCase: (str: string) => string;
}>();
</script>
