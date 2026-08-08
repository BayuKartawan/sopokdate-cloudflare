<template>
  <div class="min-h-screen">
    <div class="page-layout">
    <!-- Top Nav -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/edm/isi"
          class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-emerald-500/10"
          style="background: var(--bg-secondary); color: var(--text-primary)">
          <ArrowLeft class="w-5 h-5" />
        </NuxtLink>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-2xl font-bold" style="color: var(--text-heading)">
              Pengisian EDM
            </h1>
            <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-bold text-white"
              :class="bagianColor(bagianCode)">
              Bagian {{ bagianCode }}
            </span>
          </div>
          <p class="mt-0.5 text-xs sm:text-sm font-medium" style="color: var(--text-muted)">
            {{ bagianFullName }} · {{ indikatorList.length }} pertanyaan · Jawaban Tersinkronisasi
          </p>
        </div>
      </div>

      <!-- Status Perubahan Jawaban -->
      <div class="flex items-center gap-2">
        <div v-if="hasUnsavedChanges"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          Belum Disimpan
        </div>
        <div v-else
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 class="w-3.5 h-3.5" />
          Tersimpan
        </div>
      </div>
    </div>

    <!-- Bagian Banner -->
    <div class="mb-6 rounded-xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      style="background: var(--bg-card); border-color: var(--border-primary)">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <UsersRound class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 class="text-sm font-semibold" style="color: var(--text-heading)">
            Pengisian Bersama — {{ bagianFullName }}
          </h2>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">
            Jawaban yang diisi di halaman ini otomatis tersinkronisasi untuk seluruh anggota Bagian {{ bagianCode }}
          </p>
        </div>
      </div>

      <div v-if="anggotaBagian.length > 0" class="flex flex-wrap gap-1.5 shrink-0">
        <span v-for="a in anggotaBagian" :key="a.gtk_id"
          class="text-xs px-2.5 py-1 rounded-lg"
          :class="a.gtk_id === myGtkId ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-medium' : ''"
          :style="a.gtk_id !== myGtkId ? 'background: var(--bg-secondary); color: var(--text-muted)' : ''">
          {{ a.nama_lengkap }} {{ a.gtk_id === myGtkId ? '(Anda)' : '' }}
        </span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="indikatorList.length > 0" class="mb-6 rounded-xl p-4"
      style="background: var(--bg-card); border: 1px solid var(--border-primary)">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium" style="color: var(--text-secondary)">Progres Pengisian Bagian</span>
        <span class="text-sm font-bold" style="color: var(--text-heading)">
          {{ answeredCount }} / {{ indikatorList.length }} ({{ progressPercent }}%)
        </span>
      </div>
      <div class="w-full h-3 rounded-full" style="background: var(--bg-tertiary)">
        <div class="h-3 rounded-full bg-emerald-500 transition-all duration-500"
          :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Empty State: No Indicators -->
    <div v-else-if="indikatorList.length === 0"
      class="flex flex-col items-center justify-center py-16 text-center rounded-xl"
      style="background: var(--bg-card); border: 1px solid var(--border-primary)">
      <ListChecks class="w-12 h-12 mb-3 opacity-30" style="color: var(--text-muted)" />
      <h2 class="font-semibold text-lg mb-1" style="color: var(--text-heading)">
        Belum Ada Indikator / Soal
      </h2>
      <p class="text-sm max-w-md mb-5" style="color: var(--text-muted)">
        Belum ada indikator atau soal yang ditambahkan untuk Bagian {{ bagianCode }} di tahun anggaran ini.
      </p>
      <NuxtLink v-if="isAdmin" to="/edm/indikator"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
        <Plus class="w-4 h-4" />
        Tambah Indikator Bagian {{ bagianCode }}
      </NuxtLink>
    </div>

    <!-- Soal Pagination & Card Container -->
    <div v-else class="space-y-4">
      <!-- Quick Nav Grid per Soal -->
      <div class="p-4 rounded-xl shadow-xs"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-xs sm:text-sm font-semibold" style="color: var(--text-heading)">
            Navigasi Soal ({{ answeredCount }}/{{ indikatorList.length }} Terisi)
          </span>
          <span class="text-xs font-medium px-2.5 py-0.5 rounded-full"
            style="background: var(--bg-secondary); color: var(--text-muted)">
            Soal {{ currentPage }} dari {{ totalPages }}
          </span>
        </div>

        <!-- Number Badges Grid -->
        <div class="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
          <button v-for="(item, idx) in indikatorList" :key="item.id"
            @click="goToPage(idx + 1)"
            class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center transition-all border cursor-pointer"
            :class="[
              currentPage === idx + 1
                ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500 text-white shadow-sm scale-105'
                : localAnswers[item.id]?.skor
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                  : 'hover:border-emerald-400'
            ]"
            :style="currentPage !== idx + 1 && !localAnswers[item.id]?.skor ? 'background: var(--bg-secondary); color: var(--text-muted); border-color: var(--border-primary)' : ''">
            <span>{{ item.nomor_urut || (idx + 1) }}</span>
            <span v-if="localAnswers[item.id]?.skor && currentPage !== idx + 1"
              class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-zinc-900">
            </span>
          </button>
        </div>
      </div>

      <!-- Single Soal Card (1 Soal 1 Halaman) -->
      <div v-if="currentItem" class="rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-sm"
        :class="localAnswers[currentItem.id]?.skor ? 'ring-1 ring-emerald-500/40' : ''"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">

        <!-- Header: Nomor + Pertanyaan + Last Updated Info -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 pb-4 border-b"
          style="border-color: var(--border-subtle)">
          <div class="flex items-start gap-3">
            <span class="inline-flex items-center justify-center min-w-[2.25rem] h-9 rounded-xl text-sm font-bold flex-shrink-0 px-2 shadow-xs"
              :class="localAnswers[currentItem.id]?.skor ? 'bg-emerald-500 text-white' : ''"
              :style="!localAnswers[currentItem.id]?.skor ? 'background: var(--bg-secondary); color: var(--text-muted)' : ''">
              No. {{ currentItem.nomor_urut || currentPage }}
            </span>
            <div>
              <h2 class="text-base sm:text-lg font-bold leading-relaxed break-words whitespace-pre-line" style="color: var(--text-heading)">
                {{ currentItem.pertanyaan }}
              </h2>
            </div>
          </div>

          <span v-if="localAnswers[currentItem.id]?.updated_by_nama"
            class="text-xs px-2.5 py-1 rounded-md self-start shrink-0 whitespace-normal break-words"
            style="background: var(--bg-secondary); color: var(--text-muted)">
            Diperbarui oleh: <strong>{{ localAnswers[currentItem.id].updated_by_nama }}</strong>
          </span>
        </div>

        <!-- Bukti yang diminta -->
        <div v-if="currentItem.bukti_yang_diminta" class="mb-5 p-3.5 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm break-words whitespace-pre-line"
          style="background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-subtle)">
          <FileCheck class="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div class="flex-1 min-w-0">
            <strong class="font-semibold block text-emerald-700 dark:text-emerald-400">Bukti yang diminta:</strong>
            <span class="leading-relaxed whitespace-pre-line">{{ currentItem.bukti_yang_diminta }}</span>
          </div>
        </div>

        <!-- Pilihan Skor -->
        <div class="mb-5">
          <label class="block text-xs font-semibold uppercase tracking-wider mb-2.5" style="color: var(--text-muted)">
            Pilihan Jawaban / Skor:
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button v-for="p in parsePilihan(currentItem)" :key="p.skor"
              @click="setAnswer(currentItem.id, p.skor)"
              class="flex items-start gap-3 p-3.5 rounded-xl text-sm transition-all border-2 text-left w-full h-full cursor-pointer"
              :class="localAnswers[currentItem.id]?.skor === p.skor
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-500 font-semibold shadow-xs'
                : 'hover:border-emerald-300 dark:hover:border-emerald-700'"
              :style="localAnswers[currentItem.id]?.skor !== p.skor ? 'border-color: var(--border-primary); background: var(--bg-secondary); color: var(--text-primary)' : ''">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors"
                :class="localAnswers[currentItem.id]?.skor === p.skor
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'">
                {{ p.skor }}
              </span>
              <span class="text-xs sm:text-sm leading-relaxed break-words flex-1 whitespace-normal">
                {{ p.label }}
              </span>
            </button>
          </div>
        </div>

        <!-- Bukti URL -->
        <div class="mb-6">
          <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--text-muted)">
            Link / URL Bukti Fisik (opsional):
          </label>
          <div class="flex items-center gap-2">
            <LinkIcon class="w-4 h-4 flex-shrink-0" style="color: var(--text-muted)" />
            <input
              :value="localAnswers[currentItem.id]?.bukti_url || ''"
              @input="(e) => updateAnswerField(currentItem.id, 'bukti_url', e.target.value)"
              type="url"
              class="flex-1 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-w-0"
              style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
              placeholder="URL bukti (link Google Drive, Dropbox, dll)">
          </div>
        </div>

        <!-- Pagination Controls Bar -->
        <div class="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style="border-color: var(--border-subtle)">
          <UiBaseButton
            text="Sebelumnya"
            title="Soal sebelumnya"
            :disabled="currentPage === 1"
            @click="prevPage"
          >
            <template #icon><ChevronLeft class="w-4 h-4" /></template>
          </UiBaseButton>

          <div class="text-xs sm:text-sm font-semibold text-center" style="color: var(--text-secondary)">
            Soal {{ currentPage }} dari {{ totalPages }}
          </div>

          <UiBaseButton
            text="Selanjutnya"
            title="Soal berikutnya"
            :disabled="currentPage === totalPages"
            @click="nextPage"
          >
            <template #icon><ChevronRight class="w-4 h-4" /></template>
          </UiBaseButton>
        </div>
      </div>
    </div>

    <!-- Bottom Save Button -->
    <div v-if="indikatorList.length > 0" class="mt-6 flex justify-center">
      <UiBaseButton
        :text="isSaving ? 'Menyimpan...' : 'Simpan Semua Jawaban Bagian'"
        title="Simpan semua jawaban untuk bagian ini"
        :loading="isSaving"
        :disabled="isSaving"
        :class="hasUnsavedChanges ? 'ring-2 ring-emerald-500 ring-offset-2' : ''"
        class="w-full sm:w-auto"
        @click="handleSaveAll"
      >
        <template #icon><Save class="w-5 h-5" /></template>
      </UiBaseButton>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useEdm, EDM_BAGIAN_LIST } from "~/composables/edm/useEdm";
import { useNotiflix } from "~/composables/ui/useFeedback";
import {
  ArrowLeft, Save, FileCheck, Link as LinkIcon, UsersRound, ListChecks, Plus,
  ChevronLeft, ChevronRight, CheckCircle2
} from "lucide-vue-next";

const route = useRoute();
const { Notify } = useNotiflix();
const {
  isLoading, isSaving, listTahun, selectedTahunId,
  fetchTahunAnggaran, fetchBagian, fetchIndikator, fetchJawaban, saveJawaban,
} = useEdm();

const bagianCode = computed(() => {
  return (route.params.bagian || route.params.kelompok || "A").toString().toUpperCase();
});

const bagianFullName = computed(() => {
  const meta = EDM_BAGIAN_LIST.find((m) => m.code === bagianCode.value);
  return meta ? meta.name : `Bagian ${bagianCode.value}`;
});

const isAdmin = computed(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("user-role") === "admin";
});

const myGtkId = computed(() => {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("user-gtk-id");
  return id ? parseInt(id) : null;
});

const indikatorList = ref([]);
const localAnswers = reactive({});
const myBagianId = ref(null);
const anggotaBagian = ref([]);

// State Perubahan Jawaban
const hasUnsavedChanges = ref(false);

// Pagination State
const currentPage = ref(1);

const totalPages = computed(() => indikatorList.value.length);

const currentItem = computed(() => {
  if (indikatorList.value.length === 0) return null;
  const idx = currentPage.value - 1;
  if (idx < 0 || idx >= indikatorList.value.length) return indikatorList.value[0];
  return indikatorList.value[idx];
});

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const bagianColor = (name) => {
  const c = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return c[name] || "bg-zinc-600";
};

const parsePilihan = (item) => {
  if (Array.isArray(item.pilihan)) return item.pilihan;
  if (typeof item.pilihan === "string") {
    try {
      return JSON.parse(item.pilihan);
    } catch {
      return [
        { skor: 1, label: "Kurang" },
        { skor: 2, label: "Cukup" },
        { skor: 3, label: "Baik" },
        { skor: 4, label: "Sangat Baik" },
      ];
    }
  }
  return [
    { skor: 1, label: "Kurang" },
    { skor: 2, label: "Cukup" },
    { skor: 3, label: "Baik" },
    { skor: 4, label: "Sangat Baik" },
  ];
};

const answeredCount = computed(() => {
  return Object.values(localAnswers).filter(
    (a) => a.skor !== null && a.skor !== undefined
  ).length;
});

const progressPercent = computed(() => {
  if (indikatorList.value.length === 0) return 0;
  return Math.round((answeredCount.value / indikatorList.value.length) * 100);
});

const setAnswer = (indikatorId, skor) => {
  if (!localAnswers[indikatorId]) {
    localAnswers[indikatorId] = {
      indikator_id: indikatorId,
      skor: null,
      jawaban_text: "",
      bukti_url: "",
      updated_by_nama: "",
    };
  }
  if (localAnswers[indikatorId].skor === skor) {
    localAnswers[indikatorId].skor = null;
  } else {
    localAnswers[indikatorId].skor = skor;
  }
  hasUnsavedChanges.value = true;
};

const updateAnswerField = (indikatorId, field, value) => {
  if (!localAnswers[indikatorId]) {
    localAnswers[indikatorId] = {
      indikator_id: indikatorId,
      skor: null,
      jawaban_text: "",
      bukti_url: "",
      updated_by_nama: "",
    };
  }
  localAnswers[indikatorId][field] = value;
  hasUnsavedChanges.value = true;
};

const resetAnswers = () => {
  indikatorList.value.forEach((item) => {
    localAnswers[item.id] = {
      indikator_id: item.id,
      skor: null,
      jawaban_text: "",
      bukti_url: "",
      updated_by_nama: "",
    };
  });
  hasUnsavedChanges.value = false;
};

const loadExistingAnswers = async (tahunId, bId) => {
  if (!bId) return;
  const existing = await fetchJawaban(tahunId, bagianCode.value, bId);
  existing.forEach((j) => {
    if (localAnswers[j.indikator_id]) {
      localAnswers[j.indikator_id].skor = j.skor;
      localAnswers[j.indikator_id].jawaban_text = j.jawaban_text || "";
      localAnswers[j.indikator_id].bukti_url = j.bukti_url || "";
      localAnswers[j.indikator_id].updated_by_nama = j.updated_by_nama || "";
    }
  });
  hasUnsavedChanges.value = false;
};

const handleSaveAll = async () => {
  if (!myBagianId.value) {
    Notify?.failure?.("Data bagian tidak ditemukan");
    return;
  }

  const jawabanArray = indikatorList.value.map((item) => {
    const ans = localAnswers[item.id] || {};
    return {
      indikator_id: item.id,
      skor: ans.skor ?? null,
      jawaban_text: ans.jawaban_text || "",
      bukti_url: ans.bukti_url || "",
    };
  });

  const ok = await saveJawaban({
    bagian_id: myBagianId.value,
    gtk_id: myGtkId.value || undefined,
    jawaban: jawabanArray,
  });

  if (ok) {
    hasUnsavedChanges.value = false;
    if (selectedTahunId.value) {
      await loadExistingAnswers(selectedTahunId.value, myBagianId.value);
    }
  }
};

onMounted(async () => {
  await fetchTahunAnggaran();
  if (!selectedTahunId.value) return;

  const tahunId = selectedTahunId.value;

  // Find bagian
  const bagianData = await fetchBagian(tahunId);
  const myBag = bagianData.find(
    (b) => (b.nama_bagian || b.nama_kelompok) === bagianCode.value
  );

  if (myBag) {
    myBagianId.value = myBag.id;
    anggotaBagian.value = myBag.anggota || [];
  }

  // Load indikator for this bagian
  indikatorList.value = await fetchIndikator(tahunId, bagianCode.value);
  resetAnswers();
  currentPage.value = 1;

  if (myBagianId.value) {
    await loadExistingAnswers(tahunId, myBagianId.value);
  }
});
</script>
