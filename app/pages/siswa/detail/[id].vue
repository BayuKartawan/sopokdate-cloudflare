<!-- app/pages/siswa/detail/[id].vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="flex items-center gap-3">
          <svg
            class="w-5 h-5 animate-spin text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span class="text-zinc-400 font-medium text-sm">Memuat detail profil siswa...</span>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center p-6 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 max-w-lg mx-auto mt-8"
      >
        <h3 class="text-base font-bold mb-2">Data tidak ditemukan</h3>
        <p class="text-sm text-zinc-400 mb-4">{{ error }}</p>
        <BaseButton text="Kembali ke Daftar" @click="goBack" />
      </div>

      <!-- Detail Content -->
      <div v-else-if="siswaDetail" class="space-y-4">

        <!-- Breadcrumb -->
        <div class="flex items-center gap-1.5 text-zinc-400 text-xs">
          <NuxtLink
            to="/akademik/siswa"
            class="hover:text-emerald-400 transition-colors"
          >Data Siswa</NuxtLink>
          <span class="text-zinc-600">/</span>
          <span class="text-zinc-300 font-medium truncate">{{ toTitleCase(siswaDetail.nama) }}</span>
        </div>

        <!-- Header Card -->
        <div class="rounded-xl p-4 sm:p-5 bg-zinc-800/40 border border-zinc-700/30 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-start gap-4">
            <!-- Avatar + Info -->
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              >
                <UserCircle class="h-8 w-8 sm:h-9 sm:w-9" />
              </div>
              <div class="min-w-0">
                <h1 class="text-lg sm:text-xl font-bold text-[var(--text-heading)] leading-tight truncate">
                  {{ toTitleCase(siswaDetail.nama) }}
                </h1>
                <div class="flex flex-wrap gap-2 items-center mt-1">
                  <span class="text-zinc-400 text-xs">NISN: {{ siswaDetail.nisn || "-" }}</span>
                  <span class="text-zinc-600 text-xs">•</span>
                  <span
                    v-if="siswaDetail._isMutasi"
                    class="bg-orange-500/10 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded text-xs font-semibold"
                  >
                    Status: Mutasi ({{ siswaDetail.kelas || siswaDetail["tingkat - rombel"] || '-' }})
                  </span>
                  <span
                    v-else
                    class="bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-xs font-semibold"
                  >
                    Kelas {{ getClassName(siswaDetail["tingkat - rombel"]) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <template v-if="isAdmin && !siswaDetail._isMutasi">
                <button
                  @click="openEditModal(siswaDetail)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all"
                >
                  <Pencil class="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  @click="handleMutasiKeluar(siswaDetail)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 transition-all"
                >
                  <LogOut class="w-3.5 h-3.5" />
                  Mutasi Keluar
                </button>
              </template>
              <BaseButton
                text="Kembali"
                @click="goBack"
                class="text-xs"
              />
            </div>
          </div>
        </div>

        <!-- Main Details Section -->
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-4">

          <!-- Left - Biodata (3/4) -->
          <div class="xl:col-span-3">
            <div class="rounded-xl bg-zinc-800/40 border border-zinc-700/30 shadow-sm overflow-hidden">
              <!-- Card Header -->
              <div class="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-zinc-700/50">
                <Info class="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <h2 class="text-sm font-bold text-[var(--text-heading)]">Biodata Lengkap Siswa</h2>
              </div>

              <!-- Fields — 2-col grid on md+, stacked on mobile -->
              <div class="p-4 sm:p-5">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 divide-y divide-zinc-700/30 md:divide-y-0">
                  <div
                    v-for="(item, index) in biodataFields"
                    :key="index"
                    class="py-2.5 md:border-b md:border-zinc-700/30"
                  >
                    <dt class="text-[11px] uppercase tracking-wide text-zinc-500 font-medium mb-0.5">
                      {{ item.label }}
                    </dt>
                    <dd class="flex items-center gap-2 group">
                      <span
                        class="flex-1 text-sm text-zinc-100 hover:text-emerald-400 transition-colors font-medium break-all select-all cursor-pointer leading-snug"
                        @click="copyToClipboard(
                          item.key === 'tingkat - rombel'
                            ? getClassName(siswaDetail[item.key])
                            : item.key === 'umur'
                            ? calculateAge(siswaDetail['tanggal lahir'] || siswaDetail.tanggal_lahir)
                            : item.key === 'tanggal lahir'
                            ? formatIndonesianDate(siswaDetail[item.key])
                            : siswaDetail[item.key] || '-',
                          item.label,
                        )"
                        title="Klik untuk menyalin"
                      >
                        {{
                          item.key === "tingkat - rombel"
                            ? getClassName(siswaDetail[item.key])
                            : item.key === "umur"
                            ? calculateAge(siswaDetail["tanggal lahir"] || siswaDetail.tanggal_lahir)
                            : item.key === "tanggal lahir"
                            ? formatIndonesianDate(siswaDetail[item.key])
                            : siswaDetail[item.key] || "-"
                        }}
                      </span>
                      <span
                        class="text-[9px] bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                        @click="copyToClipboard(
                          item.key === 'tingkat - rombel'
                            ? getClassName(siswaDetail[item.key])
                            : item.key === 'umur'
                            ? calculateAge(siswaDetail['tanggal lahir'] || siswaDetail.tanggal_lahir)
                            : item.key === 'tanggal lahir'
                            ? formatIndonesianDate(siswaDetail[item.key])
                            : siswaDetail[item.key] || '-',
                          item.label,
                        )"
                      >
                        Salin
                      </span>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right - Classmates Sidebar (1/4) -->
          <div class="xl:col-span-1">
            <div class="rounded-xl bg-zinc-800/40 border border-zinc-700/30 shadow-sm xl:sticky xl:top-20">
              <!-- Sidebar Header -->
              <div class="flex items-center gap-2 px-4 py-3 border-b border-zinc-700/50">
                <Users class="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <h3 class="text-xs font-bold text-[var(--text-heading)] leading-tight">
                  Siswa Sekelas
                  <span class="block text-zinc-400 font-normal">({{ getClassName(siswaDetail["tingkat - rombel"]) }})</span>
                </h3>
              </div>

              <!-- List -->
              <div class="p-2 max-h-72 xl:max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                <button
                  v-for="(item, index) in relatedItems"
                  :key="index"
                  @click="navigateToDetail(item)"
                  class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-zinc-700/40 text-zinc-400 hover:text-emerald-400 flex items-center justify-between gap-2"
                >
                  <span class="truncate">{{ item.displayTitle }}</span>
                  <span class="text-[9px] bg-zinc-700/80 text-zinc-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                    {{ item.genderAbbr }}
                  </span>
                </button>

                <p
                  v-if="relatedItems.length === 0"
                  class="text-xs text-center py-8 text-zinc-500"
                >
                  Tidak ada siswa sekelas lainnya
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

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
import { Info, UserCircle, Users, Pencil, LogOut } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
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

        const mutasiRecord = {
          nama: item.nama || "",
          nisn: item.nisn || item["nisn"] || "",
          nis_lokal: item["nis lokal"] || item.nis_lokal || "",
          nik: item.nik || "",
          no_kk: item["no kk"] || item.no_kk || "",
          tempat_lahir: item["tempat lahir"] || item.tempat_lahir || "",
          tanggal_lahir: item["tanggal lahir"] || item.tanggal_lahir || "",
          kelas: item["tingkat - rombel"] || item.kelas || "",
          umur: calculateAge(item["tanggal lahir"] || item.tanggal_lahir),
          jenis_kelamin: item["jenis kelamin"] || item.jenis_kelamin || "",
          alamat: item.alamat || "",
          no_hp: item["no telepon"] || item.no_hp || "",
          no_kip: item["no kip"] || item.no_kip || "",
          nama_ayah_kandung: item["nama ayah kandung"] || item.nama_ayah_kandung || "",
          nama_ibu_kandung: item["nama ibu kandung"] || item.nama_ibu_kandung || "",
          nama_wali: item["nama wali"] || item.nama_wali || "",
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
];

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
async function loadSiswaDetail() {
  loading.value = true;
  error.value = null;

  try {
    // Force load student and class databases
    await loadData("DataSiswa");
    await loadDataKelas("DataKelas");

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

// Copy detail field value to clipboard
const copyToClipboard = async (text, label) => {
  if (!text || text === "-") return;
  try {
    await navigator.clipboard.writeText(String(text));
    Notify.success(`${label} berhasil disalin!`);
  } catch {
    Notify.failure("Gagal menyalin!");
  }
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

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgb(63 63 70);
  border-radius: 2px;
}
.scrollbar-thin:hover::-webkit-scrollbar-thumb {
  background-color: rgb(82 82 91);
}
</style>