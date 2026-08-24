<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Header -->
      <UiPageHeader title="Pengisian EDM" :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'EDM' },
        { label: 'Pengisian' },
      ]">
        <template #actions>
          <UiBaseButton v-if="juknisText" text="Lihat Juknis" @click="showJuknisModal = true">
            <template #icon>
              <BookOpen class="w-4 h-4" />
            </template>
          </UiBaseButton>
        </template>
      </UiPageHeader>

      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <!-- No Bagian -->
        <div v-if="!myBagian && !isAdmin"
          class="flex flex-col items-center justify-center py-16 text-center rounded-xl"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <UsersRound class="w-12 h-12 mb-3 opacity-30" style="color: var(--text-muted)" />
          <p class="font-medium mb-1" style="color: var(--text-heading)">
            Anda belum masuk bagian EDM
          </p>
          <p class="text-sm" style="color: var(--text-muted)">
            Hubungi admin untuk pembagian bagian tahun anggaran {{ activeTahun?.tahun || '' }}
          </p>
        </div>

        <template v-else>
          <!-- Bagian Anda -->
          <div v-if="myBagian" class="rounded-xl p-6 mb-6"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">
            <div class="flex items-start gap-4 mb-4">
              <span class="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-lg font-bold text-white shrink-0 mt-0.5"
                :class="bagianColor(getBagianCode(myBagian))">
                Bagian {{ getBagianCode(myBagian) }}
              </span>
              <div>
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <h2 class="font-semibold text-base sm:text-lg" style="color: var(--text-heading)">
                    {{ getBagianFullName(getBagianCode(myBagian)) }}
                  </h2>
                  <span class="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 shrink-0">
                    Jawaban Sync Bagian
                  </span>
                </div>
                <p class="text-sm" style="color: var(--text-muted)">
                  {{ myBagian.anggota?.length || 0 }} anggota · {{ myIndikatorCount }} pertanyaan
                </p>
              </div>
            </div>

            <!-- Anggota List -->
            <div class="mb-5">
              <p class="text-xs font-medium mb-2" style="color: var(--text-muted)">Anggota Bagian:</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="a in myBagian.anggota" :key="a.gtk_id"
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
                <span class="text-xs font-medium" style="color: var(--text-secondary)">Progres Pengisian Bagian</span>
                <span class="text-xs font-bold" style="color: var(--text-heading)">
                  {{ myProgress }}%
                </span>
              </div>
              <div class="w-full h-2.5 rounded-full" style="background: var(--bg-tertiary)">
                <div class="h-2.5 rounded-full bg-emerald-500 transition-all duration-500"
                  :style="{ width: myProgress + '%' }"></div>
              </div>
              <p class="text-xs mt-1.5" style="color: var(--text-muted)">
                {{ myAnsweredCount }} dari {{ myIndikatorCount }} pertanyaan dijawab oleh bagian
              </p>
            </div>

            <NuxtLink :to="`/edm/isi/${getBagianCode(myBagian)}`"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-sm">
              <PenLine class="w-4 h-4" />
              {{ myAnsweredCount > 0 ? 'Lanjutkan Pengisian Bagian' : 'Mulai Pengisian Bagian' }}
            </NuxtLink>
          </div>

          <!-- Admin: Pilih bagian untuk diisi/preview -->
          <div v-if="isAdmin" class="rounded-xl p-6"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">
            <h2 class="font-semibold mb-4" style="color: var(--text-heading)">
              <Eye class="w-5 h-5 inline-block mr-2 text-emerald-500 -mt-0.5" />
              Pengisian & Preview Per Bagian (Admin)
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <NuxtLink v-for="b in EDM_BAGIAN_LIST" :key="b.code" :to="`/edm/isi/${b.code}`"
                class="flex items-start gap-3 p-4 rounded-xl transition-all hover:shadow-md group cursor-pointer"
                style="background: var(--bg-secondary); border: 1px solid var(--border-primary)">
                <span class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 group-hover:scale-105 transition-transform mt-0.5"
                  :class="bagianColor(b.code)">
                  {{ b.code }}
                </span>
                <div>
                  <p class="text-xs font-semibold" style="color: var(--text-heading)">{{ b.name }}</p>
                  <p class="text-[11px] mt-0.5" style="color: var(--text-muted)">
                    {{ indikatorCount[b.code] || 0 }} indikator
                  </p>
                </div>
              </NuxtLink>
            </div>
          </div>
        </template>
      </template>

      <!-- Modal Juknis EDM -->
      <Teleport to="body">
        <div v-if="showJuknisModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div class="w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">

            <!-- Header Modal -->
            <div class="flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BookOpen class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 class="text-base font-semibold" style="color: var(--text-heading)">
                    Petunjuk Teknis (Juknis) EDM
                  </h3>
                  <p class="text-xs mt-0.5" style="color: var(--text-muted)">
                    Panduan pengisian evaluasi diri madrasah {{ activeTahun?.tahun ? `Tahun Anggaran ${activeTahun.tahun}` : '' }}
                  </p>
                </div>
              </div>
              <button @click="showJuknisModal = false"
                class="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <X class="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <!-- Content Scrollable -->
            <div class="overflow-y-auto flex-1 pr-1">
              <div class="prose prose-sm max-w-none text-sm whitespace-pre-wrap leading-relaxed p-4 rounded-xl"
                style="background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-primary)">
                {{ juknisText || 'Belum ada petunjuk teknis yang ditambahkan.' }}
              </div>
            </div>

            <!-- Footer Modal -->
            <div class="flex justify-end pt-3 border-t shrink-0" style="border-color: var(--border-primary)">
              <UiBaseButton text="Tutup" @click="showJuknisModal = false" />
            </div>

          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useEdm, EDM_BAGIAN_LIST } from "~/composables/edm/useEdm";
import { UsersRound, BookOpen, PenLine, Eye, X } from "lucide-vue-next";

const {
  isLoading, listTahun, selectedTahunId, activeTahun,
  fetchTahunAnggaran, fetchBagian, fetchInstrumen, fetchIndikator, fetchJawaban,
} = useEdm();

const showJuknisModal = ref(false);

const isAdmin = computed(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("user-role") === "admin";
});

const myGtkId = computed(() => {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("user-gtk-id");
  return id ? parseInt(id) : null;
});

const bagianList = ref([]);
const indikatorCount = ref({});
const myAnsweredCount = ref(0);
const juknisText = ref("");

const getBagianCode = (b) => {
  return b?.nama_bagian || b?.nama_kelompok || "A";
};

const getBagianFullName = (code) => {
  const meta = EDM_BAGIAN_LIST.find((m) => m.code === code);
  return meta ? meta.name : `Bagian ${code}`;
};

const myBagian = computed(() => {
  if (!myGtkId.value) return null;
  return bagianList.value.find((b) =>
    b.anggota?.some((a) => a.gtk_id === myGtkId.value)
  ) || null;
});

const myIndikatorCount = computed(() => {
  if (!myBagian.value) return 0;
  return indikatorCount.value[getBagianCode(myBagian.value)] || 0;
});

const myProgress = computed(() => {
  if (myIndikatorCount.value === 0) return 0;
  return Math.round((myAnsweredCount.value / myIndikatorCount.value) * 100);
});

const bagianColor = (name) => {
  const c = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return c[name] || "bg-zinc-600";
};

onMounted(async () => {
  await fetchTahunAnggaran();
  if (!selectedTahunId.value) return;

  const tahunId = selectedTahunId.value;
  const currentTahun = listTahun.value.find((t) => t.id === tahunId);
  juknisText.value = currentTahun?.juknis || "";

  bagianList.value = await fetchBagian(tahunId);

  const counts = {};
  fetchInstrumen().forEach((item) => {
    const code = item.kategori || "A";
    counts[code] = (counts[code] || 0) + 1;
  });
  indikatorCount.value = counts;

  // Count group answered (synced across all group members)
  if (myBagian.value) {
    const code = getBagianCode(myBagian.value);
    const bagianId = myBagian.value.id;
    const jawaban = await fetchJawaban(tahunId, code, bagianId);
    myAnsweredCount.value = jawaban.filter((j) => j.skor !== null && j.skor !== undefined).length;
  }
});
</script>
