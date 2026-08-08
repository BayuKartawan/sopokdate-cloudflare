<!-- app/pages/siswa/alumni-detail/[id].vue -->
<template>
  <div>
    <SiswaDetailLayout
      :loading="loading"
      loadingText="Memuat detail profil alumni..."
      :error="error"
      :data="alumniDetail"
      :foto="alumniDetail?.foto"
      breadcrumbLink="/akademik/alumni"
      breadcrumbTitle="Data Alumni"
      biodataTitle="Biodata Lengkap Alumni"
      :biodataFields="formattedBiodataFields"
      sidebarTitle="Lulus Seangkatan"
      :sidebarSubtitle="alumniDetail?.thn_lulus ? `Tahun ${alumniDetail.thn_lulus}` : ''"
      :relatedItems="relatedItems"
      emptyRelatedText="Tidak ada alumni seangkatan lainnya"
      @click-back="goBack"
      @click-related="navigateToDetail"
    >
      <template #actions>
        <template v-if="isAdmin">
          <BaseButton
            text="Edit"
            title="Edit data alumni ini"
            @click="openEditModal(alumniDetail)"
          >
            <template #icon>
              <Pencil class="w-3.5 h-3.5" />
            </template>
          </BaseButton>
          <BaseButton
            text="Kembalikan ke Siswa"
            title="Batalkan kelulusan dan kembalikan alumni ini ke daftar siswa aktif"
            @click="handleDelete(alumniDetail)"
          >
            <template #icon>
              <Trash2 class="w-3.5 h-3.5" />
            </template>
          </BaseButton>
        </template>
      </template>
    </SiswaDetailLayout>

    <!-- CRUD Modal -->
    <CrudModal
      :show="showModal"
      :mode="modalMode"
      title="Edit Data Alumni"
      :fields="alumniFields"
      :initialData="editingItem"
      :isSaving="isSaving"
      @submit="handleFormSubmit"
      @close="showModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Pencil, Trash2 } from "lucide-vue-next";
import SiswaDetailLayout from "~/components/siswa/SiswaDetailLayout.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { fetchFromApi, postToApi, deleteFromApi } from "~/utils/api";
import { clearTableSessionCache } from "~/composables/data/useTableData";

const { cardData: dataAlumni, loadData } = useTableData();

const route = useRoute();
const router = useRouter();
const { Notify, Confirm } = useNotiflix();

const { isAdmin, isSaving, updateItem } = useCrud(
  "alumni",
  async () => {
    await loadAlumniDetail();
  },
);

// CRUD Modal state
const showModal = ref(false);
const modalMode = ref("edit");
const editingItem = ref({});

const alumniFields = [
  { key: "nama", label: "Nama Lengkap", required: true },
  { key: "foto", label: "Tautan Foto (URL)" },
  { key: "nis_lokal", label: "NIS Lokal" },
  { key: "nisn", label: "NISN" },
  { key: "nik", label: "NIK" },
  { key: "no_kk", label: "Nomor KK" },
  { key: "tempat_lahir", label: "Tempat Lahir" },
  { key: "tanggal_lahir", label: "Tanggal Lahir", type: "text" },
  {
    key: "jenis_kelamin",
    label: "Jenis Kelamin",
    type: "select",
    options: ["Laki-laki", "Perempuan"],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Lulus", "Berhenti", "Pindah"],
  },
  { key: "thn_lulus", label: "Tahun Lulus", required: true },
  { key: "menjutkan_ke", label: "Melanjutkan Ke (Studi Lanjut)" },
  { key: "alamat", label: "Alamat", type: "textarea" },
  { key: "no_hp", label: "No Telepon / WhatsApp" },
  { key: "no_kip", label: "Nomor KIP/PIP" },
  { key: "nama_ayah_kandung", label: "Nama Ayah Kandung" },
  { key: "nama_ibu_kandung", label: "Nama Ibu Kandung" },
  { key: "nama_wali", label: "Nama Wali" },
];

const openEditModal = (item) => {
  modalMode.value = "edit";
  editingItem.value = {
    _id: item.id || item._id,
    nama: item.nama || "",
    foto: item.foto || "",
    nis_lokal: item.nis_lokal || "",
    nisn: item.nisn || "",
    nik: item.nik || "",
    no_kk: item.no_kk || "",
    tempat_lahir: item.tempat_lahir || "",
    tanggal_lahir: item.tanggal_lahir || "",
    jenis_kelamin: item.jenis_kelamin || "Laki-laki",
    status: item.status || "Lulus",
    thn_lulus: item.thn_lulus || "",
    menjutkan_ke: item.menjutkan_ke || "",
    alamat: item.alamat || "",
    no_hp: item.no_hp || "",
    no_kip: item.no_kip || "",
    nama_ayah_kandung: item.nama_ayah_kandung || "",
    nama_ibu_kandung: item.nama_ibu_kandung || "",
    nama_wali: item.nama_wali || "",
  };
  showModal.value = true;
};

const handleFormSubmit = async (formData) => {
  const id = editingItem.value._id;
  const success = await updateItem(id, formData);
  if (success) {
    showModal.value = false;
  }
};

const handleDelete = (item) => {
  const id = item.id || item._id;

  Confirm?.show(
    "Kembalikan Alumni Menjadi Siswa Aktif",
    `Apakah Anda yakin ingin membatalkan status kelulusan ${toTitleCase(item.nama)}? Siswa ini akan dipindahkan kembali ke Kelas 6 aktif dan dihapus dari data Alumni.`,
    "Ya, Kembalikan",
    "Batal",
    async () => {
      try {
        const classes = await fetchFromApi("data_kelas");
        let targetClassId = "VI-A";

        if (Array.isArray(classes)) {
          const level6Class = classes.find(
            (c) =>
              String(c.tingkat) === "6" ||
              String(c.tingkat).toUpperCase() === "VI",
          );
          if (level6Class && level6Class.id_kelas) {
            targetClassId = level6Class.id_kelas;
          }
        }

        const studentRecord = {
          nama: item.nama,
          nisn: item.nisn || "",
          nis_lokal: item.nis_lokal || "",
          nik: item.nik || "",
          no_kk: item.no_kk || "",
          tempat_lahir: item.tempat_lahir || "",
          tanggal_lahir: item.tanggal_lahir || "",
          kelas: targetClassId,
          jenis_kelamin: item.jenis_kelamin || "Laki-laki",
          alamat: item.alamat || "",
          no_hp: item.no_hp || "",
          no_kip: item.no_kip || "",
          nama_ayah_kandung: item.nama_ayah_kandung || "",
          nama_ibu_kandung: item.nama_ibu_kandung || "",
          nama_wali: item.nama_wali || "",
          status_promosi: "Belum",
        };

        await postToApi("data_siswa", studentRecord);
        await deleteFromApi("alumni", id);

        Notify?.success?.(
          `Berhasil mengembalikan ${toTitleCase(item.nama)} ke kelas ${targetClassId}.`,
        );

        clearTableSessionCache("data_siswa");
        router.push("/akademik/alumni");
      } catch (err) {
        console.error("Gagal memproses pengembalian alumni:", err);
        Notify?.failure?.("Gagal mengembalikan data alumni ke siswa aktif.");
      }
    },
  );
};

const alumniDetail = ref(null);
const loading = ref(true);
const error = ref(null);

// Fields array mapping all alumni parameters
const biodataFields = [
  { label: "Nama Lengkap", key: "nama" },
  { label: "NISN", key: "nisn" },
  { label: "NIS Lokal", key: "nis_lokal" },
  { label: "NIK", key: "nik" },
  { label: "No Kartu Keluarga", key: "no_kk" },
  { label: "Tempat Lahir", key: "tempat_lahir" },
  { label: "Tanggal Lahir", key: "tanggal_lahir" },
  { label: "Umur saat Lulus", key: "umur" },
  { label: "Jenis Kelamin", key: "jenis_kelamin" },
  { label: "Tahun Lulus", key: "thn_lulus" },
  { label: "Studi Lanjut (Melanjutkan Ke)", key: "menjutkan_ke" },
  { label: "Status", key: "status" },
  { label: "Alamat", key: "alamat" },
  { label: "No Telepon", key: "no_hp" },
  { label: "Nomor KIP/PIP", key: "no_kip" },
  { label: "Nama Ayah Kandung", key: "nama_ayah_kandung" },
  { label: "Nama Ibu Kandung", key: "nama_ibu_kandung" },
  { label: "Nama Wali", key: "nama_wali" },
];

const formattedBiodataFields = computed(() => {
  if (!alumniDetail.value) return [];
  return biodataFields.map((item) => {
    let val = "-";
    if (item.key === "umur") {
      val = calculateAge(alumniDetail.value.tanggal_lahir);
    } else if (item.key === "tanggal_lahir") {
      val = formatIndonesianDate(alumniDetail.value[item.key]);
    } else {
      val = alumniDetail.value[item.key] || "-";
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

// Load alumni details based on route param (nis_lokal / ID)
async function loadAlumniDetail() {
  loading.value = true;
  error.value = null;

  try {
    // Force load alumni database
    await loadData("alumni");

    const paramId = route.params.id;

    let foundItem = null;
    if (paramId !== undefined && paramId !== null) {
      foundItem = dataAlumni.value.find(
        (item) =>
          item &&
          (String(item.nis_lokal).trim() === String(paramId).trim() ||
            String(item.id).trim() === String(paramId).trim()),
      );
    }

    if (foundItem) {
      alumniDetail.value = foundItem;
    } else {
      error.value = "Alumni tidak ditemukan atau data belum terunduh.";
    }
  } catch (err) {
    error.value = "Gagal memuat detail profil alumni: " + err.message;
  } finally {
    loading.value = false;
  }
}

// Classmates listing computed property (same graduation year)
const relatedItems = computed(() => {
  if (!alumniDetail.value || !Array.isArray(dataAlumni.value)) return [];

  const targetYear = alumniDetail.value.thn_lulus;
  const currentId = alumniDetail.value.id || alumniDetail.value._id;
  return dataAlumni.value
    .filter(
      (item) =>
        (item.id || item._id) !== currentId &&
        String(item.thn_lulus) === String(targetYear),
    )
    .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""))
    .map((item) => ({
      ...item,
      displayTitle: toTitleCase(item.nama),
      genderAbbr: getJenisKelaminAbbr(item.jenis_kelamin),
    }));
});

// Navigate back to listing
const goBack = () => {
  router.push("/akademik/alumni");
};

// Navigate to another classmate's detail
const navigateToDetail = (item) => {
  const nisLokal = item.nis_lokal;
  if (nisLokal) {
    router.push(`/akademik/alumni/detail/${nisLokal}`);
  }
};

// Watch for route ID change to reload
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== undefined && newId !== oldId) {
      loadAlumniDetail();
    }
  },
);

onMounted(() => {
  loadAlumniDetail();
});
</script>
