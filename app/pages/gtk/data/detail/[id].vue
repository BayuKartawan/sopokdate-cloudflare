<!-- \src\views\gtk\GtkDetailView.vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Breadcrumb Components -->

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="flex items-center gap-2">
          <svg
            class="w-5 h-5 animate-spin text-gray-500"
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
          <span class="text-gray-500">Memuat detail...</span>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center p-4 rounded-lg bg-red-900/20 text-red-400"
      >
        <h3 class="text-lg font-medium mb-1">Data tidak ditemukan</h3>
        <p class="text-sm">{{ error }}</p>
      </div>

      <!-- Detail Content -->
      <div v-else-if="gtkDetail" class="space-y-6">
        <!-- Header -->
        <div class="rounded-lg p-6 bg-zinc-800">
          <div class="flex items-center gap-4">
            <UserCircle class="h-8 w-8 text-emerald-400" />
            <div>
              <h1 class="text-2xl font-semibold mb-1 text-white">
                {{ gtkDetail.title }}
              </h1>
              <p class="text-sm text-zinc-400">
                {{ gtkDetail.Tugas }}
              </p>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Left Column - Details -->
          <div class="lg:col-span-3">
            <!-- Information Card -->
            <div class="rounded-lg p-6 bg-zinc-800">
              <div class="flex items-center gap-2 mb-4">
                <Info class="w-5 h-5 text-emerald-400" />
                <h2 class="text-lg font-medium text-white">Informasi Detail</h2>
              </div>

              <div class="divide-y divide-zinc-700">
                <!-- Nama -->
                <div class="py-3 grid grid-cols-3 gap-4 text-sm">
                  <dt class="text-zinc-300">Nama</dt>
                  <dd class="col-span-2 flex items-center gap-2">
                    <span
                      class="flex-1 select-all cursor-pointer text-white"
                      @click="copyToClipboard(gtkDetail.title)"
                      title="Klik untuk menyalin"
                    >
                      {{ gtkDetail.title }}
                    </span>
                  </dd>
                </div>

                <!-- Dynamic Fields -->
                <div
                  v-for="(item, index) in biodataFields"
                  :key="index"
                  class="py-3 grid grid-cols-3 gap-4 text-sm"
                >
                  <dt class="text-zinc-300">
                    {{ item.label }}
                  </dt>
                  <dd class="col-span-2 flex items-center gap-2">
                    <span
                      class="flex-1 select-all cursor-pointer text-white"
                      @click="copyToClipboard(gtkDetail[item.key] || '-')"
                      title="Klik untuk menyalin"
                    >
                      {{ gtkDetail[item.key] || "-" }}
                    </span>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Related Items -->
          <div>
            <div class="rounded-lg p-4 bg-zinc-800">
              <h3 class="text-sm font-medium mb-3 text-white">GTK Terkait</h3>
              <div class="space-y-2">
                <button
                  v-for="(item, index) in relatedItems"
                  :key="index"
                  @click="navigateToDetail(item)"
                  class="w-full text-left px-3 py-2 rounded text-sm transition-colors hover:bg-zinc-700 text-zinc-300"
                >
                  {{ item.displayTitle }}
                </button>

                <p
                  v-if="relatedItems.length === 0"
                  class="text-sm text-center py-2 text-zinc-500"
                >
                  Tidak ada item terkait
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Info, UserCircle } from "lucide-vue-next";

import { ref, computed, onMounted, watch } from "vue";

import { useTableData } from "~/composables/data/useTableData";
import { useNotiflix } from "~/composables/ui/useFeedback";

const { cardData, loadData } = useTableData();
const route = useRoute();
const router = useRouter();
const { Notify } = useNotiflix();
const gtkDetail = ref(null);
const loading = ref(true);
const error = ref(null);
const dataGtk = ref([]);

// TAMBAHKAN BLOK DI BAWAH INI
watch(
  () => route.params.id,
  (newId, oldId) => {
    // Pastikan fungsi untuk memuat data dipanggil lagi saat ID berubah
    // Pengecekan newId !== oldId mencegah pemanggilan ulang yang tidak perlu.
    if (newId && newId !== oldId) {
      loadGtkDetail();
    }
  },
);
async function loadGtkDetail() {
  loading.value = true;
  error.value = null;

  try {
    // Tunggu sampai data selesai dimuat oleh komposabel
    await loadData("DataGtk");

    // Gunakan data dari komposabel jika tersedia
    if (cardData.value && cardData.value.length > 0) {
      dataGtk.value = cardData.value;
    } else {
      // Fallback ke local storage langsung jika komposabel tidak berhasil
      const storedDataGtk = localStorage.getItem("DataGtk");
      if (storedDataGtk) {
        dataGtk.value = JSON.parse(storedDataGtk);
      }
    }

    // Cari item berdasarkan parameter route (PegID atau database ID)
    const pegId = route.params.id;

    let foundItem = null;

    if (pegId !== undefined && pegId !== null) {
      foundItem = dataGtk.value.find(
        (item) => item && (
          String(item.PegID).trim() === String(pegId).trim() ||
          String(item.id).trim() === String(pegId).trim()
        )
      );
    }

    if (foundItem) {
      gtkDetail.value = foundItem;
    } else {
      error.value = "Item GTK tidak ditemukan";
    }
  } catch (err) {
    error.value = "Gagal memuat detail GTK: " + err.message;
  } finally {
    loading.value = false;
  }
}

// Format teks menjadi huruf besar di awal kata
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
}

// Menampilkan SEMUA item terkait dengan format teks yang dimodifikasi
const relatedItems = computed(() => {
  if (!gtkDetail.value) return [];

  // Hapus .slice(0, 3) untuk menampilkan semua data yang relevan
  // Kita tetap menggunakan .filter agar item yang sedang dibuka tidak muncul lagi di daftar "terkait".
  return dataGtk.value
    .filter((item) => item.title !== gtkDetail.value.title)
    .map((item) => ({
      ...item,
      displayTitle: toTitleCase(item.title),
    }));
});

function navigateToDetail(item) {
  const pegId = item.PegID;
  if (pegId) {
    router.push(`/akademik/gtk/detail/${pegId}`);
  }
}

const biodataFields = [
  { label: "Tugas", key: "Tugas" },
  { label: "Wali Kelas", key: "WaliKelas" },
  { label: "NPK", key: "NPK" },
  { label: "NUPTK", key: "NUPTK" },
  { label: "NRG", key: "NRG" },
  { label: "PegID", key: "PegID" },
  { label: "NIK", key: "NIK" },
  { label: "No Kartu Keluarga", key: "NoKK" },
  { label: "No Rekening", key: "NoRek" },
  { label: "Pendidikan Terakhir", key: "PendTerakhir" },
  { label: "Jurusan", key: "Jurusan" },
  { label: "Status Kepegawaian", key: "StatusKepegawaian" },
  { label: "NIP", key: "NIP" },
  { label: "Jenis Kelamin", key: "JenisKelamin" },
  { label: "Tempat Lahir", key: "TempatLahir" },
  { label: "Tanggal Lahir", key: "TanggalLahir" },
  { label: "Nomor Hp", key: "NomorHp" },
  { label: "Email", key: "Email" },
  { label: "Mata Pelajaran", key: "MataPelajaran" },
];

// Fungsi untuk menyalin teks ke clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    Notify.success("Teks berhasil disalin!");
  } catch {
    Notify.failure("Gagal menyalin!");
  }
};

onMounted(() => {
  loadGtkDetail();
});
</script>
