<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/75" @click="closeModal"></div>

        <!-- Modal Card -->
        <div
          class="relative z-10 w-full max-w-2xl theme-bg theme-border border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div
            class="flex items-center justify-between p-4 sm:p-5 theme-bg-secondary border-b theme-border shrink-0">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <CalendarX class="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 class="text-base font-bold theme-text">
                  Tanggal Belum Kirim Absen
                </h3>
                <p class="text-xs theme-text-muted">
                  Daftar hari efektif mengajar pada semester aktif yang belum diisi absensinya
                </p>
              </div>
            </div>
            <button type="button" @click="closeModal"
              class="p-2 rounded-lg theme-text-muted hover:theme-text hover:theme-bg-tertiary transition-colors cursor-pointer">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Controls / Filters -->
          <div
            class="p-4 theme-bg-secondary/50 border-b theme-border grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            <!-- Pilihan Kelas -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold theme-text-muted">Pilih Kelas</label>
              <UiSearchableSelect v-model="missingSelectedClass" :options="accessibleClasses"
                option-label="nama_kelas" option-value="id_kelas" placeholder="-- Pilih Kelas --"
                search-placeholder="Cari kelas..." :disabled="isWaliKelas && userRole === 'guru'" />
            </div>

            <!-- Summary Status -->
            <div class="flex items-center justify-end gap-2 text-xs">
              <div class="px-3 py-1.5 rounded-lg theme-bg theme-border border text-center">
                <span class="theme-text-muted block text-[10px]">Hari Efektif</span>
                <span class="font-bold theme-text">{{ totalHariEfektif }}</span>
              </div>
              <div class="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span class="text-emerald-600 dark:text-emerald-400 block text-[10px]">Sudah Kirim</span>
                <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ totalSudahKirim }}</span>
              </div>
              <div class="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <span class="text-amber-600 dark:text-amber-400 block text-[10px]">Belum Kirim</span>
                <span class="font-bold text-amber-600 dark:text-amber-400">{{ missingDatesList.length }}</span>
              </div>
            </div>
          </div>

          <!-- Modal Body / Content -->
          <div class="p-4 sm:p-5 overflow-y-auto flex-1">
            <!-- Loading State -->
            <div v-if="isLoading" class="text-center py-12">
              <Loader2 class="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
              <p class="text-xs theme-text-muted">Memeriksa tanggal absensi...</p>
            </div>

            <!-- No Class Selected -->
            <div v-else-if="!missingSelectedClass" class="text-center py-12">
              <CalendarX class="w-12 h-12 theme-text-muted mx-auto mb-2 opacity-50" />
              <p class="text-sm font-semibold theme-text">Silakan Pilih Kelas</p>
              <p class="text-xs theme-text-muted mt-1">Pilih kelas di atas untuk melihat tanggal yang belum diabsen.</p>
            </div>

            <!-- All Submitted State -->
            <div v-else-if="missingDatesList.length === 0" class="text-center py-12">
              <CheckCircle2 class="w-14 h-14 text-emerald-500 mx-auto mb-3" />
              <p class="text-base font-bold theme-text">Semua Absensi Sudah Terkirim!</p>
              <p class="text-xs theme-text-muted mt-1 max-w-md mx-auto">
                Tidak ada tanggal efektif mengajar yang terlewat pada semester aktif ini untuk kelas {{ currentClassName }}.
              </p>
            </div>

            <!-- List of Missing Dates -->
            <div v-else class="flex flex-col gap-2.5">
              <div v-for="item in missingDatesList" :key="item.dateStr"
                class="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border theme-border theme-bg-secondary hover:theme-bg-tertiary transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    {{ item.dayNum }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold theme-text truncate">
                      {{ item.formattedDate }}
                    </p>
                    <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span class="text-[11px] font-medium theme-text-muted">
                        Hari {{ item.namaHari }}
                      </span>
                      <span v-if="item.isJadwalMapel"
                        class="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                        Jadwal Mapel
                      </span>
                      <span v-else-if="item.isWali"
                        class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                        Wali Kelas
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Direct Action Link -->
                <button type="button" @click="goToInputAbsensi(item.dateStr, missingSelectedClass)"
                  class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer">
                  <span>Isi Absen</span>
                  <ExternalLink class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div
            class="p-4 theme-bg-secondary border-t theme-border flex items-center justify-between shrink-0 text-xs theme-text-muted">
            <span>Periode Semester Aktif: <strong>{{ awalSemesterAktifStr }} s.d. {{ todayStr }}</strong></span>
            <button type="button" @click="closeModal"
              class="px-4 py-2 rounded-xl theme-border border theme-bg theme-text font-semibold hover:theme-bg-tertiary transition-colors cursor-pointer">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { CalendarX, CheckCircle2, ExternalLink, Loader2, X } from "lucide-vue-next";
import UiSearchableSelect from "~/components/ui/SearchableSelect.vue";
import { useAuth } from "~/composables/auth/useAuth";
import { useTableData } from "~/composables/data/useTableData";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch, fetchFromApi } from "~/utils/api";
import { dapatkanAwalSemesterAktif } from "~/utils/dateHelper";
import type { MissingDateItem } from "~/types/absensi";

const props = defineProps<{
  modelValue: boolean;
  selectedTapel: string;
  defaultClassId?: string;
  dataKelas: any[];
  isWaliKelas: boolean;
  selectedWaliClassId: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
}>();

const { Notify } = useNotiflix();
const { getUserRole, getGtkId } = useAuth();
const { cardData: jadwalData, loadData: loadJadwal } = useTableData();

const missingSelectedClass = ref<string>("");
const isLoading = ref<boolean>(false);
const missingDatesList = ref<MissingDateItem[]>([]);
const totalHariEfektif = ref<number>(0);
const totalSudahKirim = ref<number>(0);
const hariLiburKalender = ref<any[]>([]);
const hariLiburMingguanIndex = ref<number>(0);

const userRole = computed(() => getUserRole() || "");
const userGtkId = computed(() => {
  const gId = getGtkId();
  return gId ? parseInt(gId) : null;
});

const NAMA_HARI_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const awalSemesterAktifStr = computed(() => dapatkanAwalSemesterAktif(new Date()));

const todayStr = computed(() => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

const accessibleClasses = computed<any[]>(() => {
  if (!props.dataKelas) return [];
  if (userRole.value === "admin") {
    return props.dataKelas.map((c: any) => ({ id_kelas: c.idKelas, nama_kelas: c.namaKelas }));
  }
  if (userRole.value === "guru") {
    const list: any[] = [];
    if (props.isWaliKelas && props.selectedWaliClassId) {
      const match = props.dataKelas.find((c: any) => c.idKelas === props.selectedWaliClassId);
      if (match) list.push({ id_kelas: match.idKelas, nama_kelas: match.namaKelas });
    }
    (jadwalData.value || []).forEach((sch: any) => {
      const gId = sch.guru_id || sch.guruId || sch.guru;
      const cId = sch.kelas_id || sch.kelasId || sch.kelas;
      if (String(gId) === String(userGtkId.value)) {
        if (!list.some((item) => item.id_kelas === cId)) {
          const match = props.dataKelas.find((c: any) => c.idKelas === cId);
          if (match) list.push({ id_kelas: match.idKelas, nama_kelas: match.namaKelas });
        }
      }
    });
    if (list.length === 0) {
      return props.dataKelas.map((c: any) => ({ id_kelas: c.idKelas, nama_kelas: c.namaKelas }));
    }
    return list;
  }
  return [];
});

const currentClassName = computed(() => {
  if (!missingSelectedClass.value) return "";
  const match = props.dataKelas?.find((k: any) => k.idKelas === missingSelectedClass.value);
  return match ? match.namaKelas : missingSelectedClass.value;
});

const closeModal = () => {
  emit("update:modelValue", false);
};

const formatDateIndo = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const fetchAndCalculateMissingDates = async () => {
  if (!missingSelectedClass.value) {
    missingDatesList.value = [];
    totalHariEfektif.value = 0;
    totalSudahKirim.value = 0;
    return;
  }

  isLoading.value = true;
  try {
    if (!jadwalData.value || jadwalData.value.length === 0) {
      await loadJadwal("jadwal_pelajaran");
    }

    if (!hariLiburKalender.value.length && props.selectedTapel) {
      try {
        const kalenderData = await fetchFromApi("kalender_pendidikan", false, null, {
          filter_col: "tahun_pelajaran",
          filter_val: props.selectedTapel,
        });
        if (Array.isArray(kalenderData)) {
          hariLiburKalender.value = kalenderData.filter((item: any) => item.tipe === "libur");
        }
      } catch (e) {
        console.error("Gagal load kalender:", e);
      }
    }

    const scheduledDays = new Set<string>();
    if (userRole.value === "guru" && userGtkId.value) {
      (jadwalData.value || []).forEach((sch: any) => {
        const gId = sch.guru_id || sch.guruId || sch.guru;
        const cId = sch.kelas_id || sch.kelasId || sch.kelas;
        if (String(gId) === String(userGtkId.value) && String(cId) === String(missingSelectedClass.value)) {
          if (sch.hari) {
            scheduledDays.add(String(sch.hari).trim().toLowerCase());
          }
        }
      });
    }

    const isWaliOfClass = props.isWaliKelas && props.selectedWaliClassId === missingSelectedClass.value;
    const isTeacherRole = userRole.value === "guru";

    const start = new Date(awalSemesterAktifStr.value + "T00:00:00");
    const end = new Date(todayStr.value + "T00:00:00");

    const requiredCandidates: MissingDateItem[] = [];
    const current = new Date(start);

    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const dayIndex = current.getDay();
      const namaHari = NAMA_HARI_MAP[dayIndex];
      const namaHariLower = namaHari.toLowerCase();

      if (dayIndex === hariLiburMingguanIndex.value) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      const isHoliday = hariLiburKalender.value.some(
        (h: any) => dateStr >= h.tanggal_mulai && dateStr <= h.tanggal_selesai,
      );
      if (isHoliday) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      let isRequired = false;
      let isJadwalMapel = false;

      if (userRole.value === "admin" || isWaliOfClass) {
        isRequired = true;
      } else if (isTeacherRole) {
        if (scheduledDays.has(namaHariLower)) {
          isRequired = true;
          isJadwalMapel = true;
        }
      }

      if (isRequired) {
        requiredCandidates.push({
          dateStr,
          formattedDate: formatDateIndo(dateStr),
          dayNum: d,
          namaHari,
          isJadwalMapel,
          isWali: isWaliOfClass,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    // Ambil semua tanggal yang sudah ada absensinya dalam 1 query efisien
    let submittedDatesSet = new Set<string>();
    try {
      const submittedRes = await authenticatedFetch(
        `/api/absensi/submitted-dates?kelas_id=${encodeURIComponent(missingSelectedClass.value)}&tahun_pelajaran=${encodeURIComponent(props.selectedTapel || "")}`
      );
      const submittedData = await submittedRes.json();
      if (Array.isArray(submittedData)) {
        submittedDatesSet = new Set(submittedData);
      }
    } catch (e) {
      console.error("Gagal mengambil daftar tanggal absensi:", e);
    }

    const totalEfektifCount = requiredCandidates.length;
    let totalSudahCount = 0;
    const missingList: MissingDateItem[] = [];

    requiredCandidates.forEach((item: MissingDateItem) => {
      const isSubmitted = submittedDatesSet.has(item.dateStr);
      if (isSubmitted) {
        totalSudahCount++;
      } else {
        missingList.push(item);
      }
    });

    missingList.sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    missingDatesList.value = missingList;
    totalHariEfektif.value = totalEfektifCount;
    totalSudahKirim.value = totalSudahCount;
  } catch (err) {
    console.error("Gagal menghitung tanggal belum kirim absensi:", err);
    Notify.failure("Gagal memuat tanggal belum kirim absensi");
  } finally {
    isLoading.value = false;
  }
};

const goToInputAbsensi = (dateStr: string, classId: string) => {
  closeModal();
  navigateTo({
    path: "/absensi/siswa",
    query: { tanggal: dateStr, kelas_id: classId },
  });
};

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      if (!missingSelectedClass.value) {
        if (props.defaultClassId) {
          missingSelectedClass.value = props.defaultClassId;
        } else if (accessibleClasses.value.length > 0) {
          missingSelectedClass.value = accessibleClasses.value[0].id_kelas;
        }
      }
      await fetchAndCalculateMissingDates();
    }
  }
);

watch(missingSelectedClass, async (newVal) => {
  if (props.modelValue && newVal) {
    await fetchAndCalculateMissingDates();
  }
});
</script>
