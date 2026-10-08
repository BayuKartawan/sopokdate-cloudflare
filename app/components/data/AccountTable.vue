<template>
  <div class="page-layout">
    <!-- Header Text -->
    <UiPageHeader :title="title" :breadcrumbs="breadcrumbs">
      <template #actions>
        <BaseButton v-if="isAdmin" text="Tambah" title="Tambah akun baru" @click="openCreateModal">
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
                  <th class="border border-stone-300 p-2 text-left">Username</th>
                  <th class="border border-stone-300 p-2 text-left">Password</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in sortedData" :key="index">
                  <td class="border border-stone-300 p-2">{{ index + 1 }}</td>
                  <td class="border border-stone-300 p-2">{{ getAccountGtkName(item) }}</td>
                  <td class="border border-stone-300 p-2 font-mono">{{ item.username }}</td>
                  <td class="border border-stone-300 p-2 font-mono">{{ item.password }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </PrintButton>

        <BaseButton text="Excel" title="Ekspor data ke Excel" @click="exportToExcel">
          <template #icon>
            <FileSpreadsheet class="w-4 h-4" />
          </template>
        </BaseButton>
      </template>
    </UiPageHeader>

    <!-- Search and Dropdown -->
    <div class="w-full flex flex-col sm:flex-row gap-3 sm:gap-4 mb-2">
      <!-- Dropdown Select (Inlined) -->
      <div v-if="activeDropdownOptions && activeDropdownOptions.length > 0" class="w-full sm:w-1/2">
        <select v-model="selectedFilterValue" @change="handleDropdownUpdated(selectedFilterValue)"
          class="w-full rounded-lg border py-2 px-4 text-sm leading-5 h-[38px] transition-all duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-1 focus:ring-opacity-50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
          :style="{
            backgroundColor: 'var(--bg-input-alpha)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-primary)',
          }">
          <option v-for="option in activeDropdownOptions" :key="option.value" :value="option.value" :style="{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }">
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Search Component -->
      <div :class="(activeDropdownOptions && activeDropdownOptions.length > 0) ? 'w-full sm:w-1/2' : 'w-full'">
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
              <div class="shrink-0">
                <div class="w-8 h-8 rounded-lg" :style="{ backgroundColor: 'var(--bg-skeleton)' }"></div>
              </div>
              <div class="h-4 rounded w-2/3" :style="{ backgroundColor: 'var(--bg-skeleton)' }"></div>
            </div>

            <!-- Account Info -->
            <div class="space-y-3 mb-5">
              <div class="flex items-center gap-2">
                <div class="h-3 rounded w-8 shrink-0" :style="{ backgroundColor: 'var(--bg-skeleton-soft)' }">
                </div>
                <div class="h-4 rounded flex-1" :style="{ backgroundColor: 'var(--bg-skeleton-soft)' }"></div>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 rounded w-8 shrink-0" :style="{ backgroundColor: 'var(--bg-skeleton-soft)' }">
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
          <div v-for="(akun, index) in visibleData" :key="index" class="rounded-lg border transition-colors flex flex-col justify-between" :style="{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }">
            <div class="p-4">
              <!-- Header -->
              <div class="flex items-start gap-3 mb-3">
                <div class="shrink-0 mt-0.5">
                  <UserCircle aria-hidden="true" class="w-8 h-8 p-1.5 rounded-lg text-emerald-500 dark:text-emerald-400"
                    :style="{ backgroundColor: 'var(--bg-tertiary)' }" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold text-base truncate" :style="{ color: 'var(--text-primary)' }" :title="getAccountGtkName(akun)">
                    {{ getAccountGtkName(akun) }}
                  </h3>
                  <!-- Badge Aplikasi jika ada -->
                  <div v-if="getAccountAppTitle(akun)" class="mt-1">
                    <span class="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 truncate max-w-full">
                      {{ getAccountAppTitle(akun) }}
                    </span>
                  </div>
                </div>

                <!-- Admin Edit/Delete Buttons -->
                <div v-if="isAdmin" class="flex items-center gap-1 shrink-0">
                  <button @click.stop="openEditModal(akun)"
                    class="p-1.5 rounded-md hover:text-amber-400 hover:bg-(--bg-card-hover) transition-all"
                    :style="{ color: 'var(--text-secondary)' }" title="Edit">
                    <PencilIcon class="w-3.5 h-3.5" />
                  </button>
                  <button @click.stop="handleDelete(akun)"
                    class="p-1.5 rounded-md hover:text-red-400 hover:bg-(--bg-card-hover) transition-all"
                    :style="{ color: 'var(--text-secondary)' }" title="Hapus">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Account Info -->
              <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2">
                  <span class="text-xs w-8 shrink-0" :style="{ color: 'var(--text-secondary)' }">User</span>
                  <p class="text-sm font-mono truncate flex-1 select-all cursor-pointer"
                    :style="{ color: 'var(--text-primary)' }" @click="copyToClipboard(akun.username)"
                    title="Klik untuk menyalin username">
                    {{ akun.username }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-8 shrink-0" :style="{ color: 'var(--text-secondary)' }">Pass</span>
                  <p class="text-sm font-mono truncate flex-1 select-all cursor-pointer"
                    :style="{ color: 'var(--text-primary)' }" @click="copyToClipboard(akun.password)"
                    title="Klik untuk menyalin password">
                    {{ akun.password }}
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-1.5 pt-2 border-t" :style="{ borderColor: 'var(--border-subtle)' }">
                <button
                  class="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  :style="{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                  }" :class="{ 'opacity-50': sharingCardId === index }" @click="handleShareAccount(akun, index)"
                  :disabled="sharingCardId === index" title="Share Account" type="button">
                  <Send class="w-4 h-4 shrink-0" />
                  <span class="hidden sm:inline">Share</span>
                </button>

                <a :href="getAccountLink(akun) || '#'" target="_blank" rel="noopener noreferrer"
                  class="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded text-xs font-medium no-underline bg-emerald-600 text-white hover:bg-emerald-500 transition-all active:scale-95"
                  title="Login" @click="handleLinkClick($event, akun)">
                  <LogIn class="w-4 h-4 shrink-0" />
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

interface Breadcrumb {
  label: string;
  to?: string;
}

interface AkunItem {
  id?: string | number;
  _id?: string | number;
  gtk_id?: string | number;
  nama?: string;
  aplikasi_id?: string | number;
  nama_aplikasi?: string;
  link_aplikasi?: string;
  username: string;
  password: string;
}

interface AplikasiItem {
  id?: string | number;
  _id?: string | number;
  title?: string;
  link?: string;
}

interface GtkItem {
  id?: string | number;
  nama_lengkap?: string;
  title?: string;
}

interface FormField {
  key: string;
  label: string;
  type?: string;
  options?: any[];
  required?: boolean;
  placeholder?: string;
  colSpan?: number;
}

interface ExportRow {
  no: number;
  nama: string;
  aplikasi?: string;
  username: string;
  password: string;
}

const props = defineProps<{
  title: string;
  initialTable: string;
  dropdownOptions?: DropdownOption[] | null;
  showEmptyStateDetails?: boolean;
  pageSize?: number;
  breadcrumbs?: Breadcrumb[];
}>();

const { pageSize = 12, showEmptyStateDetails = false } = props;

const { cardData: accountsData, isLoading, loadData, refreshData } = useTableData();
const { cardData: aplikasiData, loadData: loadAplikasiData } = useTableData();
const { cardData: gtkData, loadData: loadGtkData } = useTableData();
const { exportToCSV } = useExportExcel();
const { Notify } = useNotiflix();

const isAkunGtkMode = computed(() => props.initialTable.toLowerCase() === "akungtk");

const selectedTable = ref<string>(props.initialTable);
const selectedAppFilter = ref<string>("all");
const selectedFilterValue = ref<string>(isAkunGtkMode.value ? "all" : props.initialTable);

// Dynamic CRUD composable based on selected table
const {
  isAdmin,
  isSaving: crudSaving,
} = useCrud(selectedTable.value, () => refreshData(selectedTable.value));

const searchQuery = ref<string>("");
const currentPage = ref<number>(1);
const sharingCardId = ref<number | null>(null);

// CRUD Modal state
const showCrudModal = ref<boolean>(false);
const modalMode = ref<"create" | "edit">("create");
const editingItem = ref<Partial<AkunItem>>({});

// Dynamic dropdown options (for table selector or application filter)
const activeDropdownOptions = computed<DropdownOption[]>(() => {
  if (props.dropdownOptions) {
    return props.dropdownOptions;
  }
  if (isAkunGtkMode.value) {
    const apps = (aplikasiData.value as AplikasiItem[] | null) || [];
    const options: DropdownOption[] = [
      { label: "Semua Aplikasi", value: "all" },
      ...apps
        .filter((a) => a.title)
        .map((a) => ({
          label: a.title as string,
          value: String(a.id || a._id || a.title),
        })),
    ];
    return options;
  }
  return [];
});

// Helper to get GTK name for an account
const getAccountGtkName = (akun: AkunItem): string => {
  if (akun.nama) return akun.nama;
  if (akun.gtk_id) {
    const gtks = (gtkData.value as GtkItem[] | null) || [];
    const found = gtks.find(
      (g) => String(g.id) === String(akun.gtk_id)
    );
    if (found) return (found.nama_lengkap || found.title || "") as string;
  }
  return "";
};

// Helper to get app title for an account
const getAccountAppTitle = (akun: AkunItem): string => {
  if (akun.nama_aplikasi) return akun.nama_aplikasi;
  if (!akun.aplikasi_id) return "";
  const apps = (aplikasiData.value as AplikasiItem[] | null) || [];
  const found = apps.find(
    (a) => String(a.id || a._id) === String(akun.aplikasi_id) || a.title === String(akun.aplikasi_id)
  );
  return found?.title || "";
};

// Helper to get application link
const getAccountLink = (akun: AkunItem): string => {
  if (akun.link_aplikasi) return akun.link_aplikasi;
  if (akun.aplikasi_id) {
    const apps = (aplikasiData.value as AplikasiItem[] | null) || [];
    const found = apps.find(
      (a) => String(a.id || a._id) === String(akun.aplikasi_id)
    );
    if (found?.link) return found.link;
  }
  return "";
};

const defaultLink = computed<string>(() => "");

// GTK Options for Select
const gtkOptions = computed(() => {
  const gtks = (gtkData.value as GtkItem[] | null) || [];
  return gtks
    .filter((g) => g.nama_lengkap || g.title)
    .map((g) => ({
      label: (g.nama_lengkap || g.title) as string,
      value: g.id as string | number,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

// App Options for Select in Modal
const appSelectOptions = computed(() => {
  const apps = (aplikasiData.value as AplikasiItem[] | null) || [];
  return apps
    .filter((a) => a.title)
    .map((a) => ({
      label: a.title as string,
      value: a.id || a._id || a.title,
    }));
});

const accountFields = computed<FormField[]>(() => {
  return [
    {
      key: "gtk_id",
      label: "Nama GTK",
      type: gtkOptions.value.length > 0 ? "select" : "text",
      options: gtkOptions.value,
      required: true,
    },
    {
      key: "aplikasi_id",
      label: "Aplikasi",
      type: "select",
      options: appSelectOptions.value,
      required: true,
    },
    { key: "username", label: "Username", required: true },
    { key: "password", label: "Password", required: true },
  ];
});

const openCreateModal = (): void => {
  modalMode.value = "create";
  const defaultApp = selectedAppFilter.value !== "all"
    ? selectedAppFilter.value
    : (appSelectOptions.value[0]?.value || "");
  editingItem.value = {
    aplikasi_id: defaultApp,
  };
  showCrudModal.value = true;
};

const openEditModal = (akun: AkunItem): void => {
  modalMode.value = "edit";
  editingItem.value = {
    _id: akun.id || akun._id,
    gtk_id: akun.gtk_id || "",
    nama: akun.nama || "",
    aplikasi_id: akun.aplikasi_id || "",
    username: akun.username || "",
    password: akun.password || "",
  };
  showCrudModal.value = true;
};

const handleFormSubmit = async (formData: Record<string, unknown>): Promise<void> => {
  const tableName = selectedTable.value;
  let success = false;

  const { postToApi, putToApi } = await import("~/utils/api");

  // Pastikan nama GTK terisi dari options jika gtk_id dipilih
  const payload = { ...formData };
  if (payload.gtk_id && !payload.nama) {
    const selectedGtk = gtkOptions.value.find((g) => String(g.value) === String(payload.gtk_id));
    if (selectedGtk) {
      payload.nama = selectedGtk.label;
    }
  }

  if (modalMode.value === "create") {
    try {
      crudSaving.value = true;
      await postToApi(tableName, payload);
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
      await putToApi(tableName, id, payload);
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
  const accountName = getAccountGtkName(akun) || akun.username;

  Confirm?.show(
    "Hapus Akun",
    `Apakah Anda yakin ingin menghapus akun ${accountName}? Tindakan ini tidak dapat dibatalkan.`,
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

  const query = searchQuery.value.toLowerCase();
  const appFilter = selectedAppFilter.value;

  return data
    .filter((item) => {
      if (!item) return false;

      // Filter by Application in AkunGTK mode
      if (isAkunGtkMode.value && appFilter !== "all") {
        const itemAppId = String(item.aplikasi_id || "");
        const itemAppName = (item.nama_aplikasi || "").toLowerCase();
        const appTitle = getAccountAppTitle(item).toLowerCase();
        const matchesApp =
          itemAppId === appFilter ||
          itemAppName === appFilter.toLowerCase() ||
          appTitle === appFilter.toLowerCase();
        if (!matchesApp) return false;
      }

      // Filter by Search Query (Nama, Username, Nama Aplikasi)
      if (!query) return true;
      const accountName = getAccountGtkName(item);
      const matchesName = accountName && accountName.toLowerCase().includes(query);
      const matchesUsername = item.username && item.username.toLowerCase().includes(query);
      const matchesApp = item.nama_aplikasi && item.nama_aplikasi.toLowerCase().includes(query);
      return matchesName || matchesUsername || matchesApp;
    })
    .sort((a, b) => {
      const nameA = getAccountGtkName(a);
      const nameB = getAccountGtkName(b);
      if (!nameA || !nameB) return 0;
      return nameA.localeCompare(nameB);
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
  if (isAkunGtkMode.value) {
    selectedAppFilter.value = newValue;
    selectedFilterValue.value = newValue;
  } else {
    selectedTable.value = newValue;
    selectedFilterValue.value = newValue;
    loadData(newValue);
  }
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
  const headers = ["No", "Nama", "Aplikasi", "Username", "Password"];
  const data: ExportRow[] = sortedData.value.map((item, index) => ({
    no: index + 1,
    nama: getAccountGtkName(item) || "",
    aplikasi: getAccountAppTitle(item) || "-",
    username: item.username,
    password: item.password,
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

  const appName = getAccountAppTitle(akun) || selectedTable.value || "Akun";
  const targetLink = getAccountLink(akun) || "";
  const targetName = getAccountGtkName(akun) || "-";
  const message = `====DOKUMEN.MADRASAH====\n\nJenis Akun: ${appName}\nNama: ${targetName}\n\nUser: ${akun.username}\nPass: ${akun.password}\n\nLink masuk ${appName}:\n${targetLink}\nLogin SopokDate:\nhttps://sopokdate.netlify.app/\n\n=====SANGAT.RAHASIA=====`;

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
  const link = getAccountLink(akun);
  if (!link) {
    event.preventDefault();
    Notify.failure("Link tidak tersedia!");
  }
};

// Reset page when search, table or data changes
watch([searchQuery, selectedTable, selectedAppFilter, sortedData], () => {
  currentPage.value = 1;
});

onMounted(() => {
  loadData(selectedTable.value);
  loadAplikasiData("Aplikasi");
  loadGtkData("DataGtk");
});
</script>
