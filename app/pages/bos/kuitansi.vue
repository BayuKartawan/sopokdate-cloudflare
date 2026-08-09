<template>
  <div class="page-layout">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-zinc-100">Kwitansi</h1>
      <p class="text-sm mt-1 text-zinc-400">
        Cetak kwitansi pembayaran honor, barang, dan lainnya
      </p>
    </div>

    <div class="rounded-xl border overflow-hidden mb-8 bg-zinc-900 border-zinc-700">
      <div class="px-6 py-3 border-b font-semibold text-sm bg-zinc-800 border-zinc-700 text-zinc-200">
        Formulir Kwitansi
      </div>
      <div class="p-6 space-y-5">
        <div>
          <label :class="labelClass">Jenis Pembayaran</label>
          <select v-model="form.jenisPembayaran" :class="inputClass">
            <option value="honor">Pembayaran Honor</option>
            <option value="barang">Pembelian Barang</option>
            <option value="jasa">Pembayaran Jasa</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        <div>
          <label :class="labelClass">Nomor Kwitansi</label>
          <input v-model="form.noKwitansi" type="text" placeholder="Nomor kwitansi (opsional)" :class="inputClass" />
        </div>
        <div>
          <label :class="labelClass">Telah Diterima Dari</label>
          <input v-model="form.diterimaDari" type="text" placeholder="Nama instansi / pihak pemberi"
            :class="inputClass" />
        </div>
        <div>
          <label :class="labelClass">Nominal (Rp)</label>
          <input v-model="form.nominal" type="text" placeholder="0" @input="formatNominal"
            :class="[...inputClass, 'monospace']" />
        </div>
        <div>
          <label :class="labelClass">Terbilang</label>
          <div class="w-full rounded-lg border px-3 py-2.5 text-sm italic bg-zinc-800/50 border-zinc-700 text-zinc-300">
            {{ terbilang || "-" }}
          </div>
        </div>
        <div>
          <label :class="labelClass">Untuk Pembayaran</label>
          <textarea v-model="form.untukPembayaran" rows="3" placeholder="Uraian pembayaran / pembelian barang"
            :class="[...inputClass, 'resize-none']"></textarea>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label :class="labelClass">Tanggal</label>
            <input v-model="form.tanggal" type="date" :class="inputClass" />
          </div>
          <div>
            <label :class="labelClass">Nama Penerima</label>
            <input v-model="form.namaPenerima" type="text" placeholder="Nama penerima pembayaran" :class="inputClass" />
          </div>
        </div>
        <div class="flex justify-end pt-2">
          <BaseButton
            text="Cetak"
            title="Cetak kwitansi ini"
            @click="handlePrint"
          >
            <template #icon><PrinterIcon class="w-4 h-4" /></template>
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Preview -->
    <div class="rounded-xl border overflow-hidden bg-zinc-900 border-zinc-700">
      <div
        class="px-6 py-3 border-b font-semibold text-sm flex justify-between bg-zinc-800 border-zinc-700 text-zinc-200">
        <span>Preview Kwitansi</span>
        <span class="text-xs font-normal text-zinc-400">A4</span>
      </div>
      <div class="p-4 md:p-8 flex justify-center overflow-x-auto">
        <div ref="printArea" class="bg-white text-black shadow-lg print-page">
          <KopSurat />

          <!-- Judul -->
          <div class="text-center mt-6 mb-6">
            <div class="font-bold text-[14pt] underline tracking-wide">
              KWITANSI
            </div>
            <div v-if="form.noKwitansi" class="text-[10pt] mt-0.5">
              No: {{ form.noKwitansi }}
            </div>
          </div>

          <!-- Isi Kwitansi -->
          <table class="w-full text-[11pt]" style="border-collapse: collapse">
            <tbody>
              <tr>
                <td style="width: 180px" class="py-1.5">Telah diterima dari</td>
                <td style="width: 15px" class="py-1.5">:</td>
                <td class="py-1.5 font-semibold">
                  {{ form.diterimaDari || "..........................." }}
                </td>
              </tr>
              <tr>
                <td class="py-1.5">Uang sejumlah</td>
                <td class="py-1.5">:</td>
                <td class="py-1.5">
                  <div class="border border-black px-3 py-2 italic font-semibold text-[11pt]"
                    style="background: #f9f9f9">
                    {{ terbilang || "..........................." }}
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1.5">Untuk pembayaran</td>
                <td class="py-1.5">:</td>
                <td class="py-1.5">
                  {{ form.untukPembayaran || "..........................." }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Nominal Besar -->
          <div class="mt-6 flex justify-end">
            <div class="border-2 border-black px-6 py-3 text-[14pt] font-bold monospace">
              Rp {{ form.nominal || "0" }}
            </div>
          </div>

          <!-- TTD -->
          <div class="text-right mt-8 text-[11pt]">
            {{ form.tempat }}, {{ formatTanggal(form.tanggal) }}
          </div>
          <div class="flex justify-between mt-4 text-[11pt] text-center">
            <div style="width: 45%">
              <div class="font-semibold">Yang Menyerahkan</div>
              <div style="height: 80px"></div>
              <div class="font-bold">
                {{ form.diterimaDari || "..........................." }}
              </div>
            </div>
            <div style="width: 45%">
              <div class="font-semibold">Yang Menerima</div>
              <div style="height: 80px"></div>
              <div class="font-bold">
                {{ form.namaPenerima || "..........................." }}
              </div>
              <div class="text-[10pt]">{{ form.jabatanPenerima }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Printer as PrinterIcon } from "lucide-vue-next";
import KopSurat from "~/components/document/KopSurat.vue";
import BaseButton from "~/components/ui/BaseButton.vue";

interface KwitansiForm {
  jenisPembayaran: string;
  noKwitansi: string;
  diterimaDari: string;
  nominal: string;
  untukPembayaran: string;
  tempat: string;
  tanggal: string;
  namaPenerima: string;
  jabatanPenerima: string;
  namaKamad: string;
  namaBendahara: string;
}

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
const now = new Date();

const labelClass = computed<string[]>(() => [
  "block text-sm font-medium mb-1.5",
  "text-zinc-300",
]);
const inputClass = computed<string[]>(() => [
  "w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
  "bg-zinc-800 border-zinc-600 text-zinc-100 focus:ring-emerald-500/40",
]);

const form = ref<KwitansiForm>({
  jenisPembayaran: "honor",
  noKwitansi: "",
  diterimaDari: "",
  nominal: "",
  untukPembayaran: "",
  tempat: "Penyenggir",
  tanggal: now.toISOString().split("T")[0],
  namaPenerima: "",
  jabatanPenerima: "Bendahara",
  namaKamad: "Abdul Halim, S.Pd.I",
  namaBendahara: "Erpahardiana, S.Pd",
});

const printArea = ref<HTMLElement | null>(null);

const formatNominal = (e: Event): void => {
  let val = (e.target as HTMLInputElement).value.replace(/\D/g, "");
  if (val) val = parseInt(val).toLocaleString("id-ID");
  form.value.nominal = val;
};

const angkaKeTerbilang = (n: number): string => {
  const b: string[] = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  if (n < 12) return b[n];
  if (n < 20) return b[n - 10] + " Belas";
  if (n < 100) return b[Math.floor(n / 10)] + " Puluh " + b[n % 10];
  if (n < 200) return "Seratus " + angkaKeTerbilang(n - 100);
  if (n < 1000)
    return b[Math.floor(n / 100)] + " Ratus " + angkaKeTerbilang(n % 100);
  if (n < 2000) return "Seribu " + angkaKeTerbilang(n - 1000);
  if (n < 1e6)
    return (
      angkaKeTerbilang(Math.floor(n / 1000)) +
      " Ribu " +
      angkaKeTerbilang(n % 1000)
    );
  if (n < 1e9)
    return (
      angkaKeTerbilang(Math.floor(n / 1e6)) +
      " Juta " +
      angkaKeTerbilang(n % 1e6)
    );
  if (n < 1e12)
    return (
      angkaKeTerbilang(Math.floor(n / 1e9)) +
      " Miliar " +
      angkaKeTerbilang(n % 1e9)
    );
  return "";
};

const terbilang = computed<string>(() => {
  const raw = form.value.nominal.replace(/\D/g, "");
  if (!raw || parseInt(raw) === 0) return "";
  return (
    angkaKeTerbilang(parseInt(raw)).replace(/\s+/g, " ").trim() + " Rupiah"
  );
});

const formatTanggal = (d: string): string => {
  if (!d) return "............................";
  const dt = new Date(d);
  return `${dt.getDate()} ${bulanList[dt.getMonth()]} ${dt.getFullYear()}`;
};

const handlePrint = (): void => {
  if (!printArea.value) return;
  const w = window.open("", "_blank");
  if (!w) return;

  // Ambil semua style dan stylesheet dari dokumen utama agar Tailwind terapan sempurna
  const styles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
    .map(style => style.outerHTML)
    .join("\n");

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Kwitansi ${form.value.noKwitansi || ""}</title>
  <base href="${window.location.origin}/">
  ${styles}
  <style>
    /* Batalkan efek penyembunyian dari print.css */
    body, body * {
      visibility: visible !important;
    }
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000 !important;
      background: #fff !important;
    }
    .print-page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 15mm;
      margin: 0 auto;
      background: #fff !important;
      color: #000 !important;
    }
    .monospace {
      font-family: monospace;
    }
    .font-bold {
      font-weight: bold;
    }
    .font-semibold {
      font-weight: 600;
    }
    .italic {
      font-style: italic;
    }
    .underline {
      text-decoration: underline;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      padding: 2px 0;
      vertical-align: top;
    }
    .flex {
      display: flex;
    }
    .justify-between {
      justify-content: space-between;
    }
    .justify-end {
      justify-content: flex-end;
    }
    .mt-4 {
      margin-top: 1rem;
    }
    .mt-6 {
      margin-top: 1.5rem;
    }
    .mt-8 {
      margin-top: 2rem;
    }
    .mb-6 {
      margin-bottom: 1.5rem;
    }
    .py-1\\.5 {
      padding: .375rem 0;
    }
    .w-full {
      width: 100%;
    }
    .tracking-wide {
      letter-spacing: .05em;
    }
    .border {
      border: 1px solid #000;
    }
    .border-2 {
      border: 2px solid #000;
    }
    .px-3 {
      padding-left: .75rem;
      padding-right: .75rem;
    }
    .px-6 {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
    .py-2 {
      padding-top: .5rem;
      padding-bottom: .5rem;
    }
    .py-3 {
      padding-top: .75rem;
      padding-bottom: .75rem;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="print-page">${printArea.value.innerHTML}</div>
</body>
</html>`);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 500);
};
</script>

<style scoped>
.print-page {
  width: 210mm;
  min-height: 297mm;
  padding: 20mm 15mm;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  box-sizing: border-box;
}
</style>
