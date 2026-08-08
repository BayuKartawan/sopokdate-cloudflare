<!-- app/components/document/SuratCrudManager.vue -->
<template>
  <div class="space-y-6">
    <!-- Header Action and Search -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="relative w-full sm:max-w-xs">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="w-4 h-4 theme-text-muted" />
        </div>
        <input v-model="searchQuery" type="text" placeholder="Cari nama template..."
          class="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 theme-input" />
        <button v-if="searchQuery" @click="searchQuery = ''"
          class="absolute inset-y-0 right-0 pr-3 flex items-center theme-text-muted hover:theme-text">
          <X class="w-4 h-4" />
        </button>
      </div>

      <BaseButton text="Tambah Template" title="Tambah template surat baru" @click="openAddModal"
        class="w-full sm:w-auto">
        <template #icon>
          <Plus class="w-4 h-4" />
        </template>
      </BaseButton>
    </div>

    <!-- Table of templates -->
    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else class="overflow-x-auto rounded-xl border theme-border theme-bg">
      <table class="w-full border-collapse text-left text-sm theme-text-secondary">
        <thead class="theme-bg-secondary theme-text uppercase text-xs font-semibold">
          <tr>
            <th scope="col" class="px-6 py-4">Nama Surat (Type)</th>
            <th scope="col" class="px-6 py-4">Path Template</th>
            <th scope="col" class="px-6 py-4">Placeholder</th>
            <th scope="col" class="px-6 py-4 text-center">Status</th>
            <th scope="col" class="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredTemplates.length === 0" class="hover:theme-bg-secondary transition-colors">
            <td colspan="5" class="px-6 py-10 text-center theme-text-muted">
              <FileText class="w-12 h-12 mx-auto mb-3 theme-text-faint" />
              <p class="text-sm font-medium">Tidak ada template surat tersedia</p>
            </td>
          </tr>
          <tr v-for="tpl in filteredTemplates" :key="tpl.surat_type" class="hover:theme-bg-secondary transition-colors">
            <td class="px-6 py-4 font-medium theme-text">
              <div>
                <p class="text-sm font-semibold">{{ tpl.surat_type }}</p>
                <p class="text-xs theme-text-muted mt-0.5">{{ tpl.description || 'Tidak ada deskripsi' }}</p>
              </div>
            </td>
            <td class="px-6 py-4 font-mono text-xs theme-text-muted">
              {{ tpl.template_path }}
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                {{ tpl.placeholders?.length || 0 }} Fields
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <button @click="toggleActiveStatus(tpl)"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border"
                :class="tpl.is_active === 1
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'theme-bg-secondary theme-text-muted theme-border hover:theme-bg-tertiary'
                ">
                <span class="w-1.5 h-1.5 rounded-full"
                  :class="tpl.is_active === 1 ? 'bg-emerald-500' : 'bg-[var(--text-faint)]'"></span>
                {{ tpl.is_active === 1 ? 'Aktif' : 'Nonaktif' }}
              </button>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="inline-flex items-center gap-2">
                <BaseButton icon-only size="sm" title="Edit template ini" @click="openEditModal(tpl)">
                  <template #icon><Pencil class="w-4 h-4" /></template>
                </BaseButton>
                <BaseButton icon-only size="sm" title="Hapus template ini" @click="confirmDelete(tpl)">
                  <template #icon><Trash2 class="w-4 h-4 text-red-500" /></template>
                </BaseButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Form (Tambah / Edit) -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/60" @click="closeModal" />

          <!-- Modal Box -->
          <div
            class="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border theme-border theme-bg shadow-2xl overflow-hidden theme-text">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b theme-border theme-bg-secondary shrink-0">
              <h3 class="text-lg font-bold flex items-center gap-2 theme-text-heading">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                  :class="isEditMode ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'">
                  <Plus v-if="!isEditMode" class="w-4 h-4" />
                  <Pencil v-else class="w-4 h-4" />
                </div>
                {{ isEditMode ? 'Edit Template Surat' : 'Tambah Template Surat' }}
              </h3>
              <button @click="closeModal"
                class="p-1.5 rounded-lg hover:theme-bg-tertiary theme-text-muted hover:theme-text transition-colors">
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Body (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <!-- Basic Form Fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold theme-text-secondary flex items-center gap-1">
                    Nama Template Surat (Type)
                    <span class="text-red-500">*</span>
                  </label>
                  <input v-model="form.surat_type" type="text" placeholder="Contoh: Surat Keterangan Siswa Aktif"
                    class="w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 theme-input"
                    :disabled="isEditMode" />
                  <p class="text-[10px] theme-text-muted">Nama unik untuk mengidentifikasi template surat ini.</p>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-semibold theme-text-secondary flex items-center gap-1">
                    Path File Template Word (.docx)
                    <span class="text-red-500">*</span>
                  </label>
                  <input v-model="form.template_path" type="text" placeholder="Contoh: templates/surat_aktif.docx"
                    class="w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 theme-input" />
                  <p class="text-[10px] theme-text-muted">Lokasi file template docx pada server / storage.</p>
                </div>

                <div class="space-y-1.5 md:col-span-2">
                  <label class="text-xs font-semibold theme-text-secondary">Deskripsi</label>
                  <textarea v-model="form.description" rows="2"
                    placeholder="Tulis penjelasan singkat tentang kegunaan template surat ini..."
                    class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 theme-input resize-none" />
                </div>
              </div>

              <!-- Placeholders Management -->
              <div class="border-t theme-border pt-5">
                <div class="flex justify-between items-center mb-4">
                  <div>
                    <h4 class="text-sm font-bold theme-text">Editor Placeholder Field</h4>
                    <p class="text-xs theme-text-muted mt-0.5">Atur input field generator yang akan terhubung dengan variabel template Word</p>
                  </div>
                  <BaseButton text="Tambah Field" size="sm" title="Tambah placeholder field baru" @click="addPlaceholderField">
                    <template #icon><Plus class="w-3.5 h-3.5" /></template>
                  </BaseButton>
                </div>

                <div v-if="form.placeholders.length === 0"
                  class="text-center py-8 rounded-lg border border-dashed theme-border theme-text-muted text-xs">
                  Belum ada placeholder field. Klik 'Tambah Field' di atas.
                </div>

                <div v-else class="space-y-3">
                  <div v-for="(ph, index) in form.placeholders" :key="index"
                    class="p-4 rounded-xl border theme-border theme-bg-secondary flex flex-col md:flex-row items-start md:items-center gap-3 relative group">
                    <!-- Drag/Ordering Handle -->
                    <div class="flex flex-row md:flex-col gap-1 items-center justify-center self-stretch shrink-0 pr-1 border-r theme-border md:border-r-0">
                      <button type="button" @click="movePlaceholderUp(index)" :disabled="index === 0"
                        class="p-1 rounded hover:theme-bg-tertiary theme-text-muted hover:theme-text disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                        <ChevronUp class="w-4 h-4" />
                      </button>
                      <button type="button" @click="movePlaceholderDown(index)"
                        :disabled="index === form.placeholders.length - 1"
                        class="p-1 rounded hover:theme-bg-tertiary theme-text-muted hover:theme-text disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                        <ChevronDown class="w-4 h-4" />
                      </button>
                    </div>

                    <!-- Inputs Grid -->
                    <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 w-full">
                      <div class="space-y-1">
                        <label class="text-[10px] font-semibold theme-text-muted">Variabel / Key <span class="text-red-500">*</span></label>
                        <input v-model="ph.key" type="text" placeholder="e.g. nama_siswa"
                          class="w-full h-8 px-2 border rounded-md text-xs theme-input focus:outline-none focus:border-blue-500" />
                      </div>
                      <div class="space-y-1">
                        <label class="text-[10px] font-semibold theme-text-muted">Label Input <span class="text-red-500">*</span></label>
                        <input v-model="ph.label" type="text" placeholder="e.g. Nama Lengkap Siswa"
                          class="w-full h-8 px-2 border rounded-md text-xs theme-input focus:outline-none focus:border-blue-500" />
                      </div>
                      <div class="space-y-1">
                        <label class="text-[10px] font-semibold theme-text-muted">Tipe Data</label>
                        <select v-model="ph.type"
                          class="w-full h-8 px-1.5 border rounded-md text-xs theme-input focus:outline-none focus:border-blue-500">
                          <option v-for="t in fieldTypes" :key="t" :value="t">{{ t }}</option>
                        </select>
                      </div>
                      <div class="space-y-1">
                        <label class="text-[10px] font-semibold theme-text-muted">Nilai Default (Opsional)</label>
                        <input v-model="ph.default_value" type="text" placeholder="Nilai bawaan"
                          class="w-full h-8 px-2 border rounded-md text-xs theme-input focus:outline-none focus:border-blue-500" />
                      </div>
                      <div class="space-y-1">
                        <label class="text-[10px] font-semibold theme-text-muted">Opsi Select (Komparasi Koma)</label>
                        <input v-model="ph.options" type="text" placeholder="Opsi1, Opsi2"
                          :disabled="ph.type !== 'select'"
                          class="w-full h-8 px-2 border rounded-md text-xs theme-input focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed" />
                      </div>
                    </div>

                    <!-- Config / Trash Button -->
                    <div class="flex items-center gap-2 self-stretch md:self-auto shrink-0 pt-2 md:pt-0 w-full md:w-auto border-t theme-border md:border-t-0 justify-between md:justify-start">
                      <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs select-none theme-text-secondary">
                        <input type="checkbox" v-model="ph.isRequired"
                          class="rounded border theme-border text-blue-600 focus:ring-0 focus:ring-offset-0" />
                        Wajib
                      </label>
                      <button type="button" @click="removePlaceholderField(index)"
                        class="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 transition-colors"
                        title="Hapus Field">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="flex justify-end gap-3 px-6 py-4 border-t theme-border theme-bg-secondary shrink-0">
              <BaseButton text="Batal" size="sm" title="Tutup modal tanpa menyimpan" @click="closeModal" />
              <BaseButton
                :text="isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Template')"
                title="Simpan template"
                @click="submitForm"
                :disabled="isSaving || !isFormValid"
              >
                <template #icon>
                  <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                  <Save v-else class="w-4 h-4" />
                </template>
              </BaseButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Search, X, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Save, Loader2, FileText } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { fetchFromSuratApiAll, postSuratTemplate, putSuratTemplate, deleteSuratTemplate } from "~/utils/api";

interface PlaceholderItem {
  key: string;
  label: string;
  type: string;
  options: string;
  default_value: string;
  isRequired: boolean;
  sort_order: number;
}

interface PlaceholderPayload {
  key: string;
  label: string;
  type: string;
  options: string[] | null;
  default_value: string | null;
  is_required: 0 | 1;
  sort_order: number;
}

interface SuratTemplate {
  surat_type: string;
  template_path: string;
  template_type?: string;
  description?: string;
  is_active: number;
  placeholders?: Array<{
    key: string;
    label: string;
    type?: string;
    options?: string[] | string | null;
    default_value?: string;
    is_required?: number;
    sort_order?: number;
  }>;
}

interface FormState {
  surat_type: string;
  template_path: string;
  template_type: string;
  description: string;
  is_active: number;
  placeholders: PlaceholderItem[];
}

const emit = defineEmits<{
  refresh: [];
}>();

const { Notify, Confirm } = useNotiflix();

const isLoading = ref<boolean>(false);
const isSaving = ref<boolean>(false);
const templates = ref<SuratTemplate[]>([]);
const searchQuery = ref<string>("");

// Modal Form State
const showModal = ref<boolean>(false);
const isEditMode = ref<boolean>(false);
const editingSuratType = ref<string>("");

const form = ref<FormState>({
  surat_type: "",
  template_path: "",
  template_type: "docx",
  description: "",
  is_active: 1,
  placeholders: [],
});

const fieldTypes: string[] = [
  "text",
  "number",
  "date",
  "time",
  "email",
  "tel",
  "select",
  "gender",
  "semester",
  "class",
  "month",
  "no-surat",
  "academic-year",
  "year-range",
];

// Fetch all templates including inactive ones
const loadTemplates = async (): Promise<void> => {
  isLoading.value = true;
  try {
    const data = await fetchFromSuratApiAll(true);
    templates.value = data || [];
  } catch (err) {
    const error = err as Error;
    console.error("Gagal memuat semua template surat:", error);
    Notify?.failure?.(error.message || "Gagal memuat template surat");
  } finally {
    isLoading.value = false;
  }
};

const filteredTemplates = computed<SuratTemplate[]>(() => {
  if (!searchQuery.value) return templates.value;
  const q = searchQuery.value.toLowerCase();
  return templates.value.filter(
    (t) =>
      t.surat_type?.toLowerCase().includes(q) ||
      t.template_path?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q),
  );
});

const isFormValid = computed<boolean>(() => {
  if (!form.value.surat_type?.trim()) return false;
  if (!form.value.template_path?.trim()) return false;

  // Placeholders validation if any
  for (const ph of form.value.placeholders) {
    if (!ph.key?.trim() || !ph.label?.trim()) return false;
  }
  return true;
});

// Modal Actions
const openAddModal = (): void => {
  isEditMode.value = false;
  editingSuratType.value = "";
  form.value = {
    surat_type: "",
    template_path: "",
    template_type: "docx",
    description: "",
    is_active: 1,
    placeholders: [],
  };
  showModal.value = true;
};

const openEditModal = (tpl: SuratTemplate): void => {
  isEditMode.value = true;
  editingSuratType.value = tpl.surat_type;

  // Clone tpl data to form
  form.value = {
    surat_type: tpl.surat_type,
    template_path: tpl.template_path,
    template_type: tpl.template_type || "docx",
    description: tpl.description || "",
    is_active: tpl.is_active ?? 1,
    placeholders: (tpl.placeholders || []).map((ph) => ({
      key: ph.key,
      label: ph.label,
      type: ph.type || "text",
      options: Array.isArray(ph.options) ? ph.options.join(", ") : (ph.options || ""),
      default_value: ph.default_value || "",
      isRequired: ph.is_required !== 0,
      sort_order: ph.sort_order ?? 0,
    })),
  };
  showModal.value = true;
};

const closeModal = (): void => {
  showModal.value = false;
};

// Placeholders Editor actions
const addPlaceholderField = (): void => {
  form.value.placeholders.push({
    key: "",
    label: "",
    type: "text",
    options: "",
    default_value: "",
    isRequired: true,
    sort_order: form.value.placeholders.length,
  });
};

const removePlaceholderField = (index: number): void => {
  form.value.placeholders.splice(index, 1);
  // Re-index sort order
  form.value.placeholders.forEach((ph, idx) => {
    ph.sort_order = idx;
  });
};

const movePlaceholderUp = (index: number): void => {
  if (index === 0) return;
  const list = form.value.placeholders;
  const temp = list[index];
  list[index] = list[index - 1];
  list[index - 1] = temp;

  // Update sort order
  list.forEach((ph, idx) => {
    ph.sort_order = idx;
  });
};

const movePlaceholderDown = (index: number): void => {
  const list = form.value.placeholders;
  if (index === list.length - 1) return;
  const temp = list[index];
  list[index] = list[index + 1];
  list[index + 1] = temp;

  // Update sort order
  list.forEach((ph, idx) => {
    ph.sort_order = idx;
  });
};

// Save template
const submitForm = async (): Promise<void> => {
  if (!isFormValid.value) return;
  isSaving.value = true;

  // Map placeholders back to correct schema formats
  const mappedPlaceholders: PlaceholderPayload[] = form.value.placeholders.map((ph, idx) => {
    let optionsVal: string[] | null = null;
    if (ph.type === "select" && ph.options) {
      optionsVal = ph.options
        .split(",")
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
    }
    return {
      key: ph.key.trim(),
      label: ph.label.trim(),
      type: ph.type,
      options: optionsVal,
      default_value: ph.default_value?.trim() || null,
      is_required: ph.isRequired ? 1 : 0,
      sort_order: idx,
    };
  });

  const payload = {
    surat_type: form.value.surat_type.trim(),
    template_path: form.value.template_path.trim(),
    template_type: form.value.template_type,
    description: form.value.description?.trim() || "",
    is_active: form.value.is_active,
    placeholders: mappedPlaceholders,
  };

  try {
    if (isEditMode.value) {
      await putSuratTemplate(editingSuratType.value, payload);
      Notify?.success?.("Template surat berhasil diperbarui");
    } else {
      await postSuratTemplate(payload);
      Notify?.success?.("Template surat berhasil ditambahkan");
    }
    closeModal();
    loadTemplates();
    emit("refresh");
  } catch (err) {
    const error = err as Error;
    console.error("Gagal menyimpan template surat:", error);
    Notify?.failure?.(error.message || "Gagal menyimpan template surat");
  } finally {
    isSaving.value = false;
  }
};

// Soft delete toggle status
const toggleActiveStatus = async (tpl: SuratTemplate): Promise<void> => {
  const newStatus = tpl.is_active === 1 ? 0 : 1;

  try {
    // We only update is_active field
    await putSuratTemplate(tpl.surat_type, {
      is_active: newStatus,
    });
    tpl.is_active = newStatus;
    Notify?.success?.("Template berhasil diperbarui");
    emit("refresh");
  } catch (err) {
    const error = err as Error;
    console.error("Gagal mengubah status template:", error);
    Notify?.failure?.(error.message || "Gagal mengubah status template");
  }
};

// Hard Delete Template
const confirmDelete = (tpl: SuratTemplate): void => {
  Confirm?.show(
    "Hapus Template Surat",
    `Apakah Anda yakin ingin menghapus template '${tpl.surat_type}'? Semua data placeholder yang terhubung akan terhapus permanen.`,
    "Ya, Hapus",
    "Batal",
    async () => {
      try {
        await deleteSuratTemplate(tpl.surat_type);
        Notify?.success?.("Template surat berhasil dihapus");
        loadTemplates();
        emit("refresh");
      } catch (err) {
        const error = err as Error;
        console.error("Gagal menghapus template surat:", error);
        Notify?.failure?.(error.message || "Gagal menghapus template surat");
      }
    },
  );
};

onMounted(() => {
  loadTemplates();
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
