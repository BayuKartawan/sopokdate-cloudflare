<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeModal">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" />

        <!-- Modal Container -->
        <div
          class="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all"
          :style="{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-primary)',
          }">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b shrink-0" :style="{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }">
            <div class="flex items-center gap-3">
              <slot name="icon">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet class="w-6 h-6" />
                </div>
              </slot>
              <div>
                <h3 class="text-lg font-semibold" :style="{ color: 'var(--text-primary)' }">
                  {{ title }}
                </h3>
                <p v-if="subtitle" class="text-xs text-zinc-400">
                  {{ subtitle }}
                </p>
              </div>
            </div>
            <button type="button" @click="closeModal"
              class="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-zinc-400 hover:text-zinc-200"
              :disabled="isParsing || isUploading">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Step 1 & 2: Download Template & Dropzone -->
            <div v-if="!hasParsedData && !isParsing && !isUploading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Left: Download Section -->
              <div class="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between">
                <div>
                  <h4 class="font-medium text-sm text-zinc-200 mb-2 flex items-center gap-2">
                    <Download class="w-4 h-4 text-emerald-400" />
                    1. Unduh Template Excel
                  </h4>
                  <p class="text-xs text-zinc-400 leading-relaxed mb-4">
                    {{ downloadDescription }}
                  </p>
                </div>
                <button type="button" @click="$emit('download-template')"
                  class="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors border border-zinc-700">
                  <Download class="w-4 h-4" />
                  {{ downloadButtonText }}
                </button>
              </div>

              <!-- Right: Upload Section -->
              <div
                class="p-5 rounded-xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-900/20 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px]"
                @click="triggerFileSelect" @dragover.prevent @drop.prevent="handleFileDrop">
                <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleFileSelect" />
                <UploadCloud class="w-12 h-12 text-zinc-500 mb-3" />
                <h4 class="font-medium text-sm text-zinc-200 mb-1">
                  2. Pilih atau Drop File Excel
                </h4>
                <p class="text-xs text-zinc-500 max-w-[200px]">
                  Klik untuk menelusuri atau seret file Excel ke sini
                </p>
              </div>
            </div>

            <!-- Loading Spinner (File Parsing) -->
            <div v-if="isParsing" class="flex flex-col items-center justify-center py-12">
              <RefreshCw class="w-10 h-10 text-emerald-400 animate-spin mb-4" />
              <p class="text-sm text-zinc-300 font-medium">Membaca file Excel...</p>
            </div>

            <!-- Upload Progress -->
            <div v-if="isUploading" class="space-y-4 py-8">
              <div class="flex items-center justify-between text-sm">
                <span class="text-zinc-400">Memproses upload...</span>
                <span class="font-medium text-emerald-400">{{ uploadProgress }}% ({{ uploadIndex }}/{{ totalToUpload
                  }})</span>
              </div>
              <div class="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full transition-all duration-300" :style="{ width: `${uploadProgress}%` }">
                </div>
              </div>
              <p class="text-xs text-zinc-500 text-center">
                Jangan tutup modal ini hingga seluruh baris selesai diproses.
              </p>
            </div>

            <!-- Step 3: Preview Data & Verification Summary -->
            <div v-if="hasParsedData && !isParsing && !isUploading" class="space-y-6">
              <!-- Summary Metrics Cards -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <p class="text-[10px] uppercase text-zinc-500 font-bold">Total Baris</p>
                  <p class="text-2xl font-bold text-zinc-200">{{ totalRows }}</p>
                </div>
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p class="text-[10px] uppercase text-emerald-400 font-bold">
                    {{ summaryLabels.newLabel }}
                  </p>
                  <p class="text-2xl font-bold text-emerald-400">{{ summary.newCount }}</p>
                </div>
                <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p class="text-[10px] uppercase text-blue-400 font-bold">
                    {{ summaryLabels.updateLabel }}
                  </p>
                  <p class="text-2xl font-bold text-blue-400">{{ summary.updateCount }}</p>
                </div>
                <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p class="text-[10px] uppercase text-red-400 font-bold">
                    {{ summaryLabels.errorLabel }}
                  </p>
                  <p class="text-2xl font-bold text-red-400">{{ summary.errorCount }}</p>
                </div>
              </div>

              <!-- Warning Alert -->
              <div v-if="summary.updateCount > 0 && (warningText || $slots['warning-text'])"
                class="p-4 rounded-xl border flex items-start gap-3 bg-blue-500/10 border-blue-500/20 text-blue-300 text-xs">
                <AlertTriangle class="w-5 h-5 shrink-0 text-blue-400" />
                <div>
                  <slot name="warning-text">
                    {{ warningText }}
                  </slot>
                </div>
              </div>

              <!-- Table Preview -->
              <div class="border border-zinc-800 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-zinc-900 text-zinc-400 sticky top-0 border-b border-zinc-800">
                    <slot name="table-header" />
                  </thead>
                  <tbody class="divide-y divide-zinc-800/50 bg-zinc-950/20">
                    <slot name="table-body" />
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-6 py-4 border-t shrink-0" :style="{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }">
            <!-- Left: Reset file -->
            <button v-if="hasParsedData && !isUploading && !isParsing" type="button" @click="handleReset"
              class="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5">
              <RefreshCw class="w-3.5 h-3.5" />
              Reset & Pilih File Lain
            </button>
            <div v-else></div>

            <!-- Right Actions -->
            <div class="flex items-center gap-3">
              <button type="button" @click="closeModal"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-zinc-800 text-zinc-300"
                :disabled="isUploading || isParsing">
                Batal
              </button>
              <button v-if="hasParsedData && !isUploading && !isParsing" type="button" @click="$emit('submit')"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="submitDisabled">
                <slot name="submit-icon">
                  <component :is="submitIconComponent" class="w-4 h-4" />
                </slot>
                {{ submitButtonText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from "vue";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  X,
  AlertTriangle,
  RefreshCw,
  Play,
  Check,
} from "lucide-vue-next";

export interface SummaryLabels {
  newLabel?: string;
  updateLabel?: string;
  errorLabel?: string;
}

export interface SummaryCounts {
  newCount: number;
  updateCount: number;
  errorCount: number;
}

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  downloadDescription: {
    type: String,
    default:
      "Gunakan template Excel standar yang disediakan untuk memastikan format data yang di-upload sudah sesuai dengan sistem database.",
  },
  downloadButtonText: {
    type: String,
    default: "Unduh Template Excel",
  },
  isParsing: {
    type: Boolean,
    default: false,
  },
  isUploading: {
    type: Boolean,
    default: false,
  },
  uploadProgress: {
    type: Number,
    default: 0,
  },
  uploadIndex: {
    type: Number,
    default: 0,
  },
  totalToUpload: {
    type: Number,
    default: 0,
  },
  hasParsedData: {
    type: Boolean,
    default: false,
  },
  totalRows: {
    type: Number,
    default: 0,
  },
  summary: {
    type: Object as PropType<SummaryCounts>,
    default: () => ({ newCount: 0, updateCount: 0, errorCount: 0 }),
  },
  summaryLabels: {
    type: Object as PropType<SummaryLabels>,
    default: () => ({
      newLabel: "Data Baru (Insert)",
      updateLabel: "Update Data",
      errorLabel: "Ditolak / Error",
    }),
  },
  warningText: {
    type: String,
    default: "",
  },
  submitButtonText: {
    type: String,
    default: "Proses Upload",
  },
  submitIcon: {
    type: String,
    default: "play", // 'play' | 'check'
  },
  submitDisabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "download-template"): void;
  (e: "file-selected", file: File): void;
  (e: "reset"): void;
  (e: "submit"): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const submitIconComponent = computed(() => {
  return props.submitIcon === "check" ? Check : Play;
});

const triggerFileSelect = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit("file-selected", file);
  }
};

const handleFileDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    emit("file-selected", file);
  }
};

const handleReset = () => {
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  emit("reset");
};

const closeModal = () => {
  if (!props.isUploading && !props.isParsing) {
    handleReset();
    emit("close");
  }
};
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
