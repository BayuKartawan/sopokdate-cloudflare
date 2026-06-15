<template>
  <footer class="mt-12 text-zinc-100">
    <div class="mx-auto max-w-7xl px-6">
      <div
        class="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16 pt-3 py-14 border-t border-zinc-700"
      >
        <!-- Kolom 1: Logo -->
        <div class="hidden lg:block">
          <div
            class="w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center transition-colors duration-300 group hover:bg-zinc-800"
          >
            <Rocket
              class="transition-colors duration-300 text-lime-600 group-hover:text-lime-500"
            />
          </div>
        </div>

        <!-- Kolom 2: Copyright dan Info -->
        <div
          class="flex flex-col items-center lg:items-end justify-center mt-6 lg:mt-0"
        >
          <!-- Copyright -->
          <div class="space-y-2 text-center lg:text-right">
            <p class="text-sm transition-colors duration-300 text-zinc-400">
              © 2024-{{ new Date().getFullYear() }} Sopokdate. All rights
              reserved.
            </p>
            <p class="text-xs transition-colors duration-300 text-zinc-500">
              Dibuat dengan ❤️ oleh
              <a
                href="https://www.instagram.com/blim.bink/"
                target="_blank"
                class="font-semibold transition-colors duration-300 hover:underline text-emerald-400 hover:text-emerald-300"
              >
                Bayu Kartawan
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Rocket } from "lucide-vue-next";
</script>
