<template>
  <div class="min-h-screen">
    <div class="page-layout">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--text-heading)">Pembagian Bagian / Tim EDM</h1>
        <p class="mt-1 text-sm" style="color: var(--text-muted)">
          Alokasikan guru ke dalam 5 bagian (A – E) untuk pelaksanaan evaluasi diri madrasah
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          {{ selectedTahunLabel }}
        </span>
        <button @click="handleSave" :disabled="isSaving"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.97] transition-all shadow-sm cursor-pointer">
          <Save class="w-4 h-4" />
          {{ isSaving ? 'Menyimpan...' : 'Simpan Pembagian' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <!-- Guru Belum Diassign -->
      <div class="mb-6 rounded-xl p-5"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold flex items-center gap-2" style="color: var(--text-heading)">
            <UserPlus class="w-4 h-4 text-amber-500" />
            Guru Belum Masuk Bagian
            <span class="text-xs font-normal px-2 py-0.5 rounded-full"
              style="background: var(--bg-secondary); color: var(--text-muted)">
              {{ unassignedGuru.length }}
            </span>
          </h2>
        </div>
        <div v-if="unassignedGuru.length === 0" class="text-sm py-4 text-center" style="color: var(--text-muted)">
          Semua guru sudah masuk bagian ✓
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <div v-for="guru in unassignedGuru" :key="guru.id"
            draggable="true" @dragstart="onDragStart($event, guru)"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-sm select-none"
            style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-primary)">
            <GripVertical class="w-3 h-3 opacity-40" />
            {{ guru.nama_lengkap }}
          </div>
        </div>
      </div>

      <!-- 5 Bagian Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="b in localBagian" :key="b.nama_bagian"
          @dragover.prevent @drop="onDrop($event, b)"
          class="rounded-xl p-4 transition-all min-h-[220px] flex flex-col justify-between"
          :class="dragOverBagian === b.nama_bagian ? 'ring-2 ring-emerald-500/50 shadow-lg' : ''"
          @dragenter="dragOverBagian = b.nama_bagian"
          @dragleave="dragOverBagian = null"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">

          <div>
            <!-- Bagian Header -->
            <div class="flex items-start justify-between gap-2 mb-2">
              <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0"
                :class="bagianColor(b.nama_bagian)">
                Bagian {{ b.nama_bagian }}
              </span>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                style="background: var(--bg-secondary); color: var(--text-muted)">
                {{ b.gtk_ids.length }} guru
              </span>
            </div>
            
            <p class="text-xs font-semibold mb-3 leading-relaxed" style="color: var(--text-heading)">
              {{ getBagianTitle(b.nama_bagian) }}
            </p>

            <!-- Daftar Anggota -->
            <div class="space-y-1.5">
              <div v-for="gtkId in b.gtk_ids" :key="gtkId"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm group transition-colors"
                style="background: var(--bg-secondary)">
                <span class="truncate" style="color: var(--text-primary)">
                  {{ getGuruName(gtkId) }}
                </span>
                <button @click="removeFromBagian(b, gtkId)"
                  class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all p-0.5">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Drop zone placeholder -->
          <div v-if="b.gtk_ids.length === 0"
            class="flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed mt-3"
            style="border-color: var(--border-primary); color: var(--text-muted)">
            <UserPlus class="w-6 h-6 mb-2 opacity-40" />
            <p class="text-xs">Drag guru ke sini</p>
          </div>
        </div>
      </div>
    </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useEdm, EDM_BAGIAN_LIST } from "~/composables/edm/useEdm";
import { fetchFromApi } from "~/utils/api";
import { Save, UserPlus, GripVertical, X } from "lucide-vue-next";

const {
  isLoading, isSaving, selectedTahunId, selectedTahunLabel,
  fetchTahunAnggaran, fetchBagian, saveBagian,
} = useEdm();

const allGuru = ref([]);
const localBagian = ref([]);
const dragOverBagian = ref(null);
const dragData = ref(null);

const BAGIAN_NAMES = ["A", "B", "C", "D", "E"];

const bagianColor = (name) => {
  const colors = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return colors[name] || "bg-zinc-600";
};

const getBagianTitle = (code) => {
  const meta = EDM_BAGIAN_LIST.find((m) => m.code === code);
  return meta ? meta.name : `Bagian ${code}`;
};

const assignedGtkIds = computed(() => {
  const ids = new Set();
  localBagian.value.forEach((b) => b.gtk_ids.forEach((id) => ids.add(id)));
  return ids;
});

const unassignedGuru = computed(() => {
  return allGuru.value.filter((g) => !assignedGtkIds.value.has(g.id));
});

const getGuruName = (gtkId) => {
  const guru = allGuru.value.find((g) => g.id === gtkId);
  return guru?.nama_lengkap || `ID: ${gtkId}`;
};

const onDragStart = (event, guru) => {
  dragData.value = guru;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", guru.id.toString());
};

const onDrop = (event, b) => {
  event.preventDefault();
  dragOverBagian.value = null;
  const gtkId = parseInt(event.dataTransfer.getData("text/plain"));
  if (!gtkId) return;

  // Remove from all bagian first
  localBagian.value.forEach((item) => {
    item.gtk_ids = item.gtk_ids.filter((id) => id !== gtkId);
  });

  // Add to target bagian
  if (!b.gtk_ids.includes(gtkId)) {
    b.gtk_ids.push(gtkId);
  }
  dragData.value = null;
};

const removeFromBagian = (b, gtkId) => {
  b.gtk_ids = b.gtk_ids.filter((id) => id !== gtkId);
};

const handleSave = async () => {
  if (!selectedTahunId.value) return;
  const payload = localBagian.value.map((b) => ({
    nama_bagian: b.nama_bagian,
    gtk_ids: b.gtk_ids,
  }));
  await saveBagian(selectedTahunId.value, payload);
};

const onTahunChange = () => {
  loadData();
};

const loadData = async () => {
  if (!selectedTahunId.value) return;

  // Fetch guru
  try {
    const gtkData = await fetchFromApi("DataGtk");
    allGuru.value = Array.isArray(gtkData) ? gtkData : [];
  } catch {
    allGuru.value = [];
  }

  // Fetch bagian
  const bagianData = await fetchBagian(selectedTahunId.value);

  // Build local state
  localBagian.value = BAGIAN_NAMES.map((name) => {
    const existing = bagianData.find((b) => (b.nama_bagian || b.nama_kelompok) === name);
    return {
      nama_bagian: name,
      gtk_ids: existing ? existing.anggota.map((a) => a.gtk_id) : [],
    };
  });
};

onMounted(async () => {
  await fetchTahunAnggaran();
  if (selectedTahunId.value) {
    await loadData();
  }
});
</script>
