<template>
  <a
    v-if="href || isApiTo"
    :href="href || (typeof to === 'string' ? to : '')"
    :target="target || '_blank'"
    rel="noopener noreferrer"
    :class="classes"
    :title="title"
    :style="styleVars"
  >
    <component :is="loadingIcon" v-if="loading" class="animate-spin flex-shrink-0" :class="iconSize" />
    <slot v-else name="icon" />
    <span v-if="!iconOnly" class="leading-none">{{ text }}</span>
  </a>

  <NuxtLink
    v-else-if="to"
    :to="to"
    :class="classes"
    :title="title"
    :style="styleVars"
  >
    <component :is="loadingIcon" v-if="loading" class="animate-spin flex-shrink-0" :class="iconSize" />
    <slot v-else name="icon" />
    <span v-if="!iconOnly" class="leading-none">{{ text }}</span>
  </NuxtLink>

  <button
    v-else
    :disabled="disabled || loading"
    :title="title"
    :class="classes"
    :style="styleVars"
    v-bind="$attrs"
  >
    <component :is="loadingIcon" v-if="loading" class="animate-spin flex-shrink-0" :class="iconSize" />
    <slot v-else name="icon" />
    <span v-if="!iconOnly" class="leading-none">{{ text }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { Loader2 } from "lucide-vue-next";

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
  to: {
    type: [String, Object] as PropType<RouteLocationRaw | null>,
    default: null,
  },
  href: {
    type: String,
    default: null,
  },
  target: {
    type: String,
    default: undefined,
  },
  title: {
    type: String,
    default: undefined,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /**
   * "default" | "icon"
   * "icon" = hanya tampilkan ikon, tanpa teks (padding dikecilkan)
   */
  iconOnly: {
    type: Boolean,
    default: false,
  },
  /**
   * "sm" | "md" (default)
   */
  size: {
    type: String as PropType<"sm" | "md">,
    default: "md",
  },
  /**
   * "default" mengikuti CSS variable tema
   * Tambah variant lain di sini jika dibutuhkan nanti
   */
  variant: {
    type: String as PropType<"default">,
    default: "default",
  },
});

const isApiTo = computed(() => {
  if (typeof props.to === "string") {
    return props.to.startsWith("/api/") || props.to.startsWith("http");
  }
  return false;
});

const loadingIcon = Loader2;

const iconSize = computed(() => (props.size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"));

const classes = computed(() => [
  "inline-flex items-center justify-center gap-2 border rounded-md text-sm font-medium transition-all duration-200",
  "hover:translate-y-[1px] focus:ring-1 focus:ring-zinc-500 focus:ring-offset-1",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  props.iconOnly
    ? props.size === "sm"
      ? "p-1.5"
      : "p-2"
    : props.size === "sm"
      ? "h-8 px-2"
      : "h-9 px-3",
]);

const styleVars = {
  backgroundColor: "var(--bg-secondary)",
  borderColor: "var(--border-primary)",
  color: "var(--text-primary)",
};

const route = useRoute();
const isActive = computed((): boolean => {
  if (!props.to) return false;
  const toPath =
    typeof props.to === "string"
      ? props.to
      : (props.to as { path?: string }).path || "";
  return route.path === toPath;
});
</script>
