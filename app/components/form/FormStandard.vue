<template>
  <div>
    <!-- Header Section -->
    <div
      class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4"
    >
      <div class="space-y-1">
        <h1 class="text-2xl" :style="{ color: 'var(--text-primary)' }">
          Pilih Jenis {{ jenis_doc }}
        </h1>
      </div>

      <BaseButton
        @click="showUploadModal = true"
        class="flex items-center gap-2"
        :text="`Cetak ${jenis_doc} Massal`"
      >
        <template #icon>
          <Printer class="w-4 h-4" />
        </template>
      </BaseButton>
    </div>

    <!-- Templates Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <div
        v-for="template in templates"
        :key="template.type"
        @click="openModal(template)"
        class="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-colors"
        :style="{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-primary)',
        }"
      >
        <!-- Image Container -->
        <div class="relative w-full h-40 mb-3 rounded-md overflow-hidden">
          <!-- Preview Button -->
          <button
            @click.stop="openPreview(template)"
            class="absolute top-2 right-2 z-10 p-1.5 rounded-full hover:opacity-90"
            :style="{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }"
          >
            <Eye class="w-4 h-4" />
          </button>

          <!-- Certificate Image -->
          <img
            :src="template.preview || defaultPreview"
            :alt="template.title"
            class="w-full h-full object-cover"
            @error="(e) => (e.target.src = defaultPreview)"
          />
        </div>

        <!-- Title -->
        <h3 class="text-sm font-medium line-clamp-2">
          {{ template.title }}
        </h3>
      </div>
    </div>

    <!-- Upload Modal -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="rounded-lg p-6 w-full max-w-xl relative shadow-lg border"
        :style="{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
        }"
      >
        <button
          @click="showUploadModal = false"
          class="hover:opacity-75 absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center"
          :style="{ color: 'var(--text-secondary)' }"
        >
          <span class="text-base">✕</span>
        </button>

        <div class="text-center mb-6">
          <div class="text-3xl mb-3">📤</div>
          <h2 class="text-xl mb-1" :style="{ color: 'var(--text-primary)' }">
            Cetak {{ jenis_doc }} Massal
          </h2>
          <p class="text-sm" :style="{ color: 'var(--text-secondary)' }">
            Buat banyak {{ jenis_doc }} sekaligus dengan file Excel
          </p>
        </div>

        <div class="space-y-6">
          <div>
            <label
              class="block mb-2 font-medium text-sm"
              :style="{ color: 'var(--text-primary)' }"
            >
              Pilih Template {{ jenis_doc }}:
            </label>
            <select
              v-model="selectedTemplateForExcel"
              class="border rounded-lg p-2 w-full focus:outline-none focus:border-emerald-500 text-sm"
              :style="{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
              }"
            >
              <option disabled value="">-- Pilih Template --</option>
              <option v-for="t in templates" :key="t.type" :value="t">
                {{ t.title }}
              </option>
            </select>
          </div>

          <div class="flex justify-center">
            <button
              @click="downloadExcelTemplate"
              :disabled="!selectedTemplateForExcel"
              :class="[
                selectedTemplateForExcel
                  ? 'text-emerald-400 bg-emerald-400/10'
                  : 'text-zinc-600 bg-zinc-800',
              ]"
              class="inline-flex items-center gap-2 font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              <span>📥</span>
              Download Template Excel
            </button>
          </div>

          <div
            class="border border-dashed p-6 rounded-lg text-center cursor-pointer"
            :style="{
              borderColor: 'var(--border-secondary)',
              backgroundColor: 'var(--bg-input-alpha)',
            }"
            @dragover.prevent
            @drop.prevent="handleDrop($event)"
            @click="$refs.fileInput.click()"
          >
            <div class="space-y-3">
              <div class="text-3xl">📁</div>
              <div>
                <p
                  class="font-medium text-sm mb-1"
                  :style="{ color: 'var(--text-primary)' }"
                >
                  Drag & Drop file di sini
                </p>
                <p class="text-xs" :style="{ color: 'var(--text-muted)' }">
                  atau klik untuk memilih file Excel (.xlsx, .csv)
                </p>
              </div>
            </div>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.csv"
            @change="handleFileUpload($event)"
            class="hidden"
          />
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="rounded-lg p-6 w-full max-w-lg relative shadow-lg border flex flex-col max-h-[85vh]"
        :style="{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
        }"
      >
        <button
          @click="closeModal"
          class="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-75"
          :style="{ color: 'var(--text-secondary)' }"
        >
          <span class="text-base">✕</span>
        </button>

        <div class="text-center mb-6">
          <h3
            class="text-xl font-bold"
            :style="{ color: 'var(--text-primary)' }"
          >
            Isi Data {{ selectedTemplate?.title || jenis_doc }}
          </h3>
          <p class="mt-1 text-sm" :style="{ color: 'var(--text-secondary)' }">
            Lengkapi informasi dibawah ini!
          </p>
        </div>

        <form
          @submit.prevent="submitForm"
          class="flex flex-col flex-grow space-y-4 min-h-0"
        >
          <div class="flex-grow overflow-y-auto space-y-4">
            <div
              v-for="input in selectedTemplate.inputs"
              :key="input.name"
              class="space-y-1"
            >
              <label
                :for="input.name"
                class="block text-sm font-medium"
                :style="{ color: 'var(--text-primary)' }"
              >
                {{ input.label }}
              </label>
              <template v-if="input.type === 'select'">
                <select
                  v-model="formData[input.name]"
                  :id="input.name"
                  class="w-full border p-2 text-sm focus:outline-none focus:border-emerald-500"
                  :style="{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }"
                  required
                >
                  <option disabled value="">
                    -- Pilih {{ input.label.toLowerCase() }} --
                  </option>
                  <option
                    v-for="option in input.options"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </template>
              <template v-else-if="input.type === 'no-surat'">
                <div class="relative flex items-center w-full">
                  <input
                    v-model="formData[input.name]"
                    type="text"
                    :id="input.name"
                    placeholder="001"
                    maxlength="3"
                    class="w-full border p-2 pr-40 text-sm focus:outline-none focus:border-emerald-500"
                    :style="{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)',
                    }"
                    @input="handleNoSuratInput(input.name, $event)"
                    required
                  />
                  <span
                    class="absolute right-3 text-xs pointer-events-none font-mono"
                    :style="{ color: 'var(--text-muted)' }"
                  >
                    /MI-B/087/{{ currentRomanMonth }}/{{ currentYear }}
                  </span>
                </div>
              </template>
              <template v-else>
                <input
                  v-model="formData[input.name]"
                  :type="input.type"
                  :id="input.name"
                  :placeholder="`Masukkan ${input.label.toLowerCase()}`"
                  class="w-full border p-2 text-sm focus:outline-none focus:border-emerald-500"
                  :style="{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }"
                  required
                />
              </template>
            </div>
          </div>

          <BaseButton
            type="submit"
            :text="`Buat ${jenis_doc}`"
            class="mt-4 h-10"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { Printer, Eye } from "lucide-vue-next";

import * as XLSX from "xlsx";
import BaseButton from "~/components/ui/BaseButton.vue";
import defaultPreview from "~/assets/PreviewError.webp";
import { formatTanggalIndo } from "~/utils/date";

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

const now = new Date();
const currentRomanMonth = monthToRoman(now.getMonth() + 1);
const currentYear = now.getFullYear();

const formatNoSurat = (number) => {
  if (!number || String(number).trim() === "") return "";
  const paddedNumber = String(number).padStart(3, "0");
  return `${paddedNumber}/MI-B/087/${currentRomanMonth}/${currentYear}`;
};

const handleNoSuratInput = (key, event) => {
  let value = event.target.value.replace(/[^0-9]/g, ""); // Only numbers
  if (value.length > 3) {
    value = value.substring(0, 3);
  }
  formData.value[key] = value;
};

const props = defineProps({
  templates: {
    type: Array,
    required: true,
  },
  jenis_doc: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["formDataChanged"]);

const router = useRouter();
const showUploadModal = ref(false);
const showModal = ref(false);
const selectedTemplate = ref(null);
const selectedTemplateForExcel = ref(null);
const fileInput = ref(null);
const formData = ref({});

watch(
  formData,
  (newVal) => {
    emit("formDataChanged", {
      formData: newVal,
      templateType: selectedTemplate.value?.type,
    });
  },
  { deep: true },
);

const openModal = (template) => {
  selectedTemplate.value = template;
  formData.value = {};
  template.inputs.forEach((input) => {
    formData.value[input.name] = "";
  });
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const openPreview = (template) => {
  const imageSrc =
    template.preview && template.preview.trim() !== ""
      ? template.preview
      : defaultPreview;

  // Open a new blank window/tab and write a minimal HTML preview
  const newWin = window.open("", "_blank");
  if (newWin) {
    const escapedSrc = String(imageSrc).replace(/"/g, "%22");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Preview ${props.jenis_doc}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0;background:${"#0f1720"};display:flex;align-items:center;justify-content:center;}img{max-width:100%;max-height:100vh;object-fit:contain;}</style></head><body><img src="${escapedSrc}" alt="Preview" onerror="this.src='${defaultPreview}'"></body></html>`;
    newWin.document.write(html);
    newWin.document.close();
  } else {
    // If popup blocked, open image URL directly
    window.open(imageSrc, "_blank");
  }
};

const submitForm = () => {
  const data = { ...formData.value };
  if (data.date) {
    data.date = formatTanggalIndo(data.date);
  }

  // Format no-surat inputs
  selectedTemplate.value.inputs.forEach((input) => {
    if (input.type === "no-surat" && data[input.name]) {
      data[input.name] = formatNoSurat(data[input.name]);
    }
  });

  router.push({
    path: "/dokumen/cetak",
    query: {
      type: selectedTemplate.value.type,
      ...data,
    },
  });
};

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0];
  if (!selectedTemplateForExcel.value) {
    alert("Pilih template sertifikat terlebih dahulu.");
    return;
  }
  processExcel(file, selectedTemplateForExcel.value);
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!selectedTemplateForExcel.value) {
    alert("Pilih template sertifikat terlebih dahulu.");
    return;
  }

  processExcel(file, selectedTemplateForExcel.value);
  fileInput.value.value = "";
};

const downloadExcelTemplate = () => {
  if (!selectedTemplateForExcel.value) return;

  const template = selectedTemplateForExcel.value;

  // Membuat data contoh berdasarkan tipe input
  const generateSampleData = (input) => {
    switch (input.type) {
      case "no-surat":
        return "5";
      case "text":
        if (input.name.includes("nama")) return "John Doe";
        if (input.name.includes("kelas")) return "XII IPA 1";
        if (input.name.includes("wali")) return "Budi Santoso";
        if (input.name.includes("nomor")) return "001/SK/2024";
        if (input.name.includes("verifikasi"))
          return "https://verify.example.com/abc123";
        return "Contoh Data";
      case "number":
        if (input.name.includes("juara")) return 1;
        if (input.name.includes("duration")) return 8;
        return 1;
      case "date":
        return "2024-01-15";
      default:
        return "Contoh Data";
    }
  };

  const sampleRow = {};
  template.inputs.forEach((input) => {
    sampleRow[input.name] = generateSampleData(input);
  });

  // Membuat workbook dengan contoh data
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([sampleRow]);

  // Mengatur lebar kolom
  const colWidths = template.inputs.map((input) => ({
    wch: Math.max(input.label.length, 15),
  }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, `Data ${props.jenis_doc}`);

  // Download file
  const fileName = `template_${template.type}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

const processExcel = (file, template) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: false });

    // Konversi tipe data sesuai dengan template inputs
    const formattedRows = rows.map((row) => {
      const formattedRow = {};

      // Proses setiap field sesuai dengan tipe yang didefinisikan di template
      template.inputs.forEach((input) => {
        const value = row[input.name];

        if (value === undefined || value === null || value === "") {
          formattedRow[input.name] = "";
          return;
        }

        switch (input.type) {
          case "number": {
            // Konversi ke number, handle jika NaN
            const numValue = Number(value);
            formattedRow[input.name] = isNaN(numValue) ? 0 : numValue;
            break;
          }
          case "date":
            // Format tanggal ke bahasa Indonesia
            formattedRow[input.name] = formatTanggalIndo(value);
            break;
          case "no-surat": {
            const valStr = String(value).trim();
            if (valStr.includes("/")) {
              formattedRow[input.name] = valStr;
            } else {
              const numStr = valStr.replace(/[^0-9]/g, "");
              formattedRow[input.name] = formatNoSurat(numStr);
            }
            break;
          }
          case "text":
          default:
            // Pastikan nilai adalah string
            formattedRow[input.name] = String(value).trim();
            break;
        }
      });

      return formattedRow;
    });

    sessionStorage.setItem("bulkDoc", JSON.stringify(formattedRows));

    router.push({
      path: "/dokumen/massal",
      query: { type: template.type },
    });
  };
  reader.readAsArrayBuffer(file);
};
</script>
