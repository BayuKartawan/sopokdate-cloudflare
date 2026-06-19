<template>
  <div class="page-layout">
    <div
      class="rounded-lg shadow-sm border overflow-hidden transition-all duration-300 bg-zinc-900 border-zinc-800"
    >
      <div class="px-6 md:px-8 py-6 transition-all duration-300 bg-zinc-800">
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div
            class="flex items-center justify-between lg:justify-start gap-3 w-full lg:w-auto"
          >
            <div>
              <h1 class="text-2xl text-gray-100">{{ title }}</h1>
              <p v-if="subtitle" class="mt-1 text-sm text-gray-100/80">
                {{ subtitle }}
              </p>
            </div>

            <!-- Export Buttons -->
            <div class="flex items-center gap-2">
              <!-- Tambah Button (Admin Only) -->
              <BaseButton
                v-if="isAdmin"
                text="Tambah"
                @click="openCreateModal"
                class="!bg-emerald-600 !text-white hover:!bg-emerald-500"
              >
                <template #icon>
                  <Plus class="w-4 h-4" />
                </template>
              </BaseButton>

              <PrintButton>
                <div class="p-8">
                  <h1
                    class="text-2xl font-bold mb-4 text-center text-emerald-900"
                  >
                    {{ title }}
                  </h1>
                  <div class="mb-4 text-sm text-stone-600">
                    Total: {{ sortedData.length }} data
                  </div>
                  <table class="w-full border-collapse border border-stone-300">
                    <thead>
                      <tr class="bg-stone-100">
                        <th class="border border-stone-300 p-2 text-left">
                          No
                        </th>
                        <th class="border border-stone-300 p-2 text-left">
                          Judul
                        </th>
                        <th class="border border-stone-300 p-2 text-left">
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in sortedData" :key="index">
                        <td class="border border-stone-300 p-2 text-center">
                          {{ index + 1 }}
                        </td>
                        <td class="border border-stone-300 p-2">
                          {{ item.title || item.nama }}
                        </td>
                        <td class="border border-stone-300 p-2">
                          {{ item.description || "" }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </PrintButton>

              <BaseButton
                text="Excel"
                @click="exportToExcel"
                class="shadow-sm bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500"
              >
                <template #icon>
                  <FileSpreadsheet class="w-4 h-4" />
                </template>
              </BaseButton>
            </div>
          </div>

          <div
            class="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto"
          >
            <div v-if="showSearch" class="w-full">
              <Search @searchUpdated="handleSearch" class="w-full" />
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-5">
        <div v-if="isLoading && !items" :class="[gridClass, 'animate-pulse']">
          <div
            v-for="i in 8"
            :key="i"
            class="rounded-lg border p-4 bg-zinc-800/30 border-zinc-700/50"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 space-y-2.5">
                <div class="h-4 bg-zinc-700/70 rounded w-3/4"></div>
                <div class="h-3 bg-zinc-700/50 rounded w-1/2"></div>
              </div>
              <div
                class="w-7 h-7 rounded-lg bg-zinc-700/70 flex-shrink-0"
              ></div>
            </div>
          </div>
        </div>
        <div v-else-if="sortedData.length === 0" class="text-center py-12">
          <slot name="empty-state">
            <svg
              class="w-16 h-16 mx-auto mb-4 transition-colors duration-300 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </slot>
          <p class="transition-colors duration-300 text-zinc-400">
            {{ emptyMessage }}
          </p>
        </div>

        <ul v-else :class="[gridClass, 'list-none']">
          <template v-for="(item, index) in visibleData" :key="index">
            <slot name="card" :item="item" :index="index">
              <li>
                <div
                  class="block rounded-lg border p-4 transition-colors duration-150 bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-700/50"
                >
                  <div class="flex items-center justify-between gap-3">
                    <a
                      :href="item.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex-1 min-w-0 no-underline"
                    >
                      <h3 class="font-medium text-base mb-1 text-zinc-100">
                        {{ item.title }}
                      </h3>
                      <p class="text-sm truncate text-zinc-400">
                        {{ item.description || item.link }}
                      </p>
                    </a>

                    <div class="flex items-center gap-1 shrink-0">
                      <!-- Admin Edit/Delete -->
                      <template v-if="isAdmin">
                        <button
                          @click.stop="openEditModal(item)"
                          class="p-1.5 rounded-lg transition-colors hover:bg-zinc-700/50 text-zinc-400 hover:text-amber-400"
                          title="Edit"
                        >
                          <PencilIcon class="w-4 h-4" />
                        </button>
                        <button
                          @click.stop="handleDelete(item)"
                          class="p-1.5 rounded-lg transition-colors hover:bg-zinc-700/50 text-zinc-400 hover:text-red-400"
                          title="Hapus"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </template>

                      <button
                        @click.prevent="copyLink(item.link)"
                        class="p-1.5 rounded-lg transition-colors hover:bg-zinc-700/50 text-zinc-400 hover:text-emerald-400"
                        title="Salin Link"
                      >
                        <ExternalLink class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            </slot>
          </template>
        </ul>

        <Pagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          @pageChanged="handlePageChange"
        />
      </div>
    </div>

    <!-- CRUD Modal -->
    <CrudModal
      :show="showCrudModal"
      :mode="modalMode"
      :title="modalMode === 'create' ? `Tambah ${title}` : `Edit ${title}`"
      :fields="resourceFields"
      :initialData="editingItem"
      :isSaving="crudSaving"
      @submit="handleFormSubmit"
      @close="showCrudModal = false"
    />
  </div>
</template>

<script setup>
import {
  FileSpreadsheet,
  ExternalLink,
  Plus,
  Pencil as PencilIcon,
  Trash2,
} from "lucide-vue-next";

import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import Search from "~/components/ui/Search.vue";
import { useTableData } from "~/composables/data/useTableData";
import Pagination from "~/components/ui/Pagination.vue";
import PrintButton from "~/components/ui/PrintButton.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import CrudModal from "~/components/ui/CrudModal.vue";

import { useExportExcel } from "~/composables/data/useExcel";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { useCrud } from "~/composables/data/useCrud";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  localStorageKey: {
    type: String,
    default: "",
  },
  items: {
    type: Array,
    default: null,
  },
  emptyMessage: {
    type: String,
    default: "Tidak ada data yang ditemukan",
  },
  initialVisibleCount: {
    type: Number,
    default: 12,
  },
  accentColorClass: {
    type: String,
    default: "bg-emerald-600",
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  gridClass: {
    type: String,
    default:
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
  },
});

const { cardData, isLoading, loadData, refreshData } = useTableData();
const { exportToCSV } = useExportExcel();
const { Notify, Confirm } = useNotiflix();
const { isAdmin } = useCrud(props.localStorageKey, () =>
  refreshData(props.localStorageKey),
);

const searchQuery = ref("");
const currentPage = ref(1);

// CRUD Modal state
const showCrudModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});
const crudSaving = ref(false);

// Field configuration for resource (berkas/aplikasi)
const resourceFields = [
  { key: "title", label: "Judul", required: true },
  { key: "link", label: "Link URL", required: true },
];

const openCreateModal = () => {
  modalMode.value = "create";
  editingItem.value = {};
  showCrudModal.value = true;
};

const openEditModal = (item) => {
  modalMode.value = "edit";
  editingItem.value = {
    _id: item.id || item._id,
    title: item.title || "",
    link: item.link || "",
  };
  showCrudModal.value = true;
};

const handleFormSubmit = async (formData) => {
  const tableName = props.localStorageKey;
  const { postToApi, putToApi } = await import("~/utils/api");
  let success = false;

  crudSaving.value = true;
  try {
    if (modalMode.value === "create") {
      await postToApi(tableName, formData);
      Notify?.success?.("Data berhasil ditambahkan");
    } else {
      const id = editingItem.value._id;
      await putToApi(tableName, id, formData);
      Notify?.success?.("Data berhasil diperbarui");
    }
    refreshData(tableName);
    success = true;
  } catch (err) {
    Notify?.failure?.(err.message || "Gagal menyimpan data");
  } finally {
    crudSaving.value = false;
  }

  if (success) {
    showCrudModal.value = false;
  }
};

const handleDelete = (item) => {
  const id = item.id || item._id;
  const tableName = props.localStorageKey;

  Confirm?.show(
    "Hapus Data",
    `Apakah Anda yakin ingin menghapus "${item.title}"? Tindakan ini tidak dapat dibatalkan.`,
    "Ya, Hapus",
    "Batal",
    async () => {
      try {
        const { deleteFromApi } = await import("~/utils/api");
        await deleteFromApi(tableName, id);
        Notify?.success?.("Data berhasil dihapus");
        refreshData(tableName);
      } catch (err) {
        Notify?.failure?.(err.message || "Gagal menghapus data");
      }
    },
    () => {},
  );
};

const copyLink = async (link) => {
  try {
    await navigator.clipboard.writeText(link);
    Notify.success("Link berhasil disalin!");
  } catch {
    Notify.failure("Gagal menyalin link");
  }
};

const sourceData = computed(() => {
  return props.items || cardData.value || [];
});

const sortedData = computed(() => {
  if (!Array.isArray(sourceData.value)) return [];
  return sourceData.value
    .filter((item) => {
      const title = item.title || item.nama || "";
      return title.toLowerCase().includes(searchQuery.value.toLowerCase());
    })
    .sort((a, b) => {
      const titleA = a.title || a.nama || "";
      const titleB = b.title || b.nama || "";
      return titleA.localeCompare(titleB);
    });
});

const totalPages = computed(() => {
  return Math.ceil(sortedData.value.length / props.initialVisibleCount);
});

const visibleData = computed(() => {
  const start = (currentPage.value - 1) * props.initialVisibleCount;
  const end = start + props.initialVisibleCount;
  return sortedData.value.slice(start, end);
});

const handleSearch = (query) => {
  searchQuery.value = query;
};

const handlePageChange = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Function to Export to Excel (CSV) using composable
const exportToExcel = () => {
  const headers = ["No", "Judul", "Keterangan", "Link"];
  const data = sortedData.value.map((item, index) => ({
    no: index + 1,
    title: item.title || item.nama,
    description: item.description || "",
    link: item.link,
  }));

  exportToCSV(data, headers, props.title);
};

// Reset page when search or data changes
watch([searchQuery, sortedData], () => {
  currentPage.value = 1;
});

onMounted(() => {
  if (props.localStorageKey) {
    loadData(props.localStorageKey);
  }
});
</script>
