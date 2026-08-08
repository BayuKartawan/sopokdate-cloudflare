<!-- src\views\documents\BulkSuratViews.vue -->
<template>
  <div class="page-layout">
    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="mb-2 text-3xl theme-text-heading">Generator Surat Massal</h2>
      <p class="text-lg theme-text-muted">
        Upload file Excel dengan data untuk membuat banyak surat sekaligus
      </p>
    </div>

    <!-- Progress Steps -->
    <div class="flex justify-center mb-8 px-8">
      <div class="flex flex-1 max-w-2xl">
        <div
          v-for="(step, index) in progressSteps"
          :key="step.id"
          class="flex flex-col items-center flex-1 relative"
          :class="getStepTextColor(index + 1)"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 relative z-10"
            :class="getStepCircleColor(index + 1)"
          >
            {{ step.id }}
          </div>
          <span class="text-sm theme-text-secondary">{{ step.label }}</span>
          <div
            v-if="index < progressSteps.length - 1"
            class="absolute top-4 left-1/2 w-full h-0.5 -z-10"
            :class="getStepLineColor(index + 1)"
          ></div>
        </div>
      </div>
    </div>

    <!-- Step 1: Pilih Jenis Surat -->
    <div v-if="currentStep === 1" class="mt-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <SuratNavigation
            :suratConfigs="suratData"
            :filteredSuratConfigs="filteredSuratConfigs"
            :selectedSuratType="selectedSurat"
            :searchQuery="searchQuery"
            @select-surat-type="selectSurat"
            @update:searchQuery="searchQuery = $event"
            @clear-search="searchQuery = ''"
          />
        </div>

        <!-- Field Preview Panel -->
        <div class="lg:col-span-1">
          <div class="rounded-xl shadow-sm border overflow-hidden theme-bg-secondary theme-border">
            <div class="p-6">
              <h3 class="text-lg font-semibold mb-4 theme-text-heading">Detail Surat</h3>

              <div v-if="!selectedSurat" class="text-center py-8">
                <ClipboardList class="w-12 h-12 mx-auto mb-3 theme-text-faint" />
                <p class="text-sm theme-text-muted">
                  Pilih jenis surat untuk melihat detail field
                </p>
              </div>

              <div v-if="selectedSurat" class="space-y-4">
                <div class="p-3 border rounded-lg theme-bg-tertiary theme-border">
                  <h4 class="font-medium theme-text">{{ selectedSurat }}</h4>
                  <p class="text-sm mt-1 theme-text-secondary">
                    {{ suratData[selectedSurat].placeholder.length }} field yang diperlukan
                  </p>
                </div>

                <div>
                  <h5 class="font-medium mb-2 theme-text">Field yang diperlukan:</h5>
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    <div
                      v-for="field in suratData[selectedSurat].placeholder"
                      :key="field.key"
                      class="flex items-center justify-between p-2 rounded border theme-bg-tertiary theme-border"
                    >
                      <div class="flex-1">
                        <div class="text-sm font-medium theme-text">{{ field.label }}</div>
                        <div class="text-xs theme-text-muted">{{ field.key }}</div>
                      </div>
                      <span class="text-xs px-2 py-1 rounded border theme-bg theme-border theme-text-muted">
                        {{ field.type || "text" }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="pt-4 border-t theme-border">
                  <BaseButton
                    text="Lanjut ke Upload Data"
                    title="Lanjut ke langkah upload data"
                    @click="nextStep"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Upload Excel -->
    <div v-if="currentStep === 2" class="mt-8">
      <div class="rounded-xl p-8 shadow-md mb-4 theme-bg-secondary border theme-border">
        <h4 class="text-xl font-semibold mb-6 theme-text-heading">Upload File Excel</h4>

        <!-- Template Download -->
        <div class="my-6 p-4 border rounded-lg theme-bg-tertiary theme-border">
          <h3 class="mb-4 theme-text-secondary">
            Download template Excel dengan kolom yang sesuai untuk {{ selectedSurat }}
          </h3>
          <BaseButton
            text="Download Template"
            title="Download template Excel"
            @click="downloadTemplate(selectedSurat, suratData)"
          >
            <template #icon><Download class="w-4 h-4" /></template>
          </BaseButton>
        </div>

        <!-- File Upload -->
        <div class="my-6 p-4 border rounded-lg theme-bg-tertiary theme-border">
          <h4 class="font-medium mb-2 theme-text">Upload Data Excel</h4>
          <div
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 mt-4',
              isDragOver
                ? 'border-blue-400 bg-blue-500/10'
                : 'theme-border theme-bg',
            ]"
            @drop="handleDrop"
            @dragover.prevent="isDragOver = true"
            @dragleave="isDragOver = false"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,.xls"
              @change="handleFileSelect"
              class="hidden"
            />

              <div v-if="!uploadedFile" class="space-y-4 text-center">
              <FolderOpen class="w-12 h-12 mx-auto theme-text-faint" />
              <p class="theme-text-secondary">
                Drag &amp; drop file Excel atau klik untuk browse
              </p>
              <div class="flex justify-center">
                <BaseButton text="Pilih File" title="Pilih file Excel" @click="triggerFileInput">
                  <template #icon><Upload class="w-4 h-4" /></template>
                </BaseButton>
              </div>
            </div>

            <div v-else class="flex items-center gap-4">
              <FileText class="w-8 h-8 theme-text-muted flex-shrink-0" />
              <div class="flex-1 text-left">
                <div class="font-semibold theme-text">{{ uploadedFile.name }}</div>
                <span class="text-sm theme-text-muted">{{ formatFileSize(uploadedFile.size) }}</span>
              </div>
              <BaseButton
                icon-only
                size="sm"
                title="Hapus file ini"
                @click="removeFile"
              >
                <template #icon><XCircle class="w-4 h-4 text-red-500" /></template>
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Excel Preview -->
        <div v-if="excelData.length > 0" class="mt-6">
          <h4 class="font-medium mb-4 theme-text flex items-center gap-2">
            <Eye class="w-4 h-4" />
            Preview Data ({{ excelData.length }} baris)
          </h4>
          <div class="max-h-96 overflow-auto my-4 border rounded-lg theme-border">
            <table class="w-full border-collapse">
              <thead>
                <tr>
                  <th
                    v-for="header in excelHeaders"
                    :key="header"
                    class="px-3 py-3 text-left border-b font-semibold sticky top-0 theme-border theme-bg-secondary theme-text"
                  >
                    {{ header }}
                    <span
                      v-if="!isValidField(header, selectedSurat, suratData)"
                      class="ml-1 inline-flex"
                      title="Field tidak ditemukan dalam template"
                    >
                      <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in previewData" :key="index">
                  <td
                    v-for="header in excelHeaders"
                    :key="header"
                    class="px-3 py-3 text-left border-b theme-border theme-text-secondary"
                  >
                    {{ row[header] || "-" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Validation Results -->
          <div
            v-if="validationErrors.length > 0"
            class="mt-4 p-4 border rounded-lg bg-red-500/10 border-red-500/30 text-red-600"
          >
            <h5 class="font-medium mb-2 flex items-center gap-1.5">
              <XCircle class="w-4 h-4 text-red-500" />
              Kesalahan Validasi:
            </h5>
            <ul class="mt-2 ml-4 list-disc">
              <li v-for="error in validationErrors" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>

        <div class="flex gap-4 justify-center mt-8">
          <BaseButton text="Kembali" title="Kembali ke pilih jenis surat" @click="previousStep" />
          <BaseButton
            text="Lanjut ke Generate"
            title="Lanjut ke langkah generate dokumen"
            :disabled="!canProceed"
            @click="nextStep"
          />
        </div>
      </div>
    </div>

    <!-- Step 3: Generate -->
    <div v-if="currentStep === 3" class="mt-8">
      <div class="rounded-xl p-8 shadow-md mb-4 theme-bg-secondary border theme-border">
        <h3 class="text-xl font-semibold mb-6 theme-text-heading">Generate Dokumen</h3>

        <div class="p-4 rounded-lg mb-6 theme-bg-tertiary">
          <div class="mb-2 theme-text"><strong>Jenis Surat:</strong> {{ selectedSurat }}</div>
          <div class="mb-2 theme-text"><strong>Jumlah Dokumen:</strong> {{ excelData.length }}</div>
          <div class="mb-2 theme-text">
            <strong>Output:</strong>
            {{ excelData.length > 1 ? "File ZIP" : "File DOCX" }}
          </div>
        </div>

        <!-- Generation Progress -->
        <div v-if="isGenerating" class="my-6">
          <div class="w-full h-2 rounded overflow-hidden mb-2 theme-bg-tertiary">
            <div
              class="h-full transition-all duration-300 bg-blue-500"
              :style="{ width: `${generationProgress}%` }"
            ></div>
          </div>
          <p class="theme-text-secondary">{{ generationStatus }}</p>
        </div>

        <!-- Generation Results -->
        <div v-if="generationComplete" class="text-center my-6">
          <div class="p-6 border rounded-lg bg-emerald-500/10 border-emerald-500/30 text-emerald-600">
            <CheckCircle2 class="w-12 h-12 mx-auto mb-4" />
            <h4 class="text-lg font-semibold mb-2">
              Berhasil Generate {{ generatedCount }} Dokumen!
            </h4>
            <p v-if="excelData.length > 1">File ZIP telah otomatis didownload</p>
            <p v-else>File DOCX telah otomatis didownload</p>
          </div>
        </div>

        <div class="flex gap-4 justify-center mt-8">
          <BaseButton text="Kembali" title="Kembali ke upload data" @click="previousStep" :disabled="isGenerating" />
          <BaseButton
            text="Generate Semua Dokumen"
            title="Mulai generate seluruh dokumen"
            @click="handleStartGeneration"
            :disabled="isGenerating || generationComplete"
            :loading="isGenerating"
          >
            <template #icon>
              <Rocket class="w-4 h-4" />
            </template>
          </BaseButton>
          <BaseButton
            v-if="generationComplete"
            text="Generate Lagi"
            title="Ulangi proses generate"
            @click="resetProcess"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Download, Upload, ClipboardList, FolderOpen, FileText, Eye, AlertTriangle, XCircle, CheckCircle2, Rocket } from "lucide-vue-next";

import { ref, computed, onMounted } from "vue";
import { useTableData } from "~/composables/data/useTableData";
import { useBulkDocumentGenerator } from "~/composables/utils/useDocumentGenerator";
import { useExcelProcessor } from "~/composables/data/useExcel";

import SuratNavigation from "~/components/document/SuratNavigation.vue";
import BaseButton from "~/components/ui/BaseButton.vue";

const { cardData: suratData, loadData } = useTableData();

const {
  isGenerating,
  generationProgress,
  generationStatus,
  generationComplete,
  generatedCount,
  startGeneration,
  resetGeneration,
} = useBulkDocumentGenerator();

const {
  uploadedFile,
  excelData,
  excelHeaders,
  isDragOver,
  previewData,
  removeFile,
  downloadTemplate,
  getValidationErrors,
  isValidField,
  formatFileSize,
  handleDrop,
  handleFileSelect,
} = useExcelProcessor();

const progressSteps = [
  { id: 1, label: "Pilih Jenis Surat" },
  { id: 2, label: "Upload Data Excel" },
  { id: 3, label: "Generate Dokumen" },
];

const getStepTextColor = (stepNumber) => {
  const isCompleted = currentStep.value > stepNumber;
  if (isCompleted) return "text-emerald-600";
  return "theme-text";
};

const getStepCircleColor = (stepNumber) => {
  const isActive = currentStep.value >= stepNumber;
  const isCompleted = currentStep.value > stepNumber;
  if (isCompleted) return "bg-emerald-500 text-white";
  if (isActive) return "bg-blue-500 text-white";
  return "theme-bg-tertiary theme-text-muted";
};

const getStepLineColor = (stepNumber) => {
  const isCompleted = currentStep.value > stepNumber;
  if (isCompleted) return "bg-emerald-500";
  return "bg-[var(--bg-tertiary)]";
};

const route = useRoute();
const router = useRouter();

const currentStep = computed(() => {
  const step = parseInt(route.query.step);
  return step >= 1 && step <= 3 ? step : 1;
});

const selectedSurat = ref("");
const searchQuery = ref("");

const filteredSuratConfigs = computed(() => {
  if (!searchQuery.value) return suratData.value || {};
  const filtered = {};
  Object.keys(suratData.value || {}).forEach((key) => {
    if (key.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      filtered[key] = suratData.value[key];
    }
  });
  return filtered;
});

const validationErrors = computed(() => {
  return getValidationErrors(selectedSurat.value, suratData.value);
});

const canProceed = computed(() => {
  return excelData.value.length > 0 && validationErrors.value.length === 0;
});

const selectSurat = (suratName) => {
  selectedSurat.value = suratName;
};

const fileInput = ref(null);
const triggerFileInput = () => {
  fileInput.value?.click();
};

const nextStep = () => {
  if (currentStep.value < 3) {
    router.push({ query: { ...route.query, step: currentStep.value + 1 } });
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    router.push({ query: { ...route.query, step: currentStep.value - 1 } });
  }
};

const handleStartGeneration = async () => {
  try {
    await startGeneration(selectedSurat.value, suratData.value, excelData.value);
  } catch (error) {
    alert(error.message);
  }
};

const resetProcess = () => {
  selectedSurat.value = "";
  searchQuery.value = "";
  removeFile();
  resetGeneration();
  router.push({ query: { ...route.query, step: 1 } });
};

onMounted(() => {
  loadData("surat");
});
</script>
