<template>
  <div class="min-h-screen">
    <!-- Main Container -->
    <div class="page-layout px-4 sm:px-6">
      <!-- Announcement Section -->
      <header class="mt-4 pb-12">
        <div
          class="card rounded-2xl p-4 sm:p-6 bg-zinc-800/30 sm:bg-zinc-800/40 border border-zinc-800 sm:border-zinc-700/50 shadow-md"
        >
          <div
            class="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800 sm:border-zinc-700/50"
          >
            <div class="flex items-center gap-2">
              <span
                class="p-1.5 sm:p-2 rounded-lg bg-emerald-950 text-emerald-400"
              >
                <Bell class="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h2 class="text-sm sm:text-lg font-semibold text-zinc-100">
                Pengumuman & Informasi Terbaru
              </h2>
            </div>
            <span class="text-[10px] sm:text-xs text-zinc-500"
              >Portal Digital</span
            >
          </div>

          <!-- Mobile: flex overflow scroll, Desktop: grid -->
          <div
            class="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-none gap-3 sm:gap-4 pb-2 md:pb-0"
          >
            <div
              v-for="item in announcements"
              :key="item.id"
              class="w-[85vw] md:w-auto shrink-0 md:shrink-1 snap-center p-3.5 sm:p-4 rounded-xl bg-zinc-800/80 border border-zinc-700/30 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border',
                      item.tagColor,
                    ]"
                  >
                    {{ item.tag }}
                  </span>
                  <span class="text-[10px] sm:text-xs text-zinc-500">{{
                    item.date
                  }}</span>
                </div>
                <h3
                  class="text-xs sm:text-sm font-semibold text-zinc-200 mb-1 line-clamp-1"
                >
                  {{ item.title }}
                </h3>
                <p
                  class="text-[11px] sm:text-xs text-zinc-400 leading-relaxed line-clamp-2 sm:line-clamp-none"
                >
                  {{ item.content }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Bell } from "lucide-vue-next";

definePageMeta({
  requiresAuth: true,
});

// Dummy Data for announcements
const announcements = ref([
  {
    id: 1,
    title: "Pemeliharaan Sistem Terjadwal",
    content:
      "Sistem akan mengalami pemeliharaan rutin pada hari Sabtu mulai pukul 23:00 WITA hingga Minggu pukul 02:00 WITA. Akses dokumen mungkin akan sedikit terganggu.",
    date: "22 Mei 2026",
    tag: "Penting",
    tagColor: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    id: 2,
    title: "Pemutakhiran Data Madrasah Semester Genap",
    content:
      "Mohon kepada seluruh GTK untuk segera memperbarui data profil dan berkas terbaru di menu Madrasah -> Data Madrasah sebelum batas waktu sinkronisasi.",
    date: "20 Mei 2026",
    tag: "Info",
    tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    id: 3,
    title: "Rilis Fitur Cetak Kuitansi Baru",
    content:
      "Kini menu Keuangan BOS telah diperbarui dengan fitur unduh dan pratinjau kuitansi yang lebih cepat. Hubungi admin jika terdapat kendala.",
    date: "18 Mei 2026",
    tag: "Update",
    tagColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
]);
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
