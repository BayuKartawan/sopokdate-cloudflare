<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Page Header -->
      <PageHeader
        title="Rekap Absensi Siswa"
        :breadcrumbs="[
          { label: 'Absensi', to: '/absensi' },
          { label: 'Rekap Absensi' },
        ]"
      >
        <template #actions>
          <!-- Button Cek Tanggal Belum Kirim -->
          <button
            type="button"
            @click="showMissingModal = true"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold theme-bg-secondary theme-border border text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors shadow-xs cursor-pointer"
          >
            <CalendarX class="w-4 h-4 text-amber-500 shrink-0" />
            <span>Cek Belum Kirim</span>
          </button>

          <!-- Tab Kehadiran Actions -->
          <template v-if="activeTab === 'kehadiran' && rekapData.length > 0">
            <BaseButton
              :text="isExporting ? 'Mengekspor...' : 'Export Excel'"
              @click="exportToExcel"
              :disabled="isExporting || isLoading"
            >
              <template #icon>
                <Download v-if="!isExporting" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
              </template>
            </BaseButton>

            <PrintButton>
              <PrintRekapPresensi
                :rekap-data="rekapData"
                :current-class-name="currentClassName"
                :rekap-type="rekapType"
                :selected-semester="selectedSemester"
                :selected-tapel="selectedTapel"
                :selected-month="selectedMonth"
                :month-names="monthNames"
                :start-date="startDate"
                :end-date="endDate"
                :print-timestamp="printTimestamp"
                :wali-kelas-name="waliKelasName"
              />
            </PrintButton>
          </template>

          <!-- Tab Status Actions -->
          <template v-if="activeTab === 'status' && userRole === 'admin' && statusTableData.length > 0">
            <BaseButton
              :text="isExportingStatus ? 'Mengekspor...' : 'Export Excel'"
              @click="exportStatusToExcel"
              :disabled="isExportingStatus || isLoadingStatus"
            >
              <template #icon>
                <Download v-if="!isExportingStatus" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
              </template>
            </BaseButton>

            <PrintButton>
              <PrintStatusPengiriman
                :status-table-data="statusTableData"
                :status-semester="statusSemester"
                :status-tapel="statusTapel"
                :status-periode-label="statusPeriodeLabel"
                :avg-persentase-status="avgPersentaseStatus"
                :kelas-rendah-count="kelasRendahCount"
                :print-timestamp="printTimestamp"
              />
            </PrintButton>
          </template>

          <!-- Tab Peringkat Actions -->
          <template v-if="activeTab === 'peringkat' && userRole === 'admin' && rankedList.length > 0">
            <BaseButton
              :text="isExportingPeringkat ? 'Mengekspor...' : 'Export Excel'"
              @click="exportPeringkatToExcel"
              :disabled="isExportingPeringkat || isLoadingPeringkat || isDownloadingScreenshot"
            >
              <template #icon>
                <Download v-if="!isExportingPeringkat" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
              </template>
            </BaseButton>

            <BaseButton
              :text="isDownloadingScreenshot ? 'Memproses...' : 'Download JPG'"
              @click="downloadScreenshotJpg('print-template-peringkat')"
              :disabled="isDownloadingScreenshot || isLoadingPeringkat"
              class="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <template #icon>
                <Camera v-if="!isDownloadingScreenshot" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
              </template>
            </BaseButton>

            <PrintButton>
              <PrintRekapPeringkat
                :ranked-list="rankedList"
                :kategori-label="kategoriLabel"
                :kategori-peringkat="kategoriPeringkat"
                :top-limit="topLimit"
                :peringkat-semester="peringkatSemester"
                :peringkat-tapel="peringkatTapel"
                :filter-kelas-name="filterKelasId ? getClassName(filterKelasId) : 'Semua Kelas'"
                :print-timestamp="printTimestamp"
                :to-title-case="toTitleCase"
              />
            </PrintButton>
          </template>
        </template>
      </PageHeader>

      <!-- Tab Navigation (Minimalis & Ringan) -->
      <div
        v-if="userRole === 'admin'"
        class="flex items-center gap-1.5 mb-5 p-1 rounded-xl theme-bg-secondary border theme-border w-fit shadow-xs"
      >
        <button
          type="button"
          @click="activeTab = 'kehadiran'"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer',
            activeTab === 'kehadiran'
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'theme-text-muted hover:theme-text hover:bg-zinc-500/10',
          ]"
        >
          <ClipboardList class="w-3.5 h-3.5" />
          <span>Rekap Kehadiran</span>
        </button>
        <button
          type="button"
          @click="switchToStatusTab"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer',
            activeTab === 'status'
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'theme-text-muted hover:theme-text hover:bg-zinc-500/10',
          ]"
        >
          <BarChart3 class="w-3.5 h-3.5" />
          <span>Status Pengiriman</span>
        </button>
        <button
          type="button"
          @click="switchToPeringkatTab"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer',
            activeTab === 'peringkat'
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'theme-text-muted hover:theme-text hover:bg-zinc-500/10',
          ]"
        >
          <Trophy class="w-3.5 h-3.5" />
          <span>Peringkat</span>
        </button>
      </div>

      <!-- TAB 1: REKAP KEHADIRAN -->
      <RekapKehadiranTab
        v-if="activeTab === 'kehadiran'"
        v-model:selected-class="selectedClass"
        v-model:selected-tapel="selectedTapel"
        v-model:selected-semester="selectedSemester"
        v-model:rekap-type="rekapType"
        v-model:selected-month="selectedMonth"
        v-model:start-date="startDate"
        v-model:end-date="endDate"
        :data-kelas="dataKelas || []"
        :rekap-data="rekapData"
        :is-loading="isLoading"
        :is-wali-kelas="isWaliKelas"
        :tapel-options="tapelOptions"
        :current-class-name="currentClassName"
        :month-names="monthNames"
        :to-title-case="toTitleCase"
        :format-date-indo="formatDateIndo"
        :hitung-persentase="hitungPersentase"
      />

      <!-- TAB 2: STATUS PENGIRIMAN ABSENSI -->
      <RekapStatusTab
        v-else-if="activeTab === 'status' && userRole === 'admin'"
        v-model:status-tapel="statusTapel"
        v-model:status-semester="statusSemester"
        :tapel-options="tapelOptions"
        :is-loading-status="isLoadingStatus"
        :status-table-data="statusTableData"
        :avg-persentase-status="avgPersentaseStatus"
        :kelas-rendah-count="kelasRendahCount"
        :status-periode-label="statusPeriodeLabel"
      />

      <!-- TAB 3: PERINGKAT KETIDAKHADIRAN -->
      <RekapPeringkatTab
        v-else-if="activeTab === 'peringkat' && userRole === 'admin'"
        v-model:peringkat-tapel="peringkatTapel"
        v-model:peringkat-semester="peringkatSemester"
        v-model:kategori-peringkat="kategoriPeringkat"
        v-model:filter-kelas-id="filterKelasId"
        :data-kelas="dataKelas || []"
        :tapel-options="tapelOptions"
        :is-loading-peringkat="isLoadingPeringkat"
        :raw-data="rawData"
        :ranked-list="rankedList"
        :kategori-label="kategoriLabel"
        :top-alpa-student="topAlpaStudent"
        :top-sakit-student="topSakitStudent"
        :top-izin-student="topIzinStudent"
        :get-class-name="getClassName"
        :to-title-case="toTitleCase"
      />

      <!-- Off-Screen Render untuk Screenshot JPG & Print -->
      <div style="position: fixed; left: -9999px; top: -9999px; width: 800px; pointer-events: none;" aria-hidden="true">
        <PrintRekapPeringkat
          v-if="activeTab === 'peringkat' && rankedList.length > 0"
          :ranked-list="rankedList"
          :kategori-label="kategoriLabel"
          :kategori-peringkat="kategoriPeringkat"
          :top-limit="topLimit"
          :peringkat-semester="peringkatSemester"
          :peringkat-tapel="peringkatTapel"
          :filter-kelas-name="filterKelasId ? getClassName(filterKelasId) : 'Semua Kelas'"
          :print-timestamp="printTimestamp"
          :to-title-case="toTitleCase"
        />
      </div>

      <!-- MODAL CEK TANGGAL BELUM KIRIM -->
      <ModalMissingDates
        v-model="showMissingModal"
        :selected-tapel="selectedTapel"
        :default-class-id="selectedClass"
        :data-kelas="dataKelas || []"
        :is-wali-kelas="isWaliKelas"
        :selected-wali-class-id="selectedWaliClassId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import {
  ClipboardList,
  Loader2,
  Download,
  BarChart3,
  CalendarX,
  Trophy,
  Camera,
} from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import PrintButton from "~/components/ui/PrintButton.vue";
import PageHeader from "~/components/ui/PageHeader.vue";
import RekapKehadiranTab from "~/components/absensi/RekapKehadiranTab.vue";
import RekapStatusTab from "~/components/absensi/RekapStatusTab.vue";
import RekapPeringkatTab from "~/components/absensi/RekapPeringkatTab.vue";
import ModalMissingDates from "~/components/absensi/ModalMissingDates.vue";
import PrintRekapPresensi from "~/components/absensi/print/PrintRekapPresensi.vue";
import PrintStatusPengiriman from "~/components/absensi/print/PrintStatusPengiriman.vue";
import PrintRekapPeringkat from "~/components/absensi/print/PrintRekapPeringkat.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useAuth } from "~/composables/auth/useAuth";
import { useRekapKehadiran } from "~/composables/absensi/useRekapKehadiran";
import { useRekapStatus } from "~/composables/absensi/useRekapStatus";
import { useRekapPeringkat } from "~/composables/absensi/useRekapPeringkat";
import { fetchFromApi } from "~/utils/api";
import { dapatkanTahunDanSemester } from "~/utils/dateHelper";

// Services & Config
const { getUserRole, getGtkId } = useAuth();
const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();

// Tab State & Modal
const activeTab = ref<string>("kehadiran");
const showMissingModal = ref<boolean>(false);

// User & Role States
const userRole = ref<string>("");
const userGtkId = ref<number | null>(null);
const isWaliKelas = ref<boolean>(false);
const selectedWaliClassId = ref<string>("");
const waliKelasName = ref<string>("");
const printTimestamp = ref<string>("");

// Composables
const {
  selectedClass,
  selectedTapel,
  selectedSemester,
  rekapType,
  selectedMonth,
  startDate,
  endDate,
  rekapData,
  isLoading,
  isExporting,
  tapelOptions,
  currentClassName,
  monthNames,
  getWeekRange,
  formatDateIndo,
  toTitleCase,
  hitungPersentase,
  exportToExcel,
} = useRekapKehadiran(dataKelas);

const {
  statusTapel,
  statusSemester,
  isLoadingStatus,
  isExportingStatus,
  statusRawData,
  dataGtk,
  statusTableData,
  avgPersentaseStatus,
  kelasRendahCount,
  statusPeriodeLabel,
  fetchStatusData,
  exportStatusToExcel,
} = useRekapStatus(dataKelas);

const {
  peringkatTapel,
  peringkatSemester,
  kategoriPeringkat,
  topLimit,
  filterKelasId,
  rawData,
  isLoadingPeringkat,
  isExportingPeringkat,
  isDownloadingScreenshot,
  kategoriLabel,
  rankedList,
  topAlpaStudent,
  topSakitStudent,
  topIzinStudent,
  getClassName,
  fetchPeringkatData,
  exportPeringkatToExcel,
  downloadScreenshotJpg,
} = useRekapPeringkat(dataKelas);

const switchToStatusTab = () => {
  if (userRole.value !== "admin") return;
  activeTab.value = "status";
  if (!statusRawData.value.length && statusTapel.value && statusSemester.value) {
    fetchStatusData();
  }
};

const switchToPeringkatTab = () => {
  if (userRole.value !== "admin") return;
  activeTab.value = "peringkat";
  if (!rawData.value.length && peringkatTapel.value && peringkatSemester.value) {
    fetchPeringkatData();
  }
};

watch([statusTapel, statusSemester], () => {
  if (activeTab.value === "status" && statusTapel.value && statusSemester.value) {
    fetchStatusData();
  }
});

watch([peringkatTapel, peringkatSemester], () => {
  if (activeTab.value === "peringkat" && peringkatTapel.value && peringkatSemester.value) {
    fetchPeringkatData();
  }
});

function cleanName(name: string) {
  if (!name) return "";
  let cleaned = name.split(",")[0];
  cleaned = cleaned.replace(/^(h\.|hj\.|dra\.|drs\.|prof\.|dr\.)\s+/gi, "");
  return cleaned.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

const checkWaliKelasStatus = async () => {
  userRole.value = getUserRole() || "";
  const gId = getGtkId();
  userGtkId.value = gId ? parseInt(gId) : null;

  if (userRole.value === "guru" && userGtkId.value) {
    try {
      const gtkData = await fetchFromApi("DataGtk", false, null, {
        filter_col: "id",
        filter_val: String(userGtkId.value),
      });

      if (Array.isArray(gtkData)) {
        const myRecord = gtkData.find(
          (g: any) =>
            g.id === userGtkId.value ||
            g.ID === userGtkId.value ||
            String(g.id) === String(userGtkId.value),
        );

        if (myRecord) {
          const namaGuru =
            myRecord.title ||
            myRecord.NamaLengkap ||
            myRecord["Nama Lengkap"] ||
            myRecord.nama_lengkap;
          waliKelasName.value = namaGuru;

          const classes = dataKelas.value || [];
          const myClass = classes.find((c: any) => {
            const cWali = c.waliKelas || c["Wali Kelas"] || c.wali_kelas;
            const myPegId =
              myRecord.PegID || myRecord["Peg ID"] || myRecord.peg_id;
            const myId = myRecord.id || myRecord._id;

            const matchName = cleanName(cWali) === cleanName(namaGuru);
            const matchPegId = String(cWali).trim() === String(myPegId).trim();
            const matchId = String(cWali).trim() === String(myId).trim();

            return matchId || matchPegId || matchName;
          });

          if (myClass) {
            isWaliKelas.value = true;
            selectedWaliClassId.value = myClass.idKelas || myClass["ID Kelas"];
            selectedClass.value = myClass.idKelas || myClass["ID Kelas"];
          }
        }
      }
    } catch (err) {
      console.error("Gagal validasi status wali kelas:", err);
    }
  }
};

const updatePrintTimestamp = () => {
  const now = new Date();
  printTimestamp.value =
    now.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }) + " WITA";
};

onMounted(async () => {
  userRole.value = getUserRole() || "";

  const currentInfo = dapatkanTahunDanSemester(new Date());
  selectedTapel.value = currentInfo.tahunPelajaran;
  selectedSemester.value = currentInfo.semester;

  statusTapel.value = currentInfo.tahunPelajaran;
  statusSemester.value = currentInfo.semester;

  peringkatTapel.value = currentInfo.tahunPelajaran;
  peringkatSemester.value = currentInfo.semester;

  const week = getWeekRange();
  startDate.value = week.start;
  endDate.value = week.end;

  updatePrintTimestamp();

  try {
    await loadDataKelas("DataKelas");

    const cachedGtk = useState<any[]>("shared_data_gtk", () => []);
    if (cachedGtk.value.length > 0) {
      dataGtk.value = cachedGtk.value;
    } else {
      try {
        const gtkRaw = await fetchFromApi("DataGtk", false, null, {});
        if (Array.isArray(gtkRaw)) {
          cachedGtk.value = gtkRaw;
          dataGtk.value = gtkRaw;
        }
      } catch (e) {
        console.error("Gagal memuat DataGtk:", e);
      }
    }

    await checkWaliKelasStatus();
  } catch (err) {
    console.error(err);
  }
});
</script>
