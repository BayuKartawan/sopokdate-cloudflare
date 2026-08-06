<template>
  <div class="w-full mx-auto p-8 border border-black print-bg google-sans-code-bg"
    style="background: white; position: relative">
    <!-- SVG Background as vector -->
    <img src="/assets/images/topography.svg" alt="Topography" style="
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 0;
        pointer-events: none;
        print-color-adjust: exact;
      " />
    <!-- Header: Logo + Title -->
    <div class="flex border border-black bg-white" style="position: relative; z-index: 1">
      <!-- Logo -->
      <div class="w-1/5 flex justify-center items-center border-r border-black p-4">
        <img src="/assets/images/logo-madrasah.svg" alt="Logo" class="h-32" />
      </div>

      <!-- Judul -->
      <div class="w-2/3 p-4 space-y-4 flex flex-col justify-center">
        <h1 class="text-4xl uppercase border-b border-black pb-2 rounded_sans_serif_7">
          Absensi & Nilai Siswa
        </h1>
        <h3 class="text-2xl">
          MI NW Penyanggir - T.P. {{ currentAcademicYear }}
        </h3>
      </div>
    </div>

    <!-- Spacer -->
    <div class="h-70"></div>

    <!-- Tabel Info dan QR Code -->
    <div class="flex justify-between items-stretch w-full" style="position: relative; z-index: 1">
      <div class="flex items-center bg-white p-4 border border-black">
        <QrcodeVue :value="`https://${linkApp}/`" :size="150" level="H" render-as="svg" />
      </div>
      <table class="table-auto border border-black bg-white" style="font-size: 14pt">
        <tbody>
          <tr class="border border-black">
            <td class="px-2 py-1 w-50">Semester</td>
            <td class="px-2 py-1">:</td>
            <td class="px-2 py-1 w-100">{{ currentSemester }}</td>
          </tr>
          <tr class="border border-black">
            <td class="px-2 py-1">Kelas</td>
            <td class="px-2 py-1">:</td>
            <td class="px-2 py-1">{{ kelas }}</td>
          </tr>
          <tr class="border border-black">
            <td class="px-2 py-1">Nama Guru</td>
            <td class="px-2 py-1">:</td>
            <td class="px-2 py-1">{{ nama_guru }}</td>
          </tr>
          <tr class="border border-black">
            <td class="px-2 py-1">Mata Pelajaran</td>
            <td class="px-2 py-1">:</td>
            <td class="px-2 py-1">{{ mapel }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import QrcodeVue from "qrcode.vue";
import { useAcademicYear } from "~/composables/utils/useAcademicYear";

const { currentAcademicYear, currentSemester } = useAcademicYear();
const linkApp = useRuntimeConfig().public.appLink as string;

defineProps<{
  kelas?: string;
  nama_guru?: string;
  mapel?: string;
}>();
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Google+Sans+Mono:wght@400;700&display=swap");

.google-sans-code-bg {
  font-family: "Google Sans Mono", monospace !important;
}
</style>
