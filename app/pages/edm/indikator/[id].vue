<template>
  <EdmIndikatorForm
    :is-edit="true"
    :indikator-id="indikatorId"
    :is-loading="isLoading"
    :is-fetching-item="isFetchingItem"
    :is-saving="isSaving"
    :initial-form="formItem"
    :initial-pilihan="formPilihan"
    @save="handleSave"
  />
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useEdm } from "~/composables/edm/useEdm";
import { useNotiflix } from "~/composables/ui/useFeedback";

const route = useRoute();
const router = useRouter();
const { Notify } = useNotiflix();
const {
  isLoading, isSaving, selectedTahunId,
  fetchTahunAnggaran, fetchIndikator, updateIndikator,
} = useEdm();

const isFetchingItem = ref(true);

const indikatorId = computed(() => {
  return parseInt(route.params.id);
});

const formItem = reactive({
  bagian_target:      "A",
  nomor_urut:          1,
  pertanyaan:         "",
  bukti_yang_diminta: "",
});

const formPilihan = ref([
  { skor: 1, label: "Kurang" },
  { skor: 2, label: "Cukup" },
  { skor: 3, label: "Baik" },
  { skor: 4, label: "Sangat Baik" },
]);

const handleSave = async ({ formItem: submittedForm, formPilihan: submittedPilihan }) => {
  if (!submittedForm.pertanyaan.trim()) {
    Notify?.failure?.("Pertanyaan indikator wajib diisi");
    return;
  }
  if (!indikatorId.value) {
    Notify?.failure?.("ID Indikator tidak valid");
    return;
  }

  const payload = {
    tahun_anggaran_id: selectedTahunId.value,
    ...submittedForm,
    kelompok_target: submittedForm.bagian_target,
    pilihan: JSON.stringify(submittedPilihan),
  };

  const ok = await updateIndikator(indikatorId.value, payload);
  if (ok) {
    router.push("/edm/indikator");
  }
};

onMounted(async () => {
  isFetchingItem.value = true;
  await fetchTahunAnggaran();

  if (selectedTahunId.value && indikatorId.value) {
    const list = await fetchIndikator(selectedTahunId.value);
    const target = list.find((i) => i.id === indikatorId.value);

    if (target) {
      Object.assign(formItem, {
        bagian_target:      target.bagian_target || target.kelompok_target || "A",
        nomor_urut:          target.nomor_urut,
        pertanyaan:          target.pertanyaan || "",
        bukti_yang_diminta:  target.bukti_yang_diminta || "",
      });

      if (Array.isArray(target.pilihan) && target.pilihan.length > 0) {
        formPilihan.value = target.pilihan.map((p) => ({ ...p }));
      }
    } else {
      Notify?.failure?.("Indikator tidak ditemukan");
      router.push("/edm/indikator");
    }
  }
  isFetchingItem.value = false;
});
</script>
