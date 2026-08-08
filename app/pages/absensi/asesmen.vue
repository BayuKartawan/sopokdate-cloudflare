<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Section Header -->
      <div class="flex flex-col gap-4 mb-6">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap"
            :style="{ color: 'var(--text-heading)' }">
            <CalendarCheck class="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Asesmen Siswa</span>
            <!-- Unsaved warning badge -->
            <span v-if="hasUnsavedChanges"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20">
              <span class="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"></span>
              Ada Perubahan (Belum Simpan)
            </span>
          </h2>
          <p class="text-sm theme-text-muted mt-1">
            Input dan kelola nilai asesmen mata pelajaran siswa berdasarkan semester berjalan.
          </p>
        </div>
      </div>

      <!-- Warning Banner if Edit Lock is Active -->
      <div v-if="isLocked && currentStep > 1"
        class="p-4 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl flex items-center gap-3 mb-6 text-sm">
        <AlertTriangle class="w-5 h-5 shrink-0" />
        <div>
          <span class="font-bold">Mode Lihat Saja:</span> Pengeditan asesmen semester lampau/mendatang dikunci. Hanya
          Admin yang dapat mengubah data di luar semester berjalan.
        </div>
      </div>

      <!-- STEP 1: PILIH MAPEL -->
      <div v-if="currentStep === 1">
        <!-- Filter Tapel & Semester -->
        <div
          class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-xl border theme-bg-secondary theme-border mb-6">
          <div class="flex flex-col gap-1.5 min-w-[200px]">
            <label class="text-xs font-semibold theme-text-muted">Tahun Pelajaran</label>
            <UiSearchableSelect v-model="tapel" :options="tapelOptions" placeholder="Tahun Pelajaran"
              search-placeholder="Cari tahun..." />
          </div>

          <div class="flex flex-col gap-1.5 min-w-[200px]">
            <label class="text-xs font-semibold theme-text-muted">Semester</label>
            <UiSearchableSelect v-model="semester" :options="[
              { label: 'Ganjil', value: 'Ganjil' },
              { label: 'Genap', value: 'Genap' },
            ]" placeholder="Semester" search-placeholder="Cari semester..." />
          </div>

          <div class="flex items-end flex-1 sm:max-w-xs gap-1.5 min-w-[200px]">
            <div class="flex flex-col gap-1.5 w-full">
              <label class="text-xs font-semibold theme-text-muted">Cari Mapel / Kelas</label>
              <input v-model="searchQuery" type="text" placeholder="Cari mata pelajaran atau kelas..."
                class="theme-input px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full" />
            </div>
          </div>
        </div>

        <!-- Loader -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mb-2" />
          <p class="theme-text-muted text-sm">Memuat data jadwal & mata pelajaran...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredMapels.length === 0"
          class="border theme-border rounded-xl p-8 text-center theme-bg-secondary">
          <CalendarDays class="w-12 h-12 mx-auto theme-text-faint mb-3" />
          <h3 class="font-bold text-lg mb-1">Tidak Ada Mapel Terjadwal</h3>
          <p class="theme-text-muted text-sm max-w-md mx-auto">
            Tidak ditemukan jadwal mata pelajaran yang aktif untuk semester terpilih, atau belum ada alokasi jam
            mengajar yang diatur.
          </p>
        </div>

        <!-- List Mapel Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="mapel in filteredMapels" :key="mapel.alokasi_id" @click="selectMapel(mapel)"
            class="border theme-border rounded-xl p-5 theme-bg theme-bg-card-hover cursor-pointer transition-colors flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                  Kelas {{ mapel.nama_kelas }}
                </span>
                <span class="text-xs theme-text-muted">
                  {{ mapel.jam_mengajar }} JP / Minggu
                </span>
              </div>
              <h3 class="font-bold text-lg leading-tight mb-1" :style="{ color: 'var(--text-heading)' }">
                {{ mapel.nama_mapel }}
              </h3>
              <p class="text-xs theme-text-muted" v-if="mapel.kode_mapel">
                Kode: {{ mapel.kode_mapel }}
              </p>
            </div>

            <div class="border-t theme-border pt-3 mt-4 flex items-center justify-between text-xs theme-text-muted">
              <span class="truncate">
                Guru: <span class="font-semibold">{{ mapel.nama_guru }}</span>
              </span>
              <ChevronRight class="w-4 h-4 theme-text-faint shrink-0" />
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: KELOLA JENIS ASESMEN -->
      <div v-else-if="currentStep === 2">
        <!-- Breadcrumb / Header Info Mapel & Add Form -->
        <div
          class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-xl border theme-bg-secondary theme-border mb-6">
          <div class="flex items-center gap-3">
            <button @click="backToStep1"
              class="p-2 rounded-lg border theme-border theme-bg hover:theme-bg-secondary transition-colors"
              title="Kembali ke Daftar Mapel">
              <ChevronLeft class="w-5 h-5" />
            </button>
            <div>
              <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Mata Pelajaran Diampu
              </span>
              <h3 class="font-bold text-lg leading-tight" :style="{ color: 'var(--text-heading)' }">
                {{ selectedMapel?.nama_mapel }} — Kelas {{ selectedMapel?.nama_kelas }}
              </h3>
              <p class="text-xs theme-text-muted mt-0.5">
                Tahun Pelajaran: {{ tapel }} | Semester: {{ semester }} | Guru: {{ selectedMapel?.nama_guru }}
              </p>
            </div>
          </div>

          <!-- Add Asesmen Form (Hidden if Locked) -->
          <div v-if="!isLocked" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div class="grid grid-cols-1 sm:flex sm:items-center gap-2 flex-1">
              <UiSearchableSelect v-model="newAsesmenPreset" :options="[
                { label: 'Asesmen Harian', value: 'Asesmen Harian' },
                { label: 'UTS (Ujian Tengah Semester)', value: 'UTS' },
                { label: 'UAS (Ujian Akhir Semester)', value: 'UAS' },
                { label: 'Lainnya (Input Manual)', value: 'Lainnya' },
              ]" placeholder="Pilih Preset Asesmen" search-placeholder="Cari preset..." />

              <input v-if="newAsesmenPreset === 'Lainnya'" v-model="newAsesmenCustom" type="text"
                placeholder="Nama Asesmen..."
                class="theme-input px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" />

              <UiBaseButton
                text="Tambah"
                title="Tambah kategori asesmen baru"
                :loading="isAddingJenis"
                :disabled="isAddingJenis"
                @click="addJenisAsesmen"
              >
                <template #icon><Plus class="w-4 h-4" /></template>
              </UiBaseButton>            </div>
          </div>
        </div>

        <!-- Loader -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mb-2" />
          <p class="theme-text-muted text-sm">Memuat daftar kategori asesmen...</p>
        </div>

        <!-- Empty State Jenis Asesmen -->
        <div v-else-if="jenisAsesmens.length === 0"
          class="border theme-border rounded-xl p-8 text-center theme-bg-secondary">
          <GraduationCap class="w-12 h-12 mx-auto theme-text-faint mb-3" />
          <h3 class="font-bold text-lg mb-1">Belum Ada Asesmen</h3>
          <p class="theme-text-muted text-sm max-w-md mx-auto">
            Silakan pilih preset kategori di atas, isi materi, dan klik tombol tambah untuk memulai penginputan nilai.
          </p>
        </div>

        <!-- List Jenis Asesmen Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="jenis in jenisAsesmens" :key="jenis.id"
            class="border theme-border rounded-xl p-5 theme-bg flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                  {{ getJenisBadge(jenis.nama_asesmen) }}
                </span>

                <button v-if="!isLocked" @click="deleteJenisAsesmen(jenis)"
                  class="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors" title="Hapus Asesmen">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>

              <h4 class="font-bold text-lg mb-1 leading-tight" :style="{ color: 'var(--text-heading)' }">
                {{ jenis.nama_asesmen }}
              </h4>

              <p class="text-xs theme-text-secondary mb-3">
                <span class="font-semibold">Materi:</span> {{ jenis.materi || 'Tidak ada cakupan materi' }}
              </p>

              <p class="text-xs theme-text-muted">
                Terisi: <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ jenis.jumlah_nilai }}
                  siswa</span>
              </p>
            </div>

            <div class="border-t theme-border pt-4 mt-5 flex items-center justify-between">
              <span class="text-[11px] theme-text-muted">
                Dibuat: {{ formatDate(jenis.created_at) }}
              </span>

              <UiBaseButton
                :text="isLocked ? 'Lihat Nilai' : 'Input Nilai'"
                :title="isLocked ? 'Lihat nilai siswa untuk asesmen ini' : 'Input nilai siswa untuk asesmen ini'"
                size="sm"
                @click="selectJenisAsesmen(jenis)"
              >
                <template #icon><ChevronRight class="w-3.5 h-3.5" /></template>
              </UiBaseButton>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 3: INPUT NILAI -->
      <div v-else-if="currentStep === 3">
        <!-- Header Info Asesmen & Back Button -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border theme-bg-secondary theme-border mb-6">
          <div class="flex items-center gap-3">
            <button @click="backToStep2"
              class="p-2 rounded-lg border theme-border theme-bg hover:theme-bg-secondary transition-colors"
              title="Kembali ke Kategori Asesmen">
              <ChevronLeft class="w-5 h-5" />
            </button>
            <div>
              <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Input Nilai Asesmen
              </span>
              <h3 class="font-bold text-lg leading-tight" :style="{ color: 'var(--text-heading)' }">
                {{ selectedJenis?.nama_asesmen }}
              </h3>
              <p class="text-xs theme-text-muted mt-0.5">
                Mapel: {{ selectedMapel?.nama_mapel }} | Kelas: {{ selectedMapel?.nama_kelas }} | Materi: {{
                  selectedJenis?.materi || '-' }}
              </p>
            </div>
          </div>

          <!-- Actions (Hidden/Disabled if Locked) -->
          <div class="flex items-center gap-3">
            <UiBaseButton
              v-if="!isLocked"
              text="Simpan Perubahan"
              title="Simpan semua perubahan nilai siswa"
              :loading="isSavingGrades"
              :disabled="isSavingGrades || !hasUnsavedChanges"
              @click="saveGrades"
            >
              <template #icon><Save class="w-4 h-4" /></template>
            </UiBaseButton>
            <span v-else
              class="text-xs font-semibold theme-text-muted theme-bg-secondary px-3 py-1.5 border theme-border rounded-lg">
              Mode Baca
            </span>
          </div>
        </div>

        <!-- Input Cakupan Materi -->
        <div class="p-5 border theme-border rounded-xl theme-bg mb-6 flex flex-col gap-2">
          <label class="text-xs font-bold theme-text-secondary flex items-center gap-1">
            <span>Cakupan Materi Pembelajaran</span>
            <span class="text-red-500">* (Wajib diisi)</span>
          </label>
          <input v-model="selectedJenis.materi" type="text"
            placeholder="Tuliskan cakupan materi yang diujikan dalam asesmen ini..." :disabled="isLocked"
            @input="markAsChanged"
            class="theme-input w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-75 disabled:cursor-not-allowed" />
        </div>

        <!-- Loader -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mb-2" />
          <p class="theme-text-muted text-sm">Memuat daftar siswa dan nilai...</p>
        </div>

        <!-- Empty State Siswa -->
        <div v-else-if="studentGrades.length === 0"
          class="border theme-border rounded-xl p-8 text-center theme-bg-secondary">
          <Users class="w-12 h-12 mx-auto theme-text-faint mb-3" />
          <h3 class="font-bold text-lg mb-1">Tidak Ada Siswa Terdaftar</h3>
          <p class="theme-text-muted text-sm max-w-md mx-auto">
            Tidak ditemukan siswa yang terdaftar di kelas {{ selectedMapel?.nama_kelas }} untuk tahun pelajaran {{ tapel
            }}.
          </p>
        </div>

        <!-- Form Table (Desktop) / Cards (Mobile) -->
        <div v-else>
          <!-- DESKTOP TABLE VIEW -->
          <div class="hidden md:block border theme-border rounded-xl overflow-hidden theme-bg">
            <table class="w-full border-collapse text-left">
              <thead>
                <tr class="theme-bg-secondary border-b theme-border text-xs font-semibold theme-text-muted">
                  <th class="py-3.5 px-4 w-12 text-center">No</th>
                  <th class="py-3.5 px-4">Nama Siswa</th>
                  <th class="py-3.5 px-4 w-36">NISN / NIS Lokal</th>
                  <th class="py-3.5 px-4 w-28 text-center">Nilai (0-100)</th>
                  <th class="py-3.5 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody class="theme-text text-sm">
                <tr v-for="(student, index) in studentGrades" :key="student.siswa_id"
                  :class="[index > 0 ? 'border-t theme-border' : '', 'hover:theme-bg-secondary transition-colors']">
                  <td class="py-3 px-4 text-center theme-text-faint font-mono">{{ index + 1 }}</td>
                  <td class="py-3 px-4 font-semibold theme-text">
                    {{ student.nama }}
                  </td>
                  <td class="py-3 px-4 theme-text-muted font-mono text-xs">
                    {{ student.nisn || student.nis_lokal || '-' }}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <input v-model.number="student.nilai" type="number" min="0" max="100" placeholder="-"
                      @input="markAsChanged" :disabled="isLocked"
                      class="theme-input w-20 px-2 py-1.5 border rounded text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-70 disabled:cursor-not-allowed" />
                  </td>
                  <td class="py-3 px-4">
                    <input v-model="student.catatan" type="text" placeholder="Masukkan catatan opsional..."
                      @input="markAsChanged" :disabled="isLocked"
                      class="theme-input w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-70 disabled:cursor-not-allowed" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- MOBILE CARDS VIEW -->
          <div class="grid grid-cols-1 gap-4 md:hidden">
            <div v-for="(student, index) in studentGrades" :key="student.siswa_id"
              class="border theme-border rounded-xl p-4 theme-bg flex flex-col gap-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-mono theme-text-faint">{{ index + 1 }}.</span>
                    <h4 class="font-bold text-sm theme-text truncate">
                      {{ student.nama }}
                    </h4>
                  </div>
                  <p class="text-xs theme-text-muted font-mono mt-0.5">
                    NISN: {{ student.nisn || student.nis_lokal || '-' }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-3 items-center gap-3 pt-2 border-t theme-border">
                <div class="col-span-1">
                  <label class="text-xs font-semibold theme-text-muted block mb-1">Nilai (0-100)</label>
                  <input v-model.number="student.nilai" type="number" min="0" max="100" placeholder="-"
                    @input="markAsChanged" :disabled="isLocked"
                    class="theme-input w-full px-2 py-1.5 border rounded text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-70 disabled:cursor-not-allowed" />
                </div>

                <div class="col-span-2">
                  <label class="text-xs font-semibold theme-text-muted block mb-1">Catatan</label>
                  <input v-model="student.catatan" type="text" placeholder="Catatan..." @input="markAsChanged"
                    :disabled="isLocked"
                    class="theme-input w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-70 disabled:cursor-not-allowed" />
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Footer Bar -->
          <div class="flex items-center justify-between border theme-border rounded-xl p-4 theme-bg-secondary mt-6">
            <span class="text-xs theme-text-muted">
              Menampilkan <span class="font-bold theme-text-secondary">{{ studentGrades.length }}</span> siswa
            </span>

            <UiBaseButton
              v-if="!isLocked"
              text="Simpan Perubahan"
              title="Simpan semua perubahan nilai siswa"
              :loading="isSavingGrades"
              :disabled="isSavingGrades || !hasUnsavedChanges"
              @click="saveGrades"
            >
              <template #icon><Save class="w-4 h-4" /></template>
            </UiBaseButton>
            <span v-else class="text-xs font-semibold theme-text-muted">
              Pengeditan Terkunci
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  CalendarCheck,
  CalendarDays,
  Loader2,
  GraduationCap,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
} from "lucide-vue-next";
import { useAcademicYear } from "~/composables/utils/useAcademicYear";
import { useAuth } from "~/composables/auth/useAuth";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch } from "~/utils/api";

const { Notify, Confirm } = useNotiflix();
const { getUserRole, getGtkId } = useAuth();
const { currentAcademicYear, currentSemester } = useAcademicYear();

// --- Navigation States
const currentStep = ref(1); // 1: Pilih Mapel, 2: Jenis Asesmen, 3: Input Nilai
const isLoading = ref(false);

// --- Data States
const tapel = ref("");
const semester = ref("");
const mapels = ref([]);
const jenisAsesmens = ref([]);
const studentGrades = ref([]);

// --- Selected Entities
const selectedMapel = ref(null);
const selectedJenis = ref(null);

// --- Search and Add Forms
const searchQuery = ref("");
const newAsesmenPreset = ref("Asesmen Harian");
const newAsesmenCustom = ref("");
const newAsesmenMateri = ref("");
const isAddingJenis = ref(false);
const isSavingGrades = ref(false);

// --- Unsaved Changes Track
const hasUnsavedChanges = ref(false);
const originalGradesJSON = ref("");
const originalMateri = ref("");

// SEMESTER EDIT LOCK CHECK
const isLocked = computed(() => {
  if (getUserRole() === "admin") return false;
  return tapel.value !== currentAcademicYear.value || semester.value !== currentSemester.value;
});

// Tapel options setup (current, previous, and next)
const tapelOptions = computed(() => {
  const current = currentAcademicYear.value;
  const parts = current.split("/");
  if (parts.length !== 2) return [current];
  const start = parseInt(parts[0]);
  const end = parseInt(parts[1]);
  return [
    `${start - 1}/${end - 1}`,
    current,
    `${start + 1}/${end + 1}`,
  ];
});

// Computed filtering for mapel in step 1
const filteredMapels = computed(() => {
  if (!searchQuery.value) return mapels.value;
  const query = searchQuery.value.toLowerCase().trim();
  return mapels.value.filter(
    (m) =>
      m.nama_mapel?.toLowerCase().includes(query) ||
      m.nama_kelas?.toLowerCase().includes(query) ||
      m.kode_mapel?.toLowerCase().includes(query) ||
      m.nama_guru?.toLowerCase().includes(query)
  );
});

// Init
onMounted(() => {
  tapel.value = currentAcademicYear.value;
  semester.value = currentSemester.value;
  fetchMapelGuru();
});

// Fetch mapel & kelas for the teacher/all
const fetchMapelGuru = async () => {
  isLoading.value = true;
  try {
    const role = getUserRole();
    const gtkId = getGtkId();
    let url = "/api/asesmen/mapel-guru";
    if (role !== "admin") {
      url += `?guru_id=${gtkId}`;
    }
    const response = await authenticatedFetch(url);
    if (!response.ok) throw new Error("Gagal mengambil data mapel");
    mapels.value = await response.json();
  } catch (err) {
    console.error(err);
    Notify.failure("Gagal memuat daftar mata pelajaran");
  } finally {
    isLoading.value = false;
  }
};

// Select Mapel & proceed to step 2
const selectMapel = (mapel) => {
  selectedMapel.value = mapel;
  currentStep.value = 2;
  fetchJenisAsesmen();
};

const backToStep1 = () => {
  selectedMapel.value = null;
  currentStep.value = 1;
};

// Fetch jenis asesmen in step 2
const fetchJenisAsesmen = async () => {
  if (!selectedMapel.value) return;
  isLoading.value = true;
  try {
    const role = getUserRole();
    const gtkId = selectedMapel.value.guru_id;
    const mapelId = selectedMapel.value.mapel_id;
    const kelasId = selectedMapel.value.kelas_id;

    let url = `/api/asesmen/jenis?mapel_id=${mapelId}&kelas_id=${kelasId}&tapel=${encodeURIComponent(tapel.value)}&semester=${encodeURIComponent(semester.value)}`;
    if (role !== "admin") {
      url += `&guru_id=${gtkId}`;
    } else {
      url += `&guru_id=${gtkId}`;
    }

    const response = await authenticatedFetch(url);
    if (!response.ok) throw new Error("Gagal memuat jenis asesmen");
    jenisAsesmens.value = await response.json();
  } catch (err) {
    console.error(err);
    Notify.failure("Gagal memuat kategori asesmen");
  } finally {
    isLoading.value = false;
  }
};

// Add new jenis asesmen
const addJenisAsesmen = async () => {
  if (!selectedMapel.value) return;
  if (isLocked.value) {
    Notify.warning("Pengeditan terkunci di luar semester aktif");
    return;
  }

  let namaAsesmen = newAsesmenPreset.value;
  if (namaAsesmen === "Lainnya") {
    if (!newAsesmenCustom.value.trim()) {
      Notify.warning("Nama asesmen custom harus diisi");
      return;
    }
    namaAsesmen = newAsesmenCustom.value.trim();
  }

  isAddingJenis.value = true;
  try {
    const response = await authenticatedFetch("/api/asesmen/jenis", {
      method: "POST",
      body: JSON.stringify({
        guru_id: selectedMapel.value.guru_id,
        mapel_id: selectedMapel.value.mapel_id,
        kelas_id: selectedMapel.value.kelas_id,
        nama_asesmen: namaAsesmen,
        materi: "", // materi dikosongkan dulu saat buat kategori, diisi di step 3
        tahun_pelajaran: tapel.value,
        semester: semester.value,
      }),
    });

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error("Kategori asesmen ini sudah ada");
      }
      throw new Error("Gagal menyimpan");
    }

    Notify.success("Kategori asesmen berhasil ditambahkan");
    newAsesmenCustom.value = "";
    newAsesmenMateri.value = "";
    fetchJenisAsesmen();
  } catch (err) {
    Notify.failure(err.message || "Gagal menambah kategori asesmen");
  } finally {
    isAddingJenis.value = false;
  }
};

// Delete jenis asesmen
const deleteJenisAsesmen = (jenis) => {
  if (isLocked.value) {
    Notify.warning("Pengeditan terkunci di luar semester aktif");
    return;
  }

  Confirm.show(
    "Hapus Asesmen",
    `Apakah Anda yakin ingin menghapus "${jenis.nama_asesmen}"? Semua data nilai siswa untuk kategori ini akan ikut terhapus permanen.`,
    "Ya, Hapus",
    "Batal",
    async () => {
      try {
        const response = await authenticatedFetch(`/api/asesmen/jenis?id=${jenis.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Gagal menghapus");
        Notify.success("Kategori asesmen berhasil dihapus");
        fetchJenisAsesmen();
      } catch (err) {
        Notify.failure(err.message || "Gagal menghapus kategori asesmen");
      }
    }
  );
};

// Select assessment & proceed to step 3
const selectJenisAsesmen = (jenis) => {
  selectedJenis.value = jenis;
  currentStep.value = 3;
  hasUnsavedChanges.value = false;
  fetchStudentGrades();
};

const backToStep2 = () => {
  if (hasUnsavedChanges.value && !isLocked.value) {
    Confirm.show(
      "Perubahan Belum Disimpan",
      "Ada perubahan nilai yang belum disimpan. Apakah Anda yakin ingin kembali? Perubahan Anda akan hilang.",
      "Ya, Kembali",
      "Batal",
      () => {
        selectedJenis.value = null;
        currentStep.value = 2;
        hasUnsavedChanges.value = false;
        fetchJenisAsesmen();
      }
    );
  } else {
    selectedJenis.value = null;
    currentStep.value = 2;
    fetchJenisAsesmen();
  }
};

// Fetch student grades in step 3
const fetchStudentGrades = async () => {
  if (!selectedJenis.value) return;
  isLoading.value = true;
  try {
    const response = await authenticatedFetch(`/api/asesmen/nilai?jenis_asesmen_id=${selectedJenis.value.id}`);
    if (!response.ok) throw new Error("Gagal mengambil nilai siswa");
    const data = await response.json();

    studentGrades.value = data.map(s => ({
      siswa_id: s.siswa_id,
      nama: s.nama,
      nisn: s.nisn,
      nis_lokal: s.nis_lokal,
      nilai: s.nilai !== null ? s.nilai : "",
      catatan: s.catatan || "",
    }));

    originalGradesJSON.value = JSON.stringify(studentGrades.value);
    originalMateri.value = selectedJenis.value.materi || "";
    hasUnsavedChanges.value = false;
  } catch (err) {
    console.error(err);
    Notify.failure("Gagal memuat nilai siswa");
  } finally {
    isLoading.value = false;
  }
};

// Detect change
const markAsChanged = () => {
  if (originalGradesJSON.value !== "") {
    const currentJSON = JSON.stringify(studentGrades.value);
    const gradesChanged = currentJSON !== originalGradesJSON.value;
    const materiChanged = (selectedJenis.value?.materi || "") !== originalMateri.value;
    hasUnsavedChanges.value = gradesChanged || materiChanged;
  }
};

// Save grades
const saveGrades = async () => {
  if (isLocked.value) {
    Notify.warning("Pengeditan terkunci di luar semester aktif");
    return;
  }
  if (!selectedJenis.value || studentGrades.value.length === 0) return;

  // Validate materi
  if (!selectedJenis.value.materi || !selectedJenis.value.materi.trim()) {
    Notify.warning("Cakupan materi wajib diisi sebelum menyimpan nilai!");
    return;
  }

  // Validate values
  for (const grade of studentGrades.value) {
    if (grade.nilai !== "" && grade.nilai !== null && grade.nilai !== undefined) {
      const num = Number(grade.nilai);
      if (isNaN(num) || num < 0 || num > 100) {
        Notify.warning(`Nilai untuk ${grade.nama} harus berada di antara 0 sampai 100.`);
        return;
      }
    }
  }

  isSavingGrades.value = true;
  try {
    const dataPayload = studentGrades.value.map(g => ({
      siswa_id: g.siswa_id,
      nilai: g.nilai === "" ? null : Number(g.nilai),
      catatan: g.catatan,
    }));

    const response = await authenticatedFetch("/api/asesmen/nilai", {
      method: "POST",
      body: JSON.stringify({
        jenis_asesmen_id: selectedJenis.value.id,
        materi: selectedJenis.value.materi.trim(),
        data: dataPayload,
      }),
    });

    if (!response.ok) throw new Error("Gagal menyimpan data nilai");

    Notify.success("Nilai siswa dan materi berhasil disimpan");
    hasUnsavedChanges.value = false;
    originalGradesJSON.value = JSON.stringify(studentGrades.value);
    originalMateri.value = selectedJenis.value.materi.trim();
  } catch (err) {
    Notify.failure(err.message || "Gagal menyimpan nilai");
  } finally {
    isSavingGrades.value = false;
  }
};

// Utility helpers
const getJenisBadge = (name) => {
  if (name.includes("Harian")) return "Harian";
  if (name.includes("UTS")) return "UTS";
  if (name.includes("UAS")) return "UAS";
  return "Asesmen";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return dateStr;
  }
};
</script>
