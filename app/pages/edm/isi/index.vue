<template>
  <div class="min-h-screen">
    <div class="page-layout">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold" style="color: var(--text-heading)">Pengisian EDM</h1>
      <p class="mt-1 text-sm" style="color: var(--text-muted)">
        Isi evaluasi diri madrasah secara bersama-sama per kelompok (jawaban tersinkronisasi)
      </p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <!-- No Kelompok -->
      <div v-if="!myKelompok && !isAdmin"
        class="flex flex-col items-center justify-center py-16 text-center rounded-xl"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        <UsersRound class="w-12 h-12 mb-3 opacity-30" style="color: var(--text-muted)" />
        <p class="font-medium mb-1" style="color: var(--text-heading)">
          Anda belum masuk kelompok EDM
        </p>
        <p class="text-sm" style="color: var(--text-muted)">
          Hubungi admin untuk pembagian kelompok tahun anggaran {{ activeTahun?.tahun || '' }}
        </p>
      </div>

      <!-- Juknis + Start -->
      <template v-else>
        <!-- Juknis Card -->
        <div v-if="juknisText" class="rounded-xl p-6 mb-6"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BookOpen class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 class="font-semibold" style="color: var(--text-heading)">Petunjuk Teknis Pengisian</h2>
              <p class="text-xs" style="color: var(--text-muted)">Baca dengan seksama sebelum mulai mengisi</p>
            </div>
          </div>
          <div class="prose prose-sm max-w-none text-sm whitespace-pre-wrap leading-relaxed"
            style="color: var(--text-secondary)">
            {{ juknisText }}
          </div>
        </div>

        <!-- Kelompok Anda -->
        <div v-if="myKelompok" class="rounded-xl p-6 mb-6"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-center gap-4 mb-4">
            <span class="inline-flex items-center justify-center w-14 h-14 rounded-xl text-xl font-bold text-white"
              :class="kelompokColor(myKelompok.nama_kelompok)">
              {{ myKelompok.nama_kelompok }}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-semibold text-lg" style="color: var(--text-heading)">
                  Kelompok {{ myKelompok.nama_kelompok }}
                </h2>
                <span class="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                  Jawaban Sync Kelompok
                </span>
              </div>
              <p class="text-sm" style="color: var(--text-muted)">
                {{ myKelompok.anggota?.length || 0 }} anggota · {{ myIndikatorCount }} pertanyaan
              </p>
            </div>
          </div>

          <!-- Anggota List -->
          <div class="mb-5">
            <p class="text-xs font-medium mb-2" style="color: var(--text-muted)">Anggota Kelompok:</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="a in myKelompok.anggota" :key="a.gtk_id"
                class="text-xs px-2.5 py-1 rounded-lg"
                :class="a.gtk_id === myGtkId ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-medium' : ''"
                :style="a.gtk_id !== myGtkId ? 'background: var(--bg-secondary); color: var(--text-secondary)' : ''">
                {{ a.nama_lengkap }} {{ a.gtk_id === myGtkId ? '(Anda)' : '' }}
              </span>
            </div>
          </div>

          <!-- Progress -->
          <div class="mb-5">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-medium" style="color: var(--text-secondary)">Progres Pengisian Kelompok</span>
              <span class="text-xs font-bold" style="color: var(--text-heading)">
                {{ myProgress }}%
              </span>
            </div>
            <div class="w-full h-2.5 rounded-full" style="background: var(--bg-tertiary)">
              <div class="h-2.5 rounded-full bg-emerald-500 transition-all duration-500"
                :style="{ width: myProgress + '%' }"></div>
            </div>
            <p class="text-xs mt-1.5" style="color: var(--text-muted)">
              {{ myAnsweredCount }} dari {{ myIndikatorCount }} pertanyaan dijawab oleh kelompok
            </p>
          </div>

          <NuxtLink :to="`/edm/isi/${myKelompok.nama_kelompok}`"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-sm">
            <PenLine class="w-4 h-4" />
            {{ myAnsweredCount > 0 ? 'Lanjutkan Pengisian Kelompok' : 'Mulai Pengisian Kelompok' }}
          </NuxtLink>
        </div>

        <!-- Admin: Pilih kelompok untuk diisi/preview -->
        <div v-if="isAdmin" class="rounded-xl p-6"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <h2 class="font-semibold mb-4" style="color: var(--text-heading)">
            <Eye class="w-5 h-5 inline-block mr-2 text-emerald-500 -mt-0.5" />
            Pengisian & Preview Kelompok (Admin)
          </h2>
          <div class="grid grid-cols-5 gap-3">
            <NuxtLink v-for="k in ['A','B','C','D','E']" :key="k" :to="`/edm/isi/${k}`"
              class="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:shadow-md group cursor-pointer"
              style="background: var(--bg-secondary); border: 1px solid var(--border-primary)">
              <span class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white group-hover:scale-110 transition-transform"
                :class="kelompokColor(k)">
                {{ k }}
              </span>
              <span class="text-xs font-medium" style="color: var(--text-secondary)">Kelompok {{ k }}</span>
            </NuxtLink>
          </div>
        </div>
      </template>
    </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useEdm } from "~/composables/edm/useEdm";
import { UsersRound, BookOpen, PenLine, Eye } from "lucide-vue-next";

const {
  isLoading, listTahun, selectedTahunId, activeTahun,
  fetchTahunAnggaran, fetchKelompok, fetchIndikator, fetchJawaban,
} = useEdm();

const isAdmin = computed(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("user-role") === "admin";
});

const myGtkId = computed(() => {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("user-gtk-id");
  return id ? parseInt(id) : null;
});

const kelompokList = ref([]);
const indikatorCount = ref({});
const myAnsweredCount = ref(0);
const juknisText = ref("");

const myKelompok = computed(() => {
  if (!myGtkId.value) return null;
  return kelompokList.value.find((k) =>
    k.anggota?.some((a) => a.gtk_id === myGtkId.value)
  ) || null;
});

const myIndikatorCount = computed(() => {
  if (!myKelompok.value) return 0;
  return indikatorCount.value[myKelompok.value.nama_kelompok] || 0;
});

const myProgress = computed(() => {
  if (myIndikatorCount.value === 0) return 0;
  return Math.round((myAnsweredCount.value / myIndikatorCount.value) * 100);
});

const kelompokColor = (name) => {
  const c = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return c[name] || "bg-zinc-600";
};

onMounted(async () => {
  await fetchTahunAnggaran();
  if (!selectedTahunId.value) return;

  const tahunId = selectedTahunId.value;
  const currentTahun = listTahun.value.find((t) => t.id === tahunId);
  juknisText.value = currentTahun?.juknis || "";

  kelompokList.value = await fetchKelompok(tahunId);

  // Count indikator per kelompok
  const allIndikator = await fetchIndikator(tahunId);
  const counts = {};
  allIndikator.forEach((item) => {
    counts[item.kelompok_target] = (counts[item.kelompok_target] || 0) + 1;
  });
  indikatorCount.value = counts;

  // Count group answered (synced across all group members)
  if (myKelompok.value) {
    const jawaban = await fetchJawaban(tahunId, myKelompok.value.nama_kelompok, myKelompok.value.id);
    myAnsweredCount.value = jawaban.filter((j) => j.skor !== null && j.skor !== undefined).length;
  }
});
</script>
