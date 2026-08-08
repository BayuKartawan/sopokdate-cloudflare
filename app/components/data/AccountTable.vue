<template>
  <div class="page-layout">
    <!-- Header Text -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
      <h1 class="text-2xl" :style="{ color: 'var(--text-heading)' }">
        {{ title }}
      </h1>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <!-- Tambah Akun Button (Admin Only) -->
        <BaseButton v-if="isAdmin" text="Tambah" @click="openCreateModal">
          <template #icon>
            <Plus class="w-4 h-4" />
          </template>
        </BaseButton>

        <PrintButton>
          <div class="p-8">
            <h1 class="text-2xl font-bold mb-4 text-center text-emerald-900">
              {{ title }}
            </h1>
            <div class="mb-4 text-sm text-stone-600">
              Kategori: {{ selectedTable }} | Total:
              {{ sortedData.length }} data
            </div>
            <table class="w-full border-collapse border border-stone-300">
              <thead>
                <tr class="bg-stone-100">
                  <th class="border border-stone-300 p-2 text-left">No</th>
                  <th class="border border-stone-300 p-2 text-left">Nama</th>
                  <th class="border border-stone-300 p-2 text-left">
                    Username
                  </th>
                  <th class="border border-stone-300 p-2 text-left">
                    Password
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in sortedData" :key="index">
                  <td class="border border-stone-300 p-2">{{ index + 1 }}</td>
                  <td class="border border-stone-300 p-2">{{ item.nama }}</td>
                  <td class="border border-stone-300 p-2 font-mono">
                    {{ item.username }}
                  </td>
                  <td class="border border-stone-300 p-2 font-mono">
                    {{ item.password }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </PrintButton>

        <BaseButton text="Excel" @click="exportToExcel"
          class="shadow-sm border-emerald-600 text-emerald-600 dark:text-emerald-400"
          :style="{ backgroundColor: 'var(--bg-secondary)' }">
          <template #icon>
            <FileSpreadsheet class="w-4 h-4" />
          </template>
        </BaseButton>
      </div>
    </div>

    <!-- Search and Dropdown -->
    <div class="w-full flex flex-col sm:flex-row gap-3 sm:gap-4 mb-2">
      <!-- Dropdown Select (Inlined) -->
      <div v-if="dropdownOptions" class="w-full sm:w-1/2">
        <select v-model="selectedTable" @change="handleDropdownUpdated(selectedTable)"
          class="w-full rounded-lg border py-2 px-4 text-sm leading-5 h-[38px] transition-all duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-1 focus:ring-opacity-50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
          :style="{
            backgroundColor: 'var(--bg-input-alpha)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-primary)',
          }">
          <option v-for="option in dropdownOptions" :key="option.value" :value="option.value" :style="{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }">
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Search Component -->
      <div :class="dropdownOptions ? 'w-full sm:w-1/2' : 'w-full'">
        <Search @searchUpdated="handleSearch" class="w-full" />
      </div>
    </div>

    <!-- Content area -->
    <div class="flex-grow max-w-7xl mx-auto mt-2">
      <div>
        <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Skeleton Card -->
          <div v-for="i in 6" :key="i" class="rounded-lg border p-4 animate-pulse" :style="{
            backgroundColor: 'var(--bg-card-alpha)',
            borderColor: 'var(--border-subtle)',
          }">
            <!-- Header -->
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-lg" :style="{ backgroundColor: 'var(--bg-skeleton)' }"></div>
              </div>
              <div class="h-4 rounded w-2/3" :style="{ backgroundColor: 'var(--bg-skeleton)' }"></div>
            </div>

            <!-- Account Info -->
            <div class="space-y-3 mb-5">
              <div class="flex items-center gap-2">
                <div class="h-3 rounded w-8 flex-shrink-0" :style="{ backgroundColor: 'var(--bg-skeleton-soft)' }">
                </div>
                <div class="h-4 rounded flex-1" :style="{ backgroundColor: 'var(--bg-skeleton-soft)' }"></div>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 rounded w-8 flex-shrink-0" :style="{ backgroundColor: 'var(--bg-skeleton-soft)' }">
                </div>
                <div class="h-4 rounded flex-1" :style="{ backgroundColor: 'var(--bg-skeleton-soft)' }"></div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <div class="flex-1 h-9 rounded" :style="{ backgroundColor: 'var(--bg-skeleton)' }"></div>
              <div class="flex-1 h-9 rounded" :style="{ backgroundColor: 'var(--bg-skeleton)' }"></div>
            </div>
          </div>
        </div>
        <div v-else-if="sortedData.length === 0" class="text-center text-stone-500 py-10">
          <div class="space-y-2">
            <p>Tidak ada data yang ditemukan.</p>
            <p v-if="showEmptyStateDetails" class="text-sm">
              <span v-if="!hasLocalData">Data belum tersedia di penyimpanan lokal.
              </span>
              <span>Silakan gunakan tombol "Update All Data" di menu utama untuk
                memperbarui data.</span>
            </p>
          </div>
        </div>
        <div v-else id="accountCards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Account Card (Inlined) -->
          <div v-for="(akun, index) in visibleData" :key="index" class="rounded-lg border transition-colors" :style="{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }">
            <div class="p-4">
              <!-- Header -->
              <div class="flex items-center gap-3 mb-4">
                <div class="flex-shrink-0">
                  <UserCircle aria-hidden="true" class="w-8 h-8 p-1.5 rounded-lg text-emerald-500 dark:text-emerald-400"
                    :style="{ backgroundColor: 'var(--bg-tertiary)' }" />
                </div>
                <h3 class="font-semibold text-base truncate flex-1" :style="{ color: 'var(--text-primary)' }">
                  {{ akun.nama }}
                </h3>

                <!-- Admin Edit/Delete Buttons -->
                <div v-if="isAdmin" class="flex items-center gap-1 shrink-0">
                  <button @click.stop="openEditModal(akun)"
                    class="p-1.5 rounded-md hover:text-amber-400 hover:bg-[var(--bg-card-hover)] transition-all"
                    :style="{ color: 'var(--text-secondary)' }" title="Edit">
                    <PencilIcon class="w-3.5 h-3.5" />
                  </button>
                  <button @click.stop="handleDelete(akun)"
                    class="p-1.5 rounded-md hover:text-red-400 hover:bg-[var(--bg-card-hover)] transition-all"
                    :style="{ color: 'var(--text-secondary)' }" title="Hapus">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Account Info -->
              <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2">
                  <span class="text-xs w-8 flex-shrink-0" :style="{ color: 'var(--text-secondary)' }">User</span>
                  <p class="text-sm font-mono truncate flex-1 select-all cursor-pointer"
                    :style="{ color: 'var(--text-primary)' }" @click="copyToClipboard(akun.username)"
                    title="Klik untuk menyalin username">
                    {{ akun.username }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-8 flex-shrink-0" :style="{ color: 'var(--text-secondary)' }">Pass</span>
                  <p class="text-sm font-mono truncate flex-1 select-all cursor-pointer"
                    :style="{ color: 'var(--text-primary)' }" @click="copyToClipboard(akun.password)"
                    title="Klik untuk menyalin password">
                    {{ akun.password }}
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-1">
                <button
                  class="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  :style="{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                  }" :class="{ 'opacity-50': sharingCardId === index }" @click="handleShareAccount(akun, index)"
                  :disabled="sharingCardId === index" title="Share Account" type="button">
                  <Send class="w-4 h-4 flex-shrink-0" />
                  <span class="hidden sm:inline">Share</span>
                </button>

                <a :href="akun.link || defaultLink || '#'" target="_blank" rel="noopener noreferrer"
                  class="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded text-xs font-medium no-underline bg-emerald-600 text-white hover:bg-emerald-500"
                  title="Login" @click="handleLinkClick($event, akun)">
                  <LogIn class="w-4 h-4 flex-shrink-0" />
                  <span class="hidden sm:inline">Login</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <Pagination :currentPage="currentPage" :totalPages="totalPages" @pageChanged="handlePageChange" />
      </div>
    </div>

    <!-- CRUD Modal -->
    <CrudModal :show="showCrudModal" :mode="modalMode" :title="modalMode === 'create' ? 'Tambah Akun' : 'Edit Akun'"
      :fields="accountFields" :initialData="editingItem" :isSaving="crudSaving" @submit="handleFormSubmit"
      @close="showCrudModal = false" />
  </div>
</template>

<script setup lang="ts">
import {
  FileSpreadsheet,
  Send,
  LogIn,
  UserCircle,
  Plus,
  Pencil as PencilIcon,
  Trash2,
} from "lucide-vue-next";
import { ref, computed, onMounted, provide, watch } from "vue";
import Search from "~/components/ui/Search.vue";
import Pagination from "~/components/ui/Pagination.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useExportExcel } from "~/composables/data/useExcel";
import PrintButton from "~/components/ui/PrintButton.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import { useNotiflix } from "~/composables/ui/useFeedback";

interface DropdownOption {
  value: string;
  label: string;
}

interface AkunItem {
  id?: string;
  _id?: string;
  nama: string;
  username: string;
  password: string;
  link?: string;
}

interface AplikasiItem {
  title?: string;
  link?: string;
}

interface FormField {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

interface ExportRow {
  no: number;
  nama: string;
  username: string;
  password: string;
  link?: string;
}

const props = defineProps<{
  title: string;
  initialTable: string;
  dropdownOptions?: DropdownOption[] | null;
  showEmptyStateDetails?: boolean;
  pageSize?: number;
}>();

const { pageSize = 12, dropdownOptions = null, showEmptyStateDetails = false } = props;

const { cardData: accountsData, isLoading, loadData, refreshData } = useTableData();
const { cardData: aplikasiData, loadData: loadAplikasiData } = useTableData();
const { exportToCSV } = useExportExcel();
const { Notify } = useNotiflix();

const selectedTable = ref<string>(props.initialTable);

// Dynamic CRUD composable based on selected table
const {
  isAdmin,
  isSaving: crudSaving,
} = useCrud(selectedTable.value, () => refreshData(selectedTable.value));

// We need to re-bind the table name for CRUD when dropdown changes
const currentCrudTable = ref<string>(selectedTable.value);

const searchQuery = ref<string>("");
const currentPage = ref<number>(1);
const sharingCardId = ref<number | null>(null);

// CRUD Modal state
const showCrudModal = ref<boolean>(false);
const modalMode = ref<"create" | "edit">("create");
const editingItem = ref<Partial<AkunItem>>({});

// Helper to get fallback link from Aplikasi database table dynamically
const getAppFallbackLink = (tableKey: string): string => {
  const data = aplikasiData.value as AplikasiItem[] | null;
  if (!data || !Array.isArray(data)) return "";

  const key = tableKey.toLowerCase();
  let app: AplikasiItem | undefined;

  if (key === "akunemis") {
    app = data.find((a) => {
      const t = (a.title || "").toLowerCase();
      return t.includes("emis") && !t.includes("gtk");
    });
  } else if (key === "akunemisgtk") {
    app = data.find((a) => {
      const t = (a.title || "").toLowerCase();
      return t.includes("emis gtk") || t.includes("emis-gtk") || (t.includes("emis") && t.includes("gtk"));
    });
  } else if (key === "akunsimpatika") {
    app = data.find((a) => (a.title || "").toLowerCase().includes("simpatika"));
  } else if (key === "akunrdm") {
    app = data.find((a) => (a.title || "").toLowerCase().includes("rdm") || (a.title || "").toLowerCase().includes("raport digital"));
  } else if (key === "akunemail") {
    app = data.find((a) => (a.title || "").toLowerCase().includes("email") || (a.title || "").toLowerCase().includes("gmail"));
  }

  if (!app) {
    app = data.find((a) => {
      const t = (a.title || "").toLowerCase();
      const label = props.title.toLowerCase();
      return t.includes(label) || label.includes(t);
    });
  }

  return app?.link || "";
};

const defaultLink = computed<string>(() => getAppFallbackLink(selectedTable.value));

const accountFields = computed<FormField[]>(() => {
  const table = selectedTable.value;
  // AkunEmail has no link field
  if (table === "AkunEmail") {
    return [
      { key: "nama", label: "Nama", required: true },
      { key: "username", label: "Username", required: true },
      { key: "password", label: "Password", required: true },
    ];
  }

  return [
    { key: "nama", label: "Nama", required: true },
    { key: "username", label: "Username", required: true },
    { key: "password", label: "Password", required: true },
    {
      key: "link",
      label: "Link Login (Kosongkan untuk default)",
      placeholder: defaultLink.value ? `Default: ${defaultLink.value}` : "Link login khusus jika berbeda",
    },
  ];
});

const openCreateModal = (): void => {
  modalMode.value = "create";
  editingItem.value = {};
  showCrudModal.value = true;
};

const openEditModal = (akun: AkunItem): void => {
  modalMode.value = "edit";
  editingItem.value = {
    _id: akun.id || akun._id,
    nama: akun.nama || "",
    username: akun.username || "",
    password: akun.password || "",
    link: akun.link || "",
  };
  showCrudModal.value = true;
};

const handleFormSubmit = async (formData: Record<string, unknown>): Promise<void> => {
  const tableName = selectedTable.value;
  let success = false;

  // Import API functions directly for dynamic table name
  const { postToApi, putToApi } = await import("~/utils/api");

  if (modalMode.value === "create") {
    try {
      crudSaving.value = true;
      await postToApi(tableName, formData);
      Notify?.success?.("Data berhasil ditambahkan");
      refreshData(tableName);
      success = true;
    } catch (err) {
      const error = err as Error;
      Notify?.failure?.(error.message || "Gagal menambahkan data");
    } finally {
      crudSaving.value = false;
    }
  } else {
    const id = editingItem.value._id || editingItem.value.id;
    if (!id) return;
    try {
      crudSaving.value = true;
      await putToApi(tableName, id, formData);
      Notify?.success?.("Data berhasil diperbarui");
      refreshData(tableName);
      success = true;
    } catch (err) {
      const error = err as Error;
      Notify?.failure?.(error.message || "Gagal memperbarui data");
    } finally {
      crudSaving.value = false;
    }
  }

  if (success) {
    showCrudModal.value = false;
  }
};

const handleDelete = async (akun: AkunItem): Promise<void> => {
  const { deleteFromApi } = await import("~/utils/api");
  const { useNotiflix } = await import("~/composables/ui/useFeedback");
  const { Confirm } = useNotiflix();
  const id = akun.id || akun._id;
  if (!id) return;
  const tableName = selectedTable.value;

  Confirm?.show(
    "Hapus Akun",
    `Apakah Anda yakin ingin menghapus akun ${akun.nama}? Tindakan ini tidak dapat dibatalkan.`,
    "Ya, Hapus",
    "Batal",
    async () => {
      try {
        await deleteFromApi(tableName, id);
        Notify?.success?.("Data berhasil dihapus");
        refreshData(tableName);
      } catch (err) {
        const error = err as Error;
        Notify?.failure?.(error.message || "Gagal menghapus data");
      }
    },
    () => { },
  );
};

// Provide selectedTable for child elements
provide("selectedTable", selectedTable);

const sortedData = computed<AkunItem[]>(() => {
  const data = accountsData.value as AkunItem[] | null;
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data
    .filter((item) => {
      return (
        item &&
        item.nama &&
        item.nama.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (!a.nama || !b.nama) return 0;
      return a.nama.localeCompare(b.nama);
    });
});

const totalPages = computed<number>(() => {
  return Math.ceil(sortedData.value.length / pageSize);
});

const visibleData = computed<AkunItem[]>(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return sortedData.value.slice(start, end);
});

const hasLocalData = computed<boolean>(() => {
  const data = accountsData.value as AkunItem[] | null;
  return !!(data && data.length > 0);
});

const handleDropdownUpdated = (newValue: string): void => {
  selectedTable.value = newValue;
  currentCrudTable.value = newValue;
  loadData(newValue);
};

const handleSearch = (query: string): void => {
  searchQuery.value = query;
};

const handlePageChange = (page: number): void => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Function to Export to Excel (CSV) using composable
const exportToExcel = (): void => {
  const headers = ["No", "Nama", "Username", "Password", "Link Login"];
  const data: ExportRow[] = sortedData.value.map((item, index) => ({
    no: index + 1,
    nama: item.nama,
    username: item.username,
    password: item.password,
    link: item.link,
  }));

  exportToCSV(data, headers, `${props.title}_${selectedTable.value}`);
};

// Clipboard copy helper
const copyToClipboard = async (text: string): Promise<void> => {
  try {
    if (!navigator.clipboard) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        Notify.success(`Disalin: ${text.substring(0, 15)}...`);
      } finally {
        document.body.removeChild(textArea);
      }
      return;
    }

    await navigator.clipboard.writeText(text);
    Notify.success(`Disalin: ${text.substring(0, 15)}...`);
  } catch {
    Notify.failure("Gagal menyalin!");
  }
};

// Sharing handler
const handleShareAccount = async (akun: AkunItem, index: number): Promise<void> => {
  if (sharingCardId.value !== null) return;

  sharingCardId.value = index;

  const tableName = selectedTable.value || "Tidak Diketahui";
  const targetLink = akun.link || defaultLink.value || "";
  const message = `====DOKUMEN.MADRASAH====\n\nJenis Akun: ${tableName}\nNama: ${akun.nama}\n\nUser: ${akun.username}\nPass: ${akun.password}\n\nLink masuk ${tableName}:\n${targetLink}\nLogin SopokDate:\nhttps://sopokdate.netlify.app/\n\n=====SANGAT.RAHASIA=====`;

  try {
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ text: message })
    ) {
      await navigator.share({
        title: "Detail Akun",
        text: message,
      });
    } else {
      await copyToClipboard(message);
      Notify.success("Detail akun disalin!");
    }
  } catch (error) {
    const err = error as Error;
    if (err.name !== "AbortError") {
      try {
        await copyToClipboard(message);
      } catch {
        Notify.failure("Gagal menyalin!");
      }
    }
  } finally {
    setTimeout(() => {
      sharingCardId.value = null;
    }, 2000);
  }
};

const handleLinkClick = (event: MouseEvent, akun: AkunItem): void => {
  if (!akun.link && !defaultLink.value) {
    event.preventDefault();
    Notify.failure("Link tidak tersedia!");
  }
};

// Reset page when search, table or data changes
watch([searchQuery, selectedTable, sortedData], () => {
  currentPage.value = 1;
});

onMounted(() => {
  loadData(selectedTable.value);
  loadAplikasiData("Aplikasi");
});
</script>
