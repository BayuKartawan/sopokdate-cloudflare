<template>
  <div class="page-layout">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-zinc-100">Nota Belanja</h1>
      <p class="text-sm mt-1 text-zinc-400">
        Cetak nota pembelian barang dan jasa dengan preview tanda tangan
      </p>
    </div>

    <!-- Form Pengisian -->
    <div class="rounded-xl border overflow-hidden mb-8 bg-zinc-900 border-zinc-700">
      <div class="px-6 py-3 border-b font-semibold text-sm bg-zinc-800 border-zinc-700 text-zinc-200">
        Formulir Konfigurasi Nota
      </div>
      <div class="p-6 space-y-6">
        <!-- Grid Header Config -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Informasi Toko / Penyedia
            </h3>
            <div class="space-y-4">
              <div>
                <label :class="labelClass">Nama Toko / Judul Utama</label>
                <input v-model="form.headerTitle" type="text" :class="inputClass"
                  placeholder="Contoh: UD. Hanif Photo" />
              </div>
              <div>
                <label :class="labelClass">Deskripsi / Layanan 1</label>
                <input v-model="form.headerSub1" type="text" :class="inputClass"
                  placeholder="Contoh: Photo, Cetak Photo, Photo copy, ATK," />
              </div>
              <div>
                <label :class="labelClass">Deskripsi / Layanan 2</label>
                <input v-model="form.headerSub2" type="text" :class="inputClass"
                  placeholder="Contoh: Laminating, Pulsa Semua operator" />
              </div>
              <div>
                <label :class="labelClass">Alamat Toko</label>
                <input v-model="form.alamat" type="text" :class="inputClass"
                  placeholder="Contoh: Jl Raya Sikur-Sakra" />
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Informasi Pelanggan & Tanggal
            </h3>
            <div class="space-y-4">
              <div>
                <label :class="labelClass">Tanggal Nota</label>
                <input v-model="form.tanggal" type="date" :class="inputClass" />
              </div>
              <div>
                <label :class="labelClass">Tuan / Toko (Nama Pelanggan)</label>
                <input v-model="form.tuanToko" type="text" :class="inputClass" placeholder="Nama penerima/pembeli" />
              </div>
              <div>
                <label :class="labelClass">Nama Pengirim (Hormat Kami)</label>
                <input v-model="form.namaPengirim" type="text" :class="inputClass"
                  placeholder="Nama yang bertanda tangan (opsional)" />
              </div>
            </div>
          </div>
        </div>

        <hr class="border-zinc-800" />

        <!-- Detail Barang -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Daftar Barang / Jasa
            </h3>
            <BaseButton
              text="Tambah Baris"
              size="sm"
              title="Tambah baris barang baru"
              @click="addItem"
            >
              <template #icon><Plus class="w-3.5 h-3.5" /></template>
            </BaseButton>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left">
              <thead>
                <tr class="text-xs font-bold uppercase text-zinc-500 border-b border-zinc-800">
                  <th class="pb-3 w-12 text-center">No</th>
                  <th class="pb-3 w-24 px-2">Banyak</th>
                  <th class="pb-3 px-2">Nama Barang / Uraian</th>
                  <th class="pb-3 w-40 px-2">Harga Satuan (Rp)</th>
                  <th class="pb-3 w-36 px-2">Jumlah (Rp)</th>
                  <th class="pb-3 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/60">
                <tr v-if="form.items.length === 0">
                  <td colspan="6" class="text-center py-6 text-zinc-500 text-sm">
                    Belum ada data barang. Klik "Tambah Baris" di atas untuk
                    mulai mengisi.
                  </td>
                </tr>
                <tr v-for="(item, idx) in form.items" :key="idx" class="group transition-all hover:bg-zinc-800/20">
                  <td class="py-2.5 text-center text-xs font-semibold text-zinc-500">
                    {{ idx + 1 }}
                  </td>
                  <td class="py-2 px-2">
                    <input v-model="item.banyak" type="text" :class="inputClass" class="!py-1.5 !text-xs text-center"
                      placeholder="5" />
                  </td>
                  <td class="py-2 px-2">
                    <input v-model="item.namaBarang" type="text" :class="inputClass" class="!py-1.5 !text-xs"
                      placeholder="Nama barang..." />
                  </td>
                  <td class="py-2 px-2">
                    <input v-model="item.hargaStr" type="text" :class="inputClass" class="!py-1.5 !text-xs monospace"
                      placeholder="0" @input="formatHargaInput($event, idx)" />
                  </td>
                  <td class="py-2 px-2">
                    <div class="text-xs font-bold text-zinc-300 py-1.5 monospace">
                      Rp {{ formatUang(calcJumlah(item)) }}
                    </div>
                  </td>
                  <td class="py-2 text-right">
                    <BaseButton
                      v-if="form.items.length > 1"
                      icon-only
                      size="sm"
                      title="Hapus baris ini"
                      @click="removeItem(idx)"
                    >
                      <template #icon><Trash2 class="w-3.5 h-3.5 text-red-500" /></template>
                    </BaseButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end pt-4 gap-3 border-t border-zinc-800">
          <BaseButton text="Reset Data" title="Reset form ke data awal" @click="handleReset" />
          <BaseButton text="Cetak Nota" title="Cetak nota belanja ini" @click="handlePrint">
            <template #icon><Printer class="w-4 h-4" /></template>
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Live Preview -->
    <div class="rounded-xl border overflow-hidden bg-zinc-900 border-zinc-700">
      <div
        class="px-6 py-3 border-b font-semibold text-sm flex justify-between bg-zinc-800 border-zinc-700 text-zinc-200">
        <span>Preview Nota Belanja</span>
        <span class="text-xs font-normal text-zinc-400">A5 Portrait (Cocok dengan Cetakan)</span>
      </div>

      <!-- Preview Container -->
      <div class="p-4 md:p-8 flex justify-center overflow-x-auto bg-zinc-950/60">
        <div ref="printArea" class="bg-white text-black shadow-2xl print-container">
          <!-- Header Nota Box -->
          <div class="nota-header-box">
            <!-- Left Info (Toko) -->
            <div class="nota-header-left">
              <div class="nota-title">{{ form.headerTitle || "" }}</div>
              <div class="nota-subtitle">{{ form.headerSub1 || "" }}</div>
              <div class="nota-subtitle">{{ form.headerSub2 || "" }}</div>
            </div>

            <!-- Vertical Divider -->
            <div class="nota-divider"></div>

            <!-- Right Info (Pelanggan & Tanggal) -->
            <div class="nota-header-right">
              <div class="info-row">
                <span class="info-label">TANGGAL</span>
                <span class="info-dots">:</span>
                <span class="info-value">{{
                  formatTanggal(form.tanggal)
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tuan/Toko</span>
                <span class="info-dots">:</span>
                <span class="info-value">{{ form.tuanToko || "" }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Alamat</span>
                <span class="info-dots">:</span>
                <span class="info-value">{{ form.alamat }}</span>
              </div>
            </div>
          </div>

          <!-- Space below header box -->
          <div class="h-2"></div>

          <!-- Items Table -->
          <table class="w-full nota-table">
            <thead>
              <tr class="table-header-row">
                <th class="col-banyak">BANYAK</th>
                <th class="col-nama">NAMA BARANG</th>
                <th class="col-harga">HARGA</th>
                <th class="col-jumlah">JUMLAH</th>
              </tr>
            </thead>
            <tbody>
              <!-- Rendered items + pad to 10 rows -->
              <tr v-for="(item, idx) in paddedItems" :key="idx" class="item-row">
                <td class="col-banyak">
                  {{ item.banyak || "" }}
                </td>
                <td class="col-nama">
                  {{ item.namaBarang || "" }}
                </td>
                <td class="col-harga">
                  {{
                    item.hargaStr
                      ? formatUangTanpaDesimal(parseNum(item.hargaStr))
                      : ""
                  }}
                </td>
                <td class="col-jumlah">
                  {{
                    item.banyak || item.namaBarang
                      ? formatUangTanpaDesimal(calcJumlah(item))
                      : ""
                  }}
                </td>
              </tr>

              <!-- Grand Total Row -->
              <tr class="total-row">
                <td colspan="3" class="total-label">JUMLAH</td>
                <td class="total-value">
                  {{ formatUangTanpaDesimal(totalSemua) }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Footer Area -->
          <div class="nota-footer">
            <!-- Container pembungkus Hormat Kami (dengan border rounded) -->
            <div class="stamp-box">
              <!-- Hormat Kami -->
              <div class="stamp-hormat-kami">Hormat Kami,</div>

              <!-- Signature Area with spacing -->
              <div class="signature-space"></div>

              <!-- Sender Name / Company Name at bottom -->
              <div class="stamp-bottom-normal">
                {{ form.namaPengirim || "..........................." }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus, Trash2, Printer } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";

interface NotaItem {
  banyak: string;
  namaBarang: string;
  hargaStr: string;
}

interface NotaForm {
  headerTitle: string;
  headerSub1: string;
  headerSub2: string;
  alamat: string;
  tanggal: string;
  tuanToko: string;
  namaPengirim: string;
  items: NotaItem[];
}

const labelClass = computed<string[]>(() => [
  "block text-sm font-medium mb-1 text-zinc-300",
]);
const inputClass = computed<string[]>(() => [
  "w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 bg-zinc-800 border-zinc-600 text-zinc-100 focus:ring-emerald-500/40",
]);

const now = new Date();

const getDefaultForm = (): NotaForm => ({
  headerTitle: "UD. Hanif Photo",
  headerSub1: "Photo, Cetak Photo, Photo copy , ATK,",
  headerSub2: "Laminating, Pulsa Semua operator",
  alamat: "Jl Raya Sikur-Sakra",
  tanggal: now.toISOString().split("T")[0],
  tuanToko: "",
  namaPengirim: "",
  items: [
    { banyak: "5", namaBarang: "Cetak Foto 3x4 Doff", hargaStr: "3.000" },
    { banyak: "2", namaBarang: "Cetak Foto 4x6 Glossy", hargaStr: "5.000" },
    { banyak: "10", namaBarang: "Jasa Fotocopy Laporan BOS", hargaStr: "500" },
  ],
});

const form = ref<NotaForm>(getDefaultForm());
const printArea = ref<HTMLElement | null>(null);

const addItem = (): void => {
  form.value.items.push({ banyak: "", namaBarang: "", hargaStr: "" });
};

const removeItem = (idx: number): void => {
  form.value.items.splice(idx, 1);
};

const handleReset = (): void => {
  form.value.tanggal = "";
  form.value.tuanToko = "";
  form.value.namaPengirim = "";
  form.value.items = [];
};

const parseNum = (str?: string | number | null): number => {
  if (!str) return 0;
  const raw = String(str).replace(/\D/g, "");
  return raw ? parseInt(raw, 10) : 0;
};

const parseBanyak = (str?: string | number | null): number => {
  if (!str) return 0;
  const clean = String(str).replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const calcJumlah = (item: NotaItem): number => {
  const q = parseBanyak(item.banyak);
  const p = parseNum(item.hargaStr);
  return Math.round(q * p);
};

const formatHargaInput = (e: Event, index: number): void => {
  let val = (e.target as HTMLInputElement).value.replace(/\D/g, "");
  if (val) {
    val = parseInt(val, 10).toLocaleString("id-ID");
  }
  form.value.items[index].hargaStr = val;
};

const totalSemua = computed<number>(() => {
  return form.value.items.reduce((acc, item) => acc + calcJumlah(item), 0);
});

// Pad items to at least 10 rows
const paddedItems = computed<NotaItem[]>(() => {
  const currentItems = [...form.value.items];
  const minRows = 10;
  if (currentItems.length < minRows) {
    const padCount = minRows - currentItems.length;
    for (let i = 0; i < padCount; i++) {
      currentItems.push({ banyak: "", namaBarang: "", hargaStr: "" });
    }
  }
  return currentItems;
});

const formatUang = (num?: number | null): string => {
  if (num === undefined || num === null) return "0,00";
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatUangTanpaDesimal = (num?: number | null): string => {
  if (num === undefined || num === null) return "0";
  return num.toLocaleString("id-ID");
};

const formatTanggal = (d: string): string => {
  if (!d) return "...........................";
  const bulanList: string[] = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "...........................";
  return `${dt.getDate()} ${bulanList[dt.getMonth()]} ${dt.getFullYear()}`;
};

const handlePrint = (): void => {
  if (!printArea.value) return;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Nota - ${form.value.headerTitle || "UD. Hanif Photo"}</title>
      <style>
        @page {
          size: A5 portrait;
          margin: 6mm 8mm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9.5pt;
          line-height: 1.35;
          color: #000;
          background: #fff;
          padding: 5px;
        }
        .print-container {
          width: 100%;
          background: white;
        }
        .nota-header-box {
          border: 1px solid #000;
          border-radius: 6px;
          padding: 10px;
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .nota-header-left {
          width: 55%;
          padding-right: 8px;
        }
        .nota-header-right {
          width: 43%;
          padding-left: 12px;
        }
        .nota-divider {
          border-left: 1px solid #000;
        }
        .nota-title {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #000;
          min-height: 18px;
        }
        .nota-subtitle {
          font-size: 8pt;
          color: #333;
          font-weight: 500;
          margin-top: 2px;
          min-height: 12px;
        }
        .info-row {
          display: flex;
          margin-bottom: 3px;
          align-items: flex-end;
        }
        .info-label {
          width: 75px;
          flex-shrink: 0;
          font-weight: 600;
        }
        .info-dots {
          margin-right: 4px;
        }
        .info-value {
          flex-grow: 1;
          border-bottom: 1px dotted #666;
          min-height: 15px;
          font-weight: bold;
        }
        .h-2 { height: 8px; }
        
        /* Table Styles */
        .nota-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
        }
        .nota-table th, .nota-table td {
          border: 1px solid #000;
          padding: 5px 8px;
          height: 28px;
          vertical-align: middle;
        }
        .nota-table th {
          font-weight: bold;
          text-align: center;
          background-color: #f9fafb !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-size: 9pt;
        }
        .table-header-row {
          background-color: #f9fafb;
        }
        .col-banyak { width: 12%; text-align: center; font-weight: 600; }
        .col-nama { width: 53%; text-align: left; }
        .col-harga { width: 18%; text-align: right; font-family: monospace; }
        .col-jumlah { width: 17%; text-align: right; font-family: monospace; font-weight: 600; }
        
        .total-row {
          background-color: #f9fafb;
        }
        .total-label {
          text-align: center;
          font-weight: bold;
          letter-spacing: 2px;
          font-size: 9.5pt;
        }
        .total-value {
          text-align: right;
          font-family: monospace;
          font-weight: 800;
          font-size: 11pt;
        }
        
        /* Footer & Stamp Box Styles */
        .nota-footer {
          margin-top: 15px;
          display: flex;
          justify-content: flex-end;
        }
        .stamp-box {
          width: 220px;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          position: relative;
          background: transparent;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 110px;
          box-sizing: border-box;
          border: 1px solid #000;
        }
        .stamp-hormat-kami {
          font-size: 9pt;
          font-weight: 600;
          color: #000;
        }
        .signature-space {
          height: 50px;
        }
        .stamp-bottom-normal {
          font-size: 9.5pt;
          font-weight: bold;
          text-decoration: underline;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        ${printArea.value.innerHTML}
      </div>
    </body>
    </html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 500);
};
</script>

<style scoped>
/* Screen Preview Styling */
.print-container {
  width: 148mm;
  min-height: 210mm;
  padding: 10mm;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9.5pt;
  line-height: 1.35;
  box-sizing: border-box;
  color: #000;
  border-radius: 4px;
}

.nota-header-box {
  border: 1px solid #000;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.nota-header-left {
  width: 55%;
  padding-right: 8px;
}

.nota-header-right {
  width: 43%;
  padding-left: 12px;
}

.nota-divider {
  border-left: 1px solid #000;
}

.nota-title {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13pt;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #000;
  min-height: 18px;
}

.nota-subtitle {
  font-size: 8pt;
  color: #333;
  font-weight: 500;
  margin-top: 2px;
  min-height: 12px;
}

.info-row {
  display: flex;
  margin-bottom: 3px;
  align-items: flex-end;
}

.info-label {
  width: 75px;
  flex-shrink: 0;
  font-weight: 600;
}

.info-dots {
  margin-right: 4px;
}

.info-value {
  flex-grow: 1;
  border-bottom: 1px dotted #666;
  min-height: 15px;
  font-weight: bold;
}

.h-2 {
  height: 8px;
}

/* Table Styles */
.nota-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 5px;
}

.nota-table th,
.nota-table td {
  border: 1px solid #000;
  padding: 5px 8px;
  height: 28px;
  vertical-align: middle;
}

.nota-table th {
  font-weight: bold;
  text-align: center;
  background-color: #f9fafb !important;
  font-size: 9pt;
}

.table-header-row {
  background-color: #f9fafb;
}

.col-banyak {
  width: 12%;
  text-align: center;
  font-weight: 600;
}

.col-nama {
  width: 53%;
  text-align: left;
}

.col-harga {
  width: 18%;
  text-align: right;
  font-family: monospace;
}

.col-jumlah {
  width: 17%;
  text-align: right;
  font-family: monospace;
  font-weight: 600;
}

.total-row {
  background-color: #f9fafb;
}

.total-label {
  text-align: center;
  font-weight: bold;
  letter-spacing: 2px;
  font-size: 9.5pt;
}

.total-value {
  text-align: right;
  font-family: monospace;
  font-weight: 800;
  font-size: 11pt;
}

/* Footer & Stamp Box Styles */
.nota-footer {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.stamp-box {
  width: 220px;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  position: relative;
  background: transparent;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 110px;
  box-sizing: border-box;
  border: 1px solid #000;
}

.stamp-hormat-kami {
  font-size: 9pt;
  font-weight: 600;
  color: #000;
}

.signature-space {
  height: 50px;
}

.stamp-bottom-normal {
  font-size: 9.5pt;
  font-weight: bold;
  text-decoration: underline;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
