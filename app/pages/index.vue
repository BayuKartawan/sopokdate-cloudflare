<template>
  <div class="min-h-screen">
    <!-- Main Container -->
    <div class="page-layout px-4 sm:px-6">
      <!-- Announcement Section -->
      <header class="mt-4 pb-12">
        <div
          class="card rounded-2xl p-4 sm:p-6 bg-zinc-800/30 sm:bg-zinc-800/40 border border-zinc-800 sm:border-zinc-700/50 shadow-md"
        >
          <div
            class="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800 sm:border-zinc-700/50"
          >
            <div class="flex items-center gap-2">
              <span
                class="p-1.5 sm:p-2 rounded-lg bg-emerald-950 text-emerald-400"
              >
                <Bell class="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h2 class="text-sm sm:text-lg font-semibold text-zinc-100">
                Pengumuman & Informasi Terbaru
              </h2>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="isAdmin"
                @click="openCreateModal"
                class="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] sm:text-xs font-semibold transition-all shadow-sm animate-fade-in"
              >
                <Plus class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Tambah</span>
              </button>
              <span v-else class="text-[10px] sm:text-xs text-zinc-500"
                >Portal Digital</span
              >
            </div>
          </div>

          <!-- Mobile: flex overflow scroll, Desktop: grid -->
          <div
            v-if="isLoading"
            class="flex md:grid overflow-x-auto md:overflow-x-visible gap-3 sm:gap-4 pb-2 md:pb-0"
          >
            <div
              v-for="i in 3"
              :key="i"
              class="w-[85vw] md:w-auto shrink-0 md:shrink-1 p-3.5 sm:p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/20 animate-pulse flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between gap-2 mb-3">
                  <div class="h-5 w-16 bg-zinc-700 rounded-md"></div>
                  <div class="h-4 w-20 bg-zinc-700 rounded-md"></div>
                </div>
                <div class="h-4 w-3/4 bg-zinc-700 rounded-md mb-2"></div>
                <div class="h-3 w-full bg-zinc-700/60 rounded-md mb-1.5"></div>
                <div class="h-3 w-5/6 bg-zinc-700/60 rounded-md"></div>
              </div>
            </div>
          </div>

          <div
            v-else-if="!announcements || announcements.length === 0"
            class="flex flex-col items-center justify-center py-8 text-zinc-500 text-center w-full"
          >
            <Bell class="w-8 h-8 text-zinc-600 mb-2 stroke-[1.5]" />
            <p class="text-xs sm:text-sm">Tidak ada pengumuman terbaru</p>
          </div>

          <div
            v-else
            class="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-none gap-3 sm:gap-4 pb-2 md:pb-0"
          >
            <div
              v-for="item in announcements"
              :key="item.id"
              class="w-[85vw] md:w-auto shrink-0 md:shrink-1 snap-center p-3.5 sm:p-4 rounded-xl bg-zinc-800/80 border border-zinc-700/30 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border',
                      item.tagColor,
                    ]"
                  >
                    {{ item.tag }}
                  </span>
                  <div class="flex items-center gap-1.5 sm:gap-2">
                    <span class="text-[10px] sm:text-xs text-zinc-500">{{
                      item.date
                    }}</span>
                    <!-- Admin Actions -->
                    <div v-if="isAdmin" class="flex items-center gap-1">
                      <button
                        @click.stop="openEditModal(item)"
                        class="p-1 rounded-md text-zinc-400 hover:text-amber-400 hover:bg-zinc-700/60 transition-all"
                        title="Edit"
                      >
                        <Pencil class="w-3 h-3" />
                      </button>
                      <button
                        @click.stop="handleDelete(item)"
                        class="p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-700/60 transition-all"
                        title="Hapus"
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <h3
                  class="text-xs sm:text-sm font-semibold text-zinc-200 mb-1 line-clamp-1"
                >
                  {{ item.title }}
                </h3>
                <p
                  class="text-[11px] sm:text-xs text-zinc-400 leading-relaxed line-clamp-2 sm:line-clamp-none"
                >
                  {{ item.content }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- CRUD Modal -->
      <CrudModal
        :show="showModal"
        :mode="modalMode"
        :title="modalMode === 'create' ? 'Tambah Pengumuman' : 'Edit Pengumuman'"
        :fields="announcementFields"
        :initialData="editingItem"
        :isSaving="isSaving"
        @submit="handleFormSubmit"
        @close="showModal = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Bell, Plus, Pencil, Trash2 } from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import CrudModal from "~/components/ui/CrudModal.vue";

definePageMeta({
  requiresAuth: true,
});

const { cardData: announcements, isLoading, loadData, refreshData } = useTableData();
const { isAdmin, isSaving, createItem, updateItem, deleteItem } = useCrud("Pengumuman", () => refreshData("Pengumuman"));

onMounted(() => {
  loadData("Pengumuman");
});

// CRUD Modal states
const showModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});

const announcementFields = [
  { key: "title", label: "Judul Pengumuman", required: true, placeholder: "Masukkan judul pengumuman" },
  { key: "content", label: "Isi Pengumuman", type: "textarea", required: true, placeholder: "Tulis isi pengumuman..." },
  { key: "date", label: "Tanggal", required: true, placeholder: "Contoh: 22 Mei 2026" },
  { key: "tag", label: "Tag / Kategori", required: true, type: "select", options: ["Penting", "Info", "Update"] },
  { key: "tagColor", label: "Warna Tag", required: true, type: "select", options: [
    "bg-red-500/20 text-red-400 border-red-500/30",
    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "bg-amber-500/20 text-amber-400 border-amber-500/30"
  ]}
];

const openCreateModal = () => {
  modalMode.value = "create";
  editingItem.value = {
    title: "",
    content: "",
    date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    tag: "Info",
    tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  };
  showModal.value = true;
};

const openEditModal = (item) => {
  modalMode.value = "edit";
  editingItem.value = {
    id: item.id,
    title: item.title || "",
    content: item.content || "",
    date: item.date || "",
    tag: item.tag || "",
    tagColor: item.tagColor || ""
  };
  showModal.value = true;
};

const handleFormSubmit = async (formData) => {
  let success = false;
  if (modalMode.value === "create") {
    success = await createItem(formData);
  } else {
    const id = editingItem.value.id;
    success = await updateItem(id, formData);
  }
  if (success) {
    showModal.value = false;
  }
};

const handleDelete = (item) => {
  deleteItem(item.id, `pengumuman "${item.title}"`);
};
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
