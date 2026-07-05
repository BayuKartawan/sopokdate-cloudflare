<template>
  <div class="min-h-screen">
    <!-- Main Container -->
    <div class="page-layout px-4 sm:px-6">
      <!-- Welcome Header -->
      <div class="mt-6 p-5 sm:p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md"
        :style="{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }">
        <!-- Background Glow effects -->
        <div class="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
        <div class="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-3xl group-hover:scale-110 transition-transform duration-500"></div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div class="flex items-center gap-4">
            <div class="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 transform group-hover:scale-105 transition-transform duration-300">
              <User class="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <p class="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                Selamat Datang, {{ userRoleLabel }}
              </p>
              <h1 class="text-xl sm:text-2xl font-bold mt-1 tracking-tight" :style="{ color: 'var(--text-heading)' }">
                {{ userDisplayName || 'Pengguna Sopokdate' }}
              </h1>
              <p class="text-xs sm:text-sm mt-0.5" :style="{ color: 'var(--text-secondary)' }">
                Senang melihat Anda kembali. Akses dan kelola data madrasah Anda dengan mudah.
              </p>
            </div>
          </div>
          
          <div class="hidden sm:block text-right">
            <div class="text-xs" :style="{ color: 'var(--text-muted)' }">Tanggal Hari Ini</div>
            <div class="text-sm font-semibold mt-1" :style="{ color: 'var(--text-secondary)' }">
              {{ currentFormattedDate }}
            </div>
          </div>
        </div>
      </div>

      <!-- Announcement Section -->
      <header class="mt-6 pb-12">
        <div class="group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg p-5"
          :style="{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }">
          <div class="flex items-center justify-between mb-4 pb-2 border-b"
            :style="{ borderColor: 'var(--border-primary)' }">
            <div class="flex items-center gap-2">
              <span class="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Bell class="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h2 class="text-sm sm:text-lg font-semibold" :style="{ color: 'var(--text-heading)' }">
                Pengumuman
              </h2>
            </div>
            <div class="flex items-center gap-2">
              <button v-if="isAdmin" @click="openCreateModal"
                class="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] sm:text-xs font-semibold transition-all shadow-sm animate-fade-in">
                <Plus class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Tambah</span>
              </button>
              <span v-else class="text-[10px] sm:text-xs" :style="{ color: 'var(--text-muted)' }">Portal Digital</span>
            </div>
          </div>

          <!-- Mobile: flex overflow scroll, Desktop: grid -->
          <div v-if="isLoading" class="flex md:grid overflow-x-auto md:overflow-x-visible gap-3 sm:gap-4 pb-2 md:pb-0">
            <div v-for="i in 3" :key="i"
              class="w-[85vw] md:w-auto shrink-0 md:shrink-1 p-3.5 sm:p-4 rounded-xl border animate-pulse flex flex-col justify-between"
              :style="{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)',
              }">
              <div>
                <div class="flex items-center justify-between gap-2 mb-3">
                  <div class="h-5 w-16 rounded-md" :style="{ backgroundColor: 'var(--border-primary)' }"></div>
                  <div class="h-4 w-20 rounded-md" :style="{ backgroundColor: 'var(--border-primary)' }"></div>
                </div>
                <div class="h-4 w-3/4 rounded-md mb-2" :style="{ backgroundColor: 'var(--border-primary)' }"></div>
                <div class="h-3 w-full rounded-md mb-1.5" :style="{ backgroundColor: 'var(--border-primary)' }"></div>
                <div class="h-3 w-5/6 rounded-md" :style="{ backgroundColor: 'var(--border-primary)' }"></div>
              </div>
            </div>
          </div>

          <div v-else-if="!announcements || announcements.length === 0"
            class="flex flex-col items-center justify-center py-8 text-center w-full">
            <Bell class="w-8 h-8 mb-2 stroke-[1.5]" :style="{ color: 'var(--text-muted)' }" />
            <p class="text-xs sm:text-sm" :style="{ color: 'var(--text-secondary)' }">
              Tidak ada pengumuman terbaru
            </p>
          </div>

          <div v-else
            class="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-none gap-3 sm:gap-4 pb-2 md:pb-0">
            <div v-for="item in announcements" :key="item.id"
              class="w-[85vw] md:w-auto shrink-0 md:shrink-1 snap-center p-3.5 sm:p-4 border rounded-lg overflow-hidden transition-all duration-300 hover:border-emerald-500/40 flex flex-col justify-between"
              :style="{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)',
              }">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span :class="[
                    'px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border',
                    item.tagColor,
                  ]">
                    {{ item.tag }}
                  </span>
                  <div class="flex items-center gap-1.5 sm:gap-2">
                    <span class="text-[10px] sm:text-xs" :style="{ color: 'var(--text-muted)' }">{{ item.date }}</span>
                    <!-- Admin Actions -->
                    <div v-if="isAdmin" class="flex items-center gap-1">
                      <button @click.stop="openEditModal(item)" class="p-1 rounded-md transition-all"
                        :style="{ color: 'var(--text-muted)' }" title="Edit">
                        <Pencil class="w-3 h-3" />
                      </button>
                      <button @click.stop="handleDelete(item)" class="p-1 rounded-md transition-all"
                        :style="{ color: 'var(--text-muted)' }" title="Hapus">
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <h3 class="text-xs sm:text-sm font-semibold mb-1 line-clamp-1"
                  :style="{ color: 'var(--text-heading)' }">
                  {{ item.title }}
                </h3>
                <p class="text-[11px] sm:text-xs leading-relaxed line-clamp-2 sm:line-clamp-none"
                  :style="{ color: 'var(--text-secondary)' }">
                  {{ item.content }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- CRUD Modal -->
      <CrudModal :show="showModal" :mode="modalMode" :title="modalMode === 'create' ? 'Tambah Pengumuman' : 'Edit Pengumuman'
        " :fields="announcementFields" :initialData="editingItem" :isSaving="isSaving" @submit="handleFormSubmit"
        @close="showModal = false" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { Bell, Plus, Pencil, Trash2, User } from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useAuth } from "~/composables/auth/useAuth";
import CrudModal from "~/components/ui/CrudModal.vue";

definePageMeta({
  requiresAuth: true,
});

const {
  cardData: announcements,
  isLoading,
  loadData,
  refreshData,
} = useTableData();
const { isAdmin, isSaving, createItem, updateItem, deleteItem } = useCrud(
  "Pengumuman",
  () => refreshData("Pengumuman"),
);
const { getUserRole, getUserData } = useAuth();

const userDisplayName = ref("");
const userRole = ref("");

const userRoleLabel = computed(() => {
  const r = userRole.value;
  if (r === "admin") return "Admin";
  if (r === "guru") return "Guru";
  if (r === "kepala_madrasah") return "Kepala Madrasah";
  return r;
});

const currentFormattedDate = computed(() => {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

onMounted(() => {
  const data = getUserData();
  if (data) {
    userDisplayName.value = data.displayName || "";
    userRole.value = data.role || "";
  } else {
    userDisplayName.value = localStorage.getItem("user-displayName") || "";
    userRole.value = localStorage.getItem("user-role") || "";
  }
  loadData("Pengumuman");
});

// CRUD Modal states
const showModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});

const announcementFields = [
  {
    key: "title",
    label: "Judul Pengumuman",
    required: true,
    placeholder: "Masukkan judul pengumuman",
  },
  {
    key: "content",
    label: "Isi Pengumuman",
    type: "textarea",
    required: true,
    placeholder: "Tulis isi pengumuman...",
  },
  {
    key: "date",
    label: "Tanggal",
    required: true,
    placeholder: "Contoh: 22 Mei 2026",
  },
  {
    key: "tag",
    label: "Tag / Kategori",
    required: true,
    type: "select",
    options: ["Penting", "Info", "Update"],
  },
  {
    key: "tagColor",
    label: "Warna Tag",
    required: true,
    type: "select",
    options: [
      "bg-red-500/20 text-red-400 border-red-500/30",
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "bg-amber-500/20 text-amber-400 border-amber-500/30",
    ],
  },
];

const openCreateModal = () => {
  modalMode.value = "create";
  editingItem.value = {
    title: "",
    content: "",
    date: new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    tag: "Info",
    tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
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
    tagColor: item.tagColor || "",
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
