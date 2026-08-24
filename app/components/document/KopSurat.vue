<script setup lang="ts">
import logoKemenag from '~/assets/logo/logo-kemenag.svg';
import logoMadrasah from '~/assets/logo/logo-madrasah.svg';
</script>

<template>
  <div class="w-full border-black border-b-3 pb-1">
    <div class="flex items-center justify-between mb-1">
      <!-- Sebelah Kiri Kop: Logo Kemenag -->
      <div class="flex-shrink-0">
        <img :src="logoKemenag" alt="Logo Kemenag" class="h-[75px] w-[75px] object-contain" />
      </div>
      <div class="text-center flex-grow px-4">
        <div class="leading-tight">
          <div class="text-[12pt] tracking-wider font-semibold">
            PONDOK PESANTREN "NURUL FALAH" PENYENGGIR
          </div>
          <div class="text-[11pt] -mt-1">
            DESA SIKUR BARAT KEC. SIKUR KABUPATEN LOMBOK TIMUR
          </div>
          <div class="text-[12pt] tracking-wider font-semibold">MADRASAH IBTIDA'IYAH NW PENYENGGIR</div>
          <div class="text-[11pt] -mt-1">
            "TERAKREDITASI B" NOMOR: 087/BAN-PDM/SK/2024
          </div>
        </div>
      </div>
      <!-- Sebelah Kanan Kop: Logo Madrasah -->
      <div class="flex-shrink-0">
        <img :src="logoMadrasah" alt="Logo Madrasah" class="h-[75px] w-[75px] object-contain" />
      </div>
    </div>
    <div class="text-[10px] text-center leading-tight -mt-1">
      Jl. H. Sinarah Ibrohim KM 1 Penyenggir, NPSN:
      60721906, NSM: 111252030083, email: minwpenyenggir1985@gmail.com
    </div>
  </div>
</template>
