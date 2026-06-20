<!-- app/pages/siswa/alumni.vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title & Actions -->
      <div class="flex flex-col gap-4 sm:gap-6 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <h2 class="text-xl text-white sm:text-2xl font-bold flex items-center gap-2">
              <GraduationCap class="w-8 h-8 text-indigo-400" />
              Data Alumni
            </h2>
            <p class="text-sm text-zinc-400 mt-1">
              Informasi kelulusan dan penelusuran studi lanjut alumni madrasah
            </p>
          </div>
          <div class="flex items-center gap-2 ml-auto">
            <!-- Tambah Alumni Button (Admin Only) -->
            <BaseButton
              v-if="isAdmin"
              text="Tambah Alumni"
              @click="openCreateModal"
              class="!bg-indigo-600 !text-white hover:!bg-indigo-500 shadow-lg shadow-indigo-950/30"
            >
              <template #icon>
                <Plus class="w-4 h-4" />
              </template>
            </BaseButton>

            <!-- Export Excel Button -->
            <BaseButton
              :text="isExporting ? 'Mengekspor...' : 'Export'"
              @click="exportToExcel"
              :disabled="isExporting || sortedData.length === 0"
              class="!px-2.5 sm:!px-3 hover:bg-zinc-700"
            >
              <template #icon>
                <svg
                  v-if="!isExporting"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4 animate-spin"
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
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </template>
            </BaseButton>

            <!-- Print Button -->
            <PrintButton>
              <div class="p-10 mx-auto bg-white text-black">
                <!-- Kop Surat -->
                <KopSurat class="mb-4" />

                <!-- Header -->
                <div class="text-center mb-6">
                  <h1 class="font-bold uppercase text-lg">Daftar Data Alumni</h1>
                  <p class="text-sm">
                    Tahun Lulus: {{ selectedYear }} | Studi Lanjut: {{ selectedDestination }}
                  </p>
                </div>

                <!-- Tabel Cetak -->
                <table class="w-full table-auto border border-gray-800 mb-4 text-xs">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="border border-gray-800 px-2 py-1.5 w-8">No</th>
                      <th class="border border-gray-800 px-2 py-1.5">Nama Lengkap</th>
                      <th class="border border-gray-800 px-2 py-1.5 w-24">NISN</th>
                      <th class="border border-gray-800 px-2 py-1.5 w-20">Tahun Lulus</th>
                      <th class="border border-gray-800 px-2 py-1.5 w-24">Melanjutkan Ke</th>
                      <th class="border border-gray-800 px-2 py-1.5">Alamat</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!sortedData || sortedData.length === 0">
                      <td
                        colspan="6"
                        class="border border-gray-800 px-2 py-4 text-center text-gray-500"
                      >
                        {{ isLoading ? "Memuat data..." : "Tidak ada data alumni tersedia" }}
                      </td>
                    </tr>
                    <tr v-else v-for="(alumni, index) in sortedData" :key="alumni.id || index">
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ index + 1 }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 font-semibold">
                        {{ toTitleCase(alumni.nama) }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 text-center font-mono">
                        {{ alumni.nisn || "-" }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ alumni.thn_lulus || "-" }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ alumni.menjutkan_ke || "Tidak Melanjutkan" }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1">
                        {{ alumni.alamat || "-" }}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Footer Cetak -->
                <div class="flex justify-between items-end mt-8 text-xs">
                  <div>
                    <p class="italic">
                      Dicetak dari SopokDate pada pukul {{ currentTime }} WITA, tanggal {{ currentDate }}
                    </p>
                  </div>
                  <div class="text-center w-48">
                    <p class="mb-16">Kepala Madrasah</p>
                    <p class="font-bold underline">{{ kepalaMadrasahName }}</p>
                    <p>NIP: {{ kepalaMadrasahNIP }}</p>
                  </div>
                </div>
              </div>
            </PrintButton>
          </div>
        </div>

        <!-- Premium Stats Widgets -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-4 rounded-xl flex flex-col justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Alumni</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-2xl sm:text-3xl font-bold text-white">{{ stats.total }}</span>
              <span class="text-xs text-indigo-400 font-medium">orang</span>
            </div>
          </div>
          <div class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-4 rounded-xl flex flex-col justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-zinc-500">Melanjutkan Studi</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-2xl sm:text-3xl font-bold text-emerald-400">{{ stats.continuing }}</span>
              <span class="text-xs text-zinc-500 font-medium">({{ stats.continuingPercent }}%)</span>
            </div>
          </div>
          <div class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-4 rounded-xl flex flex-col justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tahun Lulus Terbanyak</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-2xl sm:text-3xl font-bold text-violet-400">{{ stats.topYear }}</span>
              <span class="text-xs text-zinc-500 font-medium">({{ stats.topYearCount }} orang)</span>
            </div>
          </div>
          <div class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-4 rounded-xl flex flex-col justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tujuan Terpopuler</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-xl sm:text-2xl font-bold text-amber-400 truncate max-w-full" :title="stats.topDestination">
                {{ stats.topDestination }}
              </span>
            </div>
          </div>
        </div>

        <!-- Filter and Search Row -->
        <div class="flex flex-col md:flex-row gap-4 items-center w-full">
          <!-- Search Input -->
          <div class="w-full md:flex-1">
            <Search @searchUpdated="handleSearch" class="h-10 sm:h-11" placeholder="Cari nama alumni, NISN, alamat..." />
          </div>

          <!-- Filters Group -->
          <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <!-- Year Filter -->
            <div class="w-full sm:w-44">
              <select
                v-model="selectedYear"
                class="w-full h-10 sm:h-11 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm cursor-pointer"
              >
                <option value="Semua Tahun">Semua Tahun Lulus</option>
                <option v-for="year in yearOptions" :key="year" :value="year">
                  Tahun Lulus {{ year }}
                </option>
              </select>
            </div>

            <!-- Destination Filter -->
            <div class="w-full sm:w-48">
              <select
                v-model="selectedDestination"
                class="w-full h-10 sm:h-11 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm cursor-pointer"
              >
                <option value="Semua Tujuan">Semua Studi Lanjut</option>
                <option v-for="dest in destinationOptions" :key="dest" :value="dest">
                  {{ dest }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="pt-2">
        <p v-if="isLoading" class="text-center text-zinc-500 text-lg font-semibold py-12">
          Memuat data alumni...
        </p>

        <div
          v-else-if="sortedData.length === 0"
          class="text-center py-16 bg-zinc-800/10 rounded-xl border border-zinc-800"
        >
          <Database class="w-16 h-16 mx-auto mb-4 text-zinc-600" stroke-width="1.5" />
          <p class="text-zinc-400 text-lg font-medium">Tidak ada data alumni ditemukan</p>
          <p class="text-zinc-500 text-sm mt-1">
            Coba sesuaikan kata kunci pencarian atau filter pilihan Anda.
          </p>
        </div>

        <!-- Alumni Grid List -->
        <div v-else>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <li
              v-for="(item, index) in visibleData"
              :key="item.id || index"
              @click="openDetailModal(item)"
              class="cursor-pointer rounded-xl border p-5 transition-all duration-200 shadow-sm bg-zinc-850/40 border-zinc-700/40 hover:bg-zinc-800/60 hover:border-indigo-500/30 hover:shadow-indigo-950/20 group relative overflow-hidden"
            >
              <!-- Decorative glass highlight -->
              <div class="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-all duration-350"></div>

              <div class="flex items-start gap-4">
                <!-- Avatar block -->
                <div class="w-14 h-14 rounded-xl flex items-center justify-center bg-zinc-800 text-zinc-200 transition-all group-hover:scale-105 shrink-0 overflow-hidden border border-zinc-700/50">
                  <img
                    v-if="item.foto && item.foto.startsWith('http')"
                    :src="item.foto"
                    alt="Foto Alumni"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    @error="handleImageError"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600/30 to-violet-600/20 text-indigo-300 font-bold text-lg"
                  >
                    {{ getInitials(item.nama) }}
                  </div>
                </div>

                <!-- Info Column -->
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-base text-zinc-100 truncate group-hover:text-indigo-400 transition-colors">
                    {{ toTitleCase(item.nama) }}
                  </h3>

                  <div class="flex flex-wrap gap-1.5 mt-2">
                    <span class="bg-indigo-950/40 border border-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                      Lulus {{ item.thn_lulus || '-' }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-semibold border"
                      :class="getDestinationBadgeClass(item.menjutkan_ke)"
                    >
                      {{ item.menjutkan_ke || 'Tidak Melanjutkan' }}
                    </span>
                  </div>

                  <div class="flex flex-col gap-1 mt-3 text-xs text-zinc-400">
                    <p class="flex items-center gap-1.5">
                      <span class="w-16 text-zinc-500 shrink-0">NISN:</span>
                      <span class="font-mono">{{ item.nisn || "-" }}</span>
                    </p>
                    <p class="flex items-center gap-1.5">
                      <span class="w-16 text-zinc-500 shrink-0">Lokal ID:</span>
                      <span class="font-mono">{{ item.nis_lokal || "-" }}</span>
                    </p>
                    <p class="flex items-start gap-1.5 mt-0.5">
                      <span class="w-16 text-zinc-500 shrink-0">Alamat:</span>
                      <span class="truncate text-zinc-300">{{ item.alamat || "-" }}</span>
                    </p>
                  </div>
                </div>

                <!-- Admin Action Buttons (stop propagation to not open detail) -->
                <div v-if="isAdmin" class="flex flex-col items-center gap-2 shrink-0 mt-0.5" @click.stop>
                  <button
                    @click="openEditModal(item)"
                    class="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-all border border-zinc-700/30"
                    title="Edit"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDelete(item)"
                    class="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-all border border-zinc-700/30"
                    title="Hapus"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </li>
          </ul>

          <!-- Load More Button -->
          <div v-if="sortedData.length > 9" class="text-center mt-8">
            <BaseButton
              :text="showAll ? 'Tampilkan Lebih Sedikit' : 'Tampilkan Lebih Banyak'"
              @click="showAll = !showAll"
              class="hover:bg-zinc-800"
            />
          </div>
        </div>
      </div>

      <!-- Alumni Detail Modal -->
      <div v-if="showDetailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-zinc-900 to-indigo-950/20">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap class="w-5 h-5 text-indigo-400" />
              Detail Profil Alumni
            </h3>
            <button @click="showDetailModal = false" class="text-zinc-400 hover:text-white transition-colors text-xl p-1 font-bold">&times;</button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="p-6 max-h-[70vh] overflow-y-auto space-y-6 scrollbar-thin">
            <!-- Summary Profile Card -->
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80">
              <div class="w-20 h-20 rounded-xl flex items-center justify-center bg-zinc-800 text-zinc-200 shrink-0 overflow-hidden border border-zinc-700/40">
                <img
                  v-if="selectedAlumni.foto && selectedAlumni.foto.startsWith('http')"
                  :src="selectedAlumni.foto"
                  alt="Foto Alumni"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600/30 to-violet-600/20 text-indigo-300 font-bold text-3xl"
                >
                  {{ getInitials(selectedAlumni.nama) }}
                </div>
              </div>
              <div class="text-center sm:text-left flex-1 min-w-0">
                <h4 class="text-xl font-bold text-white">{{ toTitleCase(selectedAlumni.nama) }}</h4>
                <p class="text-sm text-zinc-400 mt-1 font-mono">NISN: {{ selectedAlumni.nisn || '-' }}</p>
                <div class="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  <span class="bg-indigo-950/50 border border-indigo-900/40 text-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    Tahun Kelulusan: {{ selectedAlumni.thn_lulus || '-' }}
                  </span>
                  <span class="bg-zinc-850 border border-zinc-700/50 text-zinc-300 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    Studi Lanjut: {{ selectedAlumni.menjutkan_ke || 'Tidak Melanjutkan' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Detail Tabs/Lists -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Biodata Pribadi -->
              <div class="p-4 rounded-xl bg-zinc-950/20 border border-zinc-800/60 space-y-3">
                <h5 class="text-sm font-bold text-indigo-400 border-b border-zinc-850 pb-2">Informasi Pribadi</h5>
                <dl class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">NIS Lokal</dt>
                    <dd class="text-zinc-300 font-mono font-medium">{{ selectedAlumni.nis_lokal || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">NIK</dt>
                    <dd class="text-zinc-300 font-mono font-medium">{{ selectedAlumni.nik || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">No KK</dt>
                    <dd class="text-zinc-300 font-mono font-medium">{{ selectedAlumni.no_kk || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">Jenis Kelamin</dt>
                    <dd class="text-zinc-300 font-medium">{{ selectedAlumni.jenis_kelamin || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">Tempat Lahir</dt>
                    <dd class="text-zinc-300 font-medium">{{ selectedAlumni.tempat_lahir || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">Tanggal Lahir</dt>
                    <dd class="text-zinc-300 font-medium">{{ selectedAlumni.tanggal_lahir || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">Umur Kelulusan</dt>
                    <dd class="text-zinc-300 font-medium">{{ selectedAlumni.umur || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">Status</dt>
                    <dd class="text-zinc-300 font-medium">{{ selectedAlumni.status || '-' }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Kontak & Keluarga -->
              <div class="p-4 rounded-xl bg-zinc-950/20 border border-zinc-800/60 space-y-3">
                <h5 class="text-sm font-bold text-indigo-400 border-b border-zinc-850 pb-2">Kontak & Keluarga</h5>
                <dl class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">No Telepon</dt>
                    <dd class="text-zinc-300 font-mono font-medium">{{ selectedAlumni.no_hp || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">Nomor KIP/PIP</dt>
                    <dd class="text-zinc-300 font-mono font-medium">{{ selectedAlumni.no_kip || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">Nama Ayah</dt>
                    <dd class="text-zinc-300 font-medium">{{ selectedAlumni.nama_ayah_kandung || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">Nama Ibu</dt>
                    <dd class="text-zinc-300 font-medium">{{ selectedAlumni.nama_ibu_kandung || '-' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-zinc-500">Nama Wali</dt>
                    <dd class="text-zinc-300 font-medium">{{ selectedAlumni.nama_wali || '-' }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Alamat -->
            <div class="p-4 rounded-xl bg-zinc-950/20 border border-zinc-800/60 space-y-2">
              <h5 class="text-sm font-bold text-indigo-400 border-b border-zinc-850 pb-1.5">🚩 Alamat Tinggal</h5>
              <p class="text-xs text-zinc-300 leading-relaxed font-medium">
                {{ selectedAlumni.alamat || 'Alamat belum diinputkan.' }}
              </p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/20">
            <BaseButton text="Tutup" @click="showDetailModal = false" class="!bg-zinc-800 hover:!bg-zinc-700" />
            <BaseButton
              v-if="selectedAlumni.no_hp"
              text="Hubungi Alumni"
              @click="callAlumni(selectedAlumni.no_hp)"
              class="!bg-indigo-600 hover:!bg-indigo-500"
            >
              <template #icon>
                <Phone class="w-4 h-4" />
              </template>
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- CRUD Modal -->
      <CrudModal
        :show="showModal"
        :mode="modalMode"
        :title="modalMode === 'create' ? 'Tambah Data Alumni' : 'Edit Data Alumni'"
        :fields="alumniFields"
        :initialData="editingItem"
        :isSaving="isSaving"
        @submit="handleFormSubmit"
        @close="showModal = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  Database,
  UserCircle,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Phone,
  ArrowLeft,
  ChevronRight,
  Info
} from "lucide-vue-next";
import Search from "~/components/ui/Search.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import PrintButton from "~/components/ui/PrintButton.vue";
import KopSurat from "~/components/document/KopSurat.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { fetchFromApi } from "~/utils/api";
import * as XLSX from "xlsx";

const router = useRouter();
const {
  cardData: dataAlumni,
  isLoading,
  loadData,
  refreshData
} = useTableData();

const { isAdmin, isSaving, createItem, updateItem, deleteItem } = useCrud(
  "alumni",
  () => refreshData("alumni")
);

// Detail Modal state
const showDetailModal = ref(false);
const selectedAlumni = ref({});

// CRUD Modal state
const showModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});

// Field configuration for Alumni CRUD form
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
    options: ["Laki-laki", "Perempuan"]
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Lulus", "Berhenti", "Pindah"]
  },
  { key: "thn_lulus", label: "Tahun Lulus", required: true },
  { key: "menjutkan_ke", label: "Melanjutkan Ke (Studi Lanjut)" },
  { key: "alamat", label: "Alamat", type: "textarea" },
  { key: "no_hp", label: "No Telepon / WhatsApp" },
  { key: "no_kip", label: "Nomor KIP/PIP" },
  { key: "nama_ayah_kandung", label: "Nama Ayah Kandung" },
  { key: "nama_ibu_kandung", label: "Nama Ibu Kandung" },
  { key: "nama_wali", label: "Nama Wali" }
];

const openCreateModal = () => {
  modalMode.value = "create";
  editingItem.value = {};
  showModal.value = true;
};

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
    nama_wali: item.nama_wali || ""
  };
  showModal.value = true;
};

const openDetailModal = (item) => {
  selectedAlumni.value = item;
  showDetailModal.value = true;
};

const handleFormSubmit = async (formData) => {
  let success = false;
  if (modalMode.value === "create") {
    success = await createItem(formData);
  } else {
    const id = editingItem.value._id;
    success = await updateItem(id, formData);
  }
  if (success) {
    showModal.value = false;
  }
};

const handleDelete = (item) => {
  const id = item.id || item._id;
  deleteItem(id, toTitleCase(item.nama));
};

const kepalaMadrasah = ref(null);
const selectedYear = ref("Semua Tahun");
const selectedDestination = ref("Semua Tujuan");
const searchQuery = ref("");
const showAll = ref(false);
const isExporting = ref(false);

// State for Print timestamp
const currentDate = ref("");
const currentTime = ref("");

const updateDateTime = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  currentDate.value = `${day}/${month}/${year}`;

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  currentTime.value = `${hours}:${minutes}:${seconds}`;
};

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

const handleImageError = (e) => {
  // If remote image fails, hide image element to trigger avatar display
  e.target.style.display = "none";
};

const callAlumni = (phone) => {
  if (!phone) return;
  const cleanPhone = String(phone).replace(/[^0-9]/g, "");
  // Standard protocol
  window.open(`https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`, "_blank");
};

// Generate options for filtering years dynamically
const yearOptions = computed(() => {
  if (!Array.isArray(dataAlumni.value)) return [];
  const years = dataAlumni.value
    .map((k) => k.thn_lulus)
    .filter((y) => y && String(y).trim() !== "");
  return [...new Set(years)].sort((a, b) => b - a); // descending order
});

// Generate options for filtering continuing destination dynamically
const destinationOptions = computed(() => {
  if (!Array.isArray(dataAlumni.value)) return [];
  const dests = dataAlumni.value
    .map((k) => k.menjutkan_ke)
    .filter((d) => d && String(d).trim() !== "" && String(d).toLowerCase() !== "tidak melanjutkan");
  
  const uniqueDests = [...new Set(dests)].sort();
  return [...uniqueDests, "Tidak Melanjutkan"];
});

// Dynamic Kepala Madrasah lookup from GTK data
const loadKepalaMadrasah = async () => {
  try {
    const storedGtk = localStorage.getItem("data_gtk");
    if (storedGtk) {
      const parsed = JSON.parse(storedGtk);
      if (Array.isArray(parsed)) {
        const kamad = parsed.find(
          (guru) => guru.tugas && guru.tugas.toLowerCase().includes("kepala madrasah")
        );
        if (kamad) {
          kepalaMadrasah.value = kamad;
          return;
        }
      }
    }

    const response = await fetchFromApi("data_gtk", false, null, {
      filter_col: "tugas",
      filter_val: "Kepala Madrasah"
    });
    if (Array.isArray(response) && response.length > 0) {
      kepalaMadrasah.value = response[0];
    }
  } catch (err) {
    console.error("Gagal memuat data Kepala Madrasah:", err);
  }
};

const kepalaMadrasahName = computed(() => {
  return kepalaMadrasah.value
    ? toTitleCase(kepalaMadrasah.value.nama_lengkap)
    : "_________________";
});

const kepalaMadrasahNIP = computed(() => {
  return kepalaMadrasah.value
    ? kepalaMadrasah.value.nip || kepalaMadrasah.value.nuptk || "-"
    : "_________________";
});

// Destination badge colors utility
const getDestinationBadgeClass = (dest) => {
  if (!dest || String(dest).toLowerCase().includes("tidak")) {
    return "bg-zinc-800/40 border-zinc-700/30 text-zinc-400";
  }
  const lowDest = String(dest).toLowerCase();
  if (lowDest.includes("smp")) {
    return "bg-blue-950/40 border-blue-900/30 text-blue-400";
  }
  if (lowDest.includes("mts")) {
    return "bg-emerald-950/40 border-emerald-900/30 text-emerald-400";
  }
  return "bg-amber-950/40 border-amber-900/30 text-amber-400";
};

// Filtering logic
const filteredData = computed(() => {
  if (!Array.isArray(dataAlumni.value)) return [];
  return dataAlumni.value.filter((item) => {
    // 1. Year Filter
    const matchYear =
      selectedYear.value === "Semua Tahun" ||
      String(item.thn_lulus).trim() === String(selectedYear.value).trim();
    
    // 2. Destination Filter
    let matchDest = false;
    if (selectedDestination.value === "Semua Tujuan") {
      matchDest = true;
    } else if (selectedDestination.value === "Tidak Melanjutkan") {
      matchDest = !item.menjutkan_ke || String(item.menjutkan_ke).toLowerCase().includes("tidak");
    } else {
      matchDest = String(item.menjutkan_ke).trim().toLowerCase() === String(selectedDestination.value).trim().toLowerCase();
    }

    // 3. Search query
    const term = searchQuery.value.toLowerCase().trim();
    if (!term) return matchYear && matchDest;

    const nameMatch = (item.nama || "").toLowerCase().includes(term);
    const nisnMatch = String(item.nisn || "").toLowerCase().includes(term);
    const nisLokalMatch = String(item.nis_lokal || "").toLowerCase().includes(term);
    const addressMatch = (item.alamat || "").toLowerCase().includes(term);

    return matchYear && matchDest && (nameMatch || nisnMatch || nisLokalMatch || addressMatch);
  });
});

// Sorting alphabetically
const sortedData = computed(() => {
  return [...filteredData.value].sort((a, b) =>
    (a.nama || "").localeCompare(b.nama || "")
  );
});

const visibleData = computed(() => {
  return showAll.value ? sortedData.value : sortedData.value.slice(0, 9);
});

// Statistics Computation
const stats = computed(() => {
  const list = Array.isArray(dataAlumni.value) ? dataAlumni.value : [];
  const total = list.length;
  
  // Continuing count
  const continuingList = list.filter(
    (item) => item.menjutkan_ke && !String(item.menjutkan_ke).toLowerCase().includes("tidak")
  );
  const continuing = continuingList.length;
  const continuingPercent = total > 0 ? Math.round((continuing / total) * 100) : 0;

  // Year frequency
  const yearCounts = {};
  list.forEach((item) => {
    if (item.thn_lulus) {
      yearCounts[item.thn_lulus] = (yearCounts[item.thn_lulus] || 0) + 1;
    }
  });
  let topYear = "-";
  let topYearCount = 0;
  for (const [y, count] of Object.entries(yearCounts)) {
    if (count > topYearCount) {
      topYear = y;
      topYearCount = count;
    }
  }

  // Destination frequency
  const destCounts = {};
  continuingList.forEach((item) => {
    if (item.menjutkan_ke) {
      const cleanDest = String(item.menjutkan_ke).trim().toUpperCase();
      destCounts[cleanDest] = (destCounts[cleanDest] || 0) + 1;
    }
  });
  let topDestination = "-";
  let topDestCount = 0;
  for (const [d, count] of Object.entries(destCounts)) {
    if (count > topDestCount) {
      topDestination = d;
      topDestCount = count;
    }
  }

  return {
    total,
    continuing,
    continuingPercent,
    topYear,
    topYearCount,
    topDestination
  };
});

const handleSearch = (query) => {
  searchQuery.value = query;
};

// Export to Excel function using xlsx
const exportToExcel = async () => {
  if (sortedData.value.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  try {
    isExporting.value = true;

    // Mapping fields to user friendly headers
    const exportData = sortedData.value.map((item, index) => ({
      No: index + 1,
      "Nama Lengkap": item.nama || "",
      NISN: item.nisn || "",
      "NIS Lokal": item.nis_lokal || "",
      NIK: item.nik || "",
      "No KK": item.no_kk || "",
      "Tempat Lahir": item.tempat_lahir || "",
      "Tanggal Lahir": item.tanggal_lahir || "",
      Umur: item.umur || "",
      "Jenis Kelamin": item.jenis_kelamin || "",
      Status: item.status || "",
      "Tahun Lulus": item.thn_lulus || "",
      "Melanjutkan Ke": item.menjutkan_ke || "Tidak Melanjutkan",
      Alamat: item.alamat || "",
      "No Telepon": item.no_hp || "",
      "No KIP/PIP": item.no_kip || "",
      "Nama Ayah Kandung": item.nama_ayah_kandung || "",
      "Nama Ibu Kandung": item.nama_ibu_kandung || "",
      "Nama Wali": item.nama_wali || ""
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set Column Widths
    const colWidths = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama Lengkap
      { wch: 15 }, // NISN
      { wch: 15 }, // NIS Lokal
      { wch: 20 }, // NIK
      { wch: 20 }, // No KK
      { wch: 15 }, // Tempat Lahir
      { wch: 15 }, // Tanggal Lahir
      { wch: 8 }, // Umur
      { wch: 15 }, // Jenis Kelamin
      { wch: 10 }, // Status
      { wch: 12 }, // Tahun Lulus
      { wch: 18 }, // Melanjutkan Ke
      { wch: 30 }, // Alamat
      { wch: 15 }, // No Telepon
      { wch: 15 }, // No KIP
      { wch: 20 }, // Nama Ayah
      { wch: 20 }, // Nama Ibu
      { wch: 20 } // Nama Wali
    ];
    ws["!cols"] = colWidths;

    // Apply header style
    const headerRange = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1", "K1", "L1", "M1", "N1", "O1", "P1", "Q1", "R1", "S1"];
    headerRange.forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F46E5" } }, // Indigo 600 header
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, "Data Alumni");

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `Data_Alumni_${selectedYear.value.replace(/[^a-zA-Z0-9]/g, "_")}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);

    setTimeout(() => {
      alert(`Data alumni berhasil diekspor ke file: ${filename}`);
    }, 100);
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat mengekspor data");
  } finally {
    isExporting.value = false;
  }
};

let timeInterval = null;

onMounted(() => {
  loadData("alumni");
  loadKepalaMadrasah();
  updateDateTime();
  timeInterval = setInterval(updateDateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
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
