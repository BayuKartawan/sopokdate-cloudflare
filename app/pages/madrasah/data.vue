<!-- \src\views\madrasah\DataMadrasahView.vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- dataMadrasah Section with New Layout -->
      <section>
        <div
          class="rounded-lg shadow-sm border overflow-hidden transition-all duration-300 bg-zinc-900 border-zinc-800"
        >
          <!-- Section Header -->
          <div
            class="px-6 md:px-8 py-6 transition-all duration-300 bg-zinc-800"
          >
            <div
              class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            >
              <div class="flex items-center gap-3">
                <div>
                  <h2 class="text-2xl md:text-3xl text-white">Data Madrasah</h2>
                  <p
                    class="text-sm mt-1 transition-colors duration-300 text-zinc-300"
                  >
                    Kumpulan data madrasah dan informasi akreditasi
                  </p>
                </div>
              </div>

              <!-- Admin Actions -->
              <div v-if="isAdmin" class="flex items-center gap-2">
                <button
                  @click="openEditModal"
                  class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all"
                >
                  <Pencil class="w-4 h-4" />
                  Edit Data
                </button>
              </div>
            </div>
          </div>

          <!-- dataMadrasah Content - New Layout Format -->
          <div class="p-6">
            <div v-if="dataMadrasah.length === 0" class="text-center py-12">
              <Database
                class="w-16 h-16 mx-auto mb-4 transition-colors duration-300 text-zinc-600"
                stroke-width="1.5"
              />
              <p class="transition-colors duration-300 text-zinc-400">
                Tidak ada data madrasah yang ditemukan
              </p>
            </div>

            <!-- New Layout using the template style -->
            <div v-else class="space-y-6">
              <div
                v-for="(item, index) in visibleDataMadrasahItems"
                :key="index"
                class="overflow-hidden transition-all duration-300 bg-zinc-900 border-zinc-800/50"
              >
                <div class="flow-root">
                  <dl
                    :class="[
                      'divide-y text-sm transition-colors duration-300',
                      'divide-zinc-700/50 [&>*:nth-child(even)]:bg-zinc-800/50',
                    ]"
                  >
                    <!-- Dynamic Fields -->
                    <div
                      v-for="field in tableFields"
                      :key="field.key"
                      class="grid grid-cols-1 gap-1 p-3 sm:grid-cols-3 sm:gap-4"
                    >
                      <dt
                        class="font-medium transition-colors duration-300 text-gray-200"
                      >
                        {{ field.label }}
                      </dt>
                      <dd
                        class="sm:col-span-2 transition-colors duration-300 text-gray-300"
                        @click="copyToClipboard(item[field.key] || '-')"
                        title="Klik untuk menyalin"
                      >
                        {{ item[field.key] || "-" }}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CRUD Modal -->
      <CrudModal
        :show="showModal"
        mode="edit"
        title="Edit Data Madrasah"
        :fields="madrasahFields"
        :initialData="editingItem"
        :isSaving="isSaving"
        @submit="handleFormSubmit"
        @close="showModal = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Database, Pencil } from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import CrudModal from "~/components/ui/CrudModal.vue";

const { cardData: dataMadrasah, loadData, refreshData } = useTableData();
const { Notify } = useNotiflix();
const { isAdmin, isSaving, updateItem } = useCrud("DataMadrasah", () => refreshData("DataMadrasah"));

const searchKeyword = ref({ dataGtk: "", dataMadrasah: "" });
const visibleCount = ref({ dataGtk: 4, dataMadrasah: 12 });

// CRUD Modal state
const showModal = ref(false);
const editingItem = ref({});

// Define table fields configuration
const tableFields = [
  { key: "Madrasah", label: "Nama Madrasah" },
  { key: "Nsm", label: "NSM" },
  { key: "Npsn", label: "NPSN" },
  { key: "Akreditasi", label: "Akreditasi" },
  { key: "Nomor Akreditasi", label: "Nomor Akreditasi" },
  { key: "NoHp Kamad", label: "NoHp Kamad" },
  { key: "SiapID", label: "SiapID" },
  { key: "Data Emis", label: "Data Emis" },
  { key: "Tahun_Pelajaran", label: "Tahun Pelajaran" },
  { key: "Total_Guru", label: "Total Guru & Tenaga Pendidikan" },
  { key: "Total_Siswa", label: "Total Siswa" },
];

// Field configuration for Madrasah edit form
const madrasahFields = [
  { key: "Madrasah", label: "Nama Madrasah", required: true },
  { key: "Nsm", label: "NSM" },
  { key: "Npsn", label: "NPSN" },
  { key: "Akreditasi", label: "Akreditasi" },
  { key: "Nomor Akreditasi", label: "Nomor Akreditasi" },
  { key: "NoHp Kamad", label: "NoHp Kamad" },
  { key: "SiapID", label: "SiapID" },
];

const openEditModal = () => {
  if (Array.isArray(dataMadrasah.value) && dataMadrasah.value.length > 0) {
    const item = dataMadrasah.value[0];
    editingItem.value = {
      _id: item.id || item._id,
      "Madrasah": item["Madrasah"] || "",
      "Nsm": item["Nsm"] || "",
      "Npsn": item["Npsn"] || "",
      "Akreditasi": item["Akreditasi"] || "",
      "Nomor Akreditasi": item["Nomor Akreditasi"] || "",
      "NoHp Kamad": item["NoHp Kamad"] || "",
      "SiapID": item["SiapID"] || "",
    };
    showModal.value = true;
  }
};

const handleFormSubmit = async (formData) => {
  const id = editingItem.value._id;
  const success = await updateItem(id, formData);
  if (success) {
    showModal.value = false;
  }
};

onMounted(() => {
  loadData("DataMadrasah");
});

const filteredDataMadrasah = computed(() => {
  if (!Array.isArray(dataMadrasah.value)) {
    return [];
  }

  const keyword = (searchKeyword.value.dataMadrasah || "").toLowerCase();
  if (!keyword) {
    return dataMadrasah.value;
  }

  return dataMadrasah.value.filter(
    (item) =>
      (item.Madrasah && item.Madrasah.toLowerCase().includes(keyword)) ||
      (item.Nsm && String(item.Nsm).toLowerCase().includes(keyword)) ||
      (item.Npsn && String(item.Npsn).toLowerCase().includes(keyword)),
  );
});

// Fungsi untuk menyalin teks ke clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    Notify.success("Teks berhasil disalin!");
  } catch {
    Notify.failure("Gagal menyalin!");
  }
};

const visibleDataMadrasahItems = computed(() => {
  // Pastikan filteredDataMadrasah adalah array sebelum di-slice
  if (!Array.isArray(filteredDataMadrasah.value)) return [];
  return filteredDataMadrasah.value.slice(0, visibleCount.value.dataMadrasah);
});
</script>
