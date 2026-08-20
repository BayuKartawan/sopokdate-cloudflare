<!-- app/components/ui/PageHeader.vue -->
<template>
  <div class="mb-5 rounded-xl border theme-bg-secondary theme-border">

    <!-- Breadcrumb (di dalam container, di atas) -->
    <nav
      v-if="breadcrumbs && breadcrumbs.length"
      class="flex items-center justify-center gap-1 text-xs theme-text-muted flex-wrap px-4 py-2 border-b theme-border rounded-t-xl"
    >
      <template v-for="(crumb, i) in breadcrumbs" :key="i">
        <NuxtLink
          v-if="crumb.to"
          :to="crumb.to"
          class="hover:text-emerald-500 transition-colors"
        >{{ crumb.label }}</NuxtLink>
        <span v-else class="theme-text-secondary font-medium">{{ crumb.label }}</span>
        <span v-if="i < breadcrumbs.length - 1" class="text-[var(--text-faint)]">/</span>
      </template>
    </nav>

    <!-- Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3">
      <h1 class="text-xl font-semibold text-center sm:text-left theme-text-heading truncate">
        {{ title }}
      </h1>

      <div
        v-if="$slots.actions || $slots.leading"
        class="flex items-center justify-center sm:justify-end gap-2 flex-wrap [&>*]:flex-1 [&>*]:sm:flex-none"
      >
        <slot name="actions" />
        <div v-if="$slots.leading" class="flex-shrink-0">
          <slot name="leading" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
interface Breadcrumb {
  label: string;
  to?: string;
}

defineProps<{
  title: string;
  breadcrumbs?: Breadcrumb[];
}>();
</script>
