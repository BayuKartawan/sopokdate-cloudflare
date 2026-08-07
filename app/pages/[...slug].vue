<template>
  <div class="min-h-screen flex items-center justify-center px-6"
    :style="{ backgroundColor: 'var(--bg-primary)' }">
    <div class="text-center max-w-sm mx-auto">

      <!-- 404 -->
      <p class="text-7xl font-black tracking-tighter mb-2 select-none"
        :style="{ color: 'var(--text-faint)' }">
        404
      </p>

      <!-- Divider -->
      <div class="w-12 h-px mx-auto mb-6 rounded-full"
        :style="{ backgroundColor: 'var(--border-secondary)' }"></div>

      <!-- Heading -->
      <h1 class="text-xl font-semibold mb-2"
        :style="{ color: 'var(--text-heading)' }">
        Halaman Tidak Ditemukan
      </h1>

      <!-- Description -->
      <p class="text-sm leading-relaxed mb-8"
        :style="{ color: 'var(--text-muted)' }">
        Halaman yang kamu cari tidak tersedia atau mungkin sudah dipindahkan.
      </p>

      <!-- Actions -->
      <div class="flex items-center justify-center gap-3">
        <UiBaseButton text="Beranda" to="/">
          <template #icon>
            <Home class="w-4 h-4" stroke-width="2" />
          </template>
        </UiBaseButton>

        <UiBaseButton text="Kembali" @click="goBack">
          <template #icon>
            <ArrowLeft class="w-4 h-4" stroke-width="2" />
          </template>
        </UiBaseButton>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { Home, ArrowLeft } from "lucide-vue-next";

definePageMeta({
  layout: "auth",
  requiresAuth: false,
});

const router = useRouter();

const goBack = (): void => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push("/");
  }
};
</script>
