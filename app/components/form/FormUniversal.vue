<!-- \src\components\FormUniversal.vue -->
<template>
  <div class="space-y-6">
    <!-- Form Fields Section -->
    <div v-if="placeholders.length" class="space-y-4">
      <!-- Form Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <FilePenLine class="w-4 h-4 text-green-400" />
          <h3 class="text-sm font-medium" :style="{ color: 'var(--text-primary)' }">
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
            <label :for="field.key" class="text-xs font-medium flex items-center gap-0.5"
              :style="{ color: 'var(--text-primary)' }">
              <span>{{ field.label }}</span>
              <span class="text-red-500 text-[10px]">*</span>
            </label>

            <!-- Character count for text fields -->
            <span v-if="shouldShowCharCount(field)" class="text-[10px]" :style="{ color: 'var(--text-muted)' }">
              {{ formData[field.key]?.length || 0 }}
            </span>

            <!-- Time format preview -->
            <span v-if="field.type === 'time' && formData[field.key]" class="text-[10px] font-medium text-blue-400">
              {{ formatTimePreview(formData[field.key]) }}
            </span>

            <!-- No Surat preview -->
            <span v-if="field.type === 'no-surat' && formData[field.key]" class="text-[10px] font-medium text-blue-400">
              {{ formatNoSuratPreview(formData[field.key]) }}
            </span>
          </div>

          <!-- Connected Class Input -->
          <select v-if="hasStudentAndClass && isClassField(field)" :id="field.key" v-model="formData[field.key]"
            :class="getInputClass(field)">
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option v-for="option in dynamicClassOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <!-- Connected Student Input (Loading State) -->
          <select v-else-if="
            isStudentNameField(field) && isLoadingSiswa
          " :id="field.key" disabled :class="getInputClass(field)">
            <option value="" disabled selected>Memuat data siswa...</option>
          </select>

          <!-- Connected Student Input (Dropdown State) -->
          <div v-else-if="
            isStudentNameField(field) &&
            !isManualStudentInput &&
            filteredStudents.length > 0
          " class="flex gap-2">
            <select :id="field.key" v-model="formData[field.key]" :class="getInputClass(field)"
              @change="handleStudentChange(field.key, $event)" class="flex-1">
              <option value="" disabled>Pilih {{ field.label }}</option>
              <option v-for="siswa in filteredStudents" :key="siswa.id || siswa.nisn" :value="siswa.nama">
                {{ siswa.nama }} (Kelas: {{ siswa.kelas || '-' }}, NISN: {{ siswa.nisn || "-" }})
              </option>
              <option value="__manual__">-- Ketik manual... --</option>
            </select>
          </div>

          <!-- Connected Student Input (Manual Text State) -->
          <div v-else-if="isStudentNameField(field)" class="relative w-full">
            <input :id="field.key" type="text" v-model="formData[field.key]" :placeholder="getPlaceholderText(field)"
              :class="getInputClass(field)" />
            <button v-if="filteredStudents.length > 0" type="button" @click="
              isManualStudentInput = false;
            formData[field.key] = '';
            "
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer">
              Pilih dari daftar
            </button>
          </div>

          <!-- Connected GTK/Guru Input (Loading State) -->
          <select v-else-if="
            isGtkNameField(field) && isLoadingGtk
          " :id="field.key" disabled :class="getInputClass(field)">
            <option value="" disabled selected>Memuat data guru...</option>
          </select>

          <!-- Connected GTK/Guru Input (Dropdown State) -->
          <div v-else-if="
            isGtkNameField(field) &&
            !isManualGtkInput[field.key] &&
            sortedGtk.length > 0
          " class="flex gap-2">
            <select :id="field.key" v-model="formData[field.key]" :class="getInputClass(field)"
              @change="handleGtkChange(field.key, $event)" class="flex-1">
              <option value="" disabled>Pilih {{ field.label }}</option>
              <option v-for="guru in sortedGtk" :key="guru.id || guru.nip" :value="guru.nama_lengkap">
                {{ guru.nama_lengkap }} (NIP: {{ guru.nip || "-" }})
              </option>
              <option value="__manual__">-- Ketik manual... --</option>
            </select>
          </div>

          <!-- Connected GTK/Guru Input (Manual Text State) -->
          <div v-else-if="isGtkNameField(field)" class="relative w-full">
            <input :id="field.key" type="text" v-model="formData[field.key]" :placeholder="getPlaceholderText(field)"
              :class="getInputClass(field)" />
            <button v-if="sortedGtk.length > 0" type="button" @click="
              isManualGtkInput[field.key] = false;
            formData[field.key] = '';
            "
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer">
              Pilih dari daftar
            </button>
          </div>

          <!-- Regular Select Input (from API) -->
          <select v-else-if="field.type === 'select'" :id="field.key" v-model="formData[field.key]"
            :class="getInputClass(field)">
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option v-for="option in field.options" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <!-- Gender Select (Hardcoded) -->
          <select v-else-if="field.type === 'gender'" :id="field.key" v-model="formData[field.key]"
            :class="getInputClass(field)">
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option v-for="option in genderOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <!-- Hari Select (Hardcoded) -->
          <select v-else-if="field.type === 'hari'" :id="field.key" v-model="formData[field.key]"
            :class="getInputClass(field)">
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option v-for="option in hariOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <!-- Semester Select (Hardcoded) -->
          <select v-else-if="field.type === 'semester'" :id="field.key" v-model="formData[field.key]"
            :class="getInputClass(field)">
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option v-for="option in semesterOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <!-- Class Select (Hardcoded) -->
          <select v-else-if="field.type === 'class'" :id="field.key" v-model="formData[field.key]"
            :class="getInputClass(field)">
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option v-for="option in classOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <!-- Month Select (Hardcoded) -->
          <select v-else-if="field.type === 'month'" :id="field.key" v-model="formData[field.key]"
            :class="getInputClass(field)">
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option v-for="option in monthOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <!-- Academic Year Select (Hardcoded) -->
          <select v-else-if="field.type === 'academic-year'" :id="field.key" v-model="formData[field.key]"
            :class="getInputClass(field)">
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option v-for="year in generateAcademicYears()" :key="year" :value="year">
              {{ year }}
            </option>
          </select>

          <!-- Year Range Select (Hardcoded) -->
          <select v-else-if="field.type === 'year-range'" :id="field.key" v-model="formData[field.key]"
            :class="getInputClass(field)">
            <option value="" disabled>Pilih {{ field.label }}</option>
            <option v-for="year in generateYearRange()" :key="year" :value="year">
              {{ year }}
            </option>
          </select>

          <!-- No Surat Input (Special: 3 digit number with auto-format preview) -->
          <div v-else-if="field.type === 'no-surat'" class="relative">
            <input :id="field.key" type="text" v-model="formData[field.key]" placeholder="001" maxlength="3"
              :class="getInputClass(field)" @input="handleNoSuratInput(field.key, $event)" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
              :style="{ color: 'var(--text-muted)' }">
              /MI-B/087/...
            </span>
          </div>

          <!-- Time Input -->
          <input v-else-if="field.type === 'time'" :id="field.key" type="time" v-model="formData[field.key]"
            :class="getInputClass(field)" />

          <!-- Regular Input -->
          <input v-else :id="field.key" :type="field.type" v-model="formData[field.key]"
            :placeholder="getPlaceholderText(field)" :class="getInputClass(field)" />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t" :style="{ borderColor: 'var(--border-primary)' }">
        <div class="flex-1">
          <BaseButton :text="generateButtonText" @click="emitGenerateSurat" :disabled="!isFormValid"
            :class="generateButtonClass">
            <template #icon>
              <Download class="h-4" />
            </template>
          </BaseButton>
        </div>

        <div class="flex-shrink-0">
          <BaseButton text="Reset Form" @click="clearFormData" :class="resetButtonClass">
            <template #icon>
              <Eraser class="h-4" />
            </template>
          </BaseButton>
        </div>
      </div>

      <!-- Form Progress Indicator -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-xs" :style="{ color: 'var(--text-secondary)' }">
            Progress Pengisian
          </span>
          <span class="text-xs font-medium" :style="{ color: 'var(--text-primary)' }">
            {{ filledFieldsCount }}/{{ placeholders.length }}
          </span>
        </div>
        <div class="w-full rounded-full h-2" :style="{ backgroundColor: 'var(--bg-secondary)' }">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${progressPercentage}%` }"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="theme-text-muted space-y-3">
        <FileText class="w-16 h-16 mx-auto" />
        <div>
          <h3 class="text-sm font-medium mb-1" :style="{ color: 'var(--text-secondary)' }">
            Pilih Jenis Surat
          </h3>
          <p class="text-xs" :style="{ color: 'var(--text-muted)' }">
            Silakan pilih jenis surat terlebih dahulu untuk melanjutkan
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileText, FilePenLine, Download, Eraser } from "lucide-vue-next";

import { reactive, ref, computed, watch, onMounted } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useTableData } from "~/composables/data/useTableData";

// ========================================
// INTERFACES
// ========================================

interface PlaceholderField {
  key: string;
  label: string;
  type: string;
  options?: string[];
  default?: string;
}

interface SuratConfig {
  placeholder?: PlaceholderField[];
  [key: string]: unknown;
}

interface SiswaItem {
  id?: string;
  nisn?: string;
  nis_lokal?: string;
  "nis lokal"?: string;
  nama?: string;
  kelas?: string;
  kelas_db?: string;
  tempat_lahir?: string;
  "tempat lahir"?: string;
  tempatlahir?: string;
  tanggal_lahir?: string;
  "tanggal lahir"?: string;
  tanggallahir?: string;
  tgl_lahir?: string;
  nama_ayah_kandung?: string;
  "nama ayah kandung"?: string;
  nama_ibu_kandung?: string;
  "nama ibu kandung"?: string;
  alamat?: string;
  nama_wali?: string;
  "nama wali"?: string;
  [key: string]: unknown;
}

interface KelasItem {
  nama_kelas?: string;
  namaKelas?: string;
  id_kelas?: string;
  idKelas?: string;
  [key: string]: unknown;
}

interface GtkItem {
  id?: string;
  nip?: string;
  nuptk?: string;
  npk?: string;
  nama_lengkap?: string;
  tugas?: string;
  no_hp?: string;
  email?: string;
  [key: string]: unknown;
}

interface MonthOption {
  value: string;
  label: string;
}

// Props
const props = defineProps<{
  suratConfigs: Record<string, SuratConfig>;
}>();

// Emits
const emit = defineEmits<{
  generateSurat: [jenis: string, data: Record<string, string>];
  formDataChanged: [jenis: string, data: Record<string, string>];
  jenisSuratChanged: [jenis: string];
}>();

// Reactive state
const selectedJenis = ref<string>("");
const placeholders = ref<PlaceholderField[]>([]);
const formData = reactive<Record<string, string>>({});

// ========================================
// HARDCODED OPTIONS (Hemat API!)
// ========================================

// Gender options
const genderOptions: string[] = ["Laki-laki", "Perempuan"];

// Hari options
const hariOptions: string[] = [
  "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu",
];

// Semester options
const semesterOptions: string[] = ["I ( GANJIL )", "II ( GENAP )"];

// Class options (Kelas 1-12 + Tingkat)
const classOptions: string[] = [
  "I ( Satu )", "II ( Dua )", "III ( Tiga )",
  "IV ( Empat )", "V ( Lima )", "VI ( Enam )",
];

// Month options (Indonesia)
const monthOptions: MonthOption[] = [
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
const generateAcademicYears = (): string[] => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = -2; i <= 3; i++) {
    const year1 = currentYear + i;
    const year2 = year1 + 1;
    years.push(`${year1}/${year2}`);
  }
  return years;
};

// Generate year range (current year -5 to +5, single years only)
const generateYearRange = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = -2; i <= 3; i++) {
    years.push(currentYear + i);
  }
  return years;
};

// ========================================
// NO SURAT HELPERS
// ========================================

// Convert month number to Roman numeral
const monthToRoman = (month: number): string => {
  const romanNumerals = [
    "I", "II", "III", "IV", "V", "VI",
    "VII", "VIII", "IX", "X", "XI", "XII",
  ];
  return romanNumerals[month - 1] || "I";
};

// Format No Surat: 001/MI-B/087/VII/2025
const formatNoSurat = (number: string): string => {
  if (!number || number.trim() === "") return "";
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const romanMonth = monthToRoman(month);
  const paddedNumber = number.padStart(3, "0");
  return `${paddedNumber}/MI-B/087/${romanMonth}/${year}`;
};

// Format No Surat for preview
const formatNoSuratPreview = (number: string): string => {
  return formatNoSurat(number);
};

// Handle No Surat input (only allow numbers, max 3 digits)
const handleNoSuratInput = (key: string, event: Event): void => {
  const target = event.target as HTMLInputElement;
  let value = target.value.replace(/[^0-9]/g, "");
  if (value.length > 3) {
    value = value.substring(0, 3);
  }
  formData[key] = value;
};

// ========================================
// DATA SISWA & KELAS SYNC LOGIC
// ========================================

const {
  cardData: dataSiswa,
  isLoading: isLoadingSiswa,
  loadData: loadDataSiswa,
} = useTableData();
const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();
const {
  cardData: dataGtk,
  isLoading: isLoadingGtk,
  loadData: loadDataGtk,
} = useTableData();

const isManualGtkInput = ref<Record<string, boolean>>({});

onMounted(() => {
  loadDataSiswa("data_siswa");
  loadDataKelas("data_kelas");
  loadDataGtk("data_gtk");
});

const isClassField = (field: PlaceholderField): boolean => {
  if (!field) return false;
  const key = field.key.toLowerCase();
  return (
    field.type === "class" ||
    key === "kelas" ||
    key === "rombel" ||
    (key.includes("kelas") &&
      !key.includes("wali") &&
      !key.includes("guru") &&
      !key.includes("kamad"))
  );
};

const isStudentNameField = (field: PlaceholderField): boolean => {
  if (!field) return false;
  const key = field.key.toLowerCase();
  return (
    key === "nama_siswa" ||
    key === "nama" ||
    key === "nama_lengkap" ||
    key === "nama_siswa_yang_bersangkutan" ||
    (key.includes("nama") &&
      !key.includes("guru") &&
      !key.includes("wali") &&
      !key.includes("ortu") &&
      !key.includes("ayah") &&
      !key.includes("ibu") &&
      !key.includes("kepala") &&
      !key.includes("kamad") &&
      !key.includes("sekolah") &&
      !key.includes("gtk"))
  );
};

const isGtkNameField = (field: PlaceholderField): boolean => {
  if (!field) return false;
  const key = field.key.toLowerCase();
  return (
    key === "nama_guru" ||
    key === "nama_wali_kelas" ||
    key === "nama_kamad" ||
    key === "nama_kepala" ||
    key === "nama_kepala_madrasah" ||
    key === "nama_kepala_sekolah" ||
    key === "wali_kelas" ||
    key === "guru" ||
    (key.includes("nama") &&
      (key.includes("guru") ||
        key.includes("kamad") ||
        key.includes("wali") ||
        key.includes("kepala") ||
        key.includes("gtk")))
  );
};

const classField = computed<PlaceholderField | undefined>(() => {
  return placeholders.value.find(isClassField);
});

const studentField = computed<PlaceholderField | undefined>(() => {
  return placeholders.value.find(isStudentNameField);
});

const hasStudentAndClass = computed<boolean>(() => {
  return !!classField.value && !!studentField.value;
});

const dynamicClassOptions = computed<string[]>(() => {
  const data = dataKelas.value as KelasItem[] | null;
  if (Array.isArray(data) && data.length > 0) {
    return data
      .map((k) => k.nama_kelas || k.namaKelas || "")
      .filter((name) => name && String(name).trim() !== "")
      .sort();
  }
  return classOptions;
});

const isManualStudentInput = ref<boolean>(false);

const sortedGtk = computed<GtkItem[]>(() => {
  const data = dataGtk.value as GtkItem[] | null;
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) =>
    (a.nama_lengkap || "").localeCompare(b.nama_lengkap || ""),
  );
});

const filteredStudents = computed<SiswaItem[]>(() => {
  const siswa = dataSiswa.value as SiswaItem[] | null;
  if (!Array.isArray(siswa)) return [];

  if (hasStudentAndClass.value && classField.value) {
    const selectedClassName = formData[classField.value.key];
    if (!selectedClassName) return [];

    const targetClassIds: string[] = [];
    const kelas = dataKelas.value as KelasItem[] | null;
    if (Array.isArray(kelas)) {
      kelas.forEach((k) => {
        const name = k.nama_kelas || k.namaKelas;
        const id = k.id_kelas || k.idKelas;
        if (name && name.toLowerCase() === selectedClassName.toLowerCase()) {
          if (id) targetClassIds.push(id);
        }
      });
    }

    return siswa.filter((s) => {
      const sClass = s.kelas || s.kelas_db;
      if (!sClass) return false;
      return (
        targetClassIds.includes(sClass) ||
        sClass.toLowerCase() === selectedClassName.toLowerCase()
      );
    });
  }

  return [...siswa].sort((a, b) =>
    (a.nama || "").localeCompare(b.nama || ""),
  );
});

const formatDateForField = (dateStr: string, isDateInput: boolean): string => {
  if (!dateStr || dateStr === "null" || dateStr === "undefined") return "";

  let dateObj = new Date(dateStr);

  if (isNaN(dateObj.getTime())) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      dateObj = new Date(year, month, day);
    }
  }

  if (isNaN(dateObj.getTime())) {
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      dateObj = new Date(year, month, day);
    }
  }

  if (isNaN(dateObj.getTime())) {
    const months: Record<string, number> = {
      jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2,
      apr: 3, april: 3, mei: 4, jun: 5, juni: 5, jul: 6, juli: 6,
      agu: 7, agustus: 7, sep: 8, september: 8, okt: 9, oktober: 9,
      nov: 10, november: 10, des: 11, desember: 11,
    };
    const parts = dateStr.toLowerCase().split(/\s+/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      const year = parseInt(parts[2], 10);
      const month = months[monthStr];
      if (month !== undefined && !isNaN(day) && !isNaN(year)) {
        dateObj = new Date(year, month, day);
      }
    }
  }

  if (isNaN(dateObj.getTime())) {
    return isDateInput ? "" : dateStr;
  }

  if (isDateInput) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } else {
    const indonesianMonths = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${dateObj.getDate()} ${indonesianMonths[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  }
};

const handleStudentSelect = (selectedName: string): void => {
  if (!selectedName || selectedName === "__manual__") return;

  const student = filteredStudents.value.find((s) => s.nama === selectedName);
  if (!student) return;

  placeholders.value.forEach((field) => {
    const key = field.key.toLowerCase();
    if (isClassField(field) || isStudentNameField(field)) return;

    if (key === "nisn") {
      formData[field.key] = student.nisn || "";
    } else if (key === "nis_lokal" || key === "nis" || key === "nislokal") {
      formData[field.key] = String(student.nis_lokal || student["nis lokal"] || "");
    } else if (key === "tempat_lahir" || key.includes("tempat_lahir") || key.includes("tempatlahir")) {
      formData[field.key] = String(student.tempat_lahir || student["tempat lahir"] || student.tempatlahir || "");
    } else if (key === "tanggal_lahir" || key.includes("tanggal_lahir") || key.includes("tanggallahir") || key === "tgl_lahir") {
      const dateVal = String(student.tanggal_lahir || student["tanggal lahir"] || student.tanggallahir || student.tgl_lahir || "");
      formData[field.key] = formatDateForField(dateVal, field.type === "date");
    } else if (key === "tempat_tanggal_lahir" || key === "tempat_tgl_lahir" || key === "ttl" || key.includes("tempat_tanggal_lahir")) {
      const tempat = String(student.tempat_lahir || student["tempat lahir"] || student.tempatlahir || "");
      const tanggal = String(student.tanggal_lahir || student["tanggal lahir"] || student.tanggallahir || student.tgl_lahir || "");
      const formattedTanggal = formatDateForField(tanggal, false);
      if (tempat && formattedTanggal) {
        formData[field.key] = `${tempat}, ${formattedTanggal}`;
      } else if (tempat) {
        formData[field.key] = tempat;
      } else {
        formData[field.key] = formattedTanggal;
      }
    } else if (key.includes("ayah")) {
      formData[field.key] = String(student.nama_ayah_kandung || student["nama ayah kandung"] || "");
    } else if (key.includes("ibu")) {
      formData[field.key] = String(student.nama_ibu_kandung || student["nama ibu kandung"] || "");
    } else if (key.includes("alamat")) {
      formData[field.key] = String(student.alamat || "");
    } else if (key.includes("wali")) {
      formData[field.key] = String(student.nama_wali || student["nama wali"] || "");
    }
  });
};

const handleStudentChange = (key: string, event: Event): void => {
  const val = (event.target as HTMLSelectElement).value;
  if (val === "__manual__") {
    isManualStudentInput.value = true;
    formData[key] = "";
  } else {
    formData[key] = val;
    handleStudentSelect(val);
  }
};

const handleGtkSelect = (selectedName: string, targetKey: string): void => {
  if (!selectedName || selectedName === "__manual__") return;
  const data = dataGtk.value as GtkItem[] | null;
  if (!Array.isArray(data)) return;

  const guru = data.find((g) => g.nama_lengkap === selectedName);
  if (!guru) return;

  placeholders.value.forEach((field) => {
    if (field.key === targetKey) return;
    const key = field.key.toLowerCase();

    if (key === "nip" || key === "nip_guru" || key.includes("nip")) {
      formData[field.key] = guru.nip || "";
    } else if (key === "nuptk" || key === "nuptk_guru" || key.includes("nuptk")) {
      formData[field.key] = guru.nuptk || "";
    } else if (key === "npk" || key.includes("npk")) {
      formData[field.key] = guru.npk || "";
    } else if (key === "jabatan" || key === "tugas" || key.includes("jabatan") || key.includes("tugas")) {
      formData[field.key] = guru.tugas || "";
    } else if (key.includes("tel") || key.includes("hp")) {
      formData[field.key] = guru.no_hp || "";
    } else if (key.includes("email")) {
      formData[field.key] = guru.email || "";
    }
  });
};

const handleGtkChange = (key: string, event: Event): void => {
  const val = (event.target as HTMLSelectElement).value;
  if (val === "__manual__") {
    isManualGtkInput.value[key] = true;
    formData[key] = "";
  } else {
    formData[key] = val;
    handleGtkSelect(val, key);
  }
};

watch(
  () => (classField.value ? formData[classField.value.key] : null),
  (newClass, oldClass) => {
    if (newClass !== oldClass && studentField.value) {
      formData[studentField.value.key] = "";
      isManualStudentInput.value = false;
    }
  },
);

// ========================================
// VALIDATION
// ========================================

// Validation patterns
type ValidatorFn = (value: string) => boolean;

const validators: Record<string, ValidatorFn> = {
  text: (value) => value?.trim() !== "",
  number: (value) => value !== "" && !isNaN(Number(value)) && Number(value) > 0,
  date: (value) => value !== "",
  time: (value) => value !== "" && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
  email: (value) => value?.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
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

const fieldCounterClass = computed<string>(
  () => `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400`,
);

const generateButtonClass = computed<string[]>(() => [
  "w-full justify-center transition-colors",
  isFormValid.value ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed",
]);

const resetButtonClass = "w-full justify-center transition-colors sm:w-auto";

const generateButtonText = computed<string>(() =>
  isFormValid.value
    ? "Generate Surat"
    : `Lengkapi ${missingFieldsCount.value} Field`,
);

// Helper functions
const isFieldValid = (field: PlaceholderField): boolean => {
  const value = formData[field.key];
  const validator = validators[field.type] || validators.default;
  return validator(value);
};

const shouldShowCharCount = (field: PlaceholderField): boolean => {
  return field.type === "text" && (formData[field.key]?.length || 0) > 20;
};

// Format time for preview (HH:mm -> HH.mm)
const formatTimePreview = (timeValue: string): string => {
  if (!timeValue) return "";
  return timeValue.replace(":", ".");
};

// Format time for document generation (HH:mm -> HH.mm)
const formatTimeForDocument = (timeValue: string): string => {
  if (!timeValue) return "";
  return timeValue.replace(":", ".");
};

const getPlaceholderText = (field: PlaceholderField): string => {
  const placeholderMap: Record<string, string> = {
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
  "w-full px-3 py-2 border rounded-lg text-sm transition focus:outline-none focus:ring-1 placeholder-opacity-50 theme-input";
const getInputClass = (field: PlaceholderField): string => {
  const themeClass = "focus:border-blue-500";
  const validClass =
    isFieldValid(field) && formData[field.key] ? "border-green-600" : "";
  return `${baseInputClass} ${themeClass} ${validClass}`;
};

// Computed properties
const filledFieldsCount = computed<number>(
  () => placeholders.value.filter(isFieldValid).length,
);

const missingFieldsCount = computed<number>(
  () => placeholders.value.length - filledFieldsCount.value,
);

const progressPercentage = computed<number>(() => {
  if (placeholders.value.length === 0) return 0;
  return Math.round(
    (filledFieldsCount.value / placeholders.value.length) * 100,
  );
});

const isFormValid = computed<boolean>(() => {
  return (
    !!selectedJenis.value &&
    placeholders.value.length > 0 &&
    placeholders.value.every(isFieldValid)
  );
});

// Methods
const loadPlaceholders = (): void => {
  if (!selectedJenis.value) {
    placeholders.value = [];
    return;
  }

  const config = props.suratConfigs[selectedJenis.value];
  let list: PlaceholderField[] = config.placeholder
    ? JSON.parse(JSON.stringify(config.placeholder))
    : [];

  const classIdx = list.findIndex(isClassField);
  const studentIdx = list.findIndex(isStudentNameField);

  if (classIdx !== -1 && studentIdx !== -1) {
    if (classIdx > studentIdx) {
      const classFieldObj = list[classIdx];
      list.splice(classIdx, 1);

      const newStudentIdx = list.findIndex(isStudentNameField);
      list.splice(newStudentIdx, 0, classFieldObj);
    }
  }

  placeholders.value = list;

  Object.keys(formData).forEach((key) => delete formData[key]);
  placeholders.value.forEach((field) => {
    formData[field.key] = field.default || "";
  });

  emitFormDataChange();
  emit("jenisSuratChanged", selectedJenis.value);
};

const setSelectedJenis = (jenis: string): void => {
  if (jenis && props.suratConfigs[jenis]) {
    selectedJenis.value = jenis;
    loadPlaceholders();
  }
};

const emitFormDataChange = (): void => {
  emit("formDataChanged", selectedJenis.value, { ...formData });
};

const emitGenerateSurat = (): void => {
  if (isFormValid.value) {
    const formattedData: Record<string, string> = { ...formData };

    placeholders.value.forEach((field) => {
      if (field.type === "time" && formattedData[field.key]) {
        formattedData[field.key] = formatTimeForDocument(formattedData[field.key]);
      }
      if (field.type === "no-surat" && formattedData[field.key]) {
        formattedData[field.key] = formatNoSurat(formattedData[field.key]);
      }
    });

    emit("generateSurat", selectedJenis.value, formattedData);
  }
};

const clearFormData = (): void => {
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
