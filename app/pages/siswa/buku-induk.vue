<!-- app/pages/siswa/buku-induk.vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title, Search & Sort in PageHeader Slot -->
      <div class="mb-6">
        <UiPageHeader
          title="Buku Induk Siswa"
          :breadcrumbs="[
            { label: 'Beranda', to: '/' },
            { label: 'Akademik' },
            { label: 'Buku Induk' },
          ]"
        >
          <template #actions>
            <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <!-- Search Component -->
              <div class="w-full sm:w-64">
                <Search
                  @searchUpdated="(q) => (searchQueryBukuInduk = q)"
                  placeholder="Cari nama, NISN, NIS..."
                />
              </div>
              <!-- SearchableSelect Component -->
              <div class="w-full sm:w-60">
                <SearchableSelect
                  v-model="sortByNisLokal"
                  :options="sortOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Pilih Urutan NIS..."
                  searchPlaceholder="Cari urutan NIS..."
                />
              </div>
            </div>
          </template>
        </UiPageHeader>
      </div>

      <!-- Main Content Area -->
      <div class="pt-2">
        <p v-if="isLoadingBukuInduk" class="text-center text-lg font-semibold py-12" style="color: var(--text-muted)">
          Memuat data Buku Induk...
        </p>

        <div
          v-else-if="filteredBukuIndukData.length === 0"
          class="text-center py-16 rounded-xl border"
          style="background: var(--bg-secondary); border-color: var(--border-primary)"
        >
          <Database class="w-16 h-16 mx-auto mb-4" style="color: var(--text-faint)" stroke-width="1.5" />
          <p class="text-lg font-medium" style="color: var(--text-secondary)">
            Tidak ada data Buku Induk ditemukan
          </p>
          <p class="text-sm mt-1" style="color: var(--text-muted)">
            Coba sesuaikan kata kunci pencarian Anda.
          </p>
        </div>

        <div v-else>
          <div class="overflow-x-auto rounded-xl border mb-6" style="border-color: var(--border-primary); background: var(--bg-card)">
            <table class="w-full text-sm text-left">
              <thead class="border-b" style="background: var(--bg-secondary); border-color: var(--border-primary)">
                <tr>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-10" style="color: var(--text-muted)">No</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">Nama</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">NIS Lokal</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">NISN</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style="color: var(--text-muted)">L/P</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">Rombel / Keterangan</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style="color: var(--text-muted)">Status</th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style="color: var(--text-muted)">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in visibleBukuIndukData"
                  :key="item.id || index"
                  class="transition-colors border-b"
                  style="border-color: var(--border-subtle)"
                  @mouseenter="$event.currentTarget.style.background = 'var(--bg-secondary)'"
                  @mouseleave="$event.currentTarget.style.background = ''"
                >
                  <td class="px-4 py-3 text-xs" style="color: var(--text-muted)">
                    {{ (currentPageBukuInduk - 1) * ITEMS_PER_PAGE_BUKU_INDUK + index + 1 }}
                  </td>
                  <td class="px-4 py-3 font-semibold text-sm" style="color: var(--text-heading)">
                    {{ toTitleCase(item.nama) }}
                  </td>
                  <td class="px-4 py-3 font-mono text-xs" style="color: var(--text-secondary)">
                    {{ item.nis_lokal || '-' }}
                  </td>
                  <td class="px-4 py-3 font-mono text-xs" style="color: var(--text-secondary)">
                    {{ item.nisn || '-' }}
                  </td>
                  <td class="px-4 py-3 text-xs text-center" style="color: var(--text-secondary)">
                    {{ item.gender || '-' }}
                  </td>
                  <td class="px-4 py-3 text-xs" style="color: var(--text-muted)">
                    {{ item.kelas || '-' }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span
                      :class="[
                        'px-2 py-0.5 rounded text-xs font-semibold border',
                        item.status === 'Aktif'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : item.status === 'Alumni'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                      ]"
                    >
                      {{ item.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      @click="navigateToBukuIndukDetail(item)"
                      class="px-3 py-1 text-xs font-medium rounded-lg border transition-all"
                      style="background: var(--bg-secondary); color: var(--text-primary); border-color: var(--border-primary)"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <Pagination
            :currentPage="currentPageBukuInduk"
            :totalPages="totalPagesBukuInduk"
            @pageChanged="handlePageChangeBukuInduk"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Database } from "lucide-vue-next";
import Search from "~/components/ui/Search.vue";
import SearchableSelect from "~/components/ui/SearchableSelect.vue";
import Pagination from "~/components/ui/Pagination.vue";
import { useTableData } from "~/composables/data/useTableData";

const router = useRouter();

// Table data instances
const { cardData: dataSiswa, loadData: loadDataSiswa } = useTableData();
const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();
const { cardData: dataAlumni, loadData: loadDataAlumni } = useTableData();
const { cardData: dataMutasi, loadData: loadDataMutasi } = useTableData();

const isLoadingBukuInduk = ref(false);
const sortByNisLokal = ref("asc");
const searchQueryBukuInduk = ref("");
const currentPageBukuInduk = ref(1);
const ITEMS_PER_PAGE_BUKU_INDUK = 15;

const sortOptions = [
  { label: "NIS Lokal: Terendah ke Tertinggi", value: "asc" },
  { label: "NIS Lokal: Tertinggi ke Terendah", value: "desc" },
];

const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const getJenisKelaminAbbr = (jk) => {
  if (!jk) return "-";
  const upper = jk.toUpperCase();
  if (upper.startsWith("L")) return "L";
  if (upper.startsWith("P")) return "P";
  return jk;
};

// Map kelas ID to its details
const kelasMap = computed(() => {
  const map = {};
  if (Array.isArray(dataKelas.value)) {
    dataKelas.value.forEach((k) => {
      if (k.id_kelas) {
        map[k.id_kelas] = k;
      }
    });
  }
  return map;
});

const getClassName = (classId) => {
  if (!classId) return "-";
  const classInfo = kelasMap.value[classId];
  return classInfo ? classInfo.nama_kelas : classId;
};

const loadBukuIndukData = async (force = false) => {
  isLoadingBukuInduk.value = true;
  try {
    await Promise.all([
      loadDataSiswa("data_siswa", force),
      loadDataKelas("data_kelas", force),
      loadDataAlumni("alumni", force),
      loadDataMutasi("mutasi_siswa", force),
    ]);
  } catch (err) {
    console.error("Gagal memuat data Buku Induk:", err);
  } finally {
    isLoadingBukuInduk.value = false;
  }
};

onMounted(() => {
  loadBukuIndukData();
});

const bukuIndukData = computed(() => {
  const list = [];

  if (Array.isArray(dataSiswa.value)) {
    dataSiswa.value.forEach((item) => {
      list.push({
        id: item.id || item._id,
        nama: item.nama || "",
        nisn: item.nisn || "",
        nis_lokal: item.nis_lokal || item["nis lokal"] || item.nis || "",
        kelas: getClassName(item.kelas),
        status: "Aktif",
        gender: getJenisKelaminAbbr(item.jenis_kelamin),
        originalItem: item,
      });
    });
  }

  if (Array.isArray(dataAlumni.value)) {
    dataAlumni.value.forEach((item) => {
      list.push({
        id: item.id || item._id,
        nama: item.nama || "",
        nisn: item.nisn || "",
        nis_lokal: item.nis_lokal || item["nis lokal"] || item.nis || "",
        kelas: "Alumni (Lulus " + (item.thn_lulus || "") + ")",
        status: "Alumni",
        gender: getJenisKelaminAbbr(item.jenis_kelamin),
        originalItem: item,
      });
    });
  }

  if (Array.isArray(dataMutasi.value)) {
    dataMutasi.value.forEach((item) => {
      list.push({
        id: item.id || item._id,
        nama: item.nama || "",
        nisn: item.nisn || "",
        nis_lokal: item.nis_lokal || item["nis lokal"] || item.nis || "",
        kelas: "Mutasi (" + (item.kelas || "") + ")",
        status: "Mutasi",
        gender: getJenisKelaminAbbr(item.jenis_kelamin),
        originalItem: item,
      });
    });
  }

  return list;
});

const filteredBukuIndukData = computed(() => {
  let list = [...bukuIndukData.value];

  const query = searchQueryBukuInduk.value.toLowerCase().trim();
  if (query) {
    list = list.filter(
      (item) =>
        (item.nama || "").toLowerCase().includes(query) ||
        (item.nisn || "").toLowerCase().includes(query) ||
        (item.nis_lokal || "").toLowerCase().includes(query),
    );
  }

  return list.sort((a, b) => {
    const nisA = String(a.nis_lokal || "").trim();
    const nisB = String(b.nis_lokal || "").trim();

    if (!nisA && !nisB) {
      return (a.nama || "").localeCompare(b.nama || "");
    }
    if (!nisA) return 1;
    if (!nisB) return -1;

    let comp = 0;
    if (sortByNisLokal.value === "asc") {
      comp = nisA.localeCompare(nisB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    } else {
      comp = nisB.localeCompare(nisA, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    return comp !== 0 ? comp : (a.nama || "").localeCompare(b.nama || "");
  });
});

const totalPagesBukuInduk = computed(() => {
  return Math.ceil(
    filteredBukuIndukData.value.length / ITEMS_PER_PAGE_BUKU_INDUK,
  );
});

const visibleBukuIndukData = computed(() => {
  const start = (currentPageBukuInduk.value - 1) * ITEMS_PER_PAGE_BUKU_INDUK;
  const end = start + ITEMS_PER_PAGE_BUKU_INDUK;
  return filteredBukuIndukData.value.slice(start, end);
});

const handlePageChangeBukuInduk = (page) => {
  currentPageBukuInduk.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

watch([searchQueryBukuInduk, sortByNisLokal], () => {
  currentPageBukuInduk.value = 1;
});

const navigateToBukuIndukDetail = (item) => {
  const nisLokal = item.nis_lokal;
  if (!nisLokal) return;

  if (item.status === "Alumni") {
    router.push(`/akademik/alumni/detail/${nisLokal}`);
  } else if (item.status === "Mutasi") {
    router.push(`/akademik/mutasi/detail/${nisLokal}`);
  } else {
    router.push(`/akademik/siswa/detail/${nisLokal}`);
  }
};
</script>
