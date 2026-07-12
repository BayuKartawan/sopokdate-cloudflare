<!-- app/components/document/SuratCrudManager.vue -->
<template>
  <div class="space-y-6">
    <!-- Header Action and Search -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="relative w-full sm:max-w-xs">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="w-4 h-4 text-zinc-500" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama template..."
          class="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <BaseButton
        text="Tambah Template"
        @click="openAddModal"
        class="w-full sm:w-auto !bg-emerald-600 hover:!bg-emerald-500 !text-white !border-emerald-600"
      >
        <template #icon>
          <Plus class="w-4 h-4" />
        </template>
      </BaseButton>
    </div>

    <!-- Table of templates -->
    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else class="overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-900">
      <table class="w-full border-collapse text-left text-sm text-zinc-300">
        <thead class="bg-zinc-800 text-zinc-200 uppercase text-xs font-semibold border-b border-zinc-700">
          <tr>
            <th scope="col" class="px-6 py-4">Nama Surat (Type)</th>
            <th scope="col" class="px-6 py-4">Path Template</th>
            <th scope="col" class="px-6 py-4">Placeholder</th>
            <th scope="col" class="px-6 py-4 text-center">Status</th>
            <th scope="col" class="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800">
          <tr v-if="filteredTemplates.length === 0" class="hover:bg-zinc-800/30">
            <td colspan="5" class="px-6 py-10 text-center text-zinc-500">
              <FileText class="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p class="text-sm font-medium">Tidak ada template surat tersedia</p>
            </td>
          </tr>
          <tr
            v-for="tpl in filteredTemplates"
            :key="tpl.surat_type"
            class="hover:bg-zinc-800/40 transition-colors"
          >
            <td class="px-6 py-4 font-medium text-zinc-100">
              <div>
                <p class="text-sm font-semibold">{{ tpl.surat_type }}</p>
                <p class="text-xs text-zinc-400 mt-0.5">{{ tpl.description || 'Tidak ada deskripsi' }}</p>
              </div>
            </td>
            <td class="px-6 py-4 font-mono text-xs text-zinc-400">
              {{ tpl.template_path }}
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
                {{ tpl.placeholders?.length || 0 }} Fields
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <button
                @click="toggleActiveStatus(tpl)"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
                :class="
                  tpl.is_active === 1
                    ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/40'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                "
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="tpl.is_active === 1 ? 'bg-emerald-400' : 'bg-zinc-500'"></span>
                {{ tpl.is_active === 1 ? 'Aktif' : 'Nonaktif' }}
              </button>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="inline-flex items-center gap-2">
                <button
                  @click="openEditModal(tpl)"
                  class="p-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  title="Edit Template"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="confirmDelete(tpl)"
                  class="p-2 rounded-lg bg-red-950/20 border border-red-900/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 transition-colors"
                  title="Hapus Template"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
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
          <div class="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden text-zinc-100">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
              <h3 class="text-lg font-bold flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="isEditMode ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'">
                  <Plus v-if="!isEditMode" class="w-4 h-4" />
                  <Pencil v-else class="w-4 h-4" />
                </div>
                {{ isEditMode ? 'Edit Template Surat' : 'Tambah Template Surat' }}
              </h3>
              <button @click="closeModal" class="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Body (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <!-- Basic Form Fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                    Nama Template Surat (Type)
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.surat_type"
                    type="text"
                    placeholder="Contoh: Surat Keterangan Siswa Aktif"
                    class="w-full h-10 px-3 border rounded-lg text-sm bg-zinc-850 border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-zinc-100"
                    :disabled="isEditMode"
                  />
                  <p class="text-[10px] text-zinc-500">Nama unik untuk mengidentifikasi template surat ini.</p>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                    Path File Template Word (.docx)
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.template_path"
                    type="text"
                    placeholder="Contoh: templates/surat_aktif.docx"
                    class="w-full h-10 px-3 border rounded-lg text-sm bg-zinc-850 border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-zinc-100"
                  />
                  <p class="text-[10px] text-zinc-500">Lokasi file template docx pada server / storage.</p>
                </div>

                <div class="space-y-1.5 md:col-span-2">
                  <label class="text-xs font-semibold text-zinc-300">Deskripsi</label>
                  <textarea
                    v-model="form.description"
                    rows="2"
                    placeholder="Tulis penjelasan singkat tentang kegunaan template surat ini..."
                    class="w-full px-3 py-2 border rounded-lg text-sm bg-zinc-850 border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-zinc-100 resize-none"
                  />
                </div>
              </div>

              <!-- Placeholders Management -->
              <div class="border-t border-zinc-800 pt-5">
                <div class="flex justify-between items-center mb-4">
                  <div>
                    <h4 class="text-sm font-bold text-zinc-200">Editor Placeholder Field</h4>
                    <p class="text-xs text-zinc-400 mt-0.5">Atur input field generator yang akan terhubung dengan variabel template Word</p>
                  </div>
                  <BaseButton
                    text="Tambah Field"
                    @click="addPlaceholderField"
                    class="!bg-zinc-800 hover:!bg-zinc-700 !text-zinc-200 !border-zinc-700 !py-1.5 !px-3 !text-xs"
                  >
                    <template #icon>
                      <Plus class="w-3.5 h-3.5" />
                    </template>
                  </BaseButton>
                </div>

                <div v-if="form.placeholders.length === 0" class="text-center py-8 rounded-lg border border-dashed border-zinc-800 text-zinc-500 text-xs">
                  Belum ada placeholder field. Klik 'Tambah Field' di atas.
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="(ph, index) in form.placeholders"
                    :key="index"
                    class="p-4 rounded-xl border border-zinc-800 bg-zinc-850/50 flex flex-col md:flex-row items-start md:items-center gap-3 relative group"
                  >
                    <!-- Drag/Ordering Handle -->
                    <div class="flex flex-row md:flex-col gap-1 items-center justify-center self-stretch shrink-0 pr-1 border-r border-zinc-800 md:border-r-0 md:border-b-0 md:border-zinc-800">
                      <button
                        type="button"
                        @click="movePlaceholderUp(index)"
                        :disabled="index === 0"
                        class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronUp class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        @click="movePlaceholderDown(index)"
                        :disabled="index === form.placeholders.length - 1"
                        class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronDown class="w-4 h-4" />
                      </button>
                    </div>

                    <!-- Inputs Grid -->
                    <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 w-full">
                      <!-- Field Key -->
                      <div class="space-y-1">
                        <label class="text-[10px] font-semibold text-zinc-400">Variabel / Key <span class="text-red-400">*</span></label>
                        <input
                          v-model="ph.key"
                          type="text"
                          placeholder="e.g. nama_siswa"
                          class="w-full h-8 px-2 border rounded-md text-xs bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <!-- Field Label -->
                      <div class="space-y-1">
                        <label class="text-[10px] font-semibold text-zinc-400">Label Input <span class="text-red-400">*</span></label>
                        <input
                          v-model="ph.label"
                          type="text"
                          placeholder="e.g. Nama Lengkap Siswa"
                          class="w-full h-8 px-2 border rounded-md text-xs bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <!-- Field Type -->
                      <div class="space-y-1">
                        <label class="text-[10px] font-semibold text-zinc-400">Tipe Data</label>
                        <select
                          v-model="ph.type"
                          class="w-full h-8 px-1.5 border rounded-md text-xs bg-zinc-900 border-zinc-700 text-zinc-100 focus:outline-none focus:border-blue-500"
                        >
                          <option v-for="t in fieldTypes" :key="t" :value="t">{{ t }}</option>
                        </select>
                      </div>

                      <!-- Value Default -->
                      <div class="space-y-1">
                        <label class="text-[10px] font-semibold text-zinc-400">Nilai Default (Opsional)</label>
                        <input
                          v-model="ph.default_value"
                          type="text"
                          placeholder="Nilai bawaan"
                          class="w-full h-8 px-2 border rounded-md text-xs bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <!-- Options (Select type only) -->
                      <div class="space-y-1">
                        <label class="text-[10px] font-semibold text-zinc-400">Opsi Select (Komparasi Koma)</label>
                        <input
                          v-model="ph.options"
                          type="text"
                          placeholder="Opsi1, Opsi2"
                          :disabled="ph.type !== 'select'"
                          class="w-full h-8 px-2 border rounded-md text-xs bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <!-- Config / Trash Button -->
                    <div class="flex items-center gap-2 self-stretch md:self-auto shrink-0 pt-2 md:pt-0 w-full md:w-auto border-t border-zinc-800/40 md:border-t-0 justify-between md:justify-start">
                      <!-- Required checkbox -->
                      <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          v-model="ph.isRequired"
                          class="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 focus:ring-offset-0"
                        />
                        Wajib
                      </label>

                      <button
                        type="button"
                        @click="removePlaceholderField(index)"
                        class="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 text-red-400 hover:text-red-300 transition-colors"
                        title="Hapus Field"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border rounded-lg text-sm font-medium bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Batal
              </button>
              <BaseButton
                :text="isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Template')"
                @click="submitForm"
                :disabled="isSaving || !isFormValid"
                class="!bg-blue-600 hover:!bg-blue-500 !text-white !border-blue-600"
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

<script setup>
import { ref, computed, onMounted } from "vue";
import { Search, X, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Save, Loader2, FileText } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { fetchFromSuratApiAll, postSuratTemplate, putSuratTemplate, deleteSuratTemplate } from "~/utils/api";

const emit = defineEmits(["refresh"]);

const { Notify, Confirm } = useNotiflix();

const isLoading = ref(false);
const isSaving = ref(false);
const templates = ref([]);
const searchQuery = ref("");

// Modal Form State
const showModal = ref(false);
const isEditMode = ref(false);
const editingSuratType = ref("");

const form = ref({
  surat_type: "",
  template_path: "",
  template_type: "docx",
  description: "",
  is_active: 1,
  placeholders: []
});

const fieldTypes = [
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
  "year-range"
];

// Fetch all templates including inactive ones
const loadTemplates = async () => {
  isLoading.value = true;
  try {
    const data = await fetchFromSuratApiAll(true);
    templates.value = data || [];
  } catch (err) {
    console.error("Gagal memuat semua template surat:", err);
    Notify?.failure?.(err.message || "Gagal memuat template surat");
  } finally {
    isLoading.value = false;
  }
};

const filteredTemplates = computed(() => {
  if (!searchQuery.value) return templates.value;
  const q = searchQuery.value.toLowerCase();
  return templates.value.filter(
    (t) =>
      t.surat_type?.toLowerCase().includes(q) ||
      t.template_path?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
  );
});

const isFormValid = computed(() => {
  if (!form.value.surat_type?.trim()) return false;
  if (!form.value.template_path?.trim()) return false;
  
  // Placeholders validation if any
  for (const ph of form.value.placeholders) {
    if (!ph.key?.trim() || !ph.label?.trim()) return false;
  }
  return true;
});

// Modal Actions
const openAddModal = () => {
  isEditMode.value = false;
  editingSuratType.value = "";
  form.value = {
    surat_type: "",
    template_path: "",
    template_type: "docx",
    description: "",
    is_active: 1,
    placeholders: []
  };
  showModal.value = true;
};

const openEditModal = (tpl) => {
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
      sort_order: ph.sort_order ?? 0
    }))
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

// Placeholders Editor actions
const addPlaceholderField = () => {
  form.value.placeholders.push({
    key: "",
    label: "",
    type: "text",
    options: "",
    default_value: "",
    isRequired: true,
    sort_order: form.value.placeholders.length
  });
};

const removePlaceholderField = (index) => {
  form.value.placeholders.splice(index, 1);
  // Re-index sort order
  form.value.placeholders.forEach((ph, idx) => {
    ph.sort_order = idx;
  });
};

const movePlaceholderUp = (index) => {
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

const movePlaceholderDown = (index) => {
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
const submitForm = async () => {
  if (!isFormValid.value) return;
  isSaving.value = true;

  // Map placeholders back to correct schema formats
  const mappedPlaceholders = form.value.placeholders.map((ph, idx) => {
    let optionsVal = null;
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
      sort_order: idx
    };
  });

  const payload = {
    surat_type: form.value.surat_type.trim(),
    template_path: form.value.template_path.trim(),
    template_type: form.value.template_type,
    description: form.value.description?.trim() || "",
    is_active: form.value.is_active,
    placeholders: mappedPlaceholders
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
    console.error("Gagal menyimpan template surat:", err);
    Notify?.failure?.(err.message || "Gagal menyimpan template surat");
  } finally {
    isSaving.value = false;
  }
};

// Soft delete toggle status
const toggleActiveStatus = async (tpl) => {
  const newStatus = tpl.is_active === 1 ? 0 : 1;
  const statusLabel = newStatus === 1 ? "diaktifkan" : "dinonaktifkan";
  
  try {
    // We only update is_active field
    await putSuratTemplate(tpl.surat_type, {
      is_active: newStatus
    });
    tpl.is_active = newStatus;
    Notify?.success?.("Template berhasil diperbarui");
    emit("refresh");
  } catch (err) {
    console.error("Gagal mengubah status template:", err);
    Notify?.failure?.(err.message || "Gagal mengubah status template");
  }
};

// Hard Delete Template
const confirmDelete = (tpl) => {
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
        console.error("Gagal menghapus template surat:", err);
        Notify?.failure?.(err.message || "Gagal menghapus template surat");
      }
    }
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

.bg-zinc-850 {
  background-color: #202024;
}
</style>
