<!-- ExamplePage.vue -->
<template>
  <div class="min-h-screen">
    <div class="relative page-layout">
      <!-- Tab Menu -->
      <div class="flex border-b border-zinc-800 mb-6 gap-6 print:hidden">
        <button
          @click="activeTab = 'create'"
          :class="[
            activeTab === 'create'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200',
          ]"
          class="pb-3 text-sm font-medium border-b-2 transition-colors duration-200 cursor-pointer focus:outline-none"
        >
          Buat Sertifikat
        </button>
        <button
          @click="activeTab = 'sent'"
          :class="[
            activeTab === 'sent'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200',
          ]"
          class="pb-3 text-sm font-medium border-b-2 transition-colors duration-200 cursor-pointer focus:outline-none"
        >
          Sertifikat Terkirim
        </button>
      </div>

      <!-- Tab Content -->
      <div v-show="activeTab === 'create'">
        <SertifikatForm
          :templates="templatesData"
          jenis_doc="Sertifikat"
          @formDataChanged="handleFormUpdate"
        />
      </div>
      <div v-if="activeTab === 'sent'">
        <SentSertifikatList />
      </div>
    </div>
  </div>
</template>

<script setup>
import SertifikatForm from "~/components/form/FormStandard.vue";
import SentSertifikatList from "~/components/document/SentSertifikatList.vue";

import { ref, onMounted, watch } from "vue";
import { useTableData } from "~/composables/data/useTableData";

const activeTab = ref("create");

const { loadData: loadDataGtk, cardData: dataGtk } = useTableData();
const { loadData: loadDataSiswa, cardData: dataSiswa } = useTableData();
const { loadData: loadDataKelas, cardData: dataKelas } = useTableData();

const waliOptions = ref([]);
const siswaOptions = ref([]);
const kelasOptions = ref([]);

const templatesData = ref([
  {
    type: "juaraKelas",
    title: "Sertifikat Juara Kelas",
    preview: "/assets/images/previews/sertifikat-juara-kelas.webp",
    inputs: [
      {
        name: "kelas",
        label: "Kelas",
        type: "select",
        options: kelasOptions.value,
      },
      {
        name: "nama_lengkap",
        label: "Nama Siswa",
        type: "select",
        options: siswaOptions.value,
      },
      { name: "nisn", label: "NISN", type: "text" },
      {
        name: "wali_kelas",
        label: "Wali Kelas",
        type: "select",
        options: waliOptions.value,
      },
      {
        name: "juara",
        label: "Juara ke-",
        type: "select",
        options: [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
        ],
      },
      { name: "date", label: "Tanggal Surat", type: "date" },
      { name: "nomor", label: "No Surat Keluar", type: "no-surat" },
    ],
  },
]);

// Watch dataGtk to update waliOptions
watch(
  dataGtk,
  (newData) => {
    if (newData && Array.isArray(newData)) {
      waliOptions.value = newData
        .map((item) => item.title)
        .filter(Boolean)
        .map((title) => ({
          value: title,
          label: title,
        }));

      // Update options di templatesData
      const waliInput = templatesData.value[0].inputs.find(
        (input) => input.name === "wali_kelas",
      );
      if (waliInput) {
        waliInput.options = waliOptions.value;
      }
    }
  },
  { immediate: true },
);

// Watch dataKelas to populate kelasOptions dynamically
watch(
  dataKelas,
  (newData) => {
    if (newData && Array.isArray(newData)) {
      kelasOptions.value = newData
        .filter((k) => k.idKelas && k.namaKelas)
        .map((k) => ({
          value: k.namaKelas,
          label: k.namaKelas,
        }));

      // Update options di templatesData
      const kelasInput = templatesData.value[0].inputs.find(
        (input) => input.name === "kelas",
      );
      if (kelasInput) {
        kelasInput.options = kelasOptions.value;
      }
    }
  },
  { immediate: true },
);

// Helper function to read student data fields case-insensitively and space-insensitively
const getStudentField = (student, fieldName) => {
  if (!student) return "";
  const lowerField = fieldName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
  for (const key of Object.keys(student)) {
    const lowerKey = key
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");
    if (lowerKey === lowerField) {
      return student[key];
    }
  }
  return "";
};

let lastSelectedStudent = "";
let lastSelectedClass = "";

// Handle form inputs updates to implement dynamic filters and autofills
const handleFormUpdate = ({ formData, templateType }) => {
  if (templateType !== "juaraKelas" || !Array.isArray(dataSiswa.value)) return;

  const currentClass = formData.kelas;
  const currentStudentName = formData.nama_lengkap;

  // Build mapping from classId to className
  const kelasMap = {};
  if (Array.isArray(dataKelas.value)) {
    dataKelas.value.forEach((k) => {
      if (k.idKelas && k.namaKelas) {
        kelasMap[k.idKelas] = k.namaKelas;
      }
    });
  }

  // 1. Jika kelas berubah, update daftar nama siswa untuk kelas tersebut
  if (currentClass !== lastSelectedClass) {
    lastSelectedClass = currentClass;

    const filteredStudents = dataSiswa.value
      .filter((student) => {
        const studentClassId = getStudentField(student, "tingkat - rombel");
        const studentClassName = kelasMap[studentClassId] || studentClassId;
        return studentClassName === currentClass;
      })
      .sort((a, b) => {
        const aName = getStudentField(a, "nama");
        const bName = getStudentField(b, "nama");
        return aName.localeCompare(bName);
      });

    siswaOptions.value = filteredStudents.map((student) => {
      const name = getStudentField(student, "nama");
      return {
        value: name,
        label: name,
      };
    });

    // Update options di templatesData
    const studentInput = templatesData.value[0].inputs.find(
      (input) => input.name === "nama_lengkap",
    );
    if (studentInput) {
      studentInput.options = siswaOptions.value;
    }

    // Auto-fill Wali Kelas dari DataKelas (Lookup via ID or PegID)
    if (Array.isArray(dataKelas.value) && Array.isArray(dataGtk.value)) {
      const classInfo = dataKelas.value.find(
        (k) => k.namaKelas === currentClass,
      );
      if (classInfo && classInfo.waliKelas) {
        const teacher = dataGtk.value.find(
          (g) =>
            String(g.id).trim() === String(classInfo.waliKelas).trim() ||
            String(g.PegID).trim() === String(classInfo.waliKelas).trim()
        );
        formData.wali_kelas = teacher ? (teacher.title || teacher.nama_lengkap) : classInfo.waliKelas;
      } else {
        formData.wali_kelas = "";
      }
    } else {
      formData.wali_kelas = "";
    }

    // Reset nama dan NISN jika kelas berubah
    formData.nama_lengkap = "";
    formData.nisn = "";
  }

  // 2. Jika nama siswa dipilih, otomatis isi NISN
  if (currentStudentName && currentStudentName !== lastSelectedStudent) {
    lastSelectedStudent = currentStudentName;

    const studentInfo = dataSiswa.value.find((student) => {
      const name = getStudentField(student, "nama");
      const studentClassId = getStudentField(student, "tingkat - rombel");
      const studentClassName = kelasMap[studentClassId] || studentClassId;
      return name === currentStudentName && studentClassName === currentClass;
    });

    if (studentInfo) {
      formData.nisn = getStudentField(studentInfo, "nisn") || "";
    }
  }
};

onMounted(async () => {
  await loadDataGtk("DataGtk");
  await loadDataSiswa("DataSiswa");
  await loadDataKelas("DataKelas");
});
</script>
