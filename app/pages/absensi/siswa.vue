<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title and Header Info -->
      <div class="flex flex-col gap-4 mb-6">
        <div>
          <h2 class="text-xl text-white sm:text-2xl font-bold flex items-center gap-2">
            <CalendarCheck class="w-7 h-7 text-emerald-400" />
            Absensi Siswa
          </h2>
          <p class="text-sm text-zinc-400 mt-1">
            Pencatatan dan pengelolaan kehadiran harian siswa madrasah
          </p>
        </div>
      </div>

      <!-- Filter & Date Navigation Section -->
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-xl border bg-zinc-800/20 border-zinc-700/40 mb-6">
        <!-- Pilihan Kelas -->
        <div class="flex flex-col gap-1.5 min-w-[240px]">
          <label class="text-xs font-semibold text-zinc-400">Kelas / Rombel</label>
          <select
            v-model="selectedClass"
            :disabled="isSaving || isWaliKelas"
            class="h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="" disabled>-- Pilih Kelas --</option>
            <option
              v-for="kelas in dataKelas"
              :key="kelas.id_kelas"
              :value="kelas.id_kelas"
            >
              {{ kelas.nama_kelas }}
            </option>
          </select>
        </div>

        <!-- Date Navigation Bar -->
        <ClientOnly>
          <div class="flex items-center justify-between bg-zinc-950/40 border border-zinc-850 p-2 px-3 rounded-xl flex-1 md:max-w-[480px]">
            <!-- Arrow Kiri (Mundur) -->
            <button 
              type="button"
              @click="ubahTanggal(-1)" 
              :disabled="isPrevDisabled || isSaving"
              class="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-zinc-800"
              title="Hari Sebelumnya"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            
            <!-- Tanggal Display -->
            <div class="text-center px-4">
              <span class="text-xs sm:text-sm font-bold text-zinc-100 block select-none">{{ formattedTanggal }}</span>
              <span class="text-[10px] font-mono text-zinc-400">
                Tapel: {{ tapel }} | Semester: {{ semester }}
              </span>
            </div>
            
            <!-- Arrow Kanan (Maju) -->
            <button 
              type="button"
              @click="ubahTanggal(1)" 
              :disabled="isNextDisabled || isSaving"
              class="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-zinc-800"
              title="Hari Selanjutnya"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          <template #fallback>
            <div class="h-14 bg-zinc-850/40 border border-zinc-800/40 rounded-xl flex-1 md:max-w-[480px] animate-pulse"></div>
          </template>
        </ClientOnly>
      </div>

      <!-- Warning/Info Banner if Teacher is NOT a Wali Kelas -->
      <div 
        v-if="userRole === 'guru' && !isWaliKelas && !isLoadingKelas && !isLoadingGtk" 
        class="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm flex items-start gap-2.5 mb-6"
      >
        <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <span class="font-bold">Akses Terbatas:</span> Akun guru Anda tidak terdaftar sebagai Wali Kelas di kelas manapun untuk tahun ajaran aktif. Anda hanya dapat melihat data absensi ini tanpa izin untuk mengedit atau menyimpan.
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/20 overflow-hidden">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-16">
          <Loader2 class="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p class="text-zinc-400 text-sm">Memuat daftar siswa...</p>
        </div>

        <!-- Empty State (No Class Selected) -->
        <div v-else-if="!selectedClass" class="text-center py-16 px-4">
          <GraduationCap class="w-16 h-16 text-zinc-600 mx-auto mb-3" stroke-width="1.5" />
          <p class="text-zinc-400 font-semibold text-lg">Kelas belum dipilih</p>
          <p class="text-zinc-500 text-sm mt-1">Silakan pilih kelas terlebih dahulu untuk melihat dan menginput absensi.</p>
        </div>

        <!-- Hari Minggu / Libur State -->
        <div v-else-if="isHariLiburAtauMinggu" class="text-center py-16 px-4">
          <CalendarOff class="w-16 h-16 text-amber-500 mx-auto mb-3" stroke-width="1.5" />
          <p class="text-zinc-300 font-bold text-lg">{{ keteranganLibur }}</p>
          <p class="text-zinc-500 text-sm mt-1">Tidak ada aktivitas pengisian absensi siswa pada hari libur sekolah.</p>
        </div>

        <!-- Empty State (No Students) -->
        <div v-else-if="students.length === 0" class="text-center py-16 px-4">
          <Users class="w-16 h-16 text-zinc-600 mx-auto mb-3" stroke-width="1.5" />
          <p class="text-zinc-400 font-semibold text-lg">Tidak ada siswa</p>
          <p class="text-zinc-500 text-sm mt-1">Tidak ditemukan data siswa aktif di kelas {{ currentClassName }}.</p>
        </div>

        <!-- Attendance Table -->
        <div v-else class="flex flex-col">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-zinc-800/40 border-b border-zinc-700/50 text-zinc-300 uppercase text-xs font-semibold">
                  <th class="py-4 px-4 text-center w-12">No</th>
                  <th class="py-4 px-4">Nama Siswa</th>
                  <th class="py-4 px-4 w-28 text-center">NISN</th>
                  <th class="py-4 px-4 text-center w-80">Status Kehadiran</th>
                  <th class="py-4 px-4 min-w-48">Keterangan / Catatan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/60 text-zinc-300">
                <tr 
                  v-for="(siswa, idx) in students" 
                  :key="siswa.siswa_id"
                  class="hover:bg-zinc-800/10 transition-colors"
                >
                  <td class="py-4 px-4 text-center text-zinc-500 font-mono">{{ idx + 1 }}</td>
                  <td class="py-4 px-4 font-semibold text-zinc-100">{{ toTitleCase(siswa.nama) }}</td>
                  <td class="py-4 px-4 text-center text-zinc-400 font-mono">{{ siswa.nisn || "-" }}</td>
                  <td class="py-3 px-4">
                    <!-- Status Button Pills Group -->
                    <div class="flex justify-center items-center gap-1.5 bg-zinc-950/40 p-1 rounded-lg border border-zinc-800/80 w-fit mx-auto">
                      <!-- H (Hadir) -->
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'H')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'H' 
                            ? 'bg-emerald-600/90 text-white font-bold shadow-md shadow-emerald-950/20' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                          'px-3.5 py-1.5 rounded-md text-xs transition-all duration-200'
                        ]"
                      >
                        Hadir
                      </button>

                      <!-- S (Sakit) -->
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'S')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'S' 
                            ? 'bg-amber-600/90 text-white font-bold shadow-md shadow-amber-950/20' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                          'px-3.5 py-1.5 rounded-md text-xs transition-all duration-200'
                        ]"
                      >
                        Sakit
                      </button>

                      <!-- I (Izin) -->
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'I')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'I' 
                            ? 'bg-blue-600/90 text-white font-bold shadow-md shadow-blue-950/20' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                          'px-3.5 py-1.5 rounded-md text-xs transition-all duration-200'
                        ]"
                      >
                        Izin
                      </button>

                      <!-- A (Alpa) -->
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'A')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'A' 
                            ? 'bg-red-600/90 text-white font-bold shadow-md shadow-red-950/20' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                          'px-3.5 py-1.5 rounded-md text-xs transition-all duration-200'
                        ]"
                      >
                        Alpa
                      </button>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <input
                      type="text"
                      v-model="siswa.keterangan"
                      placeholder="Catatan (opsional)..."
                      :disabled="isDisabled"
                      class="w-full h-9 px-3 rounded-lg border border-zinc-700 bg-zinc-850 text-zinc-200 placeholder-zinc-500 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:opacity-60"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="flex items-center justify-between p-4 bg-zinc-800/20 border-t border-zinc-700/40">
            <div class="text-xs text-zinc-400">
              Menampilkan <span class="font-bold text-zinc-300">{{ students.length }}</span> siswa
            </div>
            <BaseButton
              v-if="!isDisabled"
              :text="isSaving ? 'Menyimpan...' : 'Simpan Absensi'"
              @click="saveAttendance"
              :disabled="isSaving"
              class="!bg-emerald-600 !text-white hover:!bg-emerald-500 shadow-lg shadow-emerald-900/20"
            >
              <template #icon>
                <Save v-if="!isSaving" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
              </template>
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { 
  CalendarCheck, 
  Loader2, 
  GraduationCap, 
  Users, 
  Save, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CalendarOff
} from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useAuth } from "~/composables/auth/useAuth";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch, fetchFromApi } from "~/utils/api";
import { dapatkanTahunDanSemester } from "~/utils/dateHelper";

// --- Services & Config
const { Notify } = useNotiflix();
const { getUserRole, getGtkId, getUserData } = useAuth();
const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();

// Helper to get local date string YYYY-MM-DD
function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- States
const tanggal = ref("");
const selectedClass = ref("");
const students = ref([]);
const tapel = ref("");
const semester = ref("");
const daftarHariLibur = ref([]); // Array of holiday events
const hariLiburMingguanIndex = ref(0); // 0 = Minggu by default

const userRole = ref("");
const userGtkId = ref(null);
const isWaliKelas = ref(false);
const waliKelasClassName = ref("");

const isLoading = ref(false);
const isLoadingKelas = ref(false);
const isLoadingGtk = ref(false);
const isSaving = ref(false);

// --- Computed Date Constraints
const hariIniStr = computed(() => {
  return getLocalDateString(new Date());
});

const batasanMinStr = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() - 7); // Batasi 1 minggu (7 hari) ke belakang
  return getLocalDateString(date);
});

const isPrevDisabled = computed(() => {
  if (!tanggal.value) return true;
  return tanggal.value <= batasanMinStr.value;
});

const isNextDisabled = computed(() => {
  if (!tanggal.value) return true;
  return tanggal.value >= hariIniStr.value;
});

const isHariLiburMingguan = computed(() => {
  if (!tanggal.value) return false;
  const parts = tanggal.value.split('-');
  const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return date.getDay() === hariLiburMingguanIndex.value;
});

const matchingLiburEvent = computed(() => {
  if (!tanggal.value || !Array.isArray(daftarHariLibur.value)) return null;
  return daftarHariLibur.value.find(h => {
    return tanggal.value >= h.tanggal_mulai && tanggal.value <= h.tanggal_selesai;
  });
});

const isHariLibur = computed(() => {
  return !!matchingLiburEvent.value;
});

const isHariLiburAtauMinggu = computed(() => {
  return isHariLiburMingguan.value || isHariLibur.value;
});

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const namaHariLiburMingguan = computed(() => {
  return NAMA_HARI[hariLiburMingguanIndex.value] || "Minggu";
});

const keteranganLibur = computed(() => {
  if (isHariLiburMingguan.value) {
    return `Hari ${namaHariLiburMingguan.value} - Libur Mingguan`;
  }
  if (matchingLiburEvent.value) {
    return `Hari Libur - ${matchingLiburEvent.value.keterangan}`;
  }
  return "";
});

const formattedTanggal = computed(() => {
  if (!tanggal.value) return "";
  const parts = tanggal.value.split('-');
  const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const localeDateStr = date.toLocaleDateString("id-ID", options);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Hari Ini - ${localeDateStr}`;
  } else if (diffDays === 1) {
    return `Kemarin - ${localeDateStr}`;
  } else {
    return localeDateStr;
  }
});

// --- Computed Properties
const currentClassName = computed(() => {
  if (!selectedClass.value) return "";
  const match = dataKelas.value.find(k => k.id_kelas === selectedClass.value);
  return match ? match.nama_kelas : selectedClass.value;
});

// Checks if input is disabled (user not authorized, saving, or Sunday/holiday)
const isDisabled = computed(() => {
  if (isSaving.value || isHariLiburAtauMinggu.value) return true;
  // If user is a teacher, they MUST be a Wali Kelas to edit
  if (userRole.value === "guru") {
    return !isWaliKelas.value;
  }
  // Admin can always edit
  return false;
});

// --- Methods
const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

function cleanName(name) {
  if (!name) return "";
  let cleaned = name.split(",")[0];
  cleaned = cleaned.replace(/^(h\.|hj\.|dra\.|drs\.|prof\.|dr\.)\s+/gi, "");
  return cleaned.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

const updateStatus = (siswa, newStatus) => {
  siswa.status = newStatus;
};

const ubahTanggal = (offset) => {
  if (!tanggal.value) return;
  const parts = tanggal.value.split('-');
  const current = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  current.setDate(current.getDate() + offset);
  const nextDateStr = getLocalDateString(current);
  
  // Batasi agar tidak melampaui batas atas (hari ini) atau batas bawah (7 hari lalu)
  if (nextDateStr < batasanMinStr.value || nextDateStr > hariIniStr.value) {
    return;
  }
  tanggal.value = nextDateStr;
};

// Auto calculate Tapel and Semester when date changes
watch(tanggal, (newDate) => {
  if (!newDate) return;
  const result = dapatkanTahunDanSemester(newDate);
  tapel.value = result.tahunPelajaran;
  semester.value = result.semester;
}, { immediate: true });

const fetchHolidays = async () => {
  if (!tapel.value) return;
  try {
    // 1. Fetch holidays
    const data = await fetchFromApi("kalender_pendidikan", false, null, {
      filter_col: "tahun_pelajaran",
      filter_val: tapel.value
    });
    if (Array.isArray(data)) {
      daftarHariLibur.value = data.filter(item => item.tipe === "libur");
    }

    // 2. Fetch weekly holiday configuration
    const configData = await fetchFromApi("pengaturan_tapel", false, null, {
      filter_col: "tahun_pelajaran",
      filter_val: tapel.value
    });
    if (Array.isArray(configData) && configData.length > 0) {
      const match = configData.find(item => item.tahun_pelajaran === tapel.value);
      if (match) {
        hariLiburMingguanIndex.value = parseInt(match.hari_libur_mingguan);
        return;
      }
    }
    // Default fallback
    hariLiburMingguanIndex.value = 0; // Default to Sunday (0)
  } catch (err) {
    console.error("Gagal memuat kalender pendidikan:", err);
  }
};

// Fetch holidays when tapel changes
watch(tapel, async (newTapel) => {
  if (newTapel) {
    await fetchHolidays();
  }
});

// Refetch students when Class or Date changes
watch([selectedClass, tanggal], async ([newClass, newDate]) => {
  if (!newClass || !newDate || isHariLiburAtauMinggu.value) {
    students.value = [];
    return;
  }
  
  await fetchStudents();
});

const fetchStudents = async () => {
  isLoading.value = true;
  try {
    const response = await authenticatedFetch(
      `/api/absensi?tanggal=${tanggal.value}&kelas_id=${encodeURIComponent(selectedClass.value)}`
    );
    const data = await response.json();
    
    if (Array.isArray(data)) {
      // Map data and assign default status "H" if status is null
      students.value = data.map(siswa => ({
        siswa_id: siswa.siswa_id,
        nama: siswa.nama,
        nisn: siswa.nisn,
        nis_lokal: siswa.nis_lokal,
        status: siswa.status || "H",
        keterangan: siswa.keterangan || ""
      }));
    } else {
      students.value = [];
    }
  } catch (err) {
    console.error("Gagal memuat absensi siswa:", err);
    Notify.failure("Gagal mengambil data absensi siswa");
    students.value = [];
  } finally {
    isLoading.value = false;
  }
};

const saveAttendance = async () => {
  if (students.value.length === 0 || isHariLiburAtauMinggu.value) return;
  
  isSaving.value = true;
  try {
    const uData = getUserData();
    const inputBy = uData ? uData.userId : null;

    const payload = {
      tanggal: tanggal.value,
      kelas_id: selectedClass.value,
      tahun_pelajaran: tapel.value,
      semester: semester.value,
      input_by: inputBy,
      data: students.value.map(s => ({
        siswa_id: s.siswa_id,
        status: s.status,
        keterangan: s.keterangan
      }))
    };

    const response = await authenticatedFetch("/api/absensi", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      Notify.success("Absensi kelas berhasil disimpan.");
    } else {
      throw new Error(result.error || "Gagal menyimpan.");
    }
  } catch (err) {
    console.error("Gagal simpan absensi:", err);
    Notify.failure(`Gagal menyimpan absensi: ${err.message}`);
  } finally {
    isSaving.value = false;
  }
};

// Check if logged-in guru is Wali Kelas of a class
const checkWaliKelasStatus = async () => {
  userRole.value = getUserRole();
  const gId = getGtkId();
  userGtkId.value = gId ? parseInt(gId) : null;

  if (userRole.value === "guru" && userGtkId.value) {
    isLoadingGtk.value = true;
    try {
      // Fetch data_gtk to find the teacher's full name
      const gtkData = await fetchFromApi("data_gtk", false, null, { 
        filter_col: "id", 
        filter_val: String(userGtkId.value) 
      });
      
      if (Array.isArray(gtkData)) {
        const myRecord = gtkData.find(g => 
          g.id === userGtkId.value || 
          String(g.id) === String(userGtkId.value)
        );
        
        if (myRecord) {
          const namaGuru = myRecord.nama_lengkap;
          
          // Match teacher name or Peg ID with wali_kelas in classes list
          const classes = dataKelas.value;
          const myClass = classes.find(c => {
            const cWali = c.wali_kelas;
            const myPegId = myRecord.peg_id;
            
            const matchName = cleanName(cWali) === cleanName(namaGuru);
            const matchPegId = String(cWali).trim() === String(myPegId).trim();
            
            return matchPegId || matchName;
          });
          
          if (myClass) {
            isWaliKelas.value = true;
            waliKelasClassName.value = myClass.nama_kelas;
            selectedClass.value = myClass.id_kelas;
          }
        }
      }
    } catch (err) {
      console.error("Gagal validasi status wali kelas:", err);
    } finally {
      isLoadingGtk.value = false;
    }
  }
};

// --- Lifecycle
onMounted(async () => {
  // Initialize tanggal to today's local date string
  tanggal.value = getLocalDateString(new Date());

  isLoadingKelas.value = true;
  try {
    await loadDataKelas("data_kelas");
    await checkWaliKelasStatus();
  } catch (err) {
    console.error(err);
  } finally {
    isLoadingKelas.value = false;
  }
});
</script>

<style scoped>
/* Transparansi tap indicator di handphone */
a, button {
  -webkit-tap-highlight-color: transparent;
}
</style>
