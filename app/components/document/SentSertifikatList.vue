<template>
  <div class="mt-4">
    <!-- Action Bar -->
    <div
      class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
    >
      <div class="w-full sm:w-72">
        <Search @searchUpdated="handleSearch" />
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
        <button
          @click="refreshDataList"
          :disabled="isLoading"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw :class="{ 'animate-spin': isLoading }" class="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Data State -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-12"
    >
      <RefreshCw class="w-8 h-8 animate-spin text-emerald-500 mb-2" />
      <p class="text-zinc-400 text-sm">Memuat data rekap sertifikat...</p>
    </div>

    <div
      v-else-if="filteredData.length === 0"
      class="text-center bg-zinc-900 border border-zinc-800 rounded-lg py-12 text-zinc-400"
    >
      <p class="text-base">Tidak ada data rekap sertifikat yang ditemukan.</p>
      <p class="text-xs text-zinc-500 mt-1">
        Data akan muncul setelah Anda mengirim data cetak sertifikat juara
        kelas.
      </p>
    </div>

    <div
      v-else
      class="bg-zinc-900 border border-zinc-800 rounded-lg overflow-x-auto"
    >
      <table class="min-w-full text-zinc-300 text-sm">
        <thead class="bg-zinc-800/50 text-zinc-400 border-b border-zinc-800">
          <tr>
            <th class="py-3 px-4 text-left font-semibold">No</th>
            <th class="py-3 px-4 text-left font-semibold">No Surat</th>
            <th class="py-3 px-4 text-left font-semibold">Nama Siswa</th>
            <th class="py-3 px-4 text-left font-semibold">NISN</th>
            <th class="py-3 px-4 text-left font-semibold">Kelas</th>
            <th class="py-3 px-4 text-center font-semibold">Juara</th>
            <th class="py-3 px-4 text-left font-semibold">Wali Kelas</th>
            <th class="py-3 px-4 text-left font-semibold">Tanggal</th>
            <th class="py-3 px-4 text-left font-semibold">Semester/TP</th>
            <th class="py-3 px-4 text-center font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/50">
          <tr
            v-for="(item, index) in paginatedData"
            :key="index"
            class="hover:bg-zinc-800/30 transition-colors"
          >
            <td class="py-3 px-4">{{ startNumber + index }}</td>
            <td class="py-3 px-4 font-mono text-zinc-400 text-xs">
              {{ item.nomor }}
            </td>
            <td class="py-3 px-4 font-semibold text-zinc-200">
              {{ item.nama_lengkap }}
            </td>
            <td class="py-3 px-4">{{ item.nisn || item.nis }}</td>
            <td class="py-3 px-4 text-center">{{ item.kelas }}</td>
            <td class="py-3 px-4 text-center">
              <span
                class="inline-block bg-emerald-950/50 text-emerald-400 border border-emerald-800/30 px-2 py-0.5 rounded text-xs font-semibold"
              >
                {{ item.juara }}
              </span>
            </td>
            <td class="py-3 px-4 text-zinc-400 text-xs">
              {{ item.wali_kelas }}
            </td>
            <td class="py-3 px-4 text-zinc-400 text-xs">
              {{ formatTanggalIndo(item.date) }}
            </td>
            <td class="py-3 px-4 text-zinc-400 text-xs">
              Sem. {{ item.semester }} <br />
              TP. {{ item.tahun_pelajaran }}
            </td>
            <td class="py-3 px-4 text-center">
              <button
                @click="printItem(item)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold cursor-pointer transition-colors"
                title="Cetak Ulang Sertifikat"
              >
                <Printer class="w-3.5 h-3.5" />
                Cetak
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="p-4 border-t border-zinc-800">
        <Pagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          @pageChanged="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Printer, RefreshCw } from "lucide-vue-next";
import Search from "~/components/ui/Search.vue";
import Pagination from "~/components/ui/Pagination.vue";
import { useTableData } from "~/composables/data/useTableData";
import { formatTanggalIndo } from "~/utils/date";

const router = useRouter();
const { cardData, isLoading, loadData, refreshData } = useTableData();

const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = 10;

const handleSearch = (query) => {
  searchQuery.value = query;
  currentPage.value = 1;
};

const handlePageChange = (page) => {
  currentPage.value = page;
};

const refreshDataList = () => {
  refreshData("Sertifikat");
};

// Filter data based on search query
const filteredData = computed(() => {
  if (!cardData.value || !Array.isArray(cardData.value)) return [];

  // Filter out non-matching rows and error messages (e.g. if the sheet was not found)
  const cleanData = cardData.value.filter((item) => item && item.nama_lengkap);

  if (!searchQuery.value) return cleanData;

  const query = searchQuery.value.toLowerCase();
  return cleanData.filter((item) => {
    return (
      (item.nama_lengkap && item.nama_lengkap.toLowerCase().includes(query)) ||
      ((item.nisn || item.nis) &&
        String(item.nisn || item.nis)
          .toLowerCase()
          .includes(query)) ||
      (item.kelas && String(item.kelas).toLowerCase().includes(query)) ||
      (item.wali_kelas && item.wali_kelas.toLowerCase().includes(query)) ||
      (item.nomor && item.nomor.toLowerCase().includes(query))
    );
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / pageSize);
});

const startNumber = computed(() => {
  return (currentPage.value - 1) * pageSize + 1;
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredData.value.slice(start, end);
});

const printItem = (item) => {
  router.push({
    path: "/dokumen/cetak",
    query: {
      type: "juaraKelas",
      nama_lengkap: item.nama_lengkap,
      nisn: item.nisn || item.nis,
      juara: item.juara,
      kelas: item.kelas,
      date: formatTanggalIndo(item.date),
      nomor: item.nomor,
      wali_kelas: item.wali_kelas,
      verifikasi: item.verifikasi,
    },
  });
};

onMounted(() => {
  loadData("Sertifikat");
});
</script>
