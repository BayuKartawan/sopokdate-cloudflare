<template>
  <EdmIndikatorForm
    :is-edit="false"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :initial-form="formItem"
    @save="handleSave"
  />
</template>

<script setup>
import { reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useEdm } from "~/composables/edm/useEdm";
import { useNotiflix } from "~/composables/ui/useFeedback";

const route = useRoute();
const router = useRouter();
const { Notify } = useNotiflix();
const {
  isLoading, isSaving, selectedTahunId,
  fetchTahunAnggaran, fetchIndikator, saveIndikator,
} = useEdm();

const formItem = reactive({
  bagian_target:      "A",
  nomor_urut:          1,
  pertanyaan:         "",
  bukti_yang_diminta: "",
});

const handleSave = async ({ formItem: submittedForm, formPilihan: submittedPilihan }) => {
  if (!submittedForm.pertanyaan.trim()) {
    Notify?.failure?.("Pertanyaan indikator wajib diisi");
    return;
  }
  if (!selectedTahunId.value) {
    Notify?.failure?.("Tahun anggaran belum dipilih");
    return;
  }

  const payload = {
    tahun_anggaran_id: selectedTahunId.value,
    ...submittedForm,
    kelompok_target: submittedForm.bagian_target,
    pilihan: JSON.stringify(submittedPilihan),
  };

  const ok = await saveIndikator(payload);
  if (ok) {
    router.push("/edm/indikator");
  }
};

onMounted(async () => {
  await fetchTahunAnggaran();

  if (route.query.tahun_id) {
    selectedTahunId.value = parseInt(route.query.tahun_id);
  }
  if (route.query.bagian) {
    formItem.bagian_target = route.query.bagian.toString().toUpperCase();
  }

  if (selectedTahunId.value) {
    const existingList = await fetchIndikator(selectedTahunId.value, formItem.bagian_target);
    formItem.nomor_urut = existingList.length + 1;
  }
});
</script>
