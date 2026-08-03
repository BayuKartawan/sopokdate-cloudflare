<template>
  <div class="min-h-screen p-4 lg:p-6">
    <!-- Top Nav -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/edm/isi"
          class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-emerald-500/10"
          style="background: var(--bg-secondary); color: var(--text-primary)">
          <ArrowLeft class="w-5 h-5" />
        </NuxtLink>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold" style="color: var(--text-heading)">
              Pengisian EDM
            </h1>
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white"
              :class="kelompokColor(kelompokName)">
              {{ kelompokName }}
            </span>
          </div>
          <p class="mt-0.5 text-sm" style="color: var(--text-muted)">
            Kelompok {{ kelompokName }} · {{ indikatorList.length }} pertanyaan · Jawaban Tersinkronisasi
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button @click="handleSaveAll" :disabled="isSaving || indikatorList.length === 0"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.97] transition-all shadow-sm">
          <Save class="w-4 h-4" />
          {{ isSaving ? 'Menyimpan...' : 'Simpan Jawaban Kelompok' }}
        </button>
      </div>
    </div>

    <!-- Kelompok Banner -->
    <div class="mb-6 rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      style="background: var(--bg-card); border-color: var(--border-primary)">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <UsersRound class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 class="text-sm font-semibold" style="color: var(--text-heading)">
            Pengisian Bersama Kelompok {{ kelompokName }}
          </h2>
          <p class="text-xs" style="color: var(--text-muted)">
            Jawaban yang diisi di halaman ini otomatis tersinkronisasi untuk seluruh anggota Kelompok {{ kelompokName }}
          </p>
        </div>
      </div>

      <div v-if="anggotaKelompok.length > 0" class="flex flex-wrap gap-1.5">
        <span v-for="a in anggotaKelompok" :key="a.gtk_id"
          class="text-xs px-2 py-0.5 rounded"
          :class="a.gtk_id === myGtkId ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-medium' : ''"
          :style="a.gtk_id !== myGtkId ? 'background: var(--bg-secondary); color: var(--text-muted)' : ''">
          {{ a.nama_lengkap }}
        </span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="indikatorList.length > 0" class="mb-6 rounded-xl p-4"
      style="background: var(--bg-card); border: 1px solid var(--border-primary)">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium" style="color: var(--text-secondary)">Progres Pengisian Kelompok</span>
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
        Belum ada indikator atau soal yang ditambahkan untuk Kelompok {{ kelompokName }} di tahun anggaran ini.
      </p>
      <NuxtLink v-if="isAdmin" to="/edm/indikator"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
        <Plus class="w-4 h-4" />
        Tambah Indikator Kelompok {{ kelompokName }}
      </NuxtLink>
    </div>

    <!-- Soal List -->
    <div v-else class="space-y-4">
      <div v-for="item in indikatorList" :key="item.id"
        class="rounded-xl p-5 transition-all duration-200"
        :class="localAnswers[item.id]?.skor ? 'ring-1 ring-emerald-500/30' : ''"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">

        <!-- Header: Nomor + Komponen + Last Updated Info -->
        <div class="flex items-start gap-3 mb-3">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0"
            :class="localAnswers[item.id]?.skor ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : ''"
            :style="!localAnswers[item.id]?.skor ? 'background: var(--bg-secondary); color: var(--text-muted)' : ''">
            {{ item.nomor_urut }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <div class="flex items-center gap-2 flex-wrap">
                <span v-if="item.komponen" class="text-xs font-medium px-2 py-0.5 rounded"
                  style="background: var(--bg-secondary); color: var(--text-secondary)">
                  {{ item.komponen }}
                </span>
                <span v-if="item.sub_komponen" class="text-xs" style="color: var(--text-muted)">
                  › {{ item.sub_komponen }}
                </span>
              </div>
              <span v-if="localAnswers[item.id]?.updated_by_nama" class="text-[11px] px-2 py-0.5 rounded"
                style="background: var(--bg-secondary); color: var(--text-muted)">
                Diperbarui oleh: <strong>{{ localAnswers[item.id].updated_by_nama }}</strong>
              </span>
            </div>
            <p class="text-sm font-medium leading-relaxed" style="color: var(--text-primary)">
              {{ item.pertanyaan }}
            </p>
          </div>
        </div>

        <!-- Bukti yang diminta -->
        <div v-if="item.bukti_yang_diminta" class="ml-11 mb-3 flex items-start gap-2 text-xs"
          style="color: var(--text-muted)">
          <FileCheck class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Bukti: {{ item.bukti_yang_diminta }}</span>
        </div>

        <!-- Keterangan -->
        <div v-if="item.keterangan" class="ml-11 mb-3 flex items-start gap-2 text-xs"
          style="color: var(--text-muted)">
          <Info class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{{ item.keterangan }}</span>
        </div>

        <!-- Pilihan Skor -->
        <div class="ml-11 mb-3">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button v-for="p in parsePilihan(item)" :key="p.skor" @click="setAnswer(item.id, p.skor)"
              class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all border-2"
              :class="localAnswers[item.id]?.skor === p.skor
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-500 font-medium'
                : 'hover:border-emerald-300 dark:hover:border-emerald-700'"
              :style="localAnswers[item.id]?.skor !== p.skor ? 'border-color: var(--border-primary); background: var(--bg-secondary); color: var(--text-primary)' : ''">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                :class="localAnswers[item.id]?.skor === p.skor
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'">
                {{ p.skor }}
              </span>
              <span class="truncate">{{ p.label }}</span>
            </button>
          </div>
        </div>

        <!-- Keterangan / Jawaban Text -->
        <div class="ml-11 mb-3">
          <textarea
            :value="localAnswers[item.id]?.jawaban_text || ''"
            @input="(e) => updateAnswerField(item.id, 'jawaban_text', e.target.value)"
            rows="2"
            class="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
            style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
            placeholder="Keterangan jawaban kelompok (opsional)...">
          </textarea>
        </div>

        <!-- Bukti URL -->
        <div class="ml-11">
          <div class="flex items-center gap-2">
            <LinkIcon class="w-4 h-4 flex-shrink-0" style="color: var(--text-muted)" />
            <input
              :value="localAnswers[item.id]?.bukti_url || ''"
              @input="(e) => updateAnswerField(item.id, 'bukti_url', e.target.value)"
              type="url"
              class="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
              placeholder="URL bukti (link Google Drive, dll)">
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Save Button -->
    <div v-if="indikatorList.length > 0" class="mt-6 flex justify-center">
      <button @click="handleSaveAll" :disabled="isSaving"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.97] transition-all shadow-lg">
        <Save class="w-5 h-5" />
        {{ isSaving ? 'Menyimpan...' : 'Simpan Semua Jawaban Kelompok' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useEdm } from "~/composables/edm/useEdm";
import { useNotiflix } from "~/composables/ui/useFeedback";
import {
  ArrowLeft, Save, FileCheck, Info, Link as LinkIcon, UsersRound, ListChecks, Plus,
} from "lucide-vue-next";

const route = useRoute();
const { Notify } = useNotiflix();
const {
  isLoading, isSaving, listTahun, selectedTahunId,
  fetchTahunAnggaran, fetchKelompok, fetchIndikator, fetchJawaban, saveJawaban,
} = useEdm();

const kelompokName = computed(() => {
  return (route.params.kelompok || "A").toString().toUpperCase();
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
const myKelompokId = ref(null);
const anggotaKelompok = ref([]);

const kelompokColor = (name) => {
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
};

const loadExistingAnswers = async (tahunId, kelId) => {
  if (!kelId) return;
  const existing = await fetchJawaban(tahunId, kelompokName.value, kelId);
  existing.forEach((j) => {
    if (localAnswers[j.indikator_id]) {
      localAnswers[j.indikator_id].skor = j.skor;
      localAnswers[j.indikator_id].jawaban_text = j.jawaban_text || "";
      localAnswers[j.indikator_id].bukti_url = j.bukti_url || "";
      localAnswers[j.indikator_id].updated_by_nama = j.updated_by_nama || "";
    }
  });
};

const handleSaveAll = async () => {
  if (!myKelompokId.value) {
    Notify?.failure?.("Data kelompok tidak ditemukan");
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
    kelompok_id: myKelompokId.value,
    gtk_id: myGtkId.value || undefined,
    jawaban: jawabanArray,
  });

  if (ok && selectedTahunId.value) {
    await loadExistingAnswers(selectedTahunId.value, myKelompokId.value);
  }
};

onMounted(async () => {
  await fetchTahunAnggaran();
  if (!selectedTahunId.value) return;

  const tahunId = selectedTahunId.value;

  // Find kelompok
  const kelompokData = await fetchKelompok(tahunId);
  const myKel = kelompokData.find(
    (k) => k.nama_kelompok === kelompokName.value
  );

  if (myKel) {
    myKelompokId.value = myKel.id;
    anggotaKelompok.value = myKel.anggota || [];
  }

  // Load indikator for this kelompok
  indikatorList.value = await fetchIndikator(tahunId, kelompokName.value);
  resetAnswers();

  if (myKelompokId.value) {
    await loadExistingAnswers(tahunId, myKelompokId.value);
  }
});
</script>
