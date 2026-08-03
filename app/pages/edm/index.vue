<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Header -->
      <div class="mb-6">
      <h1 class="text-2xl font-bold" style="color: var(--text-heading)">
        Evaluasi Diri Madrasah
      </h1>
      <p class="mt-1 text-sm" style="color: var(--text-muted)">
        Dashboard EDM — Kelola tahun anggaran dan pantau progres pengisian evaluasi diri madrasah
      </p>
    </div>

    <!-- Tahun Anggaran Selector + Add (Admin) -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
      <div class="flex items-center gap-2 flex-1">
        <select v-model="selectedTahunId" @change="onTahunChange"
          class="rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
          style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)">
          <option v-for="t in listTahun" :key="t.id" :value="t.id">
            Tahun Anggaran {{ t.tahun }}
            <template v-if="t.is_active === 1"> (Aktif)</template>
          </option>
        </select>
      </div>
      <button v-if="isAdmin" @click="showTahunModal = true"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-sm">
        <Plus class="w-4 h-4" />
        Tahun Anggaran Baru
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Content -->
    <template v-else-if="currentTahun">
      <!-- Status Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <!-- Card: Tahun -->
        <div class="rounded-xl p-4"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CalendarDays class="w-4 h-4 text-emerald-600" />
            </div>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="currentTahun.is_active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'">
              {{ currentTahun.is_active ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>
          <p class="text-2xl font-bold" style="color: var(--text-heading)">{{ currentTahun.tahun }}</p>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">Tahun Anggaran</p>
        </div>

        <!-- Card: Progres Kelompok -->
        <div class="rounded-xl p-4"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <PieChart class="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p class="text-2xl font-bold" style="color: var(--text-heading)">{{ totalProgress }}%</p>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">Progres Isian Kelompok</p>
        </div>

        <!-- Card: Total Indikator -->
        <div class="rounded-xl p-4"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <ListChecks class="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p class="text-2xl font-bold" style="color: var(--text-heading)">{{ totalIndikator }}</p>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">Total Indikator / Soal</p>
        </div>

        <!-- Card: Pengisian -->
        <div class="rounded-xl p-4"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <ClipboardCheck class="w-4 h-4 text-violet-600" />
            </div>
          </div>
          <p class="text-2xl font-bold" style="color: var(--text-heading)">
            {{ rekapData?.overall?.total_kelompok_terisi || 0 }}
            <span class="text-sm font-normal" style="color: var(--text-muted)">
              / {{ kelompokList.length || 5 }}
            </span>
          </p>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">Kelompok Sudah Mengisi</p>
        </div>
      </div>

      <!-- Kelompok Overview Cards -->
      <h2 class="text-sm font-semibold mb-3 flex items-center gap-2" style="color: var(--text-heading)">
        <UsersRound class="w-4 h-4 text-emerald-500" />
        Progres Per Kelompok
      </h2>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div v-for="kel in kelompokList" :key="kel.id"
          class="rounded-xl p-4"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-center justify-between mb-3">
            <span
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white"
              :class="kelompokColor(kel.nama_kelompok)">
              {{ kel.nama_kelompok }}
            </span>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full"
              style="background: var(--bg-secondary); color: var(--text-muted)">
              {{ kel.anggota?.length || 0 }} guru
            </span>
          </div>
          <div class="w-full h-1.5 rounded-full" style="background: var(--bg-tertiary)">
            <div class="h-1.5 rounded-full transition-all duration-500"
              :class="kelompokColor(kel.nama_kelompok)"
              :style="{ width: getKelompokProgress(kel) + '%' }">
            </div>
          </div>
          <p class="text-xs mt-2" style="color: var(--text-muted)">
            {{ getKelompokSummary(kel) }}
          </p>
        </div>
      </div>

      <!-- Quick Actions for Guru -->
      <template v-if="myKelompok && !isAdmin">
        <h2 class="text-sm font-semibold mb-3 flex items-center gap-2" style="color: var(--text-heading)">
          <ClipboardCheck class="w-4 h-4 text-emerald-500" />
          Pengisian Anda
        </h2>
        <div class="rounded-xl p-5 mb-6"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-center gap-3 mb-4">
            <span
              class="inline-flex items-center justify-center w-10 h-10 rounded-xl text-base font-bold text-white"
              :class="kelompokColor(myKelompok.nama_kelompok)">
              {{ myKelompok.nama_kelompok }}
            </span>
            <div>
              <p class="font-semibold text-sm" style="color: var(--text-heading)">
                Kelompok {{ myKelompok.nama_kelompok }}
              </p>
              <p class="text-xs" style="color: var(--text-muted)">
                {{ myKelompok.anggota?.length || 0 }} anggota
              </p>
            </div>
          </div>
          <NuxtLink to="/edm/isi"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-sm">
            <PenLine class="w-4 h-4" />
            Mulai Pengisian EDM
          </NuxtLink>
        </div>
      </template>

      <!-- Admin: Juknis Editor -->
      <template v-if="isAdmin">
        <h2 class="text-sm font-semibold mb-3 flex items-center gap-2" style="color: var(--text-heading)">
          <FileText class="w-4 h-4 text-emerald-500" />
          Petunjuk Teknis (Juknis)
        </h2>
        <div class="rounded-xl p-5 mb-6"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <textarea v-model="juknisText" rows="6"
            class="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all resize-y"
            style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
            placeholder="Tulis petunjuk teknis pengisian EDM di sini..."></textarea>
          <div class="flex justify-end mt-3">
            <button @click="saveJuknis" :disabled="isSaving"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all">
              <Save class="w-4 h-4" />
              {{ isSaving ? 'Menyimpan...' : 'Simpan Juknis' }}
            </button>
          </div>
        </div>
      </template>
    </template>

    <!-- Empty State -->
    <div v-else-if="!isLoading && listTahun.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
        <CalendarDays class="w-7 h-7 text-emerald-500" />
      </div>
      <p class="font-semibold text-base mb-1" style="color: var(--text-heading)">Belum Ada Tahun Anggaran</p>
      <p class="text-sm mb-5" style="color: var(--text-muted)">
        Buat tahun anggaran EDM terlebih dahulu untuk memulai evaluasi diri madrasah.
      </p>
      <button v-if="isAdmin" @click="showTahunModal = true"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
        <Plus class="w-4 h-4" />
        Buat Tahun Anggaran
      </button>
    </div>

    <!-- Modal: Tambah/Edit Tahun Anggaran -->
    <Teleport to="body">
      <div v-if="showTahunModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4"
        style="background: var(--shadow-overlay)">
        <div class="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <h3 class="text-base font-semibold mb-5" style="color: var(--text-heading)">
            {{ editingTahun ? 'Edit Tahun Anggaran' : 'Tahun Anggaran Baru' }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Tahun</label>
              <input v-model.number="formTahun.tahun" type="number" min="2020" max="2050"
                class="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
                placeholder="2026">
            </div>

            <div class="flex items-center gap-3">
              <button @click="formTahun.is_active = formTahun.is_active === 1 ? 0 : 1" type="button"
                class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                :class="formTahun.is_active === 1 ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'">
                <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  :class="formTahun.is_active === 1 ? 'translate-x-5' : ''"></span>
              </button>
              <span class="text-sm" style="color: var(--text-secondary)">Tahun Anggaran Aktif</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button @click="showTahunModal = false"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style="color: var(--text-secondary); background: var(--bg-secondary)">
              Batal
            </button>
            <button @click="handleSaveTahun" :disabled="isSaving"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all">
              {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useEdm } from "~/composables/edm/useEdm";
import {
  CalendarDays, UsersRound, ListChecks, ClipboardCheck, Plus,
  PenLine, FileText, Save, PieChart,
} from "lucide-vue-next";

const {
  isLoading, isSaving, listTahun, selectedTahunId,
  fetchTahunAnggaran, saveTahunAnggaran, fetchKelompok, fetchIndikator, fetchRekap,
} = useEdm();

const isAdmin = computed(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("user-role") === "admin";
});

const myGtkId = computed(() => {
  if (typeof window === "undefined") return null;
  const gtkId = localStorage.getItem("user-gtk-id");
  return gtkId ? parseInt(gtkId) : null;
});

const currentTahun = computed(() => {
  return listTahun.value.find((t) => t.id === selectedTahunId.value) || null;
});

const kelompokList = ref([]);
const totalIndikator = ref(0);
const rekapData = ref(null);
const juknisText = ref("");

const totalProgress = computed(() => {
  if (!rekapData.value?.kelompok || rekapData.value.kelompok.length === 0) return 0;
  const totalJawaban = rekapData.value.kelompok.reduce((acc, k) => acc + (k.jumlah_jawaban || 0), 0);
  const totalReq = rekapData.value.kelompok.reduce((acc, k) => acc + (k.jumlah_indikator || 0), 0);
  if (totalReq === 0) return 0;
  return Math.min(100, Math.round((totalJawaban / totalReq) * 100));
});

const showTahunModal = ref(false);
const editingTahun = ref(null);
const formTahun = ref({ tahun: new Date().getFullYear(), is_active: 1 });

const myKelompok = computed(() => {
  if (!myGtkId.value) return null;
  return kelompokList.value.find((k) =>
    k.anggota?.some((a) => a.gtk_id === myGtkId.value)
  ) || null;
});

const kelompokColor = (name) => {
  const colors = {
    A: "bg-blue-600",
    B: "bg-emerald-600",
    C: "bg-amber-600",
    D: "bg-violet-600",
    E: "bg-rose-600",
  };
  return colors[name] || "bg-zinc-600";
};

const getKelompokProgress = (kel) => {
  if (!rekapData.value?.kelompok) return 0;
  const kData = rekapData.value.kelompok.find((k) => k.kelompok_id === kel.id);
  if (!kData || !kData.jumlah_indikator) return 0;
  return Math.min(100, Math.round((kData.jumlah_jawaban / kData.jumlah_indikator) * 100));
};

const getKelompokSummary = (kel) => {
  if (!rekapData.value?.kelompok) return "Belum ada data";
  const kData = rekapData.value.kelompok.find((k) => k.kelompok_id === kel.id);
  if (!kData || !kData.jumlah_indikator) return "0/0 indikator terisi";
  return `${kData.jumlah_jawaban || 0}/${kData.jumlah_indikator || 0} indikator terisi`;
};

const loadDashboardData = async () => {
  if (!selectedTahunId.value) return;
  const tahunId = selectedTahunId.value;

  const [kel, indikator, rekap] = await Promise.all([
    fetchKelompok(tahunId),
    fetchIndikator(tahunId),
    fetchRekap(tahunId),
  ]);

  kelompokList.value = kel;
  totalIndikator.value = indikator.length;
  rekapData.value = rekap;

  if (currentTahun.value) {
    juknisText.value = currentTahun.value.juknis || "";
  }
};

const onTahunChange = () => {
  loadDashboardData();
};

const handleSaveTahun = async () => {
  const payload = { ...formTahun.value };
  if (editingTahun.value) {
    payload.id = editingTahun.value.id;
  }
  const ok = await saveTahunAnggaran(payload);
  if (ok) {
    showTahunModal.value = false;
    editingTahun.value = null;
    formTahun.value = { tahun: new Date().getFullYear(), is_active: 1 };
    await loadDashboardData();
  }
};

const saveJuknis = async () => {
  if (!currentTahun.value) return;
  await saveTahunAnggaran({
    id: currentTahun.value.id,
    tahun: currentTahun.value.tahun,
    is_active: currentTahun.value.is_active,
    juknis: juknisText.value,
  });
};

watch(
  () => currentTahun.value,
  (t) => {
    if (t) juknisText.value = t.juknis || "";
  },
);

onMounted(async () => {
  await fetchTahunAnggaran();
  if (selectedTahunId.value) {
    await loadDashboardData();
  }
});
</script>
