<!-- src\views\documents\BulkSuratViews.vue -->
<template>
  <div class="page-layout">
    <!-- Breadcrumb Components -->

    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="mb-2 text-3xl text-zinc-100">Generator Surat Massal</h2>
      <p class="text-lg text-zinc-400">
        Upload file Excel dengan data untuk membuat banyak surat sekaligus
      </p>
    </div>

    <!-- Progress Steps - Simplified Version -->
    <div class="flex justify-center mb-8 px-8">
      <div class="flex flex-1 max-w-2xl">
        <div
          v-for="(step, index) in progressSteps"
          :key="step.id"
          class="flex flex-col items-center flex-1 relative"
          :class="getStepTextColor(index + 1)"
        >
          <!-- Step Circle -->
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 relative z-10"
            :class="getStepCircleColor(index + 1)"
          >
            {{ step.id }}
          </div>

          <!-- Step Label -->
          <span class="text-sm text-zinc-300">
            {{ step.label }}
          </span>

          <!-- Connection Line (except for last step) -->
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
        <!-- Navigation Component -->
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
          <div
            class="rounded-xl shadow-sm border overflow-hidden bg-zinc-800 border-zinc-700"
          >
            <div class="p-6">
              <h3 class="text-lg font-semibold mb-4 text-zinc-100">
                Detail Surat
              </h3>

              <div v-if="!selectedSurat" class="text-center py-8">
                <div class="text-4xl mb-3">ðŸ“‹</div>
                <p class="text-sm text-zinc-400">
                  Pilih jenis surat untuk melihat detail field
                </p>
              </div>

              <div v-if="selectedSurat" class="space-y-4">
                <div class="p-3 border rounded-lg bg-zinc-700 border-zinc-600">
                  <h4 class="font-medium text-zinc-100">
                    {{ selectedSurat }}
                  </h4>
                  <p class="text-sm mt-1 text-zinc-300">
                    {{ suratData[selectedSurat].placeholder.length }} field yang
                    diperlukan
                  </p>
                </div>

                <div>
                  <h5 class="font-medium mb-2 text-zinc-100">
                    Field yang diperlukan:
                  </h5>
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    <div
                      v-for="field in suratData[selectedSurat].placeholder"
                      :key="field.key"
                      class="flex items-center justify-between p-2 rounded border bg-zinc-700 border-zinc-600"
                    >
                      <div class="flex-1">
                        <div class="text-sm font-medium text-zinc-100">
                          {{ field.label }}
                        </div>
                        <div class="text-xs text-zinc-400">
                          {{ field.key }}
                        </div>
                      </div>
                      <span
                        class="text-xs px-2 py-1 rounded bg-zinc-600 text-zinc-300"
                      >
                        {{ field.type || "text" }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="pt-4 border-t border-zinc-600">
                  <BaseButton
                    text="Lanjut ke Upload Data"
                    @click="nextStep"
                    class="w-full"
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
      <div
        class="rounded-xl p-8 shadow-md mb-4 bg-zinc-800 border border-zinc-700"
      >
        <h4 class="text-xl font-semibold mb-6 text-zinc-100">
          Upload File Excel
        </h4>

        <!-- Template Download -->
        <div class="my-6 p-4 border rounded-lg border-zinc-600 bg-zinc-700">
          <h3 class="mb-4 text-zinc-300">
            Download template Excel dengan kolom yang sesuai untuk
            {{ selectedSurat }}
          </h3>
          <BaseButton
            text="Download Template"
            @click="downloadTemplate(selectedSurat, suratData)"
          >
            <template #icon>
              <Download />
            </template>
          </BaseButton>
        </div>

        <!-- File Upload -->
        <div
          :class="['my-6 p-4 border rounded-lg', 'border-zinc-600 bg-zinc-700']"
        >
          <h4 class="font-medium mb-2 text-zinc-100">Upload Data Excel</h4>
          <div
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 mt-4',
              isDragOver
                ? 'border-zinc-400 bg-zinc-600'
                : 'border-zinc-500 bg-zinc-800',
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
              <div class="text-5xl">ðŸ“</div>
              <p class="text-zinc-300">
                Drag & drop file Excel atau klik untuk browse
              </p>

              <div class="flex justify-center">
                <BaseButton text="Pilih File" @click="$refs.fileInput.click()">
                  <template #icon>
                    <Upload />
                  </template>
                </BaseButton>
              </div>
            </div>

            <div v-else class="flex items-center gap-4">
              <div class="text-3xl">ðŸ“„</div>
              <div class="flex-1 text-left">
                <div class="font-semibold text-zinc-100">
                  {{ uploadedFile.name }}
                </div>
                <span class="text-sm text-zinc-400">{{
                  formatFileSize(uploadedFile.size)
                }}</span>
              </div>
              <button
                :class="[
                  'px-4 py-2 text-sm rounded-md transition-colors',
                  'bg-red-600 text-white hover:bg-red-700',
                ]"
                @click="removeFile"
              >
                âœ•
              </button>
            </div>
          </div>
        </div>

        <!-- Excel Preview -->
        <div v-if="excelData.length > 0" class="mt-6">
          <h4 class="font-medium mb-4 text-zinc-100">
            ðŸ‘€ Preview Data ({{ excelData.length }} baris)
          </h4>
          <div
            :class="[
              'max-h-96 overflow-auto my-4 border rounded-lg',
              'border-zinc-600',
            ]"
          >
            <table class="w-full border-collapse">
              <thead>
                <tr>
                  <th
                    v-for="header in excelHeaders"
                    :key="header"
                    :class="[
                      'px-3 py-3 text-left border-b font-semibold sticky top-0',
                      'border-zinc-600 bg-zinc-700 text-zinc-100',
                    ]"
                  >
                    {{ header }}
                    <span
                      v-if="!isValidField(header, selectedSurat, suratData)"
                      class="ml-2"
                      title="Field tidak ditemukan dalam template"
                    >
                      âš ï¸
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in previewData" :key="index">
                  <td
                    v-for="header in excelHeaders"
                    :key="header"
                    :class="[
                      'px-3 py-3 text-left border-b',
                      'border-zinc-600 text-zinc-200',
                    ]"
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
            :class="[
              'mt-4 p-4 border rounded-lg',
              'bg-red-900 border-red-700 text-red-200',
            ]"
          >
            <h5 class="font-medium mb-2">âŒ Kesalahan Validasi:</h5>
            <ul class="mt-2 ml-4 list-disc">
              <li v-for="error in validationErrors" :key="error">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>

        <div class="flex gap-4 justify-center mt-8">
          <BaseButton text="Kembali" @click="previousStep" />
          <BaseButton
            text="Lanjut ke Generate"
            :disabled="!canProceed"
            @click="nextStep"
            class="disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>

    <!-- Step 3: Generate -->
    <div v-if="currentStep === 3" class="mt-8">
      <div
        :class="[
          'rounded-xl p-8 shadow-md mb-4',
          'bg-zinc-800 border border-zinc-700',
        ]"
      >
        <h3 class="text-xl font-semibold mb-6 text-zinc-100">
          Generate Dokumen
        </h3>

        <div class="p-4 rounded-lg mb-6 bg-zinc-700">
          <div class="mb-2 text-zinc-200">
            <strong>Jenis Surat:</strong> {{ selectedSurat }}
          </div>
          <div class="mb-2 text-zinc-200">
            <strong>Jumlah Dokumen:</strong> {{ excelData.length }}
          </div>
          <div class="mb-2 text-zinc-200">
            <strong>Output:</strong>
            {{ excelData.length > 1 ? "File ZIP" : "File DOCX" }}
          </div>
        </div>

        <!-- Generation Progress -->
        <div v-if="isGenerating" class="my-6">
          <div
            :class="['w-full h-2 rounded overflow-hidden mb-2', 'bg-zinc-600']"
          >
            <div
              :class="['h-full transition-all duration-300', 'bg-zinc-400']"
              :style="{ width: `${generationProgress}%` }"
            ></div>
          </div>
          <p class="text-zinc-300">{{ generationStatus }}</p>
        </div>

        <!-- Generation Results -->
        <div v-if="generationComplete" class="text-center my-6">
          <div
            :class="[
              'p-6 border rounded-lg',
              'bg-green-900 border-green-700 text-green-200',
            ]"
          >
            <div class="text-5xl mb-4">âœ…</div>
            <h4 class="text-lg font-semibold mb-2">
              Berhasil Generate {{ generatedCount }} Dokumen!
            </h4>
            <p v-if="excelData.length > 1">
              File ZIP telah otomatis didownload
            </p>
            <p v-else>File DOCX telah otomatis didownload</p>
          </div>
        </div>

        <div class="flex gap-4 justify-center mt-8">
          <BaseButton
            text="Kembali"
            @click="previousStep"
            :disabled="isGenerating"
          />
          <button
            :class="[
              'px-8 py-4 text-lg rounded-md disabled:opacity-60 disabled:cursor-not-allowed transition-colors',
              'bg-zinc-600 text-zinc-100 hover:bg-zinc-500',
            ]"
            @click="handleStartGeneration"
            :disabled="isGenerating || generationComplete"
          >
            <span v-if="!isGenerating">ðŸš€ Generate Semua Dokumen</span>
            <span v-else>â³ Generating...</span>
          </button>
          <BaseButton
            v-if="generationComplete"
            text="Generate Lagi"
            @click="resetProcess"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Download, Upload } from "lucide-vue-next";

import { ref, computed, onMounted } from "vue";
import { useTableData } from "~/composables/data/useTableData";
import { useBulkDocumentGenerator } from "~/composables/utils/useDocumentGenerator";
import { useExcelProcessor } from "~/composables/data/useExcel";

import SuratNavigation from "~/components/document/SuratNavigation.vue";
import BaseButton from "~/components/ui/BaseButton.vue";

// Composables
const { cardData: suratData, loadData } = useTableData();

// Bulk Document Generator Composable
const {
  isGenerating,
  generationProgress,
  generationStatus,
  generationComplete,
  generatedCount,
  startGeneration,
  resetGeneration,
} = useBulkDocumentGenerator();

// Excel Processor Composable
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

// Helper methods for styling
const getStepTextColor = (stepNumber) => {
  const isActive = currentStep.value >= stepNumber;
  const isCompleted = currentStep.value > stepNumber;

  if (isCompleted) {
    return "text-green-400";
  }
  if (isActive) {
    return "text-zinc-400";
  }
  return "";
};

const getStepCircleColor = (stepNumber) => {
  const isActive = currentStep.value >= stepNumber;
  const isCompleted = currentStep.value > stepNumber;

  if (isCompleted) {
    return "bg-green-600 text-white";
  }
  if (isActive) {
    return "bg-zinc-600 text-zinc-100";
  }
  return "bg-zinc-700 text-zinc-400";
};

const getStepLineColor = (stepNumber) => {
  const isCompleted = currentStep.value > stepNumber;

  if (isCompleted) {
    return "bg-green-500";
  }
  return "bg-zinc-600";
};

const route = useRoute();
const router = useRouter();

// Computed step state linked to route query parameter 'step'
const currentStep = computed(() => {
  const step = parseInt(route.query.step);
  return step >= 1 && step <= 3 ? step : 1;
});

// Local reactive state
const selectedSurat = ref("");
const searchQuery = ref("");

// Computed properties
const filteredSuratConfigs = computed(() => {
  if (!searchQuery.value) {
    return suratData.value || {};
  }

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

// Methods
const selectSurat = (suratName) => {
  selectedSurat.value = suratName;
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
    await startGeneration(
      selectedSurat.value,
      suratData.value,
      excelData.value,
    );
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

// Lifecycle
onMounted(() => {
  loadData("surat");
});
</script>
