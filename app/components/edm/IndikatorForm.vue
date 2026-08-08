<template>
  <div class="min-h-screen">
    <div class="page-layout">

      <!-- ── Header & Navigation ─────────────────────────────── -->
      <div class="flex items-start justify-between gap-3 mb-6">
        <!-- Left: back button + title -->
        <div class="flex items-start gap-3 min-w-0">
          <NuxtLink to="/edm/indikator"
            class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-emerald-500/10 shrink-0 mt-0.5"
            style="background: var(--bg-secondary); color: var(--text-primary)">
            <ArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-lg sm:text-2xl font-bold leading-tight" style="color: var(--text-heading)">
                {{ headerTitleText }}
              </h1>
              <span v-if="isEdit && indikatorId" class="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold shrink-0"
                style="background: var(--bg-secondary); color: var(--text-muted)">
                ID #{{ indikatorId }}
              </span>
            </div>
            <p class="text-xs sm:text-sm mt-0.5 line-clamp-2" style="color: var(--text-muted)">
              {{ subTitleText }}
            </p>
          </div>
        </div>

        <!-- Right: action buttons -->
        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink to="/edm/indikator"
            class="hidden sm:inline-flex px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            style="background: var(--bg-secondary); color: var(--text-primary)">
            Batal
          </NuxtLink>
          <UiBaseButton
            :text="saveButtonText"
            title="Simpan indikator ke database"
            :loading="isSaving"
            :disabled="isSaving"
            @click="handleSave"
          >
            <template #icon><Save class="w-4 h-4" /></template>
          </UiBaseButton>
        </div>
      </div>

      <!-- ── Loading ─────────────────────────────────────────── -->
      <div v-if="isLoading || isFetchingItem" class="flex flex-col items-center justify-center py-20">
        <div class="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p class="text-xs font-medium" style="color: var(--text-muted)">
          {{ isEdit ? 'Memuat data indikator...' : 'Memuat data...' }}
        </p>
      </div>

      <!-- ── Main Form Section ────────────────────────────────── -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Form Column (Left / Top) -->
        <div class="lg:col-span-7 space-y-6">

          <!-- Card 1: Bagian & Nomor Urut -->
          <div class="p-5 rounded-2xl shadow-xs"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">
            <h2 class="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
              style="color: var(--text-muted)">
              <Sparkles class="w-4 h-4 text-emerald-500" />
              Informasi Bagian Indikator
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--text-secondary)">Bagian Target
                  *</label>
                <UiSearchableSelect
                  v-model="formItem.bagian_target"
                  :options="EDM_BAGIAN_LIST.map(b => ({ label: `Bagian ${b.code}: ${b.title}`, value: b.code }))"
                  placeholder="Pilih Bagian Target"
                  search-placeholder="Cari bagian..."
                />
              </div>

              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--text-secondary)">Nomor Urut
                  *</label>
                <input v-model.number="formItem.nomor_urut" type="number" min="1"
                  class="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-bold"
                  style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)">
              </div>
            </div>
          </div>

          <!-- Card 2: Pertanyaan Indikator -->
          <div class="p-5 rounded-2xl shadow-xs"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">
            <label class="block text-sm font-bold mb-1.5" style="color: var(--text-heading)">
              Pertanyaan Indikator *
            </label>
            <p class="text-xs mb-3" style="color: var(--text-muted)">
              Tulis pertanyaan indikator evaluasi diri. Gunakan garis baru (*Enter*) jika terdapat beberapa paragraf
              atau uraian.
            </p>
            <textarea v-model="formItem.pertanyaan" v-auto-resize
              class="w-full rounded-xl px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/40 break-words"
              style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
              :placeholder="isEdit ? 'Tulis pertanyaan indikator...' : 'Contoh: Apakah madrasah menyediakan fasilitas dan sarana pendukung pembelajaran yang memadai untuk seluruh siswa?'"></textarea>
          </div>

          <!-- Card 3: Bukti yang Diminta (Daftar Bukti Fisik) -->
          <div class="p-5 rounded-2xl shadow-xs"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-sm font-bold" style="color: var(--text-heading)">
                Daftar Bukti Fisik yang Diminta
              </label>
              <span
                class="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                Multi-Line & List Supported
              </span>
            </div>
            <p class="text-xs mb-3" style="color: var(--text-muted)">
              Tuliskan daftar dokumen atau bukti fisik. Gunakan baris baru untuk setiap nomor/poin bukti.
            </p>
            <textarea v-model="formItem.bukti_yang_diminta" v-auto-resize
              class="w-full rounded-xl px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/40 break-words"
              style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
              placeholder="Contoh:&#10;1. Dokumen SK Tim Pengembang Madrasah&#10;2. Daftar Hadir Rapat Evaluasi&#10;3. Foto Dokumentasi Kegiatan"></textarea>
          </div>

          <!-- Card 4: Pilihan Jawaban & Kriteria Skor -->
          <div class="p-5 rounded-2xl shadow-xs"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">
            <h2 class="text-sm font-bold mb-1" style="color: var(--text-heading)">
              Pilihan Jawaban & Deskripsi Kriteria Skor (1–4)
            </h2>
            <p class="text-xs mb-4" style="color: var(--text-muted)">
              Berikan penjelasan detail kriteria untuk setiap tingkatan skor agar penilaian objektif.
            </p>

            <div class="space-y-4">
              <div v-for="(p, idx) in formPilihan" :key="idx" class="p-3.5 rounded-xl border transition-all"
                style="background: var(--bg-secondary); border-color: var(--border-subtle)">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
                    :class="skorColor(p.skor)">
                    Skor {{ p.skor }}
                  </span>
                  <span class="text-xs font-medium" style="color: var(--text-muted)">
                    Tingkatan {{ p.skor }} dari 4
                  </span>
                </div>

                <textarea v-model="p.label" v-auto-resize
                  class="w-full rounded-xl px-3.5 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/40 break-words"
                  style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-input)"
                  :placeholder="`Penjelasan rinci kriteria untuk pilihan skor ${p.skor}...`"></textarea>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-2 pb-6">
            <NuxtLink to="/edm/indikator"
              class="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              style="background: var(--bg-secondary); color: var(--text-primary)">
              Batal
            </NuxtLink>
            <UiBaseButton
              :text="saveButtonText"
              title="Simpan indikator ke database"
              :loading="isSaving"
              :disabled="isSaving"
              @click="handleSave"
            >
              <template #icon><Save class="w-4 h-4" /></template>
            </UiBaseButton>
          </div>
        </div>

        <!-- Live Preview Column (Right Side on Desktop) -->
        <div class="lg:col-span-5">
          <!-- Mobile: collapsible label -->
          <div class="lg:hidden flex items-center gap-2 mb-3">
            <div class="flex-1 h-px" style="background: var(--border-primary)"></div>
            <span class="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
              style="background: var(--bg-secondary); color: var(--text-muted)">
              <Eye class="w-3.5 h-3.5 text-emerald-500" />
              Pratinjau Real-time
            </span>
            <div class="flex-1 h-px" style="background: var(--border-primary)"></div>
          </div>

          <div class="lg:sticky lg:top-[4.5rem] p-5 rounded-2xl shadow-xs space-y-4"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">
            <div class="flex items-center justify-between pb-3 border-b" style="border-color: var(--border-subtle)">
              <div class="flex items-center gap-2">
                <Eye class="w-4 h-4 text-emerald-500" />
                <h3 class="text-sm font-bold" style="color: var(--text-heading)">
                  Pratinjau Tampilan Real-time
                </h3>
              </div>
              <span class="text-[11px] px-2 py-0.5 rounded-md font-semibold"
                :class="bagianColor(formItem.bagian_target)" style="color: white">
                Bagian {{ formItem.bagian_target }}
              </span>
            </div>

            <!-- Preview Card Container -->
            <div class="rounded-xl p-4 border"
              style="background: var(--bg-surface); border-color: var(--border-primary)">
              <div class="flex items-start gap-2.5 mb-3">
                <span
                  class="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-lg text-xs font-bold bg-emerald-500 text-white flex-shrink-0">
                  No. {{ formItem.nomor_urut || 1 }}
                </span>
                <h4 class="text-sm font-bold leading-relaxed break-words whitespace-pre-line"
                  style="color: var(--text-heading)">
                  {{ formItem.pertanyaan || 'Pertanyaan indikator akan tampil di sini...' }}
                </h4>
              </div>

              <!-- Preview Bukti yang diminta -->
              <div v-if="formItem.bukti_yang_diminta"
                class="mb-4 p-3 rounded-lg text-xs break-words whitespace-pre-line flex items-start gap-2"
                style="background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-subtle)">
                <FileCheck class="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div class="flex-1 min-w-0">
                  <strong class="font-semibold block text-emerald-700 dark:text-emerald-400 mb-0.5">Bukti yang
                    diminta:</strong>
                  <span class="leading-relaxed whitespace-pre-line">{{ formItem.bukti_yang_diminta }}</span>
                </div>
              </div>

              <!-- Preview Pilihan Skor -->
              <div class="space-y-2">
                <span class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-muted)">
                  Simulasi Pilihan Skor:
                </span>
                <div v-for="p in formPilihan" :key="p.skor"
                  class="p-2.5 rounded-lg border text-xs flex items-start gap-2.5"
                  style="background: var(--bg-card); border-color: var(--border-primary)">
                  <span
                    class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                    :class="skorColor(p.skor)">
                    {{ p.skor }}
                  </span>
                  <span class="leading-relaxed break-words whitespace-pre-line flex-1"
                    style="color: var(--text-primary)">
                    {{ p.label || `Kriteria skor ${p.skor}` }}
                  </span>
                </div>
              </div>
            </div>

            <p class="text-[11px] leading-relaxed text-center" style="color: var(--text-muted)">
              Tampilan di atas mensimulasikan persis bagaimana soal dan opsi jawaban akan dirender di layar pengisian
              pengguna.
            </p>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import { EDM_BAGIAN_LIST } from "~/composables/edm/useEdm";
import { ArrowLeft, Save, Sparkles, Eye, FileCheck } from "lucide-vue-next";
import UiSearchableSelect from "~/components/ui/SearchableSelect.vue";

interface FormItem {
  bagian_target: string;
  nomor_urut: number;
  pertanyaan: string;
  bukti_yang_diminta: string;
}

interface PilihanItem {
  skor: number;
  label: string;
}

interface SavePayload {
  formItem: FormItem;
  formPilihan: PilihanItem[];
}

// Extend HTMLElement to support custom _autoResizeHandler property
interface AutoResizeElement extends HTMLTextAreaElement {
  _autoResizeHandler?: () => void;
}

const props = defineProps<{
  isEdit?: boolean;
  indikatorId?: number | string | null;
  isLoading?: boolean;
  isFetchingItem?: boolean;
  isSaving?: boolean;
  initialForm?: FormItem;
  initialPilihan?: PilihanItem[];
}>();

const emit = defineEmits<{
  save: [payload: SavePayload];
}>();

const headerTitleText = computed<string>(() =>
  props.isEdit ? "Edit Indikator Soal EDM" : "Tambah Indikator Soal EDM",
);

const subTitleText = computed<string>(() =>
  props.isEdit
    ? "Perbarui pertanyaan, daftar bukti fisik, dan kriteria skor evaluasi diri"
    : "Form isian lengkap untuk pertanyaan, daftar bukti fisik, dan kriteria skor",
);

const saveButtonText = computed<string>(() =>
  props.isSaving
    ? "Menyimpan..."
    : props.isEdit
      ? "Perbarui Indikator"
      : "Simpan Indikator Baru",
);

const formItem = reactive<FormItem>({
  bagian_target: "A",
  nomor_urut: 1,
  pertanyaan: "",
  bukti_yang_diminta: "",
});

const formPilihan = ref<PilihanItem[]>([
  { skor: 1, label: "Kurang" },
  { skor: 2, label: "Cukup" },
  { skor: 3, label: "Baik" },
  { skor: 4, label: "Sangat Baik" },
]);

// Auto-resize directive
const vAutoResize = {
  mounted(el: AutoResizeElement) {
    el.style.resize = "none";
    el.style.overflow = "hidden";
    el.style.minHeight = "2.75rem";
    const resize = () => {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    };
    el._autoResizeHandler = resize;
    el.addEventListener("input", resize);
    resize();
  },
  updated(el: AutoResizeElement) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  },
  unmounted(el: AutoResizeElement) {
    if (el._autoResizeHandler) {
      el.removeEventListener("input", el._autoResizeHandler);
    }
  },
};

const triggerAutoResize = async (): Promise<void> => {
  await nextTick();
  document.querySelectorAll<AutoResizeElement>("textarea").forEach((el) => {
    if (el._autoResizeHandler) el._autoResizeHandler();
  });
};

watch(
  () => props.initialForm,
  (val) => {
    if (val) {
      Object.assign(formItem, val);
      triggerAutoResize();
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => props.initialPilihan,
  (val) => {
    if (Array.isArray(val) && val.length > 0) {
      formPilihan.value = val.map((p) => ({ ...p }));
      triggerAutoResize();
    }
  },
  { immediate: true, deep: true },
);

const bagianColor = (name: string): string => {
  const c: Record<string, string> = {
    A: "bg-blue-600",
    B: "bg-emerald-600",
    C: "bg-amber-600",
    D: "bg-violet-600",
    E: "bg-rose-600",
  };
  return c[name] ?? "bg-zinc-600";
};

const skorColor = (skor: number): string => {
  const c: Record<number, string> = {
    1: "bg-rose-500",
    2: "bg-amber-500",
    3: "bg-emerald-500",
    4: "bg-blue-600",
  };
  return c[skor] ?? "bg-zinc-500";
};

const handleSave = (): void => {
  emit("save", {
    formItem: { ...formItem },
    formPilihan: formPilihan.value.map((p) => ({ ...p })),
  });
};
</script>
