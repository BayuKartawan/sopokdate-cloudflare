<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 pb-12">
    <div class="page-layout px-4 sm:px-6">
      <!-- Breadcrumbs (Screen Only) -->
      <div
        class="flex items-center gap-2 text-xs text-zinc-400 mb-4 print:hidden"
      >
        <NuxtLink
          to="/"
          class="hover:text-emerald-400 flex items-center gap-1 transition"
        >
          <Home class="w-3.5 h-3.5" />
          Beranda
        </NuxtLink>
        <span>/</span>
        <span class="text-zinc-500">Buat Dokumen</span>
        <span>/</span>
        <span class="text-zinc-200">Cetak Pas Foto</span>
      </div>

      <!-- Header (Screen Only) -->
      <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800 print:hidden"
      >
        <div>
          <h1
            class="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2"
          >
            <span
              class="p-2 bg-emerald-950/60 rounded-xl border border-emerald-500/20 text-emerald-400"
            >
              <Camera class="w-6 h-6" />
            </span>
            Cetak Banyak Pas Foto
          </h1>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1.5">
            Unggah foto siswa, sesuaikan ukuran cetak, atur posisi grid secara
            instan, dan cetak di kertas A4 / F4.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="addDemoPhotos"
            class="px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm active:translate-y-[1px]"
            title="Muat contoh pas foto siswa untuk langsung uji coba fitur"
          >
            <Sparkles class="w-4 h-4 text-emerald-400 animate-pulse" />
            Gunakan Foto Demo
          </button>
          <button
            @click="triggerPrint"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/30 active:translate-y-[1px]"
            :disabled="expandedPhotos.length === 0"
          >
            <Printer class="w-4 h-4" />
            Cetak Pas Foto
          </button>
        </div>
      </div>

      <!-- Main Columns -->
      <div
        class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start print:block print:w-full print:p-0"
      >
        <!-- Controls Column (Screen Only) -->
        <div class="lg:col-span-1 space-y-6 print:hidden">
          <!-- Card 1: Kertas (Paper Settings) -->
          <div
            class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-lg"
          >
            <h2
              class="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2"
            >
              <FileText class="w-4 h-4 text-emerald-400" />
              1. Pengaturan Kertas
            </h2>

            <div class="space-y-4">
              <!-- Paper Size -->
              <div>
                <label
                  class="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5"
                  >Ukuran Kertas</label
                >
                <div
                  class="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800"
                >
                  <button
                    v-for="size in ['A4', 'F4']"
                    :key="size"
                    @click="paperSize = size"
                    class="py-1.5 text-xs font-semibold rounded-lg transition-all"
                    :class="
                      paperSize === size
                        ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/50 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    "
                  >
                    {{ size }}
                  </button>
                </div>
              </div>

              <!-- Orientation -->
              <div>
                <label
                  class="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5"
                  >Orientasi</label
                >
                <div
                  class="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800"
                >
                  <button
                    v-for="orient in ['portrait', 'landscape']"
                    :key="orient"
                    @click="orientation = orient"
                    class="py-1.5 text-xs font-semibold rounded-lg transition-all capitalize flex items-center justify-center gap-1.5"
                    :class="
                      orientation === orient
                        ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/50 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    "
                  >
                    <RefreshCw
                      class="w-3.5 h-3.5"
                      :class="{ 'rotate-90': orient === 'landscape' }"
                    />
                    {{ orient === "portrait" ? "Tegak" : "Mendatar" }}
                  </button>
                </div>
              </div>

              <!-- Margins -->
              <div>
                <label
                  class="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5"
                  >Margin Kertas (cm)</label
                >
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <span class="text-[10px] text-zinc-400">Atas</span>
                    <input
                      type="number"
                      step="0.1"
                      v-model="printSettings.marginTop"
                      class="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <span class="text-[10px] text-zinc-400">Bawah</span>
                    <input
                      type="number"
                      step="0.1"
                      v-model="printSettings.marginBottom"
                      class="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <span class="text-[10px] text-zinc-400">Kiri</span>
                    <input
                      type="number"
                      step="0.1"
                      v-model="printSettings.marginLeft"
                      class="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <span class="text-[10px] text-zinc-400">Kanan</span>
                    <input
                      type="number"
                      step="0.1"
                      v-model="printSettings.marginRight"
                      class="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2: Pas Foto Layout (Photo Grid & Dimensions) -->
          <div
            class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-lg"
          >
            <h2
              class="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2"
            >
              <Ruler class="w-4 h-4 text-emerald-400" />
              2. Ukuran & Desain Grid
            </h2>

            <div class="space-y-4">
              <!-- Preset Sizes -->
              <div>
                <label
                  class="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5"
                  >Ukuran Foto</label
                >
                <div
                  class="grid grid-cols-4 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800"
                >
                  <button
                    v-for="preset in ['2x3', '3x4', '4x6', 'custom']"
                    :key="preset"
                    @click="photoPreset = preset"
                    class="py-1 text-[11px] font-semibold rounded-lg transition-all"
                    :class="
                      photoPreset === preset
                        ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/50 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    "
                  >
                    {{ preset === "custom" ? "Kustom" : preset }}
                  </button>
                </div>
              </div>

              <!-- Custom Inputs -->
              <div
                v-if="photoPreset === 'custom'"
                class="grid grid-cols-2 gap-3 p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-xl"
              >
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1"
                    >Lebar (cm)</label
                  >
                  <input
                    type="number"
                    step="0.1"
                    v-model="customWidth"
                    class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1"
                    >Tinggi (cm)</label
                  >
                  <input
                    type="number"
                    step="0.1"
                    v-model="customHeight"
                    class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
              </div>

              <!-- Spacer Info -->
              <div
                class="text-[10px] text-zinc-500 leading-relaxed bg-zinc-950/30 p-2.5 border border-zinc-850 rounded-xl flex items-start gap-1.5"
              >
                <Info class="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  {{ presetInfoText }}
                </span>
              </div>

              <!-- Photo Gap -->
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label
                    class="block text-[10px] uppercase tracking-wider font-bold text-zinc-500"
                    >Jarak Antar Foto (Gap)</label
                  >
                  <span class="text-xs text-zinc-400 font-mono"
                    >{{ printSettings.gap }} cm</span
                  >
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  v-model="printSettings.gap"
                  class="w-full accent-emerald-500 cursor-pointer bg-zinc-950 border border-zinc-850 h-1.5 rounded-lg appearance-none"
                />
              </div>

              <!-- Image Fit -->
              <div>
                <label
                  class="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5"
                  >Penyesuaian Gambar</label
                >
                <div
                  class="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800"
                >
                  <button
                    @click="printSettings.imageFit = 'cover'"
                    class="py-1 text-[11px] font-semibold rounded-lg transition-all"
                    :class="
                      printSettings.imageFit === 'cover'
                        ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/50'
                        : 'text-zinc-400 hover:text-zinc-200'
                    "
                  >
                    Crop Penuh (Fill)
                  </button>
                  <button
                    @click="printSettings.imageFit = 'contain'"
                    class="py-1 text-[11px] font-semibold rounded-lg transition-all"
                    :class="
                      printSettings.imageFit === 'contain'
                        ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/50'
                        : 'text-zinc-400 hover:text-zinc-200'
                    "
                  >
                    Pas Ukuran (Fit)
                  </button>
                </div>
              </div>

              <!-- Borders -->
              <div>
                <label
                  class="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5"
                  >Garis Tepi (Gunting)</label
                >
                <select
                  v-model="printSettings.borderStyle"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="none">Tanpa Garis Tepi</option>
                  <option value="solid-black">Garis Tipis Hitam</option>
                  <option value="solid-gray">Garis Tipis Abu-abu</option>
                  <option value="dashed-gray">Garis Putus-putus Abu-abu</option>
                </select>
              </div>

              <!-- Border Radius -->
              <div>
                <label
                  class="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5"
                  >Lengkungan Sudut (Radius)</label
                >
                <div
                  class="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800"
                >
                  <button
                    v-for="radius in ['0px', '4px', '8px']"
                    :key="radius"
                    @click="printSettings.borderRadius = radius"
                    class="py-1 text-[11px] font-semibold rounded-lg transition-all"
                    :class="
                      printSettings.borderRadius === radius
                        ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/50'
                        : 'text-zinc-400 hover:text-zinc-200'
                    "
                  >
                    {{ radius === "0px" ? "Siku" : radius }}
                  </button>
                </div>
              </div>

              <!-- Student Name Options -->
              <div class="pt-2 border-t border-zinc-850">
                <div class="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="showNameCheckbox"
                    v-model="printSettings.showName"
                    class="w-4 h-4 rounded border-zinc-800 bg-zinc-950 accent-emerald-500 text-emerald-600 focus:ring-0"
                  />
                  <label
                    for="showNameCheckbox"
                    class="text-xs font-semibold text-zinc-300 cursor-pointer select-none"
                    >Tampilkan Nama Siswa</label
                  >
                </div>

                <div
                  v-if="printSettings.showName"
                  class="mt-3 space-y-3 pl-6 border-l border-zinc-800"
                >
                  <div>
                    <label
                      class="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5"
                      >Posisi Nama</label
                    >
                    <div
                      class="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800"
                    >
                      <button
                        @click="printSettings.labelPosition = 'overlay'"
                        class="py-1 text-[11px] font-semibold rounded-lg transition-all"
                        :class="
                          printSettings.labelPosition === 'overlay'
                            ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/50'
                            : 'text-zinc-400 hover:text-zinc-200'
                        "
                      >
                        Melayang di Foto
                      </button>
                      <button
                        @click="printSettings.labelPosition = 'below'"
                        class="py-1 text-[11px] font-semibold rounded-lg transition-all"
                        :class="
                          printSettings.labelPosition === 'below'
                            ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/50'
                            : 'text-zinc-400 hover:text-zinc-200'
                        "
                      >
                        Di Bawah Foto
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      class="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5"
                      >Ukuran Huruf</label
                    >
                    <div
                      class="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800"
                    >
                      <button
                        v-for="size in ['small', 'medium', 'large']"
                        :key="size"
                        @click="printSettings.labelSize = size"
                        class="py-1 text-[11px] font-semibold rounded-lg transition-all capitalize"
                        :class="
                          printSettings.labelSize === size
                            ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/50'
                            : 'text-zinc-400 hover:text-zinc-200'
                        "
                      >
                        {{
                          size === "small"
                            ? "Kecil"
                            : size === "medium"
                              ? "Sedang"
                              : "Besar"
                        }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 3: Upload & Kelola File -->
          <div
            class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-lg"
          >
            <h2
              class="text-sm font-semibold text-zinc-200 mb-4 flex items-center justify-between"
            >
              <span class="flex items-center gap-2">
                <UploadCloud class="w-4 h-4 text-emerald-400" />
                3. Unggah & Kelola Foto
              </span>
              <span
                v-if="photos.length > 0"
                class="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-750"
              >
                {{ photos.length }} Siswa
              </span>
            </h2>

            <div class="space-y-4">
              <!-- Upload Area -->
              <div
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                @click="$refs.fileInput.click()"
                class="border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                :class="
                  isDragging
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : 'border-zinc-850 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900/40'
                "
              >
                <UploadCloud
                  class="w-8 h-8 text-zinc-500 group-hover:text-emerald-400 transition-colors"
                />
                <span
                  class="text-xs font-semibold text-zinc-300 group-hover:text-emerald-300 transition-colors"
                  >Pilih / Drag Foto Siswa</span
                >
                <span class="text-[9px] text-zinc-500"
                  >Mendukung format gambar PNG, JPG, JPEG</span
                >
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  class="hidden"
                  @change="handleFileChange"
                />
              </div>

              <!-- Global Multi-Copies -->
              <div
                v-if="photos.length > 0"
                class="p-3 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2.5"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-zinc-500 uppercase"
                    >Set Jumlah Cetak Massal</span
                  >
                  <span class="text-[10px] text-zinc-400 font-mono"
                    >Untuk semua foto</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <div
                    class="flex items-center border border-zinc-800 bg-zinc-900 rounded-lg overflow-hidden flex-1"
                  >
                    <button
                      @click="
                        defaultGlobalCopies = Math.max(
                          1,
                          defaultGlobalCopies - 1,
                        )
                      "
                      class="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 transition"
                    >
                      <Minus class="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      v-model.number="defaultGlobalCopies"
                      class="w-full text-center bg-transparent border-0 text-xs text-zinc-200 font-mono focus:outline-none focus:ring-0"
                      min="1"
                    />
                    <button
                      @click="defaultGlobalCopies++"
                      class="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 transition"
                    >
                      <Plus class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    @click="applyGlobalCopies"
                    class="px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition active:translate-y-[1px]"
                  >
                    Terapkan
                  </button>
                </div>
              </div>

              <!-- Photo Control List -->
              <div v-if="photos.length > 0" class="space-y-2">
                <div
                  class="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase mb-1"
                >
                  <span>Daftar Urutan Foto</span>
                  <button
                    @click="clearAllPhotos"
                    class="text-red-400 hover:text-red-300 font-bold lowercase flex items-center gap-1 transition"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                    hapus semua
                  </button>
                </div>

                <div
                  class="max-h-[360px] overflow-y-auto pr-1 space-y-2 scrollbar-thin"
                >
                  <div
                    v-for="(photo, index) in photos"
                    :key="photo.id"
                    class="flex items-center gap-3 p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl hover:border-zinc-800 transition group"
                  >
                    <!-- Thumbnail -->
                    <div
                      class="w-10 h-12 rounded bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center"
                    >
                      <img
                        :src="photo.url"
                        class="w-full h-full object-cover select-none"
                      />
                    </div>

                    <!-- Details -->
                    <div class="flex-1 min-w-0 space-y-1.5">
                      <input
                        type="text"
                        v-model="photo.name"
                        class="w-full bg-zinc-900/60 border border-zinc-850 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                        placeholder="Nama Siswa"
                      />

                      <!-- Copies control & Rearrange -->
                      <div class="flex items-center justify-between gap-2">
                        <div
                          class="flex items-center border border-zinc-850 bg-zinc-900/40 rounded-lg scale-90 origin-left"
                        >
                          <button
                            @click="
                              photo.copies = Math.max(1, photo.copies - 1)
                            "
                            class="px-1.5 py-0.5 text-zinc-400 hover:text-zinc-200 transition"
                          >
                            <Minus class="w-3 h-3" />
                          </button>
                          <span
                            class="w-6 text-center text-xs text-zinc-300 font-mono select-none"
                            >{{ photo.copies }}x</span
                          >
                          <button
                            @click="photo.copies++"
                            class="px-1.5 py-0.5 text-zinc-400 hover:text-zinc-200 transition"
                          >
                            <Plus class="w-3 h-3" />
                          </button>
                        </div>

                        <!-- Arrow order & Trash -->
                        <div class="flex items-center gap-1">
                          <button
                            @click="movePhoto(index, -1)"
                            :disabled="index === 0"
                            class="p-1 rounded text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent transition"
                          >
                            <ChevronUp class="w-3.5 h-3.5" />
                          </button>
                          <button
                            @click="movePhoto(index, 1)"
                            :disabled="index === photos.length - 1"
                            class="p-1 rounded text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent transition"
                          >
                            <ChevronDown class="w-3.5 h-3.5" />
                          </button>
                          <button
                            @click="deletePhoto(photo.id)"
                            class="p-1 rounded text-zinc-650 hover:text-red-400 hover:bg-red-950/20 transition ml-1"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Column -->
        <div class="lg:col-span-2 space-y-4 print:w-full print:p-0 print:m-0">
          <!-- Zoom Controller (Screen Only) -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl print:hidden shadow-sm"
          >
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-zinc-300"
                >Pratinjau Hasil Grid:</span
              >
              <span
                class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 font-mono"
              >
                {{ pages.length }} Lembar Halaman
              </span>
              <span
                class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-950 border border-zinc-850 text-zinc-400 font-mono"
              >
                Kapasitas: {{ cols }}x{{ rows }} = {{ itemsPerPage }} Foto / Hlm
              </span>
            </div>

            <div class="flex items-center gap-2 self-end sm:self-auto">
              <span class="text-[11px] text-zinc-400 font-medium"
                >Zoom Pratinjau:</span
              >
              <input
                type="range"
                min="40"
                max="100"
                v-model.number="zoomValue"
                class="w-24 sm:w-32 accent-emerald-500 cursor-pointer h-1 bg-zinc-850 rounded-lg appearance-none"
              />
              <span class="text-xs text-zinc-300 font-mono w-9 text-right"
                >{{ zoomValue }}%</span
              >
            </div>
          </div>

          <!-- Preview & Print Canvas -->
          <div
            class="overflow-auto max-h-[85vh] p-4 bg-zinc-950/40 border border-zinc-850/80 rounded-3xl flex flex-col gap-8 items-center scrollbar-thin print:bg-transparent print:border-0 print:p-0 print:overflow-visible print:max-h-none print:w-full print:m-0"
          >
            <!-- Empty State Placeholder -->
            <div
              v-if="expandedPhotos.length === 0"
              class="flex flex-col items-center justify-center py-28 text-zinc-500 gap-4"
            >
              <div
                class="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-850 text-zinc-400"
              >
                <Image class="w-12 h-12 stroke-[1.2] text-zinc-650" />
              </div>
              <div class="text-center">
                <p class="text-sm font-semibold text-zinc-300">
                  Belum ada foto yang diunggah
                </p>
                <p class="text-xs text-zinc-500 mt-1 max-w-[280px]">
                  Seret foto siswa ke kolom kiri atau klik tombol "Gunakan Foto
                  Demo" untuk memuat sampel.
                </p>
              </div>
              <button
                @click="addDemoPhotos"
                class="mt-1 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:border-zinc-700 transition active:translate-y-[1px]"
              >
                Gunakan Foto Demo
              </button>
            </div>

            <!-- Print Area Wrapper -->
            <div
              v-else
              id="print-area"
              class="w-full flex flex-col items-center gap-8 print:gap-0 print:bg-white print:w-full print:m-0 print:p-0"
            >
              <!-- Sheets / Pages -->
              <div
                v-for="(pageItems, pageIdx) in pages"
                :key="pageIdx"
                class="print-page bg-white text-black shadow-2xl relative select-none origin-top transition-transform print:shadow-none print:my-0 page-break"
                :class="[paperSize, orientation]"
                :style="{
                  width: paperDimensions.width,
                  height: paperDimensions.height,
                  paddingTop: `${printSettings.marginTop}cm`,
                  paddingBottom: `${printSettings.marginBottom}cm`,
                  paddingLeft: `${printSettings.marginLeft}cm`,
                  paddingRight: `${printSettings.marginRight}cm`,
                  transform: `scale(${zoomValue / 100})`,
                  marginBottom: `${marginOffsetForZoom}px`,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  flexShrink: 0,
                }"
              >
                <!-- Grid Container inside Sheet -->
                <div
                  class="grid"
                  :style="{
                    gridTemplateColumns: `repeat(${cols}, ${photoDimensions.width}cm)`,
                    gridAutoRows: `${photoDimensions.height + (printSettings.showName && printSettings.labelPosition === 'below' ? 0.65 : 0)}cm`,
                    gap: `${printSettings.gap}cm`,
                    justifyContent: 'center',
                    alignContent: 'start',
                    width: '100%',
                    height: '100%',
                  }"
                >
                  <div
                    v-for="(item, idx) in pageItems"
                    :key="`${pageIdx}-${idx}-${item.id}`"
                    class="relative flex flex-col overflow-hidden items-center justify-start"
                    :style="{
                      width: `${photoDimensions.width}cm`,
                      height: `${photoDimensions.height + (printSettings.showName && printSettings.labelPosition === 'below' ? 0.65 : 0)}cm`,
                      boxSizing: 'border-box',
                    }"
                  >
                    <!-- Image Box (Adds border, border-radius, fit) -->
                    <div
                      class="relative overflow-hidden w-full flex-grow flex items-center justify-center bg-zinc-50 border-box"
                      :style="{
                        height: `${photoDimensions.height}cm`,
                        border: borderStyle,
                        borderRadius: printSettings.borderRadius,
                        boxSizing: 'border-box',
                      }"
                    >
                      <img
                        :src="item.url"
                        class="w-full h-full select-none"
                        :class="{
                          'object-cover': printSettings.imageFit === 'cover',
                          'object-contain':
                            printSettings.imageFit === 'contain',
                        }"
                        alt="Pas Foto Siswa"
                      />

                      <!-- Name Label (Overlay Position) -->
                      <div
                        v-if="
                          printSettings.showName &&
                          printSettings.labelPosition === 'overlay'
                        "
                        class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-center py-0.5 leading-tight truncate px-1 font-sans"
                        :style="{
                          fontSize: labelFontSize,
                        }"
                      >
                        {{ item.name }}
                      </div>
                    </div>

                    <!-- Name Label (Below Position) -->
                    <div
                      v-if="
                        printSettings.showName &&
                        printSettings.labelPosition === 'below'
                      "
                      class="w-full text-center text-black py-0.5 leading-tight truncate flex items-center justify-center font-sans font-medium"
                      :style="{
                        height: '0.65cm',
                        fontSize: labelFontSize,
                        boxSizing: 'border-box',
                      }"
                    >
                      {{ item.name }}
                    </div>
                  </div>
                </div>

                <!-- Page Number Badge (Screen only) -->
                <div
                  class="absolute bottom-3 right-4 px-2.5 py-1 bg-zinc-900 text-zinc-300 text-[10px] font-semibold rounded-lg border border-zinc-700/50 font-mono shadow-sm print:hidden"
                >
                  Lembar {{ pageIdx + 1 }} dari {{ pages.length }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from "vue";
import {
  Home,
  Camera,
  Printer,
  Sparkles,
  FileText,
  RefreshCw,
  Ruler,
  Info,
  UploadCloud,
  Minus,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image,
} from "lucide-vue-next";

// Route security validation
definePageMeta({
  requiresAuth: true,
});

// --- STATE ---
const paperSize = ref("A4"); // A4 or F4
const orientation = ref("portrait"); // portrait or landscape
const photoPreset = ref("3x4"); // 2x3, 3x4, 4x6, custom
const customWidth = ref(3.0);
const customHeight = ref(4.0);
const isDragging = ref(false);
const zoomValue = ref(75);
const defaultGlobalCopies = ref(4); // Default quantity is 4 copies per photo

// Uploaded photos list
// Structure: { id, name, url, copies }
const photos = ref([]);

// Print and Grid Layout settings
const printSettings = ref({
  marginTop: 1.0,
  marginBottom: 1.0,
  marginLeft: 1.0,
  marginRight: 1.0,
  gap: 0.2, // spacing between photos in cm
  imageFit: "cover", // cover or contain
  borderStyle: "dashed-gray", // none, solid-black, solid-gray, dashed-gray
  borderRadius: "0px", // 0px, 4px, 8px
  showName: false, // show student name toggle
  labelPosition: "below", // overlay or below
  labelSize: "medium", // small, medium, large
});

// --- COMPUTED PROPERTIES ---

// Paper dimensions in cm and px
const paperDimensions = computed(() => {
  const isPortrait = orientation.value === "portrait";
  if (paperSize.value === "A4") {
    return {
      width: isPortrait ? "21cm" : "29.7cm",
      height: isPortrait ? "29.7cm" : "21cm",
      widthVal: isPortrait ? 21.0 : 29.7,
      heightVal: isPortrait ? 29.7 : 21.0,
    };
  } else {
    // F4 (Folio) standard is 21.5 x 33.0 cm
    return {
      width: isPortrait ? "21.5cm" : "33cm",
      height: isPortrait ? "33cm" : "21.5cm",
      widthVal: isPortrait ? 21.5 : 33.0,
      heightVal: isPortrait ? 33.0 : 21.5,
    };
  }
});

// Photo dimensions in cm
const photoDimensions = computed(() => {
  if (photoPreset.value === "2x3") {
    // Indonesian standard 2x3 is actual size 2.0 x 2.7 cm
    return { width: 2.0, height: 2.7 };
  } else if (photoPreset.value === "3x4") {
    // Indonesian standard 3x4 is actual size 2.8 x 3.8 cm
    return { width: 2.8, height: 3.8 };
  } else if (photoPreset.value === "4x6") {
    // Indonesian standard 4x6 is actual size 3.8 x 5.6 cm
    return { width: 3.8, height: 5.6 };
  } else {
    return {
      width: Math.max(0.5, parseFloat(customWidth.value) || 3.0),
      height: Math.max(0.5, parseFloat(customHeight.value) || 4.0),
    };
  }
});

// Context info about current sizes
const presetInfoText = computed(() => {
  if (photoPreset.value === "2x3") {
    return "Pas Foto 2x3 menggunakan dimensi standar nasional Indonesia: Lebar 2.0 cm x Tinggi 2.7 cm.";
  } else if (photoPreset.value === "3x4") {
    return "Pas Foto 3x4 menggunakan dimensi standar nasional Indonesia: Lebar 2.8 cm x Tinggi 3.8 cm.";
  } else if (photoPreset.value === "4x6") {
    return "Pas Foto 4x6 menggunakan dimensi standar nasional Indonesia: Lebar 3.8 cm x Tinggi 5.6 cm.";
  }
  return "Ukuran Kustom: Masukkan lebar dan tinggi pas foto Anda sendiri secara presisi (dalam satuan cm).";
});

// Border styles mapping
const borderStyle = computed(() => {
  if (printSettings.value.borderStyle === "solid-black")
    return "1px solid #000000";
  if (printSettings.value.borderStyle === "solid-gray")
    return "1px solid #d4d4d8";
  if (printSettings.value.borderStyle === "dashed-gray")
    return "1px dashed #a1a1aa";
  return "none";
});

// Font size of name label mapping
const labelFontSize = computed(() => {
  if (printSettings.value.labelSize === "small") return "8px";
  if (printSettings.value.labelSize === "large") return "12px";
  return "10px";
});

// Calculate columns & rows fit capacity
const cols = computed(() => {
  const pWidth = photoDimensions.value.width;
  const gap = parseFloat(printSettings.value.gap) || 0;
  const leftMargin = parseFloat(printSettings.value.marginLeft) || 0;
  const rightMargin = parseFloat(printSettings.value.marginRight) || 0;

  const availWidth = paperDimensions.value.widthVal - leftMargin - rightMargin;

  // calculation: cols * pWidth + (cols - 1) * gap <= availWidth
  // cols * (pWidth + gap) - gap <= availWidth
  // cols <= (availWidth + gap) / (pWidth + gap)
  const columnsCount = Math.floor((availWidth + gap) / (pWidth + gap));
  return Math.max(1, columnsCount);
});

const rows = computed(() => {
  const pHeight = photoDimensions.value.height;
  const labelHeight =
    printSettings.value.showName &&
    printSettings.value.labelPosition === "below"
      ? 0.65
      : 0;
  const pHeightTotal = pHeight + labelHeight;

  const gap = parseFloat(printSettings.value.gap) || 0;
  const topMargin = parseFloat(printSettings.value.marginTop) || 0;
  const bottomMargin = parseFloat(printSettings.value.marginBottom) || 0;

  const availHeight =
    paperDimensions.value.heightVal - topMargin - bottomMargin;

  const rowsCount = Math.floor((availHeight + gap) / (pHeightTotal + gap));
  return Math.max(1, rowsCount);
});

// Items count per single page
const itemsPerPage = computed(() => {
  return cols.value * rows.value;
});

// Expand all uploaded photos depending on their requested copies count
const expandedPhotos = computed(() => {
  const list = [];
  photos.value.forEach((photo) => {
    for (let i = 0; i < photo.copies; i++) {
      list.push(photo);
    }
  });
  return list;
});

// Paginate expanded photos list into separate sheets / pages
const pages = computed(() => {
  const list = expandedPhotos.value;
  const chunked = [];
  const size = itemsPerPage.value;

  for (let i = 0; i < list.length; i += size) {
    chunked.push(list.slice(i, i + size));
  }
  return chunked;
});

// Compute negative margin offset for scaled sheets to collapse blank layout spacing
const marginOffsetForZoom = computed(() => {
  const scale = zoomValue.value / 100;
  // height in cm * ~37.79 pixels per cm at 96 DPI
  const originalHeightPx = paperDimensions.value.heightVal * 37.7952755906;
  return -originalHeightPx * (1 - scale);
});

// --- FUNCTIONS / EVENT HANDLERS ---

// File changes handler
const handleFileChange = (e) => {
  const files = e.target.files;
  if (!files) return;
  addUploadedFiles(files);
};

// Drop files handler
const handleDrop = (e) => {
  isDragging.value = false;
  const files = e.dataTransfer.files;
  if (!files) return;
  addUploadedFiles(files);
};

// Common file adder & cleaner
const addUploadedFiles = (files) => {
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith("image/")) return;

    // Clean name label from filename
    // Strip file extension
    let name = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    // Replace underscores, hyphens, and dots with spacing
    name = name.replace(/[_\-\.]+/g, " ");
    name = name.trim();
    // Capitalize first letters
    name = name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Create a Blob Url for localized UI preview
    const url = URL.createObjectURL(file);

    photos.value.push({
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      name: name,
      file: file,
      url: url,
      copies: defaultGlobalCopies.value,
    });
  });
};

// Global quantity applier
const applyGlobalCopies = () => {
  if (defaultGlobalCopies.value < 1) defaultGlobalCopies.value = 1;
  photos.value.forEach((photo) => {
    photo.copies = defaultGlobalCopies.value;
  });
};

// Move item order
const movePhoto = (index, direction) => {
  const targetIdx = index + direction;
  if (targetIdx < 0 || targetIdx >= photos.value.length) return;

  const temp = photos.value[index];
  photos.value[index] = photos.value[targetIdx];
  photos.value[targetIdx] = temp;
};

// Delete single photo
const deletePhoto = (id) => {
  const idx = photos.value.findIndex((p) => p.id === id);
  if (idx > -1) {
    if (photos.value[idx].url.startsWith("blob:")) {
      URL.revokeObjectURL(photos.value[idx].url);
    }
    photos.value.splice(idx, 1);
  }
};

// Clear all photos
const clearAllPhotos = () => {
  photos.value.forEach((photo) => {
    if (photo.url.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url);
    }
  });
  photos.value = [];
};

// Trigger Printing
const triggerPrint = () => {
  window.print();
};

// Load student mock photos for quick preview
const addDemoPhotos = () => {
  const demoList = [
    {
      name: "Ahmad Dahlan",
      url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Siti Aminah",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Budi Santoso",
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Dewi Sartika",
      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Eko Prasetyo",
      url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Farida Utami",
      url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Guntur Wibowo",
      url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Hana Pertiwi",
      url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    },
  ];

  demoList.forEach((demo) => {
    photos.value.push({
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      name: demo.name,
      url: demo.url,
      copies: defaultGlobalCopies.value,
    });
  });
};

// Cleanup Blob urls on unmount
onUnmounted(() => {
  photos.value.forEach((photo) => {
    if (photo.url.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url);
    }
  });
});
</script>

<style scoped>
/* Range input custom styling */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981; /* emerald-500 */
  cursor: pointer;
  border: 2px solid #09090b; /* zinc-950 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  cursor: pointer;
  border: 2px solid #09090b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

/* Scrollbar customization */
.scrollbar-thin::-webkit-scrollbar {
  width: 5px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #27272a;
  border-radius: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #3f3f46;
}

/* Page Break Print Rules */
.page-break {
  break-after: page;
  page-break-after: always;
}

@media print {
  /* Hide overall backgrounds, borders, shadow on pages */
  body {
    background: white !important;
    color: black !important;
  }

  .print-page {
    transform: none !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
    background: white !important;
    page-break-after: always !important;
    break-after: page !important;
  }
}
</style>
