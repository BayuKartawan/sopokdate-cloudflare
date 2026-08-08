<!-- app/pages/siswa/mutasi-detail/[id].vue -->
<template>
  <div>
    <SiswaDetailLayout
      :loading="loading"
      loadingText="Memuat detail profil mutasi..."
      :error="error"
      :data="mutasiDetail"
      :foto="mutasiDetail?.foto"
      breadcrumbLink="/akademik/mutasi"
      breadcrumbTitle="Data Mutasi"
      biodataTitle="Biodata Lengkap Siswa Mutasi"
      :biodataFields="formattedBiodataFields"
      sidebarTitle="Mutasi Lainnya"
      :sidebarSubtitle="mutasiDetail?.kelas ? `Kelas ${mutasiDetail.kelas}` : ''"
      :relatedItems="relatedItems"
      emptyRelatedText="Tidak ada data mutasi sekelas lainnya"
      @click-back="goBack"
      @click-related="navigateToDetail"
    >
      <template #actions>
        <template v-if="isAdmin">
          <BaseButton
            text="Edit"
            title="Edit data mutasi siswa ini"
            @click="openEditModal(mutasiDetail)"
          >
            <template #icon>
              <Pencil class="w-3.5 h-3.5" />
            </template>
          </BaseButton>
          <BaseButton
            text="Kembalikan"
            title="Kembalikan siswa ini ke daftar siswa aktif"
            @click="handleKembalikanSiswa(mutasiDetail)"
          >
            <template #icon>
              <Undo2 class="w-3.5 h-3.5" />
            </template>
          </BaseButton>
        </template>
      </template>
    </SiswaDetailLayout>

    <!-- CRUD Modal -->
    <CrudModal
      :show="showModal"
      :mode="modalMode"
      title="Edit Data Mutasi"
      :fields="mutasiFields"
      :initialData="editingItem"
      :isSaving="isSaving"
      @submit="handleFormSubmit"
      @close="showModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Pencil, Undo2 } from "lucide-vue-next";
import SiswaDetailLayout from "~/components/siswa/SiswaDetailLayout.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { fetchFromApi, postToApi, deleteFromApi } from "~/utils/api";
import { clearTableSessionCache } from "~/composables/data/useTableData";

const { cardData: dataMutasi, loadData } = useTableData();

const route = useRoute();
const router = useRouter();
const { Notify, Confirm } = useNotiflix();

const { isAdmin, isSaving, updateItem, deleteItem } = useCrud(
  "mutasi_siswa",
  async () => {
    await loadMutasiDetail();
  },
);

// CRUD Modal state
const showModal = ref(false);
const modalMode = ref("edit");
const editingItem = ref({});

const mutasiFields = [
  { key: "nama", label: "Nama Lengkap", required: true },
  { key: "nisn", label: "NISN" },
  { key: "nis_lokal", label: "NIS Lokal" },
  { key: "nik", label: "NIK" },
  { key: "no_kk", label: "Nomor KK" },
  { key: "tempat_lahir", label: "Tempat Lahir" },
  { key: "tanggal_lahir", label: "Tanggal Lahir" },
  { key: "kelas", label: "Tingkat Kelas" },
  { key: "tahun_ajaran", label: "Tahun Ajaran Mutasi" },
  {
    key: "jenis_kelamin",
    label: "Jenis Kelamin",
    type: "select",
    options: ["Laki-laki", "Perempuan"],
  },
  { key: "alamat", label: "Alamat", type: "textarea" },
  { key: "no_hp", label: "No Telepon / WhatsApp" },
  { key: "no_kip", label: "Nomor KIP/PIP" },
  { key: "nama_ayah_kandung", label: "Nama Ayah Kandung" },
  { key: "nama_ibu_kandung", label: "Nama Ibu Kandung" },
  { key: "nama_wali", label: "Nama Wali" },
  {
    key: "jenis_mutasi",
    label: "Jenis Mutasi",
    type: "select",
    options: ["Pindah Keluar", "Dikeluarkan", "Mengundurkan Diri", "Meninggal Dunia"],
  },
  { key: "sekolah_tujuan", label: "Sekolah Tujuan" },
  { key: "tanggal_mutasi", label: "Tanggal Mutasi", type: "date" },
  { key: "keterangan", label: "Keterangan", type: "textarea" },
];

const openEditModal = (item) => {
  modalMode.value = "edit";
  editingItem.value = {
    _id: item.id || item._id,
    nama: item.nama || "",
    nisn: item.nisn || "",
    nis_lokal: item.nis_lokal || "",
    nik: item.nik || "",
    no_kk: item.no_kk || "",
    tempat_lahir: item.tempat_lahir || "",
    tanggal_lahir: item.tanggal_lahir || "",
    kelas: item.kelas || "",
    tahun_ajaran: item.tahun_ajaran || "",
    jenis_kelamin: item.jenis_kelamin || "Laki-laki",
    alamat: item.alamat || "",
    no_hp: item.no_hp || "",
    no_kip: item.no_kip || "",
    nama_ayah_kandung: item.nama_ayah_kandung || "",
    nama_ibu_kandung: item.nama_ibu_kandung || "",
    nama_wali: item.nama_wali || "",
    jenis_mutasi: item.jenis_mutasi || "Pindah Keluar",
    sekolah_tujuan: item.sekolah_tujuan || "",
    tanggal_mutasi: item.tanggal_mutasi || "",
    keterangan: item.keterangan || "",
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

const handleKembalikanSiswa = (item) => {
  const id = item.id || item._id;

  Confirm?.show(
    "Kembalikan Siswa Aktif",
    `Apakah Anda yakin ingin mengembalikan ${toTitleCase(item.nama)} ke daftar siswa aktif? Data akan dihapus dari daftar mutasi.`,
    "Ya, Kembalikan",
    "Batal",
    async () => {
      try {
        let targetClassId = item.kelas || "";
        try {
          const classes = await fetchFromApi("data_kelas");
          if (Array.isArray(classes)) {
            const matchClass = classes.find(
              (c) =>
                String(c.tingkat).toUpperCase() === String(item.kelas || "").toUpperCase() ||
                String(c.id_kelas).toUpperCase() === String(item.kelas || "").toUpperCase(),
            );
            if (matchClass && matchClass.id_kelas) {
              targetClassId = matchClass.id_kelas;
            }
          }
        } catch (e) {
          console.warn("Gagal memuat data_kelas untuk pemetaaan tingkat:", e);
        }

        const studentRecord = {
          nama: item.nama || "",
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
        await deleteFromApi("mutasi_siswa", id);

        Notify?.success?.(`${toTitleCase(item.nama)} berhasil dikembalikan ke daftar siswa aktif.`);
        clearTableSessionCache("data_siswa");
        clearTableSessionCache("mutasi_siswa");
        router.push("/akademik/mutasi");
      } catch (err) {
        console.error("Gagal mengembalikan siswa:", err);
        Notify?.failure?.("Gagal mengembalikan siswa ke daftar aktif.");
      }
    },
  );
};

const mutasiDetail = ref(null);
const loading = ref(true);
const error = ref(null);

const biodataFields = [
  { label: "Nama Lengkap", key: "nama" },
  { label: "NISN", key: "nisn" },
  { label: "NIS Lokal", key: "nis_lokal" },
  { label: "NIK", key: "nik" },
  { label: "No Kartu Keluarga", key: "no_kk" },
  { label: "Tempat Lahir", key: "tempat_lahir" },
  { label: "Tanggal Lahir", key: "tanggal_lahir" },
  { label: "Umur", key: "umur" },
  { label: "Jenis Kelamin", key: "jenis_kelamin" },
  { label: "Tingkat Kelas", key: "kelas" },
  { label: "Tahun Ajaran Mutasi", key: "tahun_ajaran" },
  { label: "Jenis Mutasi", key: "jenis_mutasi" },
  { label: "Tanggal Mutasi", key: "tanggal_mutasi" },
  { label: "Sekolah Tujuan", key: "sekolah_tujuan" },
  { label: "Keterangan", key: "keterangan" },
  { label: "Alamat", key: "alamat" },
  { label: "No Telepon", key: "no_hp" },
  { label: "Nomor KIP/PIP", key: "no_kip" },
  { label: "Nama Ayah Kandung", key: "nama_ayah_kandung" },
  { label: "Nama Ibu Kandung", key: "nama_ibu_kandung" },
  { label: "Nama Wali", key: "nama_wali" },
];

const formattedBiodataFields = computed(() => {
  if (!mutasiDetail.value) return [];
  return biodataFields.map((item) => {
    let val = "-";
    if (item.key === "umur") {
      val = calculateAge(mutasiDetail.value.tanggal_lahir);
    } else if (item.key === "tanggal_lahir" || item.key === "tanggal_mutasi") {
      val = formatIndonesianDate(mutasiDetail.value[item.key]);
    } else {
      val = mutasiDetail.value[item.key] || "-";
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

// Load mutasi details based on route param (nis_lokal / ID)
async function loadMutasiDetail() {
  loading.value = true;
  error.value = null;

  try {
    await loadData("mutasi_siswa");
    const paramId = route.params.id;

    let foundItem = null;
    if (paramId !== undefined && paramId !== null) {
      foundItem = dataMutasi.value.find(
        (item) =>
          item &&
          (String(item.nis_lokal || "").trim() === String(paramId).trim() ||
            String(item["nis lokal" || ""]).trim() === String(paramId).trim() ||
            String(item.id || "").trim() === String(paramId).trim()),
      );
    }

    if (foundItem) {
      mutasiDetail.value = foundItem;
    } else {
      error.value = "Data mutasi siswa tidak ditemukan atau belum terunduh.";
    }
  } catch (err) {
    error.value = "Gagal memuat detail mutasi siswa: " + err.message;
  } finally {
    loading.value = false;
  }
}

// Related mutasi items (same class)
const relatedItems = computed(() => {
  if (!mutasiDetail.value || !Array.isArray(dataMutasi.value)) return [];

  const targetClass = mutasiDetail.value.kelas;
  const currentId = mutasiDetail.value.id || mutasiDetail.value._id;
  return dataMutasi.value
    .filter(
      (item) =>
        (item.id || item._id) !== currentId &&
        String(item.kelas || "") === String(targetClass || ""),
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
  router.push("/akademik/mutasi");
};

// Navigate to another mutasi detail
const navigateToDetail = (item) => {
  const nisLokal = item.nis_lokal || item["nis lokal"];
  if (nisLokal) {
    router.push(`/akademik/mutasi/detail/${nisLokal}`);
  }
};

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== undefined && newId !== oldId) {
      loadMutasiDetail();
    }
  },
);

onMounted(() => {
  loadMutasiDetail();
});
</script>
