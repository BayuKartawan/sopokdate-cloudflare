<template>
  <div class="page-layout">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-zinc-100">Penerimaan Honor</h1>
      <p class="text-sm mt-1 text-zinc-400">
        Cetak bukti penerimaan honor dengan format tabel
      </p>
    </div>

    <div class="rounded-xl border overflow-hidden mb-8 bg-zinc-900 border-zinc-700">
      <div class="px-6 py-3 border-b font-semibold text-sm bg-zinc-800 border-zinc-700 text-zinc-200">
        Formulir Data Penerimaan
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          <!-- Row 1 -->
          <div class="sm:col-span-2 lg:col-span-2">
            <label :class="labelClass">Jenis Honor</label>
            <SearchableSelect v-model="form.jenisHonor" :options="jenisHonorOptions" @change="onJenisHonorChange"
              placeholder="Pilih Jenis Honor" />
            <!-- Input Manual Jika Pilih LAINNYA -->
            <div v-if="form.jenisHonor === 'LAINNYA (INPUT MANUAL)'" class="mt-2">
              <input v-model="form.customJenisHonor" type="text" placeholder="Masukkan Jenis Honor Manual..."
                :class="inputClass" />
            </div>
          </div>
          <div>
            <label :class="labelClass">Bulan Mulai</label>
            <SearchableSelect v-model="form.bulanMulai" :options="bulanOptions" placeholder="Pilih Bulan" />
          </div>
          <div>
            <label :class="labelClass">Bulan Selesai</label>
            <SearchableSelect v-model="form.bulanSelesai" :options="bulanOptions" placeholder="Pilih Bulan" />
          </div>

          <div>
            <label :class="labelClass">Tanggal Cetak</label>
            <input v-model="form.tanggal" type="date" :min="dateRange.min" :max="dateRange.max" :class="inputClass" />
          </div>
          <div>
            <label :class="labelClass">Tinggi Baris</label>
            <SearchableSelect v-model="form.tinggiBaris" :options="tinggiBarisOptions" placeholder="Pilih Tinggi" />
          </div>
        </div>

        <!-- Daftar Penerima Section -->
        <div class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold uppercase tracking-wider flex items-center text-zinc-400">
              Daftar Penerima Honor
              <span v-if="canAddRecipient"
                class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                {{ form.penerimaList.length }} Orang
              </span>
            </h3>
            <div class="flex gap-2">
              <button v-if="canAddRecipient" @click="addAllGtk"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-blue-600/20 text-blue-400 hover:bg-blue-600/30">
                <Users class="w-3.5 h-3.5" stroke-width="3" />
                Tambah Semua GTK
              </button>
              <button v-if="canAddRecipient" @click="addPenerima"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30">
                <Plus class="w-3.5 h-3.5" stroke-width="3" />
                Tambah Penerima
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="text-left text-[10px] uppercase tracking-widest text-zinc-500">
                  <th class="pb-3 pl-2 w-10">No</th>
                  <th class="pb-3 px-2">Nama Penerima</th>
                  <th v-if="isHonorGuru" class="pb-3 px-2 w-20 text-center">
                    Jam/Bln
                  </th>
                  <th class="pb-3 px-2 w-40">Satuan (Rp)</th>
                  <th class="pb-3 px-2 w-32">Total</th>
                  <th v-if="canAddRecipient" class="pb-3 pr-2 w-10"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800">
                <tr v-for="(p, idx) in form.penerimaList" :key="idx" class="group transition-all hover:bg-zinc-800/30">
                  <td class="py-2.5 pl-2 text-xs font-medium text-zinc-500">
                    {{ idx + 1 }}
                  </td>
                  <td class="py-2 px-2">
                    <SearchableSelect v-model="p.nama" :options="sortedGtkDataNames" placeholder="Pilih Penerima"
                      search-placeholder="Cari nama GTK..." @change="(val) => onGtkChangeName(val, idx)" />
                  </td>
                  <td v-if="isHonorGuru" class="py-2 px-2">
                    <input v-model.number="p.jamPerBulan" type="number" :class="inputClass"
                      class="!py-1.5 !text-[11px] !h-8 text-center" />
                  </td>
                  <td class="py-2 px-2">
                    <input v-model="p.satuanStr" type="text" placeholder="0" @input="(e) => formatSatuan(e, idx)"
                      :class="inputClass" class="!py-1.5 !text-[11px] !h-8 monospace" />
                  </td>
                  <td class="py-2 px-2">
                    <div class="text-[11px] font-bold text-emerald-400">
                      Rp {{ formatUang(calcPenerimaan(p)) }}
                    </div>
                  </td>
                  <td v-if="canAddRecipient" class="py-2 pr-2 text-right">
                    <button v-if="form.penerimaList.length > 1" @click="removePenerima(idx)"
                      class="w-7 h-7 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 class="w-3.5 h-3.5" stroke-width="2.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 mt-6 pt-4 border-t border-zinc-700">
          <button @click="handleReset"
            class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-center flex justify-center">
            Reset Data
          </button>
          <button @click="handlePrint"
            class="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white">
            <Printer class="w-4 h-4" />
            Cetak Landscape
          </button>
        </div>
      </div>
    </div>

    <!-- Preview -->
    <div class="rounded-xl border bg-zinc-900 border-zinc-700">
      <div
        class="px-6 py-3 border-b font-semibold text-sm flex justify-between bg-zinc-800 border-zinc-700 text-zinc-200 rounded-t-xl">
        <span>Preview Dokumen</span>
        <span class="text-xs font-normal text-zinc-400">A4 Landscape</span>
      </div>
      <!-- Mobile scroll hint -->
      <div
        class="flex items-center gap-1.5 px-4 py-2 text-[10px] text-zinc-400 bg-zinc-800/60 border-b border-zinc-700 sm:hidden">
        <svg class="w-3.5 h-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Geser ke kanan untuk melihat dokumen penuh
      </div>
      <div class="preview-scroll-area" style="-webkit-overflow-scrolling: touch;">
        <div id="print-area" ref="printArea" class="bg-white text-black shadow-lg print-page">
          <!-- Judul Atas -->
          <div class="text-center mb-8">
            <div class="font-bold text-[11pt]">
              PENERIMAAN HONOR DANA BOS TAHUN ANGGARAN {{ tahunAnggaran }}
            </div>
            <div class="font-bold text-[11pt]">
              TAHUN PELAJARAN {{ tahunPelajaran }}
            </div>
          </div>

          <!-- Info Box (2 Columns) -->
          <div class="grid grid-cols-2 gap-x-10 text-[11pt] mb-4 leading-tight">
            <div class="space-y-1">
              <div class="flex">
                <div class="w-36 font-semibold uppercase">Nama Madrasah</div>
                <div class="flex-1">: {{ form.namaMadrasah }}</div>
              </div>
              <div class="flex">
                <div class="w-36 font-semibold uppercase">Kecamatan</div>
                <div class="flex-1">: {{ form.kecamatan }}</div>
              </div>
              <div class="flex">
                <div class="w-36 font-semibold uppercase">Kabupaten/Kota</div>
                <div class="flex-1">: {{ form.kabupaten }}</div>
              </div>
            </div>
            <div class="space-y-1">
              <div class="flex">
                <div class="w-36 font-semibold uppercase">Jenis Honor</div>
                <div class="flex-1">
                  :
                  {{
                    form.jenisHonor === "LAINNYA (INPUT MANUAL)"
                      ? form.customJenisHonor || "HONOR ..."
                      : form.jenisHonor
                  }}
                </div>
              </div>
              <div class="flex">
                <div class="w-36 font-semibold uppercase">Periode Bulan</div>
                <div class="flex-1">: {{ periodeBulanText }}</div>
              </div>
            </div>
          </div>

          <!-- Tabel Data (Unified Template) -->
          <table class="w-full table-fixed border-collapse print-table text-[11pt]">
            <thead>
              <tr class="bg-gray-100">
                <th class="py-2 px-1 text-center w-8 border border-black">
                  No
                </th>
                <th class="py-2 px-2 text-center border border-black" :class="isHonorGuru ? 'w-56' : ''">
                  Nama Lengkap
                </th>
                <th class="py-2 px-2 text-center border border-black" :class="isHonorGuru ? 'w-28' : ''">
                  Jabatan
                </th>
                <th v-if="isHonorGuru" class="py-2 px-1 text-center w-16 border border-black">
                  Jum. Jam/Bln
                </th>
                <th class="py-2 px-1 text-center w-16 border border-black">
                  Volume
                </th>
                <th class="py-2 px-2 text-center w-32 border border-black">
                  Satuan
                </th>
                <th class="py-2 px-2 text-center w-32 border border-black">
                  Jumlah Penerimaan
                </th>
                <th class="py-2 px-2 text-center w-40 border border-black">
                  Tanda Tangan
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, idx) in form.penerimaList" :key="idx" :class="(idx + 1) % 2 === 0 ? 'bg-gray-50' : ''">
                <td class="py-2 px-1 text-center border border-black">
                  {{ idx + 1 }}
                </td>
                <td class="py-2 px-2 border border-black">{{ p.nama }}</td>
                <td class="py-2 px-2 border border-black">{{ p.jabatan }}</td>
                <td v-if="isHonorGuru" class="py-2 px-1 text-center border border-black">
                  {{ p.jamPerBulan }}
                </td>
                <td class="py-2 px-1 text-center border border-black">
                  {{ volume }}
                </td>
                <td class="py-2 px-2 border border-black">
                  <div class="flex justify-between">
                    <span>Rp</span>
                    <span>{{ formatUang(parseNum(p.satuanStr)) }}</span>
                  </div>
                </td>
                <td class="py-2 px-2 border border-black font-semibold">
                  <div class="flex justify-between">
                    <span>Rp</span>
                    <span>{{ formatUang(calcPenerimaan(p)) }}</span>
                  </div>
                </td>
                <td class="py-2 px-2 border border-black text-[11pt] align-top sig-cell"
                  :style="{ position: 'relative', height: rowHeightPx + 'px' }">
                  <div v-if="(idx + 1) % 2 !== 0" style="position: absolute; left: 4px; top: 4px">
                    {{ idx + 1 }}.
                  </div>
                  <div v-else style="position: absolute; left: 50%; top: 4px">
                    {{ idx + 1 }}.
                  </div>
                </td>
              </tr>
              <!-- Row Jumlah -->
              <tr class="font-bold bg-gray-100">
                <td :colspan="isHonorGuru ? 3 : 3" class="py-2 px-2 text-center border border-black">
                  Jumlah
                </td>
                <td v-if="isHonorGuru" class="py-2 px-1 text-center border border-black">
                  {{ totalJam }}
                </td>
                <td class="py-2 px-1 text-center border border-black">
                  {{ totalVolume }}
                </td>
                <td class="py-2 px-2 border border-black">
                  <div class="flex justify-between">
                    <span>Rp</span>
                    <span>{{ totalSatuanStr }}</span>
                  </div>
                </td>
                <td class="py-2 px-2 border border-black">
                  <div class="flex justify-between">
                    <span>Rp</span>
                    <span>{{ formatUang(totalSemua) }}</span>
                  </div>
                </td>
                <td class="py-2 px-2 border border-black bg-white sig-cell-last"></td>
              </tr>
            </tbody>
          </table>

          <!-- TTD -->
          <div class="flex justify-between mt-8 text-[11pt]">
            <!-- Kepala Madrasah -->
            <div style="width: 30%">
              <div>Mengetahui,</div>
              <div>Kepala Madrasah</div>
              <div style="height: 70px"></div>
              <div class="font-bold inline-block">
                {{ formatNameWithDegree(form.namaKamad) }}
              </div>
            </div>

            <!-- Bendahara -->
            <div style="width: 30%">
              <div>{{ form.tempat }}, {{ formatTanggal(form.tanggal) }}</div>
              <div class="mt-1">Bendahara</div>
              <div style="height: 70px"></div>
              <div class="font-bold inline-block">
                {{ formatNameWithDegree(form.namaBendahara) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Users, Plus, Trash2, Printer } from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useBosHonor } from "~/composables/utils/useBosHonor";
import SearchableSelect from "~/components/ui/SearchableSelect.vue";

interface Penerima {
  nama: string;
  jabatan: string;
  jamPerBulan: number;
  satuanStr: string;
}

interface HonorForm {
  namaMadrasah: string;
  kecamatan: string;
  kabupaten: string;
  jenisHonor: string;
  customJenisHonor: string;
  bulanMulai: string;
  bulanSelesai: string;
  penerimaList: Penerima[];
  namaKamad: string;
  namaBendahara: string;
  tempat: string;
  tanggal: string;
  tinggiBaris: string;
}

const { cardData: gtkData, loadData } = useTableData();
const { jenisHonorOptions, bulanList } = useBosHonor();

const bulanOptions = computed<string[]>(() => bulanList.map((b: string) => b.toUpperCase()));
const tinggiBarisOptions: Array<{ label: string; value: string }> = [
  { label: "Kecil", value: "kecil" },
  { label: "Default", value: "default" },
  { label: "Besar", value: "besar" },
];
const now = new Date();

const labelClass = computed<string[]>(() => [
  "block text-sm font-medium mb-1.5",
  "text-zinc-300",
]);
const inputClass = computed<string[]>(() => [
  "w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
  "bg-zinc-800 border-zinc-600 text-zinc-100 focus:ring-emerald-500/40",
]);

const calculateSafeLastDay = (monthName: string, year: number): string => {
  const monthIdx = bulanList.findIndex((b: string) => b.toUpperCase() === monthName);
  if (monthIdx === -1) return "";

  // Gunakan 12:00 siang untuk menghindari masalah pergeseran tanggal saat manipulasi
  let date = new Date(year, monthIdx + 1, 0, 12, 0, 0);
  if (date.getDay() === 0) {
    // Jika hari Minggu (0)
    date.setDate(date.getDate() - 1); // Maka gunakan hari sebelumnya (Sabtu)
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDefaultForm = (): HonorForm => ({
  namaMadrasah: "MI NW PENYENGGIR",
  kecamatan: "SIKUR",
  kabupaten: "LOMBOK TIMUR",
  jenisHonor: "HONOR OPERATOR MADRASAH",
  customJenisHonor: "",
  bulanMulai: "JULI",
  bulanSelesai: "OKTOBER",
  penerimaList: [
    {
      nama: "Bayu Kartawa, S.Kom.",
      jabatan: "Operator Madrasah",
      jamPerBulan: 1,
      satuanStr: "1.500.000",
    },
  ],
  namaKamad: "Abdul Halim, S.Pd.I",
  namaBendahara: "Erpahardiana, S.Pd",
  tempat: "Penyenggir",
  tanggal: calculateSafeLastDay("OKTOBER", new Date().getFullYear()),
  tinggiBaris: "default",
});

const form = ref<HonorForm>(getDefaultForm());

const isHonorGuru = computed<boolean>(
  () => form.value.jenisHonor === "HONOR GURU MADRASAH",
);

const canAddRecipient = computed<boolean>(() => {
  const singleTypes: string[] = [
    "HONOR OPERATOR MADRASAH",
    "HONOR BENDAHARA MADRASAH",
    "HONOR KEPALA MADRASAH",
  ];
  return !singleTypes.includes(form.value.jenisHonor);
});

const rowHeightPx = computed<number>(() => {
  if (form.value.tinggiBaris === "kecil") return 32;
  if (form.value.tinggiBaris === "besar") return 56;
  return 42;
});

// Fungsi Otomatis Tahun
const tahunAnggaran = computed<number>(() => {
  if (!form.value.tanggal) return now.getFullYear();
  return new Date(form.value.tanggal).getFullYear();
});

const tahunPelajaran = computed<string>(() => {
  if (!form.value.tanggal)
    return `${now.getFullYear()}/${now.getFullYear() + 1}`;
  const d = new Date(form.value.tanggal);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12

  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
});

const periodeBulanText = computed<string>(() => {
  if (form.value.bulanMulai === form.value.bulanSelesai) {
    return `${form.value.bulanMulai} ${tahunAnggaran.value}`;
  }
  return `${form.value.bulanMulai} - ${form.value.bulanSelesai} ${tahunAnggaran.value}`;
});

const dateRange = computed<{ min: string; max: string }>(() => {
  const year = tahunAnggaran.value;
  const startIdx = bulanList.findIndex(
    (b: string) => b.toUpperCase() === form.value.bulanMulai,
  );
  const endIdx = bulanList.findIndex(
    (b: string) => b.toUpperCase() === form.value.bulanSelesai,
  );

  if (startIdx === -1 || endIdx === -1) return { min: "", max: "" };

  const min = `${year}-${String(startIdx + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, endIdx + 1, 0).getDate();
  const max = `${year}-${String(endIdx + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return { min, max };
});

// Logika Volume Otomatis
const volume = computed<number>(() => {
  const startIdx = bulanList.findIndex(
    (b: string) => b.toUpperCase() === form.value.bulanMulai,
  );
  const endIdx = bulanList.findIndex(
    (b: string) => b.toUpperCase() === form.value.bulanSelesai,
  );
  if (startIdx === -1 || endIdx === -1) return 1;
  return Math.max(1, endIdx - startIdx + 1);
});

// Watcher untuk validasi rentang bulan
watch(
  () => form.value.bulanMulai,
  (newMulai: string) => {
    const startIdx = bulanList.findIndex((b: string) => b.toUpperCase() === newMulai);
    const endIdx = bulanList.findIndex(
      (b: string) => b.toUpperCase() === form.value.bulanSelesai,
    );

    if (startIdx > endIdx) {
      form.value.bulanSelesai = newMulai;
    }
    // Gunakan tahun dari tanggal sekarang atau tahun ini
    const yr = form.value.tanggal
      ? new Date(form.value.tanggal).getFullYear()
      : now.getFullYear();
    form.value.tanggal = calculateSafeLastDay(form.value.bulanSelesai, yr);
  },
);

watch(
  () => form.value.bulanSelesai,
  (newSelesai: string) => {
    const startIdx = bulanList.findIndex(
      (b: string) => b.toUpperCase() === form.value.bulanMulai,
    );
    const endIdx = bulanList.findIndex((b: string) => b.toUpperCase() === newSelesai);

    if (endIdx < startIdx) {
      form.value.bulanMulai = newSelesai;
    }
    const yr = form.value.tanggal
      ? new Date(form.value.tanggal).getFullYear()
      : now.getFullYear();
    form.value.tanggal = calculateSafeLastDay(newSelesai, yr);
  },
);

// Watcher untuk clamping tanggal cetak ke dalam range periode
watch(
  () => [form.value.bulanMulai, form.value.bulanSelesai, tahunAnggaran.value],
  () => {
    if (!form.value.tanggal) return;

    const current = new Date(form.value.tanggal).getTime();
    const min = new Date(dateRange.value.min).getTime();
    const max = new Date(dateRange.value.max).getTime();

    if (current < min) form.value.tanggal = dateRange.value.min;
    if (current > max) form.value.tanggal = dateRange.value.max;
  },
  { immediate: true },
);

const printArea = ref<HTMLElement | null>(null);

const sortedGtkData = computed<any[]>(() => {
  if (!gtkData.value) return [];
  return [...gtkData.value].sort((a, b) =>
    (a.title || "").localeCompare(b.title || ""),
  );
});

const sortedGtkDataNames = computed<string[]>(() => {
  return sortedGtkData.value.map((gtk: any) => formatTitle(gtk.title));
});

const onGtkChangeName = (val: any, index: number): void => {
  const selectedName = typeof val === "string" ? val : String(val?.label || val?.value || val || "");
  const selected = sortedGtkData.value.find(
    (g: any) => formatTitle(g.title) === selectedName,
  );
  if (selected) {
    form.value.penerimaList[index].jabatan = selected.Tugas || "Guru";
  }
};

const onJenisHonorChange = (): void => {
  const currentJenis = form.value.jenisHonor;
  // Reset seluruh form ke default
  form.value = getDefaultForm();
  // Kembalikan jenis honor yang baru dipilih
  form.value.jenisHonor = currentJenis;

  if (currentJenis === "HONOR KEPALA MADRASAH") {
    form.value.penerimaList = [
      {
        nama: form.value.namaKamad,
        jabatan: "Kepala Madrasah",
        jamPerBulan: 1,
        satuanStr: "0",
      },
    ];
  } else if (currentJenis === "HONOR BENDAHARA MADRASAH") {
    form.value.penerimaList = [
      {
        nama: form.value.namaBendahara,
        jabatan: "Bendahara",
        jamPerBulan: 1,
        satuanStr: "0",
      },
    ];
  } else if (currentJenis === "HONOR GURU MADRASAH") {
    form.value.penerimaList = [
      {
        nama: "",
        jabatan: "Guru Kelas",
        jamPerBulan: 24,
        satuanStr: "30.000",
      },
    ];
  } else if (currentJenis === "HONOR EKSTRAKULIKULER PRAMUKA") {
    form.value.penerimaList = [
      {
        nama: "",
        jabatan: "Pembina Pramuka",
        jamPerBulan: 1,
        satuanStr: "0",
      },
    ];
  } else if (currentJenis === "HONOR EKSTRAKULIKULER TAHFIDZ") {
    form.value.penerimaList = [
      {
        nama: "",
        jabatan: "Pembina Tahfidz",
        jamPerBulan: 1,
        satuanStr: "0",
      },
    ];
  } else if (currentJenis.includes("PANITIA")) {
    form.value.penerimaList = [
      {
        nama: "",
        jabatan: "Panitia",
        jamPerBulan: 1,
        satuanStr: "0",
      },
    ];
  } else if (currentJenis.includes("PENGAWAS")) {
    form.value.penerimaList = [
      {
        nama: "",
        jabatan: "Pengawas",
        jamPerBulan: 1,
        satuanStr: "0",
      },
    ];
  } else if (currentJenis.includes("PENYUSUN")) {
    form.value.penerimaList = [
      {
        nama: "",
        jabatan: "Penyusun",
        jamPerBulan: 1,
        satuanStr: "0",
      },
    ];
  } else if (currentJenis === "LAINNYA (INPUT MANUAL)") {
    form.value.penerimaList = [
      {
        nama: "",
        jabatan: "Penerima",
        jamPerBulan: 1,
        satuanStr: "0",
      },
    ];
  }
};

const addPenerima = (): void => {
  form.value.penerimaList.push({
    nama: "",
    jabatan: isHonorGuru.value ? "Guru Kelas" : "",
    jamPerBulan: isHonorGuru.value ? 24 : 1,
    satuanStr: "0",
  });
};

const addAllGtk = (): void => {
  const nominal = prompt("Masukkan nominal satuan (Rp) untuk semua GTK:", "0");
  if (nominal === null) return;

  let val = nominal.replace(/\D/g, "");
  if (val) val = parseInt(val, 10).toLocaleString("id-ID");
  else val = "0";

  form.value.penerimaList = sortedGtkData.value.map((gtk: any) => ({
    nama: formatTitle(gtk.title),
    jabatan: gtk.Tugas || (isHonorGuru.value ? "Guru Kelas" : ""),
    jamPerBulan: isHonorGuru.value ? 24 : 1,
    satuanStr: val,
  }));
};

const removePenerima = (index: number): void => {
  form.value.penerimaList.splice(index, 1);
};

const handleReset = (): void => {
  onJenisHonorChange();
};

const parseNum = (str?: string | number | null): number => {
  const raw = String(str || "").replace(/\D/g, "");
  return raw ? parseInt(raw, 10) : 0;
};

const calcPenerimaan = (p: Penerima): number => {
  if (!p) return 0;
  return parseNum(p.satuanStr) * (p.jamPerBulan || 1) * volume.value;
};

const totalJam = computed<number>(() =>
  form.value.penerimaList.reduce((acc, p) => acc + (p.jamPerBulan || 0), 0),
);
const totalVolume = computed<number>(
  () => volume.value * form.value.penerimaList.length,
);
const totalSatuan = computed<number>(() =>
  form.value.penerimaList.reduce((acc, p) => acc + parseNum(p.satuanStr), 0),
);
const totalSemua = computed<number>(() =>
  form.value.penerimaList.reduce((acc, p) => acc + calcPenerimaan(p), 0),
);

const totalSatuanStr = computed<string>(() => {
  if (form.value.penerimaList.length === 1)
    return formatUang(parseNum(form.value.penerimaList[0].satuanStr));
  return formatUang(totalSatuan.value);
});

const formatSatuan = (e: Event, index: number): void => {
  let val = (e.target as HTMLInputElement).value.replace(/\D/g, "");
  if (val) val = parseInt(val, 10).toLocaleString("id-ID");
  form.value.penerimaList[index].satuanStr = val;
};

function formatTitle(title?: string): string {
  if (!title) return "";
  return title.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNameWithDegree(fullName?: string): string {
  if (!fullName) return "";
  const parts = fullName.split(",");
  const name = parts[0].trim().toUpperCase();
  if (parts.length > 1) {
    const degrees = parts
      .slice(1)
      .map((d) => {
        return d
          .trim()
          .split(".")
          .map((word) => {
            if (!word) return "";
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(".");
      })
      .join(", ");
    return `${name}, ${degrees}`;
  }
  return name;
}

onMounted(() => {
  loadData("DataGtk");
});

const formatUang = (num: number): string => {
  // Format menjadi 1.500.000,00
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatTanggal = (d?: string): string => {
  if (!d) return "............................";
  const dt = new Date(d);
  return `${dt.getDate()} ${bulanList[dt.getMonth()]} ${dt.getFullYear()}`;
};

const handlePrint = (): void => {
  window.print();
};
</script>

<style scoped>
/* Preview size A4 landscape inside the web view */
.print-page {
  width: 297mm;
  min-height: 210mm;
  padding: 10mm 15mm;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0;
}

table.print-table th,
table.print-table td {
  border: 1px solid black;
}

/* Menghilangkan garis horizontal untuk kolom tanda tangan */
.sig-cell {
  border-top: none !important;
  border-bottom: none !important;
}

.sig-cell-last {
  border-top: none !important;
  border-bottom: 1px solid black !important;
}

/* Scroll container preview */
.preview-scroll-area {
  display: flex;
  justify-content: center;
  padding: 2rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background-color: #f3f4f6;
  border-radius: 0 0 0.75rem 0.75rem;
}

@media (max-width: 639px) {
  .preview-scroll-area {
    justify-content: flex-start;
    padding: 1rem;
    /* Ruang di kanan agar tidak mentok */
    padding-right: 0;
  }

  .preview-scroll-area::after {
    content: '';
    display: block;
    min-width: 1rem;
    flex-shrink: 0;
  }
}

@media print {
  .print-table td {
    height: v-bind('rowHeightPx + "px"');
  }
}
</style>

<style>
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm 16mm 10mm 15mm;
  }

  body {
    background-color: #ffffff !important;
    color: #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #print-area {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 297mm !important;
    min-height: 210mm !important;
    margin: 0 !important;
    padding: 10mm 15mm !important;
    box-shadow: none !important;
    border: none !important;
    background: white !important;
    color: black !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
