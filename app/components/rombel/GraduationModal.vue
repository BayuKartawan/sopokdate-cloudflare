<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
        @click.self="$emit('close')">
        <!-- Modal Content -->
        <div
          class="relative w-full max-w-md flex flex-col rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <!-- Header -->
          <div
            class="flex items-center justify-between px-5 py-4 sm:px-6 border-b border-zinc-700/50 bg-zinc-800/30 shrink-0">
            <div class="flex items-center gap-3 text-indigo-400">
              <GraduationCap class="w-5 h-5" />
              <h3 class="text-base sm:text-lg font-semibold text-zinc-100">
                Proses Kelulusan Siswa
              </h3>
            </div>
            <button @click="$emit('close')"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 px-5 py-4 sm:px-6 sm:py-5 space-y-5">
            <div class="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-lg">
              <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Anda akan meluluskan
                <strong class="text-white">{{ selectedCount }}</strong>
                siswa terpilih dari Rombel
                <strong class="text-indigo-300">{{ rombelNama }}</strong>.
                Data siswa akan dipindahkan ke tabel Alumni.
              </p>
            </div>

            <!-- Input Tahun Lulus -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-zinc-400">
                Tahun Kelulusan <span class="text-red-400">*</span>
              </label>
              <input v-model="gradYear" type="text" placeholder="Contoh: 2026"
                class="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-600" />
            </div>

            <!-- Input Studi Lanjut -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-zinc-400">
                Studi Lanjut (Melanjutkan Ke)
              </label>
              <input v-model="gradDestination" type="text" placeholder="Contoh: MTs NW Penyenggir atau SMP"
                class="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-600" />
              <!-- Quick Suggestions -->
              <div class="flex flex-wrap gap-2 pt-1">
                <button v-for="sug in suggestions" :key="sug" type="button" @click="gradDestination = sug"
                  class="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-[11px] font-medium text-zinc-300 transition-colors whitespace-nowrap">
                  {{ sug }}
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex flex-col sm:flex-row items-center justify-end gap-3 px-5 py-4 sm:px-6 border-t border-zinc-700/50 bg-zinc-800/30 shrink-0">
            <button type="button" @click="$emit('close')"
              class="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors">
              Batal
            </button>
            <button @click="$emit('confirm', { gradYear, gradDestination })" :disabled="!gradYear || isLoading"
              class="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-900/20">
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
              <span>Konfirmasi Kelulusan</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { GraduationCap, X, Loader2 } from "lucide-vue-next";

interface ConfirmPayload {
  gradYear: string;
  gradDestination: string;
}

const props = defineProps({
  show: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  selectedCount: { type: Number, default: 0 },
  rombelNama: { type: String, default: "" },
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", payload: ConfirmPayload): void;
}>();

const gradYear = ref<string>(new Date().getFullYear().toString());
const gradDestination = ref<string>("");

const suggestions: string[] = ["MTs NW Penyenggir", "SMP", "MTs", "Tidak Melanjutkan"];

// Reset form when modal opens
watch(() => props.show, (val: boolean) => {
  if (val) {
    gradYear.value = new Date().getFullYear().toString();
    gradDestination.value = "";
  }
});
</script>
