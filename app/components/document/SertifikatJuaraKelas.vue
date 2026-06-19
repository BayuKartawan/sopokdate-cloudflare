<template>
  <div
    id="sertifikat-wrapper"
    class="w-[297mm] h-[210mm] py-32 px-34 text-black font-arial text-center blangko"
  >
    <!-- kop surat -->
    <KopSurat />

    <!-- BODY -->
    <div class="mt-3">
      <div class="text-[24pt]">
        <span
          class="border-b-2 border-sky-950 text-sky-950 text-4xl rounded_sans_serif_7"
          >PIAGAM PENGHARGAAN</span
        >
      </div>
      <!-- no surat -->
      <div class="flex justify-center h-4 w-93 mx-auto gap-1">
        <p class="text-base">No :</p>
        <p class="text-base">{{ nomor }}</p>
      </div>

      <p class="mt-4 text-base">Piagam ini diberikan kepada:</p>
      <h2 class="text-[34pt] Mikalea text-emerald-900 underline">
        {{ formattedNamaLengkap }}
      </h2>

      <p class="text-base">( NISN. {{ nisn }} )</p>

      <p class="text-base mt-2">
        Atas keberhasilannya meraih Peringkat {{ juara }} Pada
        {{ displayKelas }} Semester {{ currentSemester }} <br />
        Tahun Pelajaran {{ currentAcademicYear }}
      </p>
    </div>

    <!-- FOOTER -->
    <div class="flex justify-between items-end">
      <!-- TTD -->
      <div class="flex-1 text-left">
        <p class="mt-4">Penyenggir, {{ formattedDate }}</p>
        <!-- flex horizontal -->
        <div class="flex justify-left gap-2">
          <div class="flex-1 flex flex-col items-start text-left">
            <p class="text-base">Kepala Madrasah</p>
            <p class="font-bold mt-21 text-base">ABDUL HALIM, S.Pd.I.</p>
          </div>

          <div class="flex-1 flex flex-col items-start text-left">
            <p class="text-base">Wali {{ displayKelas }}</p>
            <p class="font-bold mt-21">{{ wali_kelas }}</p>
          </div>
        </div>
      </div>

      <div class="flex justify-center items-center gap-2 mb-2">
        <!-- rangking -->
        <div
          class="border-2 border-emerald-900 flex flex-col h-[120px] text-emerald-900 w-[100px]"
        >
          <div class="flex-1 flex items-center justify-center">
            <span class="font-bold text-8xl Mikalea">{{ juara }}</span>
          </div>
          <div
            class="flex items-center justify-center border-t-2 border-emerald-900 bg-emerald-900 text-white"
          >
            <span class="text-[10px]">PERINGKAT</span>
          </div>
        </div>

        <!-- qrcode -->
        <div v-if="verifikasi" class="border-2 border-sky-900">
          <QrcodeVue
            :value="qrValue"
            :size="100"
            render-as="svg"
            :foreground="'#0c4a6e'"
            class="p-2"
          />
          <div
            class="flex items-center justify-center border-t-2 border-sky-900 bg-sky-900 text-white"
          >
            <span class="text-[10px]">VERIFIKASI</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import QrcodeVue from "qrcode.vue";
import KopSurat from "./KopSurat.vue";
import { useAcademicYear } from "~/composables/utils/useAcademicYear";
import { ref, computed, onMounted } from "vue";
import { formatTanggalIndo } from "~/utils/date";
import { useTableData } from "~/composables/data/useTableData";

const { currentAcademicYear, currentSemester } = useAcademicYear();

const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();

// Map kelas ID to its details
const kelasMap = computed(() => {
  const map = {};
  if (Array.isArray(dataKelas.value)) {
    dataKelas.value.forEach((k) => {
      if (k.idKelas) {
        map[k.idKelas] = k;
      }
    });
  }
  return map;
});

const displayKelas = computed(() => {
  if (!props.kelas) return "-";
  const classInfo = kelasMap.value[props.kelas];
  return classInfo ? classInfo.namaKelas : props.kelas;
});

const formattedDate = computed(() => {
  return formatTanggalIndo(props.date);
});

const props = defineProps({
  nama_lengkap: String,
  nisn: [String, Number],
  juara: String,
  kelas: String,
  date: String,
  nomor: String,
  wali_kelas: String,
  verifikasi: String,
});

// Format QR Code value
const qrValue = computed(() => {
  const nama = props.nama_lengkap || "";
  const link = "https://minwpenyenggir.vercel.app/verif-sertifikat";
  const kode = props.verifikasi || "";
  return `Nama Siswa: ${nama}\nLink Verifikasi: ${link}\nKode Verif: ${kode}`;
});

// Format nama lengkap ke title case
const formattedNamaLengkap = computed(() => {
  return (props.nama_lengkap || "")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
});

onMounted(() => {
  loadDataKelas("DataKelas");
});
</script>

<style scoped>
.blangko {
  background-image: url("/assets/images/blangko-piagam.svg");
  background-size: cover;
  /* atau contain */
  background-repeat: no-repeat;
  background-position: center;
}
</style>
