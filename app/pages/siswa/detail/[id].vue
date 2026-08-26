<!-- app/pages/siswa/detail/[id].vue -->
<template>
  <div>
    <SiswaDetailLayout
      :loading="loading"
      loadingText="Memuat detail profil siswa..."
      :error="error"
      :data="siswaDetail"
      :foto="siswaDetail?.foto"
      breadcrumbLink="/akademik/siswa"
      breadcrumbTitle="Data Siswa"
      biodataTitle="Biodata Lengkap Siswa"
      :biodataFields="formattedBiodataFields"
      sidebarTitle="Siswa Sekelas"
      :sidebarSubtitle="getClassName(siswaDetail?.['tingkat - rombel'])"
      :relatedItems="relatedItems"
      emptyRelatedText="Tidak ada siswa sekelas lainnya"
      @click-back="goBack"
      @click-related="navigateToDetail"
    >
      <template #actions>
        <template v-if="isAdmin && !siswaDetail?._isMutasi">
          <BaseButton
            text="Edit"
            title="Edit data siswa ini"
            @click="openEditModal(siswaDetail)"
          >
            <template #icon>
              <Pencil class="w-3.5 h-3.5" />
            </template>
          </BaseButton>
          <BaseButton
            text="Mutasi Keluar"
            title="Pindahkan siswa ini ke daftar mutasi keluar"
            @click="handleMutasiKeluar(siswaDetail)"
          >
            <template #icon>
              <LogOut class="w-3.5 h-3.5" />
            </template>
          </BaseButton>
        </template>
      </template>
    </SiswaDetailLayout>

    <!-- CRUD Modal -->
    <CrudModal
      :show="showModal"
      :mode="modalMode"
      :title="modalMode === 'create' ? 'Tambah Data Siswa' : 'Edit Data Siswa'"
      :fields="siswaFields"
      :initialData="editingItem"
      :isSaving="isSaving"
      @submit="handleFormSubmit"
      @close="showModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Pencil, LogOut } from "lucide-vue-next";
import SiswaDetailLayout from "~/components/siswa/SiswaDetailLayout.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { postToApi, deleteFromApi } from "~/utils/api";
import { clearTableSessionCache } from "~/composables/data/useTableData";

const { cardData: dataSiswa, loadData } = useTableData();
const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();
const { cardData: dataMutasi, loadData: loadDataMutasi } = useTableData();

const { isAdmin, isSaving, updateItem, deleteItem } = useCrud(
  "data_siswa",
  () => loadSiswaDetail(),
);
// CRUD Modal state
const showModal = ref(false);
const modalMode = ref("edit");
const editingItem = ref({});

const siswaFields = [
  { key: "nama", label: "Nama", required: true },
  { key: "nisn", label: "NISN" },
  { key: "nis_lokal", label: "NIS Lokal" },
  { key: "nik", label: "NIK" },
  { key: "no_kk", label: "No KK" },
  { key: "tempat_lahir", label: "Tempat Lahir" },
  { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date" },
  { key: "kelas", label: "Kelas" },
  {
    key: "jenis_kelamin",
    label: "Jenis Kelamin",
    type: "select",
    options: ["Laki-Laki", "Perempuan"],
  },
  { key: "alamat", label: "Alamat", type: "textarea" },
  { key: "no_hp", label: "No HP" },
  { key: "no_kip", label: "No KIP" },
  { key: "nama_ayah_kandung", label: "Nama Ayah Kandung" },
  { key: "nama_ibu_kandung", label: "Nama Ibu Kandung" },
  { key: "nama_wali", label: "Nama Wali" },
  { key: "nik_wali", label: "NIK Wali" },
];

const openEditModal = (item) => {
  modalMode.value = "edit";
  editingItem.value = {
    _id: item.id || item._id,
    nama: item.nama || "",
    nisn: item.nisn || "",
    nis_lokal: item["nis lokal"] || item.nis_lokal || "",
    nik: item.nik || "",
    no_kk: item["no kk"] || item.no_kk || "",
    tempat_lahir: item["tempat lahir"] || item.tempat_lahir || "",
    tanggal_lahir: item["tanggal lahir"] || item.tanggal_lahir || "",
    kelas: item["tingkat - rombel"] || item.kelas || "",
    jenis_kelamin: item["jenis kelamin"] || item.jenis_kelamin || "",
    alamat: item.alamat || "",
    no_hp: item["no telepon"] || item.no_hp || "",
    no_kip: item["no kip"] || item.no_kip || "",
    nama_ayah_kandung: item["nama ayah kandung"] || item.nama_ayah_kandung || "",
    nama_ibu_kandung: item["nama ibu kandung"] || item.nama_ibu_kandung || "",
    nama_wali: item["nama wali"] || item.nama_wali || "",
    nik_wali: item["nik wali"] || item.nik_wali || "",
  };
  showModal.value = true;
};

const handleFormSubmit = async (formData) => {
  const id = editingItem.value._id;
  const success = await updateItem(id, formData);
  if (success) {
    showModal.value = false;
    clearTableSessionCache("data_siswa");
    clearTableSessionCache("DataSiswa");
    await loadSiswaDetail(true);
  }
};

import { useAcademicYear } from "~/composables/utils/useAcademicYear";

const { currentAcademicYear } = useAcademicYear();

const handleMutasiKeluar = (item) => {
  const id = item.id || item._id;

  Confirm?.show(
    "Mutasi Keluar Siswa",
    `Apakah Anda yakin ingin memutasi keluar ${toTitleCase(item.nama)}? Data siswa akan dipindahkan ke menu Mutasi dan dihapus dari daftar siswa aktif.`,
    "Ya, Mutasi Keluar",
    "Batal",
    async () => {
      try {
        const now = new Date();
        const tanggalMutasi = now.toISOString().slice(0, 10);

        const rawClass = item.kelas || item["tingkat - rombel"] || "";
        let classTingkat = rawClass;

        if (Array.isArray(dataKelas.value)) {
          const foundClass = dataKelas.value.find(
            (c) =>
              c.id_kelas === rawClass ||
              c.idKelas === rawClass ||
              c.nama_kelas === rawClass ||
              c.namaKelas === rawClass,
          );
          if (foundClass && foundClass.tingkat) {
            classTingkat = foundClass.tingkat;
          }
        }

        const mutasiRecord = {
          nama: item.nama || "",
          nisn: item.nisn || item["nisn"] || "",
          nis_lokal: item["nis lokal"] || item.nis_lokal || "",
          nik: item.nik || "",
          no_kk: item["no kk"] || item.no_kk || "",
          tempat_lahir: item["tempat lahir"] || item.tempat_lahir || "",
          tanggal_lahir: item["tanggal lahir"] || item.tanggal_lahir || "",
          kelas: classTingkat,
          tahun_ajaran: currentAcademicYear.value || "",
          jenis_kelamin: item["jenis kelamin"] || item.jenis_kelamin || "",
          alamat: item.alamat || "",
          no_hp: item["no telepon"] || item.no_hp || "",
          no_kip: item["no kip"] || item.no_kip || "",
          nama_ayah_kandung: item["nama ayah kandung"] || item.nama_ayah_kandung || "",
          nama_ibu_kandung: item["nama ibu kandung"] || item.nama_ibu_kandung || "",
          nama_wali: item["nama wali"] || item.nama_wali || "",
          nik_wali: item["nik wali"] || item.nik_wali || "",
          jenis_mutasi: "Pindah Keluar",
          tanggal_mutasi: tanggalMutasi,
          keterangan: "",
          sekolah_tujuan: "",
        };

        await postToApi("mutasi_siswa", mutasiRecord);
        await deleteFromApi("data_siswa", id);

        Notify?.success?.(`${toTitleCase(item.nama)} berhasil dimutasi keluar dan data dipindahkan ke menu Mutasi.`);
        clearTableSessionCache("data_siswa");
        clearTableSessionCache("mutasi_siswa");
        router.push("/akademik/siswa");
      } catch (err) {
        console.error("Gagal memproses mutasi keluar:", err);
        Notify?.failure?.("Gagal memproses mutasi keluar siswa.");
      }
    },
  );
};

const handleDelete = (item) => {
  const id = item.id || item._id;
  deleteItem(id, toTitleCase(item.nama));
  router.push("/akademik/siswa");
};

const route = useRoute();
const router = useRouter();
const { Notify, Confirm } = useNotiflix();

const siswaDetail = ref(null);

// Map kelas ID to its details
const kelasMap = computed(() => {
  const map = {};
  if (Array.isArray(dataKelas.value)) {
    dataKelas.value.forEach((k) => {
      if (k.idKelas) {
        map[k.idKelas] = k;
      }
    });
  }
  return map;
});

const getClassName = (classId) => {
  if (!classId) return "-";
  const classInfo = kelasMap.value[classId];
  return classInfo ? classInfo.namaKelas : classId;
};

const loading = ref(true);
const error = ref(null);

// Fields array mapping all student parameters
const biodataFields = [
  { label: "Nama Lengkap", key: "nama" },
  { label: "NISN", key: "nisn" },
  { label: "NIS Lokal", key: "nis lokal" },
  { label: "NIK", key: "nik" },
  { label: "No Kartu Keluarga", key: "no kk" },
  { label: "Tempat Lahir", key: "tempat lahir" },
  { label: "Tanggal Lahir", key: "tanggal lahir" },
  { label: "Tingkat - Rombel", key: "tingkat - rombel" },
  { label: "Umur", key: "umur" },
  { label: "Jenis Kelamin", key: "jenis kelamin" },
  { label: "Alamat", key: "alamat" },
  { label: "No Telepon", key: "no telepon" },
  { label: "No KIP", key: "no kip" },
  { label: "Nama Ayah Kandung", key: "nama ayah kandung" },
  { label: "Nama Ibu Kandung", key: "nama ibu kandung" },
  { label: "Nama Wali", key: "nama wali" },
  { label: "NIK Wali", key: "nik wali" },
];

const formattedBiodataFields = computed(() => {
  if (!siswaDetail.value) return [];
  return biodataFields.map((item) => {
    let val = "-";
    if (item.key === "tingkat - rombel") {
      val = getClassName(siswaDetail.value[item.key]);
    } else if (item.key === "umur") {
      val = calculateAge(siswaDetail.value["tanggal lahir"] || siswaDetail.value.tanggal_lahir);
    } else if (item.key === "tanggal lahir") {
      val = formatIndonesianDate(siswaDetail.value[item.key]);
    } else {
      val = siswaDetail.value[item.key] || "-";
    }
    return {
      label: item.label,
      value: val,
    };
  });
});

const toTitleCase = (str) => {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getJenisKelaminAbbr = (jk) => {
  if (!jk) return "-";
  const upper = String(jk).toUpperCase();
  if (upper.startsWith("L")) return "L";
  if (upper.startsWith("P")) return "P";
  return jk;
};

const parseIndonesianDate = (dateStr) => {
  if (!dateStr) return null;
  let s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s);
  }
  const monthsMap = {
    jan: 'Jan', januari: 'Jan',
    feb: 'Feb', peb: 'Feb', februari: 'Feb', pebruari: 'Feb',
    mar: 'Mar', maret: 'Mar',
    apr: 'Apr', april: 'Apr',
    mei: 'May',
    jun: 'Jun', juni: 'Jun',
    jul: 'Jul', juli: 'Jul',
    agt: 'Aug', agu: 'Aug', agustus: 'Aug',
    sep: 'Sep', september: 'Sep',
    okt: 'Oct', oktober: 'Oct',
    nov: 'Nov', nop: 'Nov', november: 'Nov', nopember: 'Nov',
    des: 'Dec', desember: 'Dec'
  };
  for (const [indo, eng] of Object.entries(monthsMap)) {
    const regex = new RegExp(`\\b${indo}\\b`, 'i');
    if (regex.test(s)) {
      s = s.replace(regex, eng);
      break;
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const calculateAge = (birthDateString) => {
  if (!birthDateString) return "-";
  if (typeof birthDateString === "string" && birthDateString.includes("Tahun")) {
    return birthDateString;
  }
  const birthDate = parseIndonesianDate(birthDateString);
  if (!birthDate) return "-";
  
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return `${years} Tahun, ${months} Bulan, ${days} Hari`;
};

const formatIndonesianDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = parseIndonesianDate(dateStr);
  if (!date) return dateStr;
  
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

// Load student details based on route param (nis lokal)
async function loadSiswaDetail(force = false) {
  loading.value = true;
  error.value = null;

  try {
    // Force load student and class databases
    await loadData("DataSiswa", force);
    await loadDataKelas("DataKelas", force);

    const nisLokal = route.params.id;

    let foundItem = null;

    if (nisLokal !== undefined && nisLokal !== null) {
      foundItem = dataSiswa.value.find(
        (item) =>
          item && String(item["nis lokal"]).trim() === String(nisLokal).trim(),
      );
    }

    if (foundItem) {
      siswaDetail.value = foundItem;
    } else {
      // Fallback: cari di database mutasi_siswa
      await loadDataMutasi("mutasi_siswa");
      let mutasiItem = null;
      if (nisLokal !== undefined && nisLokal !== null) {
        mutasiItem = dataMutasi.value.find(
          (item) =>
            item &&
            (String(item.nis_lokal || "").trim() === String(nisLokal).trim() ||
             String(item["nis lokal"] || "").trim() === String(nisLokal).trim()),
        );
      }

      if (mutasiItem) {
        // Normalisasi field mutasi agar sesuai dengan tampilan detail siswa
        siswaDetail.value = {
          ...mutasiItem,
          nama: mutasiItem.nama || "",
          nisn: mutasiItem.nisn || "",
          "nis lokal": mutasiItem.nis_lokal || mutasiItem["nis lokal"] || "",
          nik: mutasiItem.nik || "",
          "no kk": mutasiItem.no_kk || mutasiItem["no kk"] || "",
          "tempat lahir": mutasiItem.tempat_lahir || mutasiItem["tempat lahir"] || "",
          "tanggal lahir": mutasiItem.tanggal_lahir || mutasiItem["tanggal lahir"] || "",
          "tingkat - rombel": mutasiItem.kelas || "",
          kelas: mutasiItem.kelas || "",
          "jenis kelamin": mutasiItem.jenis_kelamin || mutasiItem["jenis kelamin"] || "",
          alamat: mutasiItem.alamat || "",
          "no telepon": mutasiItem.no_telepon || mutasiItem["no telepon"] || "",
          "no kip": mutasiItem.no_kip || mutasiItem["no kip"] || "",
          "nama ayah kandung": mutasiItem.nama_ayah_kandung || mutasiItem["nama ayah kandung"] || "",
          "nama ibu kandung": mutasiItem.nama_ibu_kandung || mutasiItem["nama ibu kandung"] || "",
          "nama wali": mutasiItem.nama_wali || mutasiItem["nama wali"] || "",
          "nik wali": mutasiItem.nik_wali || mutasiItem["nik wali"] || "",
          _isMutasi: true,
        };
      } else {
        error.value = "Siswa tidak ditemukan atau data belum terunduh.";
      }
    }
  } catch (err) {
    error.value = "Gagal memuat detail profil siswa: " + err.message;
  } finally {
    loading.value = false;
  }
}

// Classmates listing computed property
const relatedItems = computed(() => {
  if (!siswaDetail.value || !Array.isArray(dataSiswa.value)) return [];

  const targetClass = siswaDetail.value["tingkat - rombel"];
  return dataSiswa.value
    .filter(
      (item) =>
        item.nama !== siswaDetail.value.nama &&
        item["tingkat - rombel"] === targetClass,
    )
    .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""))
    .map((item) => ({
      ...item,
      displayTitle: toTitleCase(item.nama),
      genderAbbr: getJenisKelaminAbbr(item["jenis kelamin"]),
    }));
});

// Navigate back to listing
const goBack = () => {
  router.push("/akademik/siswa");
};

// Navigate to another classmate's detail
const navigateToDetail = (item) => {
  const nisLokal = item["nis lokal"];
  if (nisLokal) {
    router.push(`/akademik/siswa/detail/${nisLokal}`);
  }
};

// Watch for route ID change to reload
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== undefined && newId !== oldId) {
      loadSiswaDetail();
    }
  },
);

onMounted(() => {
  loadSiswaDetail();
});
</script>