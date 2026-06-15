<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="[
      'flex items-center justify-center gap-2 border px-3 py-1.5 rounded-md text-sm',
      'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:translate-y-[1px] focus:ring-1 focus:ring-zinc-500 focus:ring-offset-1 focus:ring-offset-zinc-900',
      { 'router-link-active': isActive },
    ]"
  >
    <slot name="icon" />
    <span>{{ text }}</span>
  </NuxtLink>
  <button
    v-else
    :class="[
      'flex items-center justify-center gap-2 border px-3 py-1.5 rounded-md text-sm',
      'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:translate-y-[1px] focus:ring-1 focus:ring-zinc-500 focus:ring-offset-1 focus:ring-offset-zinc-900',
    ]"
  >
    <slot name="icon" />
    <span>{{ text }}</span>
  </button>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  to: {
    type: [String, Object],
    default: null,
  },
});

const route = useRoute();
const isActive = computed(() => {
  if (!props.to) return false;
  const toPath = typeof props.to === "string" ? props.to : props.to.path || "";
  return route.path === toPath;
});
</script>
