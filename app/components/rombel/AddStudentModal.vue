<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Modal Content -->
        <div
          class="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-5 py-4 sm:px-6 border-b border-zinc-700/50 bg-zinc-800/30 shrink-0"
          >
            <div class="flex items-center gap-3 text-emerald-400">
              <UserPlus class="w-5 h-5" />
              <h3 class="text-base sm:text-lg font-semibold text-zinc-100">
                Tambah Siswa ke Rombel
              </h3>
            </div>
            <button
              @click="$emit('close')"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4">
            <!-- Search & Count -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p class="text-xs sm:text-sm text-zinc-400">
                Menampilkan
                <span class="font-semibold text-zinc-200">{{ filteredStudents.length }}</span>
                siswa tanpa rombel
              </p>
              <div class="relative w-full sm:w-64">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cari nama atau NISN..."
                  class="w-full h-9 sm:h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>

            <!-- List Table -->
            <div
              class="overflow-x-auto rounded-lg border border-zinc-800/80 max-h-[45vh] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
            >
              <table
                class="w-full text-left border-collapse text-xs sm:text-sm text-zinc-300 min-w-[500px]"
              >
                <thead>
                  <tr
                    class="border-b border-zinc-700/80 bg-zinc-800/50 text-zinc-400 font-medium sticky top-0 z-10 backdrop-blur-md"
                  >
                    <th class="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        :checked="isAllSelected"
                        @change="toggleSelectAll"
                        class="rounded bg-zinc-800 border-zinc-600 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th class="p-3">Nama Siswa</th>
                    <th class="p-3 w-32">NISN</th>
                    <th class="p-3 w-28 text-center whitespace-nowrap">Kelas Asal</th>
                    <th class="p-3 w-16 text-center">L/P</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredStudents.length === 0">
                    <td colspan="5" class="p-8 text-center text-zinc-500 text-sm">
                      Tidak ada siswa tanpa kelas ditemukan.
                    </td>
                  </tr>
                  <tr
                    v-else
                    v-for="student in filteredStudents"
                    :key="student.id || student._id"
                    class="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-all"
                  >
                    <td class="p-3 text-center align-middle">
                      <input
                        type="checkbox"
                        :checked="selectedIds.includes(student.id || student._id)"
                        @change="toggleSelect(student.id || student._id)"
                        class="rounded bg-zinc-800 border-zinc-600 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td class="p-3 font-semibold text-zinc-200 align-middle">
                      {{ toTitleCase(student.nama) }}
                    </td>
                    <td class="p-3 font-mono text-zinc-400 text-xs align-middle">
                      {{ student.nisn || "-" }}
                    </td>
                    <td class="p-3 text-center align-middle">
                      <span
                        class="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-[11px] font-mono whitespace-nowrap"
                      >
                        {{ getClassName(student.kelas_db) || "Baru" }}
                      </span>
                    </td>
                    <td class="p-3 text-center text-zinc-400 align-middle font-medium">
                      {{ getJenisKelaminAbbr(student.jenis_kelamin) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex flex-col sm:flex-row items-center justify-end gap-3 px-5 py-4 sm:px-6 border-t border-zinc-700/50 bg-zinc-800/30 shrink-0"
          >
            <button
              type="button"
              @click="$emit('close')"
              class="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
            >
              Batal
            </button>
            <button
              @click="$emit('assign', selectedIds)"
              :disabled="selectedIds.length === 0 || isLoading"
              class="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
              <span>Tambahkan ({{ selectedIds.length }})</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { UserPlus, X, Loader2 } from "lucide-vue-next";

const props = defineProps({
  show: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  students: { type: Array, default: () => [] },   // unassigned students
  kelasMap: { type: Object, default: () => ({}) }, // id_kelas -> kelas object
});

const emit = defineEmits(["close", "assign"]);

const searchQuery = ref("");
const selectedIds = ref([]);

// Reset state when modal opens
watch(() => props.show, (val) => {
  if (val) {
    searchQuery.value = "";
    selectedIds.value = [];
  }
});

const filteredStudents = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  return props.students.filter((s) => {
    if (!q) return true;
    return (
      String(s.nama || "").toLowerCase().includes(q) ||
      String(s.nisn || "").includes(q) ||
      String(s.nis_lokal || "").includes(q)
    );
  });
});

const isAllSelected = computed(() => {
  if (filteredStudents.value.length === 0) return false;
  return filteredStudents.value.every((s) =>
    selectedIds.value.includes(s.id || s._id),
  );
});

const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) selectedIds.value.splice(index, 1);
  else selectedIds.value.push(id);
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    filteredStudents.value.forEach((s) => {
      const id = s.id || s._id;
      const index = selectedIds.value.indexOf(id);
      if (index > -1) selectedIds.value.splice(index, 1);
    });
  } else {
    filteredStudents.value.forEach((s) => {
      const id = s.id || s._id;
      if (!selectedIds.value.includes(id)) selectedIds.value.push(id);
    });
  }
};

const getClassName = (classId) => {
  if (!classId) return "";
  return props.kelasMap[classId]?.nama_kelas || classId;
};

const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const getJenisKelaminAbbr = (jk) => {
  if (!jk) return "-";
  const upper = jk.toUpperCase();
  if (upper.startsWith("L")) return "L";
  if (upper.startsWith("P")) return "P";
  return jk;
};
</script>
