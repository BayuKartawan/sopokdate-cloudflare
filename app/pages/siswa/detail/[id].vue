<!-- app/pages/siswa/detail/[id].vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-16">
        <div class="flex items-center gap-3">
          <svg
            class="w-6 h-6 animate-spin text-emerald-500"
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
          <span class="text-zinc-400 font-medium text-base"
            >Memuat detail profil siswa...</span
          >
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center p-6 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 max-w-lg mx-auto mt-8"
      >
        <h3 class="text-lg font-bold mb-2">Data tidak ditemukan</h3>
        <p class="text-sm text-zinc-400 mb-4">{{ error }}</p>
        <BaseButton text="Kembali ke Daftar" @click="goBack" />
      </div>

      <!-- Detail Content -->
      <div v-else-if="siswaDetail" class="space-y-6">
        <!-- Breadcrumb / Back Navigation -->
        <div class="flex items-center gap-2 text-zinc-400 text-sm">
          <NuxtLink
            to="/akademik/siswa"
            class="hover:text-emerald-400 transition-colors"
            >Data Siswa</NuxtLink
          >
          <span>/</span>
          <span class="text-zinc-200 font-medium">{{
            toTitleCase(siswaDetail.nama)
          }}</span>
        </div>

        <!-- Header Card -->
        <div
          class="rounded-xl p-6 bg-zinc-800/40 border border-zinc-700/30 shadow-md"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              >
                <UserCircle class="h-9 w-9" />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-[var(--text-heading)] mb-1">
                  {{ toTitleCase(siswaDetail.nama) }}
                </h1>
                <div class="flex flex-wrap gap-2 items-center text-sm">
                  <span class="text-zinc-400"
                    >NISN: {{ siswaDetail.nisn || "-" }}</span
                  >
                  <span class="text-zinc-600">•</span>
                  <span
                    class="bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-xs font-semibold"
                  >
                    Kelas {{ getClassName(siswaDetail["tingkat - rombel"]) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="shrink-0">
              <BaseButton
                text="Kembali ke Daftar"
                @click="goBack"
                class="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>

        <!-- Main Details Section -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Left Columns - Detail Biodata (3/4 width) -->
          <div class="lg:col-span-3 space-y-6">
            <!-- Profil Siswa Card -->
            <div
              class="rounded-xl p-6 bg-zinc-800/40 border border-zinc-700/30 shadow-sm"
            >
              <div
                class="flex items-center gap-2 mb-6 border-b border-zinc-700/50 pb-3"
              >
                <Info class="w-5 h-5 text-emerald-400" />
                <h2 class="text-lg font-bold text-[var(--text-heading)]">
                  Biodata Lengkap Siswa
                </h2>
              </div>

              <div class="divide-y divide-zinc-700/50">
                <!-- Dynamic Fields Render -->
                <div
                  v-for="(item, index) in biodataFields"
                  :key="index"
                  class="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 text-sm"
                >
                  <dt class="text-zinc-400 font-medium">
                    {{ item.label }}
                  </dt>
                  <dd class="sm:col-span-2 flex items-center gap-2 group">
                    <span
                      class="flex-1 select-all cursor-pointer text-zinc-100 hover:text-emerald-400 transition-colors font-medium break-all"
                      @click="
                        copyToClipboard(
                          item.key === 'tingkat - rombel'
                            ? getClassName(siswaDetail[item.key])
                            : siswaDetail[item.key] || '-',
                          item.label,
                        )
                      "
                      title="Klik untuk menyalin"
                    >
                      {{
                        item.key === "tingkat - rombel"
                          ? getClassName(siswaDetail[item.key])
                          : siswaDetail[item.key] || "-"
                      }}
                    </span>
                    <span
                      class="text-[10px] bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                      @click="
                        copyToClipboard(
                          item.key === 'tingkat - rombel'
                            ? getClassName(siswaDetail[item.key])
                            : siswaDetail[item.key] || '-',
                          item.label,
                        )
                      "
                    >
                      Salin
                    </span>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Classmates Sidebar (1/4 width) -->
          <div>
            <div
              class="rounded-xl p-4 bg-zinc-800/40 border border-zinc-700/30 shadow-sm sticky top-20"
            >
              <div
                class="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-700/50"
              >
                <Users class="w-4 h-4 text-emerald-400" />
                <h3 class="text-sm font-bold text-[var(--text-heading)]">
                  Siswa Sekelas ({{
                    getClassName(siswaDetail["tingkat - rombel"])
                  }})
                </h3>
              </div>

              <!-- List of classmates -->
              <div
                class="space-y-1 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700"
              >
                <button
                  v-for="(item, index) in relatedItems"
                  :key="index"
                  @click="navigateToDetail(item)"
                  class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-zinc-700/40 text-zinc-400 hover:text-emerald-400 flex items-center justify-between"
                >
                  <span class="truncate pr-2">{{ item.displayTitle }}</span>
                  <span
                    class="text-[9px] bg-zinc-700 text-zinc-400 px-1 rounded font-mono shrink-0"
                  >
                    {{ item.genderAbbr }}
                  </span>
                </button>

                <p
                  v-if="relatedItems.length === 0"
                  class="text-xs text-center py-6 text-zinc-500"
                >
                  Tidak ada siswa sekelas lainnya
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
import { ref, computed, onMounted, watch } from "vue";
import { Info, UserCircle, Users } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useNotiflix } from "~/composables/ui/useFeedback";

const { cardData: dataSiswa, loadData } = useTableData();
const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();

const route = useRoute();
const router = useRouter();
const { Notify } = useNotiflix();

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
      error.value = "Siswa tidak ditemukan atau data belum terunduh.";
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
