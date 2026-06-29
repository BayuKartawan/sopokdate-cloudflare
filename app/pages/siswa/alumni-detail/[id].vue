<!-- app/pages/siswa/alumni-detail/[id].vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-16">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span class="text-zinc-400 font-medium text-base">Memuat detail profil alumni...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error"
        class="text-center p-6 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 max-w-lg mx-auto mt-8">
        <h3 class="text-lg font-bold mb-2">Data tidak ditemukan</h3>
        <p class="text-sm text-zinc-400 mb-4">{{ error }}</p>
        <BaseButton text="Kembali ke Daftar" @click="goBack" class="!bg-indigo-600 hover:!bg-indigo-500" />
      </div>

      <!-- Detail Content -->
      <div v-else-if="alumniDetail" class="space-y-6">
        <!-- Breadcrumb / Back Navigation -->
        <div class="flex items-center gap-2 text-zinc-400 text-sm">
          <NuxtLink to="/akademik/alumni" class="hover:text-indigo-400 transition-colors">Data Alumni</NuxtLink>
          <span>/</span>
          <span class="text-zinc-200 font-medium">{{
            toTitleCase(alumniDetail.nama)
          }}</span>
        </div>

        <!-- Header Card -->
        <div class="rounded-xl p-6 bg-zinc-900/30 border border-zinc-800/60 shadow-md relative overflow-hidden">
          <!-- Decorative glass highlight -->
          <div class="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl"></div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div class="flex items-center gap-4">
              <!-- Photo / Avatar Block -->
              <div
                class="w-14 h-14 rounded-xl flex items-center justify-center bg-zinc-800 text-zinc-200 shrink-0 overflow-hidden border border-zinc-700/50">
                <img v-if="
                  alumniDetail.foto && alumniDetail.foto.startsWith('http')
                " :src="alumniDetail.foto" alt="Foto Alumni" class="w-full h-full object-cover" />
                <div v-else
                  class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600/30 to-violet-600/20 text-indigo-300 font-bold text-2xl">
                  {{ getInitials(alumniDetail.nama) }}
                </div>
              </div>

              <div>
                <h1 class="text-2xl font-bold text-[var(--text-heading)] mb-1">
                  {{ toTitleCase(alumniDetail.nama) }}
                </h1>
                <div class="flex flex-wrap gap-2 items-center text-sm">
                  <span class="text-zinc-400">NISN: {{ alumniDetail.nisn || "-" }}</span>
                  <span class="text-zinc-600">•</span>
                  <span
                    class="bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-semibold border border-indigo-500/20 dark:border-indigo-900/30">
                    Lulus Tahun {{ alumniDetail.thn_lulus || "-" }}
                  </span>
                </div>
              </div>
            </div>
            <div class="shrink-0 flex gap-2">
              <template v-if="isAdmin">
                <button
                  @click="openEditModal(alumniDetail)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all"
                >
                  <Pencil class="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  @click="handleDelete(alumniDetail)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  Kembalikan ke Siswa
                </button>
              </template>
              <BaseButton v-if="alumniDetail.no_hp" text="Hubungi Alumni" @click="callAlumni(alumniDetail.no_hp)"
                class="!bg-indigo-600 hover:!bg-indigo-500">
                <template #icon>
                  <Phone class="w-4 h-4" />
                </template>
              </BaseButton>
              <BaseButton text="Kembali" @click="goBack" class="!bg-zinc-800 hover:!bg-zinc-700 w-full sm:w-auto" />
            </div>
          </div>
        </div>

        <!-- Main Details Section -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Left Columns - Detail Biodata (3/4 width) -->
          <div class="lg:col-span-3 space-y-6">
            <!-- Profil Alumni Card -->
            <div class="rounded-xl p-6 bg-zinc-900/30 border border-zinc-800/60 shadow-sm">
              <div class="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
                <Info class="w-5 h-5 text-indigo-400" />
                <h2 class="text-lg font-bold text-[var(--text-heading)]">
                  Biodata Lengkap Alumni
                </h2>
              </div>

              <div class="divide-y divide-zinc-800/60">
                <!-- Dynamic Fields Render -->
                <div v-for="(item, index) in biodataFields" :key="index"
                  class="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 text-sm">
                  <dt class="text-zinc-400 font-medium">
                    {{ item.label }}
                  </dt>
                  <dd class="sm:col-span-2 flex items-center gap-2 group">
                    <span
                      class="flex-1 select-all cursor-pointer text-zinc-100 hover:text-indigo-400 transition-colors font-medium break-all"
                      @click="
                        copyToClipboard(
                          alumniDetail[item.key] || '-',
                          item.label,
                        )
                        " title="Klik untuk menyalin">
                      {{ alumniDetail[item.key] || "-" }}
                    </span>
                    <span
                      class="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0 border border-zinc-700/30"
                      @click="
                        copyToClipboard(
                          alumniDetail[item.key] || '-',
                          item.label,
                        )
                        ">
                      Salin
                    </span>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Year Classmates Sidebar (1/4 width) -->
          <div>
            <div class="rounded-xl p-4 bg-zinc-900/30 border border-zinc-800/60 shadow-sm sticky top-20">
              <div class="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-800">
                <Users class="w-4 h-4 text-indigo-400" />
                <h3 class="text-sm font-bold text-[var(--text-heading)]">
                  Lulus Seangkatan ({{ alumniDetail.thn_lulus || "-" }})
                </h3>
              </div>

              <!-- List of classmates -->
              <div class="space-y-1 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                <button v-for="(item, index) in relatedItems" :key="index" @click="navigateToDetail(item)"
                  class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-zinc-800/60 text-zinc-400 hover:text-indigo-400 flex items-center justify-between">
                  <span class="truncate pr-2">{{ item.displayTitle }}</span>
                  <span
                    class="text-[9px] bg-zinc-800 border border-zinc-700/30 text-zinc-400 px-1 rounded font-mono shrink-0">
                    {{ item.genderAbbr }}
                  </span>
                </button>

                <p v-if="relatedItems.length === 0" class="text-xs text-center py-6 text-zinc-500">
                  Tidak ada alumni seangkatan lainnya
                </p>
              </div>
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
    title="Edit Data Alumni"
    :fields="alumniFields"
    :initialData="editingItem"
    :isSaving="isSaving"
    @submit="handleFormSubmit"
    @close="showModal = false"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Info, UserCircle, Users, Phone, Pencil, Trash2 } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { fetchFromApi, postToApi, deleteFromApi } from "~/utils/api";
import { clearTableSessionCache } from "~/composables/data/useTableData";

const { cardData: dataAlumni, loadData, refreshData } = useTableData();

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
  { key: "umur", label: "Umur saat Lulus" },
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
    umur: item.umur || "",
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
          umur: item.umur || "",
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

const toTitleCase = (str) => {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

const getJenisKelaminAbbr = (jk) => {
  if (!jk) return "-";
  const upper = String(jk).toUpperCase();
  if (upper.startsWith("L")) return "L";
  if (upper.startsWith("P")) return "P";
  return jk;
};

const callAlumni = (phone) => {
  if (!phone) return;
  const cleanPhone = String(phone).replace(/[^0-9]/g, "");
  window.open(
    `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}`,
    "_blank",
  );
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
