<template>
  <div class="min-h-screen">
    <div class="page-layout">

      <!-- Header -->
      <UiPageHeader title="Pembagian Bagian / Tim EDM" :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'EDM' },
        { label: 'Pembagian Bagian' },
      ]">
        <template #actions>
          <span
            class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            {{ selectedTahunLabel }}
          </span>
          <PrintButton :documentTitle="`SK TPM EDM ${selectedTahunLabel}`">
            <div class="flex flex-col items-center w-full bg-white text-black">
              <!-- PAGE 1 -->
              <div class="sk-page bg-white text-black relative">
                <KopSurat class="mb-4" />
                <div class="sk-title-block">
                  <div class="sk-title">KEPUTUSAN</div>
                  <div class="sk-subtitle">KEPALA MADRASAH IBTIDA'IYAH NAHDLATUL WATHAN PENYENGGIR</div>
                  <div class="sk-nomor">NOMOR: {{ nomorSk }}</div>
                  <div class="sk-tentang">TENTANG</div>
                  <div class="sk-kegiatan">PEMBENTUKAN TIM PENJAMIN MUTU MADRASAH (TPM)</div>
                  <div class="sk-kegiatan">MADRASAH IBTIDA'IYAH NAHDLATUL WATHAN PENYENGGIR</div>
                  <div class="sk-kegiatan">TAHUN ANGGARAN {{ tahunAnggaranVal }}</div>
                  <div class="sk-rahmat">DENGAN RAHMAT TUHAN YANG MAHA ESA</div>
                  <div class="sk-kepala-head">Kepala Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir</div>
                </div>
                <div class="sk-row">
                  <div class="sk-label">Menimbang</div>
                  <div class="sk-colon">:</div>
                  <div class="sk-content space-y-1">
                    <div class="sk-subitem">
                      <span class="sk-num">a.</span>
                      <span class="sk-text">bahwa untuk memastikan seluruh proses penyelenggaraan pendidikan telah sesuai dengan standar mutu dan aturan yang telah ditetapkan;</span>
                    </div>
                    <div class="sk-subitem">
                      <span class="sk-num">b.</span>
                      <span class="sk-text">bahwa untuk dapat melakukan penjaminan mutu pendidikan dengan baik diperlukan adanya Sistem Penjaminan Mutu di Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir;</span>
                    </div>
                    <div class="sk-subitem">
                      <span class="sk-num">c.</span>
                      <span class="sk-text">bahwa untuk maksud pada poin (b) tersebut di atas, perlu ditetapkan Tim Penjamin Mutu Madrasah (TPM) Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir Tahun Anggaran {{ tahunAnggaranVal }};</span>
                    </div>
                    <div class="sk-subitem">
                      <span class="sk-num">d.</span>
                      <span class="sk-text">bahwa berdasarkan pertimbangan sebagaimana dimaksud pada poin (b) dan poin (c) di atas perlu ditetapkan dengan Surat Keputusan Kepala Madrasah;</span>
                    </div>
                  </div>
                </div>
                <div class="sk-row mt-2">
                  <div class="sk-label">Mengingat</div>
                  <div class="sk-colon">:</div>
                  <div class="sk-content space-y-1">
                    <div class="sk-subitem"><span class="sk-num">1.</span><span class="sk-text">Undang – Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</span></div>
                    <div class="sk-subitem"><span class="sk-num">2.</span><span class="sk-text">Peraturan Pemerintah Nomor 19 Tahun 2005 tentang Standar Nasional Pendidikan sebagaimana telah diubah dengan Peraturan Pemerintah Nomor 32 Tahun 2015 dan Nomor 13 Tahun 2015 tentang Perubahan kedua Peraturan Pemerintah Nomor 19 Tahun 2005 Tentang Standar Nasional Pendidikan;</span></div>
                    <div class="sk-subitem"><span class="sk-num">3.</span><span class="sk-text">Peraturan Pemerintah Nomor 17 Tahun 2010 tentang Pengelolaan dan Penyelenggaraan Pendidikan sebagaimana telah diubah dengan Peraturan Pemerintah Nomor 66 Tahun 2010 tentang Pengelolaan dan Penyelenggaraan Pendidikan;</span></div>
                    <div class="sk-subitem"><span class="sk-num">4.</span><span class="sk-text">Permendiknas Nomor 19 Tahun 2007 tentang Standar Pengelolaan Pendidikan oleh Satuan Pendidikan Dasar dan Menengah;</span></div>
                    <div class="sk-subitem"><span class="sk-num">5.</span><span class="sk-text">Permendikbud Nomor 22 Tahun 2016 tentang Standar Proses Pendidikan Dasar dan Menengah;</span></div>
                    <div class="sk-subitem"><span class="sk-num">6.</span><span class="sk-text">Permendikbud Nomor 23 Tahun 2016 tentang Standar Penilaian Pendidikan;</span></div>
                    <div class="sk-subitem"><span class="sk-num">7.</span><span class="sk-text">Permendikbud Nomor 28 Tahun 2016 tentang Sistem Penjaminan Mutu Pendidikan Dasar dan Menengah;</span></div>
                  </div>
                </div>
              </div>

              <!-- PAGE 2 -->
              <div class="sk-page bg-white text-black relative">
                <div class="sk-row">
                  <div class="sk-label"></div>
                  <div class="sk-colon"></div>
                  <div class="sk-content space-y-1">
                    <div class="sk-subitem"><span class="sk-num">8.</span><span class="sk-text">Peraturan Menteri Agama No 90 Tahun 2013 Tentang penyelenggaraan Pendidikan madrasah sebagaimana telah diubah dengan PMA No. 60 Tahun 2015;</span></div>
                    <div class="sk-subitem"><span class="sk-num">9.</span><span class="sk-text">Peraturan Menteri Agama No 58 Tahun 2017 pasal 5 bahwa kepala madrasah bertanggung jawab Menyusun RKJM dan RKTM;</span></div>
                    <div class="sk-subitem"><span class="sk-num">10.</span><span class="sk-text">Rapat kerja Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir tanggal 20 desember 2023.</span></div>
                  </div>
                </div>
                <div class="sk-memutuskan">MEMUTUSKAN</div>
                <div class="space-y-2.5">
                  <div class="sk-row">
                    <div class="sk-label font-normal">Menetapkan</div>
                    <div class="sk-colon">:</div>
                    <div class="sk-content font-bold uppercase">KEPUTUSAN KEPALA MADRASAH IBTIDA'IYAH NAHDLATUL WATHAN PENYENGGIR TENTANG TIM PENJAMIN MUTU MADRASAH (TPM) MADRASAH IBTIDA'IYAH NAHDLATUL WATHAN PENYENGGIR TAHUN ANGGARAN {{ tahunAnggaranVal }}</div>
                  </div>
                  <div class="sk-row"><div class="sk-label font-normal">PERTAMA</div><div class="sk-colon">:</div><div class="sk-content">Membentuk Tim Penjamin Mutu Madrasah (TPM)</div></div>
                  <div class="sk-row"><div class="sk-label font-normal">KEDUA</div><div class="sk-colon">:</div><div class="sk-content">Nama – nama yang tercantum dalam lampiran surat keputusan ini sebagai Tim Penjamin Mutu Madrasah (TPM) Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir;</div></div>
                  <div class="sk-row"><div class="sk-label font-normal">KETIGA</div><div class="sk-colon">:</div><div class="sk-content">Tim Evaluasi Diri Madrasah dimaksud melaksanakan tugas – tugas sebagaimana tertuang pada lampiran surat keputusan ini;</div></div>
                  <div class="sk-row"><div class="sk-label font-normal">KEEMPAT</div><div class="sk-colon">:</div><div class="sk-content">Dalam melaksanakan tugasnya, Tim Penjamin Mutu Madrasah dimaksud bertanggung jawab kepada Kepala Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir;</div></div>
                  <div class="sk-row"><div class="sk-label font-normal">KELIMA</div><div class="sk-colon">:</div><div class="sk-content">Segala biaya yang timbul akibat Pelaksanaan Keputusan ini dibebankan pada Rencana Kegiatan Anggaran Madrasah (RKAM) Tahun {{ tahunAnggaranVal }};</div></div>
                  <div class="sk-row"><div class="sk-label font-normal">KEENAM</div><div class="sk-colon">:</div><div class="sk-content">Keputusan ini mulai berlaku sejak tanggal ditetapkan dengan ketentuan apabila dikemudian hari ternyata terdapat kekeliruan di dalam penetapannya akan diadakan perubahan dan perbaikan sebagaimana mestinya;</div></div>
                </div>
                <div class="sk-footer-flex">
                  <div class="sk-tembusan">
                    <div class="font-normal mb-1">Tembusan:</div>
                    <ol class="list-decimal list-inside space-y-0.5 pl-1">
                      <li>Kepala Kantor Kementerian Agama Kab/Kota Lombok Timur;</li>
                      <li>Ketua Yayasan Nurul Falah Penyenggir;</li>
                      <li>Pengawas Pembina;</li>
                      <li>Yang bersangkutan untuk diketahui dan dilaksanakan sebagaimana mestinya;</li>
                      <li>Arsip.</li>
                    </ol>
                  </div>
                  <div class="sk-ttd-box">
                    <div>Ditetapkan di Penyenggir</div>
                    <div>pada tanggal {{ tanggalSk }}</div>
                    <div class="mt-2 font-bold">Kepala Madrasah,</div>
                    <div class="sk-ttd-space"></div>
                    <div class="sk-ttd-nama">{{ namaKepala }}</div>
                  </div>
                </div>
              </div>

              <!-- PAGE 3 -->
              <div class="sk-page bg-white text-black relative">
                <div class="sk-lampiran-header">
                  <div class="sk-lampiran-row"><span class="sk-lampiran-lbl">Lampiran I</span><span class="sk-lampiran-col">:</span><span>Keputusan Kepala Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir</span></div>
                  <div class="sk-lampiran-row"><span class="sk-lampiran-lbl">Nomor</span><span class="sk-lampiran-col">:</span><span>{{ nomorSk }}</span></div>
                  <div class="sk-lampiran-row"><span class="sk-lampiran-lbl">Tanggal</span><span class="sk-lampiran-col">:</span><span>{{ tanggalSk }}</span></div>
                  <div class="sk-lampiran-row"><span class="sk-lampiran-lbl">Tentang</span><span class="sk-lampiran-col">:</span><span>Pembentukan Tim Penjamin Mutu Madrasah (TPM).</span></div>
                </div>
                <div class="sk-lampiran-title">
                  <div>TIM PENJAMIN MUTU MADRASAH (TPM)</div>
                  <div>TAHUN ANGGARAN {{ tahunAnggaranVal }}</div>
                </div>
                <div class="my-6">
                  <table class="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr class="bg-gray-100 font-bold text-center border-b border-black">
                        <th class="border border-black px-3 py-2 w-12 text-center">NO</th>
                        <th class="border border-black px-3 py-2 text-left">NAMA</th>
                        <th class="border border-black px-3 py-2 text-left">BAGIAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="tpmTableData.length === 0">
                        <td colspan="3" class="border border-black px-3 py-4 text-center text-gray-500 italic">
                          Belum ada anggota tim yang ditambahkan
                        </td>
                      </tr>
                      <tr v-else v-for="item in tpmTableData" :key="item.no">
                        <td class="border border-black px-3 py-2 text-center">{{ item.no }}</td>
                        <td class="border border-black px-3 py-2 font-semibold">{{ item.nama }}</td>
                        <td class="border border-black px-3 py-2">{{ item.bagian }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="flex justify-end mt-12">
                  <div class="sk-ttd-box">
                    <div>Kepala Madrasah,</div>
                    <div class="sk-ttd-space"></div>
                    <div class="sk-ttd-nama">{{ namaKepala }}</div>
                  </div>
                </div>
              </div>

              <!-- PAGE 4 -->
              <div class="sk-page bg-white text-black relative">
                <div class="sk-lampiran-header">
                  <div class="sk-lampiran-row"><span class="sk-lampiran-lbl">Lampiran II</span><span class="sk-lampiran-col">:</span><span>Keputusan Kepala Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir</span></div>
                  <div class="sk-lampiran-row"><span class="sk-lampiran-lbl">Nomor</span><span class="sk-lampiran-col">:</span><span>{{ nomorSk }}</span></div>
                  <div class="sk-lampiran-row"><span class="sk-lampiran-lbl">Tanggal</span><span class="sk-lampiran-col">:</span><span>{{ tanggalSk }}</span></div>
                  <div class="sk-lampiran-row"><span class="sk-lampiran-lbl">Tentang</span><span class="sk-lampiran-col">:</span><span>Pembentukan Tim Penjamin Mutu Madrasah (TPM).</span></div>
                </div>
                <div class="sk-lampiran-title">
                  <div>Uraian tugas Tim Penjamin Mutu Madrasah (TPM)</div>
                  <div>Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir</div>
                </div>
                <div class="space-y-2.5 text-justify">
                  <div class="sk-subitem"><span class="sk-num">1.</span><span class="sk-text">TPM Melakukan analisis terhadaap indikator pada setiap aspek budaya mutu madrasah</span></div>
                  <div class="sk-subitem"><span class="sk-num">2.</span><span class="sk-text">TPM mengumpulkan data, informasi dan bukti fisik dari berbagai sumber yang relevan untuk dasar penilaian indikator yang ada dalam Instrumen</span></div>
                  <div class="sk-subitem"><span class="sk-num">3.</span><span class="sk-text">TPM mendiskusikan dan menetapkan level setiap indikator berdasarkan data, informasi dan bukti fisik</span></div>
                  <div class="sk-subitem"><span class="sk-num">4.</span><span class="sk-text">TPM dan TIM dibantu oleh operator madrasah mengisi instrumen yang tersedia secara online atau semi online berdasarkan data, informasi dan bukti fisik yang dikumpulkan;</span></div>
                  <div class="sk-subitem"><span class="sk-num">5.</span><span class="sk-text">TPM mengirim hasil pengisian EDM yang sudah disetujui oleh Kepala Madrasah;</span></div>
                  <div class="sk-subitem"><span class="sk-num">6.</span><span class="sk-text">TPM melakukan rapat penentuan rencana kegiatan sesuai dengan hasil isian pada EDM;</span></div>
                  <div class="sk-subitem"><span class="sk-num">7.</span><span class="sk-text">TPM melakukan distribusi penugasan penanggung jawab indikator dan penanggung jawab kegiatan;</span></div>
                  <div class="sk-subitem"><span class="sk-num">8.</span><span class="sk-text">TPM melakukan distribusi rencana pendanaan pengembangan dan operasional;</span></div>
                  <div class="sk-subitem"><span class="sk-num">9.</span><span class="sk-text">TPM Menyusun RKAM berdasarkan skala prioritas indikator yang belum memenuhi acuan yang ditetapkan;</span></div>
                </div>
                <div class="flex justify-end mt-16">
                  <div class="sk-ttd-box">
                    <div>Kepala Madrasah,</div>
                    <div class="sk-ttd-space"></div>
                    <div class="sk-ttd-nama">{{ namaKepala }}</div>
                  </div>
                </div>
              </div>
            </div>
          </PrintButton>
          <UiBaseButton :text="isSaving ? 'Menyimpan...' : 'Simpan'" title="Simpan pembagian guru ke dalam bagian EDM"
            :loading="isSaving" :disabled="isSaving" @click="handleSave">
            <template #icon>
              <Save class="w-4 h-4" />
            </template>
          </UiBaseButton>
        </template>
      </UiPageHeader>

      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <!-- Card Pengaturan Metadata SK -->
        <div class="mb-6 rounded-xl p-4 sm:p-5 theme-bg-card border theme-border">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold flex items-center gap-2 theme-text-heading">
              <FileText class="w-4 h-4 text-emerald-500" />
              Pengaturan Dokumen SK
            </h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label class="block font-medium mb-1 theme-text-muted">Nomor SK</label>
              <input v-model="nomorSk"
                class="w-full rounded-lg px-3 py-2 text-sm border theme-bg-secondary theme-text theme-border focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
            </div>
            <div>
              <label class="block font-medium mb-1 theme-text-muted">Tanggal SK</label>
              <input v-model="tanggalSk"
                class="w-full rounded-lg px-3 py-2 text-sm border theme-bg-secondary theme-text theme-border focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
            </div>
            <div>
              <label class="block font-medium mb-1 theme-text-muted">Nama Kepala Madrasah</label>
              <input v-model="namaKepala"
                class="w-full rounded-lg px-3 py-2 text-sm border theme-bg-secondary theme-text theme-border focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
            </div>
          </div>
        </div>

        <!-- Guru Belum Diassign -->
        <div class="mb-6 rounded-xl p-4 sm:p-5 theme-bg-card border theme-border">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold flex items-center gap-2 theme-text-heading">
              <UserPlus class="w-4 h-4 text-amber-500" />
              Guru Belum Masuk Bagian
              <span class="text-xs font-normal px-2 py-0.5 rounded-full theme-bg-secondary theme-text-muted">
                {{ unassignedGuru.length }}
              </span>
            </h2>
          </div>
          <div v-if="unassignedGuru.length === 0" class="text-sm py-4 text-center theme-text-muted">
            Semua guru sudah masuk bagian ✓
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <div v-for="guru in unassignedGuru" :key="guru.id" draggable="true" @dragstart="onDragStart($event, guru)"
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-sm select-none theme-bg-secondary theme-text theme-border border">
              <GripVertical class="w-3 h-3 opacity-40" />
              {{ guru.nama_lengkap }}
            </div>
          </div>
        </div>

        <!-- 5 Bagian Grid — 1 col mobile, 2 col md, 3 col lg -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="b in localBagian" :key="b.nama_bagian" @dragover.prevent @drop="onDrop($event, b)"
            @dragenter="dragOverBagian = b.nama_bagian" @dragleave="dragOverBagian = null"
            class="rounded-xl p-4 transition-all min-h-[200px] flex flex-col theme-bg-card border theme-border"
            :class="dragOverBagian === b.nama_bagian ? 'ring-2 ring-emerald-500/50 shadow-lg' : ''">
            <!-- Bagian Header -->
            <div class="flex items-start justify-between gap-2 mb-2">
              <span
                class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0"
                :class="bagianColor(b.nama_bagian)">
                Bagian {{ b.nama_bagian }}
              </span>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full theme-bg-secondary theme-text-muted">
                {{ b.gtk_ids.length }} guru
              </span>
            </div>

            <p class="text-xs font-semibold mb-3 leading-relaxed theme-text-heading">
              {{ getBagianTitle(b.nama_bagian) }}
            </p>

            <!-- Daftar Anggota -->
            <div class="space-y-1.5 flex-1">
              <div v-for="gtkId in b.gtk_ids" :key="gtkId"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm group transition-colors theme-bg-secondary">
                <span class="truncate theme-text">{{ getGuruName(gtkId) }}</span>
                <button @click="removeFromBagian(b, gtkId)"
                  class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all p-0.5 shrink-0"
                  title="Hapus dari bagian">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Drop zone placeholder -->
            <div v-if="b.gtk_ids.length === 0"
              class="flex flex-col items-center justify-center py-6 text-center rounded-lg border-2 border-dashed mt-3 theme-border theme-text-muted">
              <UserPlus class="w-5 h-5 mb-1.5 opacity-40" />
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
import { Save, UserPlus, GripVertical, X, FileText } from "lucide-vue-next";
import KopSurat from "~/components/document/KopSurat.vue";
import PrintButton from "~/components/ui/PrintButton.vue";

const {
  isLoading, isSaving, selectedTahunId, listTahun, selectedTahunLabel,
  fetchTahunAnggaran, fetchBagian, saveBagian,
} = useEdm();

const allGuru = ref([]);
const localBagian = ref([]);
const dragOverBagian = ref(null);
const dragData = ref(null);

// SK Metadata Editable State
const nomorSk = ref("077/MI-B/615/XII/2023");
const tanggalSk = ref("23 Desember 2023");
const namaKepala = ref("ABDUL HALIM, S.Pd.I");

const BAGIAN_NAMES = ["A", "B", "C", "D", "E"];

const BAGIAN_TITLE_MAP = {
  A: "Kedisiplinan",
  B: "Pengembangan Diri",
  C: "Proses Pembelajaran",
  D: "Sarana dan Prasarana",
  E: "Pembiayaan",
};

const bagianColor = (name) => {
  const colors = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return colors[name] || "bg-zinc-600";
};

const getBagianTitle = (code) => {
  const meta = EDM_BAGIAN_LIST.find((m) => m.code === code);
  return meta ? meta.name : `Bagian ${code}`;
};

const tahunAnggaranVal = computed(() => {
  const t = listTahun.value.find((t) => t.id === selectedTahunId.value);
  return t ? t.tahun : new Date().getFullYear();
});

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

// Bagian Anggota Helper for SK Lampiran I (semua anggota tanpa koordinator)
const getBagianSemuaAnggota = (code) => {
  const b = localBagian.value.find((item) => item.nama_bagian === code);
  if (!b || !b.gtk_ids || b.gtk_ids.length === 0) return [];
  return b.gtk_ids.map((id) => getGuruName(id));
};

const tpmTableData = computed(() => {
  const list = [];
  let no = 1;
  BAGIAN_NAMES.forEach((code) => {
    const anggotaList = getBagianSemuaAnggota(code);
    const bagianName = BAGIAN_TITLE_MAP[code] || `Bagian ${code}`;
    if (anggotaList.length > 0) {
      anggotaList.forEach((nama) => {
        list.push({
          no: no++,
          nama,
          bagian: bagianName,
        });
      });
    }
  });
  return list;
});

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
  localBagian.value.forEach((item) => {
    item.gtk_ids = item.gtk_ids.filter((id) => id !== gtkId);
  });
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

const loadData = async () => {
  if (!selectedTahunId.value) return;
  try {
    const gtkData = await fetchFromApi("DataGtk");
    allGuru.value = Array.isArray(gtkData) ? gtkData : [];
  } catch {
    allGuru.value = [];
  }
  const bagianData = await fetchBagian(selectedTahunId.value);
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

<style scoped>
/* SK Preview (screen) */
.sk-page {
  width: 210mm;
  min-height: 297mm;
  padding: 15mm 20mm;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  color: #000;
  background: #fff;
  box-sizing: border-box;
  line-height: 1.4;
}

.sk-title-block {
  text-align: center;
  margin: 16px 0;
}

.sk-title {
  font-size: 12pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sk-subtitle {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
}

.sk-nomor {
  font-size: 11pt;
  font-weight: bold;
  margin: 2px 0;
}

.sk-tentang {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  margin-top: 10px;
}

.sk-kegiatan {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  margin-top: 2px;
}

.sk-rahmat {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  margin-top: 14px;
}

.sk-kepala-head {
  font-size: 11pt;
  font-weight: bold;
  margin-top: 10px;
}

.sk-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  text-align: justify;
  font-size: 11pt;
}

.sk-label {
  width: 100px;
  flex-shrink: 0;
  font-weight: normal;
}

.sk-colon {
  width: 16px;
  flex-shrink: 0;
}

.sk-content {
  flex: 1;
}

.sk-subitem {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
  font-size: 11pt;
}

.sk-num {
  width: 22px;
  flex-shrink: 0;
}

.sk-text {
  flex: 1;
}

.sk-memutuskan {
  text-align: center;
  font-weight: bold;
  font-size: 11pt;
  text-transform: uppercase;
  margin: 16px 0;
  letter-spacing: 1px;
}

.sk-footer-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 32px;
  font-size: 11pt;
}

.sk-tembusan {
  font-size: 11pt;
}

.sk-tembusan ol {
  margin-left: 16px;
}

.sk-ttd-box {
  text-align: center;
  min-width: 220px;
  font-size: 11pt;
}

.sk-ttd-space {
  height: 75px;
}

.sk-ttd-nama {
  font-weight: bold;
  text-decoration: underline;
}

.sk-lampiran-header {
  font-size: 11pt;
  margin-bottom: 16px;
  line-height: 1.5;
}

.sk-lampiran-row {
  display: flex;
}

.sk-lampiran-lbl {
  width: 100px;
  flex-shrink: 0;
}

.sk-lampiran-col {
  width: 12px;
  flex-shrink: 0;
}

.sk-lampiran-title {
  text-align: center;
  font-weight: bold;
  font-size: 11pt;
  text-transform: uppercase;
  margin-bottom: 24px;
  line-height: 1.4;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 15mm 20mm;
  }

  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background: white !important;
  }

  .sk-page {
    width: 100% !important;
    min-height: 265mm !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
    page-break-after: always !important;
    break-after: page !important;
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 11pt !important;
    color: #000 !important;
    background: #fff !important;
  }

  .sk-page:last-child {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
}
</style>
