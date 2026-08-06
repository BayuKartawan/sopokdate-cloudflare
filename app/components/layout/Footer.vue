<template>
  <footer class="mt-12" :style="{ color: 'var(--text-primary)' }">
    <div class="mx-auto max-w-7xl px-6">
      <div class="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16 pt-3 py-14 border-t"
        :style="{ borderColor: 'var(--border-primary)' }">
        <!-- Kolom 1: Logo -->
        <div class="flex justify-center items-center md:justify-start md:items-start">
          <div
            class="w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center transition-colors duration-300 group">
            <LogoSopokdate
              class="w-full h-full md:p-3 transition-colors duration-300 text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
          </div>
        </div>

        <!-- Kolom 2: Copyright dan Info -->
        <div class="flex flex-col items-center lg:items-end justify-center ">
          <!-- Copyright -->
          <div class="space-y-2 text-center lg:text-right">
            <p class="text-sm transition-colors duration-300" :style="{ color: 'var(--text-secondary)' }">
              © 2024-{{ new Date().getFullYear() }} Sopokdate. All rights
              reserved.
            </p>
            <p class="text-xs transition-colors duration-300" :style="{ color: 'var(--text-muted)' }">
              Dibuat dengan ❤️ oleh
              <a href="https://www.instagram.com/blim.bink/" target="_blank"
                class="font-semibold transition-colors duration-300 hover:underline text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300">
                Bayu Kartawan
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import LogoSopokdate from "~/assets/logo-sopokdate.vue";
</script>
