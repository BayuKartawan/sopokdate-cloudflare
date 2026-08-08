<template>
  <div class="mt-4">
    <!-- Action Bar -->
    <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div class="w-full sm:w-72">
        <Search @searchUpdated="handleSearch" />
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
        <BaseButton
          text="Refresh"
          title="Muat ulang data sertifikat"
          :loading="isLoading"
          @click="refreshDataList"
        >
          <template #icon>
            <RefreshCw class="w-4 h-4" />
          </template>
        </BaseButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
      <RefreshCw class="w-8 h-8 animate-spin text-emerald-500 mb-2" />
      <p class="theme-text-muted text-sm">Memuat data rekap sertifikat...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredData.length === 0"
      class="text-center theme-bg-secondary border theme-border rounded-lg py-12 theme-text-muted">
      <p class="text-base">Tidak ada data rekap sertifikat yang ditemukan.</p>
      <p class="text-xs theme-text-faint mt-1">
        Data akan muncul setelah Anda mengirim data cetak sertifikat juara kelas.
      </p>
    </div>

    <!-- Table -->
    <div v-else class="theme-bg border theme-border rounded-lg overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="theme-bg-secondary theme-text-muted">
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
        <tbody class="[&>tr+tr]:border-t [&>tr+tr]:border-[var(--border-primary)]">
          <tr
            v-for="(item, index) in paginatedData"
            :key="index"
            class="hover:theme-bg-secondary transition-colors"
          >
            <td class="py-3 px-4 theme-text-secondary">{{ startNumber + index }}</td>
            <td class="py-3 px-4 font-mono theme-text-muted text-xs">{{ item.nomor }}</td>
            <td class="py-3 px-4 font-semibold theme-text">{{ item.nama_lengkap }}</td>
            <td class="py-3 px-4 theme-text-secondary">{{ item.nisn || item.nis }}</td>
            <td class="py-3 px-4 text-center theme-text-secondary">{{ item.kelas }}</td>
            <td class="py-3 px-4 text-center">
              <span class="inline-block bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-semibold">
                {{ item.juara }}
              </span>
            </td>
            <td class="py-3 px-4 theme-text-muted text-xs">{{ item.wali_kelas }}</td>
            <td class="py-3 px-4 theme-text-muted text-xs">{{ formatTanggalIndo(item.date) }}</td>
            <td class="py-3 px-4 theme-text-muted text-xs">
              Sem. {{ item.semester }}<br />
              TP. {{ item.tahun_pelajaran }}
            </td>
            <td class="py-3 px-4 text-center">
              <BaseButton
                text="Cetak"
                size="sm"
                title="Cetak ulang sertifikat ini"
                @click="printItem(item)"
              >
                <template #icon>
                  <Printer class="w-3.5 h-3.5" />
                </template>
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="p-4 border-t theme-border">
        <Pagination :currentPage="currentPage" :totalPages="totalPages" @pageChanged="handlePageChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Printer, RefreshCw } from "lucide-vue-next";
import Search from "~/components/ui/Search.vue";
import Pagination from "~/components/ui/Pagination.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useTableData } from "~/composables/data/useTableData";
import { formatTanggalIndo } from "~/utils/date";

interface SertifikatItem {
  nama_lengkap?: string;
  nisn?: string | number;
  nis?: string | number;
  juara?: string;
  kelas?: string;
  date?: string;
  nomor?: string;
  wali_kelas?: string;
  verifikasi?: string;
  semester?: string | number;
  tahun_pelajaran?: string;
  [key: string]: unknown;
}

const router = useRouter();
const { cardData, isLoading, loadData, refreshData } = useTableData();

const searchQuery = ref<string>("");
const currentPage = ref<number>(1);
const pageSize = 10;

const handleSearch = (query: string): void => {
  searchQuery.value = query;
  currentPage.value = 1;
};

const handlePageChange = (page: number): void => {
  currentPage.value = page;
};

const refreshDataList = (): void => {
  refreshData("Sertifikat");
};

// Filter data based on search query
const filteredData = computed<SertifikatItem[]>(() => {
  const data = cardData.value as SertifikatItem[] | null;
  if (!data || !Array.isArray(data)) return [];

  // Filter out non-matching rows and error messages (e.g. if the sheet was not found)
  const cleanData = data.filter((item) => item && item.nama_lengkap);

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

const totalPages = computed<number>(() => {
  return Math.ceil(filteredData.value.length / pageSize);
});

const startNumber = computed<number>(() => {
  return (currentPage.value - 1) * pageSize + 1;
});

const paginatedData = computed<SertifikatItem[]>(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredData.value.slice(start, end);
});

const printItem = (item: SertifikatItem): void => {
  router.push({
    path: "/dokumen/cetak",
    query: {
      type: "juaraKelas",
      nama_lengkap: item.nama_lengkap,
      nisn: String(item.nisn || item.nis),
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
