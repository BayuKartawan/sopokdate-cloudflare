<!-- \src\components\FormUniversal.vue -->
<template>
  <div class="space-y-6">
    <!-- Form Fields Section -->
    <div v-if="placeholders.length" class="space-y-4">
      <!-- Form Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <FilePenLine class="w-4 h-4 text-green-400" />
          <h3 class="text-sm font-medium text-zinc-200">
            Data {{ selectedJenis }}
          </h3>
        </div>
        <span :class="fieldCounterClass">
          {{ placeholders.length }}
        </span>
      </div>

      <!-- Form Fields -->
      <div class="grid gap-3">
        <div v-for="field in placeholders" :key="field.key" class="space-y-1.5">
          <div class="flex items-start justify-between">
            <label
              :for="field.key"
              class="text-xs font-medium flex items-center gap-0.5 text-zinc-300"
            >
              <span>{{ field.label }}</span>
              <span class="text-red-500 text-[10px]">*</span>
            </label>

            <!-- Character count for text fields -->
            <span
              v-if="shouldShowCharCount(field)"
              class="text-[10px] text-zinc-500"
            >
              {{ formData[field.key]?.length || 0 }}
            </span>

            <!-- Time format preview -->
            <span
              v-if="field.type === 'time' && formData[field.key]"
              class="text-[10px] font-medium text-blue-400"
            >
              {{ formatTimePreview(formData[field.key]) }}
            </span>

            <!-- No Surat preview -->
            <span
              v-if="field.type === 'no-surat' && formData[field.key]"
              class="text-[10px] font-medium text-blue-400"
            >
              {{ formatNoSuratPreview(formData[field.key]) }}
            </span>
          </div>

          <!-- Regular Select Input (from API) -->
          <select
            v-if="field.type === 'select'"
            :id="field.key"
            v-model="formData[field.key]"
            :class="getInputClass(field)"
          >
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option
              v-for="option in field.options"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>

          <!-- Gender Select (Hardcoded) -->
          <select
            v-else-if="field.type === 'gender'"
            :id="field.key"
            v-model="formData[field.key]"
            :class="getInputClass(field)"
          >
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option
              v-for="option in genderOptions"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>

          <!-- Hari Select (Hardcoded) -->
          <select
            v-else-if="field.type === 'hari'"
            :id="field.key"
            v-model="formData[field.key]"
            :class="getInputClass(field)"
          >
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option v-for="option in hariOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <!-- Semester Select (Hardcoded) -->
          <select
            v-else-if="field.type === 'semester'"
            :id="field.key"
            v-model="formData[field.key]"
            :class="getInputClass(field)"
          >
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option
              v-for="option in semesterOptions"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>

          <!-- Class Select (Hardcoded) -->
          <select
            v-else-if="field.type === 'class'"
            :id="field.key"
            v-model="formData[field.key]"
            :class="getInputClass(field)"
          >
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option
              v-for="option in classOptions"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>

          <!-- Month Select (Hardcoded) -->
          <select
            v-else-if="field.type === 'month'"
            :id="field.key"
            v-model="formData[field.key]"
            :class="getInputClass(field)"
          >
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option
              v-for="option in monthOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <!-- Academic Year Select (Hardcoded) -->
          <select
            v-else-if="field.type === 'academic-year'"
            :id="field.key"
            v-model="formData[field.key]"
            :class="getInputClass(field)"
          >
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option
              v-for="year in generateAcademicYears()"
              :key="year"
              :value="year"
            >
              {{ year }}
            </option>
          </select>

          <!-- Year Range Select (Hardcoded) -->
          <select
            v-else-if="field.type === 'year-range'"
            :id="field.key"
            v-model="formData[field.key]"
            :class="getInputClass(field)"
          >
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option
              v-for="year in generateYearRange()"
              :key="year"
              :value="year"
            >
              {{ year }}
            </option>
          </select>

          <!-- No Surat Input (Special: 3 digit number with auto-format preview) -->
          <div v-else-if="field.type === 'no-surat'" class="relative">
            <input
              :id="field.key"
              type="text"
              v-model="formData[field.key]"
              placeholder="001"
              maxlength="3"
              :class="getInputClass(field)"
              @input="handleNoSuratInput(field.key, $event)"
            />
            <span
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none text-zinc-500"
            >
              /MI-B/087/...
            </span>
          </div>

          <!-- Time Input -->
          <input
            v-else-if="field.type === 'time'"
            :id="field.key"
            type="time"
            v-model="formData[field.key]"
            :class="getInputClass(field)"
          />

          <!-- Regular Input -->
          <input
            v-else
            :id="field.key"
            :type="field.type"
            v-model="formData[field.key]"
            :placeholder="getPlaceholderText(field)"
            :class="getInputClass(field)"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-700"
      >
        <div class="flex-1">
          <BaseButton
            :text="generateButtonText"
            @click="emitGenerateSurat"
            :disabled="!isFormValid"
            :class="generateButtonClass"
          >
            <template #icon>
              <Download class="h-4" />
            </template>
          </BaseButton>
        </div>

        <div class="flex-shrink-0">
          <BaseButton
            text="Reset Form"
            @click="clearFormData"
            :class="resetButtonClass"
          >
            <template #icon>
              <Eraser class="h-4" />
            </template>
          </BaseButton>
        </div>
      </div>

      <!-- Form Progress Indicator -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-zinc-400 text-xs"> Progress Pengisian </span>
          <span class="text-zinc-300 text-xs font-medium">
            {{ filledFieldsCount }}/{{ placeholders.length }}
          </span>
        </div>
        <div class="w-full rounded-full h-2 bg-zinc-800">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-zinc-600 space-y-3">
        <FileText class="w-16 h-16 mx-auto" />
        <div>
          <h3 class="text-zinc-400 text-sm font-medium mb-1">
            Pilih Jenis Surat
          </h3>
          <p class="text-zinc-500 text-xs">
            Silakan pilih jenis surat terlebih dahulu untuk melanjutkan
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FileText, FilePenLine, Download, Eraser } from "lucide-vue-next";

import { reactive, ref, computed, watch } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";

// Props
const props = defineProps({
  suratConfigs: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits([
  "generateSurat",
  "formDataChanged",
  "jenisSuratChanged",
]);

// Reactive state
const selectedJenis = ref("");
const placeholders = ref([]);
const formData = reactive({});

// ========================================
// HARDCODED OPTIONS (Hemat API!)
// ========================================

// Gender options
const genderOptions = ["Laki-laki", "Perempuan"];

// Hari options
const hariOptions = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

// Semester options
const semesterOptions = ["I ( GANJIL )", "II ( GENAP )"];

// Class options (Kelas 1-12 + Tingkat)
const classOptions = [
  "I ( Satu )",
  "II ( Dua )",
  "III ( Tiga )",
  "IV ( Empat )",
  "V ( Lima )",
  "VI ( Enam )",
];

// Month options (Indonesia)
const monthOptions = [
  { value: "Januari", label: "Januari" },
  { value: "Februari", label: "Februari" },
  { value: "Maret", label: "Maret" },
  { value: "April", label: "April" },
  { value: "Mei", label: "Mei" },
  { value: "Juni", label: "Juni" },
  { value: "Juli", label: "Juli" },
  { value: "Agustus", label: "Agustus" },
  { value: "September", label: "September" },
  { value: "Oktober", label: "Oktober" },
  { value: "November", label: "November" },
  { value: "Desember", label: "Desember" },
];

// Generate academic years (current year -2 to +5)
const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = -2; i <= 3; i++) {
    const year1 = currentYear + i;
    const year2 = year1 + 1;
    years.push(`${year1}/${year2}`);
  }
  return years;
};

// Generate year range (current year -5 to +5, single years only)
const generateYearRange = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = -2; i <= 3; i++) {
    years.push(currentYear + i);
  }
  return years;
};

// ========================================
// NO SURAT HELPERS
// ========================================

// Convert month number to Roman numeral
const monthToRoman = (month) => {
  const romanNumerals = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  return romanNumerals[month - 1] || "I";
};

// Format No Surat: 001/MI-B/087/VII/2025
const formatNoSurat = (number) => {
  if (!number || number.trim() === "") return "";

  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  const romanMonth = monthToRoman(month);

  // Pad number with leading zeros (max 3 digits)
  const paddedNumber = number.padStart(3, "0");

  // Format: 001/MI-B/087/VII/2025
  return `${paddedNumber}/MI-B/087/${romanMonth}/${year}`;
};

// Format No Surat for preview
const formatNoSuratPreview = (number) => {
  return formatNoSurat(number);
};

// Handle No Surat input (only allow numbers, max 3 digits)
const handleNoSuratInput = (key, event) => {
  let value = event.target.value.replace(/[^0-9]/g, ""); // Only numbers

  // Limit to 3 digits
  if (value.length > 3) {
    value = value.substring(0, 3);
  }

  formData[key] = value;
};

// ========================================
// VALIDATION
// ========================================

// Validation patterns
const validators = {
  text: (value) => value?.trim() !== "",
  number: (value) => value !== "" && !isNaN(value) && Number(value) > 0,
  date: (value) => value !== "",
  time: (value) =>
    value !== "" && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
  email: (value) =>
    value?.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  tel: (value) => value?.trim() !== "",
  select: (value) => value !== "" && value != null,
  gender: (value) => value !== "" && value != null,
  semester: (value) => value !== "" && value != null,
  class: (value) => value !== "" && value != null,
  month: (value) => value !== "" && value != null,
  "no-surat": (value) => value !== "" && /^\d{1,3}$/.test(value),
  "academic-year": (value) => value !== "" && value != null,
  "year-range": (value) => value !== "" && value != null,
  default: (value) => value != null && value !== "",
};

const fieldCounterClass = computed(
  () =>
    `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400`,
);

const generateButtonClass = computed(() => [
  "w-full justify-center transition-colors",
  isFormValid.value
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-zinc-700 text-zinc-400 cursor-not-allowed",
]);

const resetButtonClass =
  "w-full justify-center transition-colors sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700";

const generateButtonText = computed(() =>
  isFormValid.value
    ? "Generate Surat"
    : `Lengkapi ${missingFieldsCount.value} Field`,
);

// Helper functions
const isFieldValid = (field) => {
  const value = formData[field.key];
  const validator = validators[field.type] || validators.default;
  return validator(value);
};

const shouldShowCharCount = (field) => {
  return field.type === "text" && formData[field.key]?.length > 20;
};

// Format time for preview (HH:mm -> HH.mm)
const formatTimePreview = (timeValue) => {
  if (!timeValue) return "";
  return timeValue.replace(":", ".");
};

// Format time for document generation (HH:mm -> HH.mm)
const formatTimeForDocument = (timeValue) => {
  if (!timeValue) return "";
  return timeValue.replace(":", ".");
};

const getPlaceholderText = (field) => {
  const placeholderMap = {
    number: `Masukkan ${field.label.toLowerCase()} (angka)`,
    date: `Pilih ${field.label.toLowerCase()}`,
    time: `Pilih ${field.label.toLowerCase()} (HH:mm)`,
    email: `Masukkan ${field.label.toLowerCase()} (email@contoh.com)`,
    tel: `Masukkan ${field.label.toLowerCase()} (nomor telepon)`,
    select: `Pilih ${field.label.toLowerCase()}`,
    gender: `Pilih ${field.label.toLowerCase()}`,
    semester: `Pilih ${field.label.toLowerCase()}`,
    class: `Pilih ${field.label.toLowerCase()}`,
    month: `Pilih ${field.label.toLowerCase()}`,
    "no-surat": `001`,
    "academic-year": `Pilih ${field.label.toLowerCase()}`,
    "year-range": `Pilih ${field.label.toLowerCase()}`,
    default: `Masukkan ${field.label.toLowerCase()}`,
  };
  return placeholderMap[field.type] || placeholderMap.default;
};

const baseInputClass =
  "w-full px-3 py-2 border rounded-lg text-sm transition focus:outline-none focus:ring-1 placeholder-opacity-50";
const getInputClass = (field) => {
  const themeClass =
    "text-zinc-100 bg-zinc-800 border-zinc-600 placeholder-zinc-500 focus:border-blue-500";
  const validClass =
    isFieldValid(field) && formData[field.key] ? "border-green-600" : "";
  return `${baseInputClass} ${themeClass} ${validClass}`;
};

// Computed properties
const filledFieldsCount = computed(
  () => placeholders.value.filter(isFieldValid).length,
);

const missingFieldsCount = computed(
  () => placeholders.value.length - filledFieldsCount.value,
);

const progressPercentage = computed(() => {
  if (placeholders.value.length === 0) return 0;
  return Math.round(
    (filledFieldsCount.value / placeholders.value.length) * 100,
  );
});

const isFormValid = computed(() => {
  return (
    selectedJenis.value &&
    placeholders.value.length > 0 &&
    placeholders.value.every(isFieldValid)
  );
});

// Methods
const loadPlaceholders = () => {
  if (!selectedJenis.value) {
    placeholders.value = [];
    return;
  }

  const config = props.suratConfigs[selectedJenis.value];
  placeholders.value = config.placeholder || [];

  // Reset form data
  Object.keys(formData).forEach((key) => delete formData[key]);
  placeholders.value.forEach((field) => {
    formData[field.key] = field.default || "";
  });

  emitFormDataChange();
  emit("jenisSuratChanged", selectedJenis.value);
};

const setSelectedJenis = (jenis) => {
  if (jenis && props.suratConfigs[jenis]) {
    selectedJenis.value = jenis;
    loadPlaceholders();
  }
};

const emitFormDataChange = () => {
  emit("formDataChanged", selectedJenis.value, { ...formData });
};

const emitGenerateSurat = () => {
  if (isFormValid.value) {
    // Format special fields before emitting
    const formattedData = { ...formData };

    placeholders.value.forEach((field) => {
      // Format time fields
      if (field.type === "time" && formattedData[field.key]) {
        formattedData[field.key] = formatTimeForDocument(
          formattedData[field.key],
        );
      }

      // Format no-surat fields
      if (field.type === "no-surat" && formattedData[field.key]) {
        formattedData[field.key] = formatNoSurat(formattedData[field.key]);
      }
    });

    emit("generateSurat", selectedJenis.value, formattedData);
  }
};

const clearFormData = () => {
  placeholders.value.forEach((field) => {
    formData[field.key] = "";
  });
  emitFormDataChange();
};

// Watchers
watch(
  formData,
  () => {
    if (selectedJenis.value) {
      emitFormDataChange();
    }
  },
  { deep: true },
);

watch(selectedJenis, (newValue) => {
  if (newValue) {
    emit("jenisSuratChanged", newValue);
  }
});

// Expose methods
defineExpose({
  setSelectedJenis,
  selectedJenis,
  clearFormData,
  isFormValid,
});
</script>
