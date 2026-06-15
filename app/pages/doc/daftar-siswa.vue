<template>
  <ResourceGrid
    title="Export daftar siswa"
    subtitle=""
    :items="links"
    accentColorClass="bg-emerald-600"
  />
</template>

<script setup>
import ResourceGrid from "~/components/data/ResourceGrid.vue";

// Links data to render via v-for to avoid repetition
const links = [
  {
    title: "Absen Siswa Untuk Guru Kelas",
    description: "(.pdf)",
    aria: "Absen Siswa Untuk Guru Kelas PDF",
    link: "https://script.google.com/macros/s/AKfycbxZ_5jh9FQV1kzNZhVhZmuVnCK6HTniWTIeQ7kvP7HQjLyjXAQIV1Mr7Z--YwBnYOzpVg/exec",
  },
  {
    title: "Absen Siswa Untuk Guru Mapel",
    description: "(.pdf)",
    aria: "Absen Siswa Untuk Guru Mapel PDF",
    link: "https://script.google.com/macros/s/AKfycbzKCjo5JGnPCfSHtofdIiLdBu0IeN43vsvA1Zl7_PVrSEXZoWsxMfbG9ZUzcsi-9ctP0g/exec",
  },
  {
    title: "Lembar Sumatif / Nilai Siswa",
    description: "(.pdf)",
    aria: "Lembar Sumatif Nilai Siswa PDF",
    link: "https://script.google.com/macros/s/AKfycbyYaXWXM2NKpEbl3AiASBQQWK4ag1NdCH0fRAY6HNamtVIaM7XlYhdzLJP4EDVnHMPO/exec",
  },
  {
    title: "Daftar Nama Siswa",
    description: "(Excel)",
    aria: "Daftar Nama Siswa Excel",
    link: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSiLDyHOJ9gRxeEvMxjD7xqA03WMfRoFqCxnhGJCKLfAyaLGNDgyeQxqv_HtBTH4tGtUSXzejKVmRwe/pub?output=xlsx",
  },
  {
    title: "Daftar Siswa Untuk Kebutuhan BIAS",
    description: "(.pdf)",
    aria: "Daftar Siswa Untuk Kebutuhan BIAS PDF",
    link: "https://script.google.com/macros/s/AKfycbxFhx_Y7CP_AJU2uWpwbQT_yXECAWOqqp2pNBDTHV0s-nLStBFrn-yQgEJLtEIkTha7/exec",
  },
];
</script>
