<template>
  <li
    class="cursor-pointer rounded-lg border p-4 transition-colors duration-150 shadow-sm bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-700/50"
  >
    <div class="flex items-center gap-3">
      <!-- Icon -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-700/50 text-emerald-400"
        @click="$emit('click', item)"
      >
        <UserCircle class="w-5 h-5" />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0" @click="$emit('click', item)">
        <h3 class="font-medium text-base truncate text-zinc-100">
          {{ toTitleCase(title) }}
        </h3>
        <p class="text-sm truncate text-zinc-400">
          {{ subtitle }}
        </p>
      </div>

      <ChevronRight
        class="w-4 h-4 text-zinc-600"
        @click="$emit('click', item)"
      />
    </div>
  </li>
</template>

<script setup>
import { UserCircle, ChevronRight } from "lucide-vue-next";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  // Teks utama (nama). Jika tidak diberikan, fallback ke item.title atau item.nama
  title: {
    type: String,
    default: "",
  },
  // Teks sekunder (tugas, NISN, kelas, dll)
  subtitle: {
    type: String,
    default: "",
  },
});

defineEmits(["click"]);

const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};
</script>
