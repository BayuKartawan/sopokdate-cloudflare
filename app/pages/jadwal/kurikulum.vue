<template>
  <div class="min-h-screen">
    <div class="page-layout pb-24 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div class="flex-1">
          <h2 class="text-lg sm:text-xl lg:text-2xl font-bold flex items-center gap-2"
            :style="{ color: 'var(--text-heading)' }">
            <BookOpen v-if="activeTab === 'kurikulum'"
              class="w-6 h-6 sm:w-7 sm:h-7 text-emerald-650 dark:text-emerald-400" />
            <ClipboardList v-else-if="activeTab === 'emis_mapel'"
              class="w-6 h-6 sm:w-7 sm:h-7 text-emerald-650 dark:text-emerald-400" />
            <CalendarRange v-else class="w-6 h-6 sm:w-7 sm:h-7 text-emerald-650 dark:text-emerald-400" />
            {{
              activeTab === "kurikulum"
                ? "Kurikulum Pelajaran"
                : activeTab === "emis_mapel"
                  ? "Referensi Mapel EMIS-GTK"
                  : "Mapping JP Mingguan"
            }}
          </h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">
            {{
              activeTab === "kurikulum"
                ? "Kelola mata pelajaran dan batasan alokasi jam mengajar dalam satu minggu langsung melalui tabel matriks"
                : activeTab === "emis_mapel"
                  ? "Atur referensi mata pelajaran dan JP dari EMIS-GTK secara manual"
                  : "Simulasikan dan visualisasikan total jam pelajaran (JP) dalam satu minggu secara interaktif"
            }}
          </p>
        </div>

        <!-- Tambah Mapel Button (Admin Only) -->
        <div v-if="isAdmin && activeTab === 'kurikulum'" class="w-full sm:w-auto mt-2 sm:mt-0 flex flex-wrap gap-2">
          <button @click="syncFromEmisGtk" :disabled="emisMatrixRows.length === 0"
            class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-indigo-650 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-indigo-950/20">
            <RefreshCw class="w-4 h-4" />
            Sync EMIS Mapel GTK
          </button>
          <button @click="showUploadModal = true"
            class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all border border-zinc-700 shadow-lg shadow-zinc-950/20">
            <FileSpreadsheet class="w-4 h-4" />
            Upload Excel
          </button>
          <button @click="addSubjectRow"
            class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-950/20">
            <Plus class="w-4 h-4" />
            Tambah Mapel
          </button>
        </div>

        <!-- Tambah Mapel EMIS Button (Admin Only) -->
        <div v-if="isAdmin && activeTab === 'emis_mapel'" class="w-full sm:w-auto mt-2 sm:mt-0 flex flex-wrap gap-2">
          <button @click="addEmisSubjectRow"
            class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-950/20">
            <Plus class="w-4 h-4" />
            Tambah Mapel EMIS
          </button>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="flex overflow-x-auto border-b border-zinc-800 mb-6 scrollbar-hide">
        <button @click="activeTab = 'kurikulum'" :class="[
          activeTab === 'kurikulum'
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : 'border-transparent text-zinc-400 hover:text-zinc-200',
        ]"
          class="px-4 sm:px-5 py-3 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 whitespace-nowrap">
          <BookOpen class="w-4 h-4" />
          Alokasi Kurikulum
        </button>
        <button @click="activeTab = 'mapping'" :class="[
          activeTab === 'mapping'
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : 'border-transparent text-zinc-400 hover:text-zinc-200',
        ]"
          class="px-4 sm:px-5 py-3 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 whitespace-nowrap">
          <CalendarRange class="w-4 h-4" />
          Mapping JP Mingguan
        </button>
        <button @click="activeTab = 'emis_mapel'" :class="[
          activeTab === 'emis_mapel'
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : 'border-transparent text-zinc-400 hover:text-zinc-200',
        ]"
          class="px-4 sm:px-5 py-3 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 whitespace-nowrap">
          <ClipboardList class="w-4 h-4" />
          Mapel EMIS-GTK
        </button>
      </div>

      <!-- Main Content -->
      <div class="pt-2">
        <template v-if="activeTab === 'kurikulum'">
          <p v-if="isLoading" class="text-center text-zinc-500 text-base sm:text-lg font-semibold py-12">
            Memuat data kurikulum...
          </p>

          <div v-else-if="kelasData.length === 0"
            class="text-center py-12 sm:py-16 px-4 bg-zinc-800/10 rounded-xl border border-zinc-800">
            <Database class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-zinc-600" stroke-width="1.5" />
            <p class="text-zinc-400 text-base sm:text-lg font-medium">
              Tidak ada data rombongan belajar (kelas) ditemukan
            </p>
            <p class="text-zinc-500 text-xs sm:text-sm mt-1">
              Silakan tambahkan rombel kelas terlebih dahulu sebelum mengatur
              alokasi kurikulum.
            </p>
          </div>

          <!-- Matrix Table -->
          <div v-else class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-left min-w-[800px]">
                <thead>
                  <tr
                    class="border-b border-zinc-800 bg-zinc-950/40 text-[10px] sm:text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                    <th class="p-3 sm:p-4 w-12 text-center border-r border-zinc-800/60 whitespace-nowrap">
                      No
                    </th>
                    <th class="p-3 sm:p-4 min-w-[180px] sm:min-w-[220px] border-r border-zinc-800/60 whitespace-nowrap">
                      Nama Mata Pelajaran
                    </th>
                    <th class="p-3 sm:p-4 w-32 sm:w-40 border-r border-zinc-800/60 whitespace-nowrap">
                      Kode Abreviasi
                    </th>
                    <th v-for="t in tingkatList" :key="t"
                      class="p-3 sm:p-4 text-center border-r border-zinc-800/60 min-w-[90px] sm:min-w-[100px] whitespace-nowrap">
                      Kelas {{ t }} (JP)
                    </th>
                    <th v-if="isAdmin" class="p-3 sm:p-4 w-20 text-center whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/60">
                  <tr v-for="(row, idx) in matrixRows" :key="row.rowId" :class="[
                    editingRowId === row.rowId
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-y border-emerald-500/30'
                      : 'hover:bg-zinc-900/10',
                    'transition-colors',
                  ]">
                    <!-- Index -->
                    <td
                      class="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-zinc-500 border-r border-zinc-800/60">
                      {{ idx + 1 }}
                    </td>

                    <!-- Subject Name -->
                    <td class="p-2 sm:p-3 border-r border-zinc-800/60">
                      <input v-if="isAdmin && editingRowId === row.rowId" type="text" v-model="row.nama_mapel"
                        placeholder="Contoh: Matematika"
                        class="w-full px-2 sm:px-3 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 text-xs sm:text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold" />
                      <span v-else class="text-zinc-200 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1.5 block">
                        {{ row.nama_mapel || "(Belum diisi)" }}
                      </span>
                    </td>

                    <!-- Subject Code -->
                    <td class="p-2 sm:p-3 border-r border-zinc-800/60">
                      <input v-if="isAdmin && editingRowId === row.rowId" type="text" v-model="row.kode_mapel"
                        placeholder="Contoh: MAT" @input="
                          row.kode_mapel = $event.target.value.toUpperCase()
                          "
                        class="w-full px-2 sm:px-3 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 text-xs sm:text-sm font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                      <span v-else class="text-zinc-400 text-xs sm:text-sm font-mono px-2 sm:px-3 py-1.5 block">
                        {{ row.kode_mapel || "-" }}
                      </span>
                    </td>

                    <!-- Hourly allocations per Grade Level -->
                    <td v-for="t in tingkatList" :key="t" class="p-2 sm:p-3 text-center border-r border-zinc-800/60">
                      <div class="flex flex-col items-center gap-1">
                        <input v-if="isAdmin && editingRowId === row.rowId" type="number" min="0"
                          :value="getCellHours(row, t)" @input="onHoursInput(row, t, $event.target.value)" placeholder="0"
                          class="w-14 sm:w-16 mx-auto px-1 sm:px-2 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 text-xs sm:text-sm text-center font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                        <span v-else class="text-zinc-300 text-xs sm:text-sm font-bold block text-center">
                          {{ getCellHours(row, t) || "-" }}
                        </span>
                        <!-- Ref JP from EMIS GTK -->
                        <span v-if="getEmisRefHours(row.nama_mapel, t) !== null"
                          class="text-[9px] text-zinc-500 font-medium block whitespace-nowrap">
                          Ref: {{ getEmisRefHours(row.nama_mapel, t) }} JP
                        </span>
                      </div>
                    </td>

                    <!-- Actions -->
                    <td v-if="isAdmin" class="p-2 sm:p-3 text-center">
                      <div class="flex items-center justify-center gap-1 sm:gap-2">
                        <button v-if="editingRowId === row.rowId" @click="finishEditingRow(row)"
                          class="p-1.5 sm:p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"
                          title="Selesai Edit">
                          <Check class="w-4 h-4" />
                        </button>
                        <button v-else @click="startEditingRow(row)"
                          class="p-1.5 sm:p-2 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                          title="Edit Baris">
                          <Pencil class="w-4 h-4" />
                        </button>
                        <button @click="deleteSubjectRow(row, idx)"
                          class="p-1.5 sm:p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Hapus Baris">
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <!-- Total JP per Kelas Row -->
                  <tr v-if="matrixRows.length > 0" class="bg-zinc-950/30 border-t border-zinc-800 font-semibold">
                    <td colspan="3"
                      class="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold text-zinc-400 border-r border-zinc-800/60">
                      Total JP / Kelas (1 Minggu)
                    </td>
                    <td v-for="t in tingkatList" :key="t"
                      class="p-3 sm:p-4 text-center text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 border-r border-zinc-800/60">
                      {{ getTotalHours(t) }}
                    </td>
                    <td v-if="isAdmin" class="p-3 sm:p-4"></td>
                  </tr>

                  <tr v-if="matrixRows.length === 0">
                    <td :colspan="4 + tingkatList.length + (isAdmin ? 1 : 0)"
                      class="p-8 sm:p-12 text-center text-zinc-500 italic text-xs sm:text-sm">
                      Belum ada data mata pelajaran. Klik tombol "Tambah Mapel"
                      di atas untuk memulai.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === 'mapping'">
          <!-- Dashboard Statistics -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <!-- Total JP Card -->
            <div
              class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-lg flex items-center gap-3 sm:gap-4">
              <div class="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Clock class="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p class="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Total JP Terjadwal
                </p>
                <h3 class="text-xl sm:text-2xl font-bold text-[var(--text-heading)] mt-1">
                  {{ totalSelectedJP }}
                  <span class="text-xs sm:text-sm font-normal text-zinc-400">JP</span>
                </h3>
              </div>
            </div>

            <!-- Occupancy Card -->
            <div
              class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col justify-center">
              <div class="flex justify-between items-center mb-2">
                <p class="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Keterisian Slot Mingguan
                </p>
                <span class="text-xs font-bold text-emerald-650 dark:text-emerald-400">{{ occupancyPercentage }}%</span>
              </div>
              <div class="w-full bg-zinc-850 rounded-full h-1.5 sm:h-2">
                <div class="bg-emerald-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${occupancyPercentage}%` }"></div>
              </div>
              <p class="text-[9px] sm:text-[10px] text-zinc-500 mt-1.5">
                {{ totalSelectedJP }} dari 48 total slot JP dalam seminggu
              </p>
            </div>

            <!-- Average / Action Card -->
            <div
              class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:col-span-2 md:col-span-1">
              <div>
                <p class="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Rata-rata JP Harian
                </p>
                <h3 class="text-xl sm:text-2xl font-bold text-[var(--text-heading)] mt-1">
                  {{ averageJPHarian }}
                  <span class="text-xs sm:text-sm font-normal text-zinc-400">JP / hari</span>
                </h3>
              </div>
              <button @click="resetSimulator" :disabled="totalSelectedJP === 0"
                class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700/50">
                <RefreshCw class="w-3.5 h-3.5" />
                Reset Grid
              </button>
            </div>
          </div>

          <!-- Interactive Grid Table -->
          <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl select-none mb-6">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-left min-w-[700px]">
                <thead>
                  <tr
                    class="border-b border-zinc-800 bg-zinc-950/40 text-[10px] sm:text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                    <th class="p-3 sm:p-4 w-24 sm:w-28 text-center border-r border-zinc-800/60">
                      Jam Ke
                    </th>
                    <th v-for="day in days" :key="day"
                      class="p-3 sm:p-4 text-center border-r border-zinc-800/60 min-w-[100px] sm:min-w-[120px]">
                      {{ day }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/60">
                  <tr v-for="hour in maxHours" :key="hour" class="hover:bg-zinc-900/10 transition-colors">
                    <!-- Hour Label -->
                    <td
                      class="p-3 sm:p-4 text-center text-xs sm:text-sm font-bold text-zinc-400 bg-zinc-950/20 border-r border-zinc-800/60">
                      Jam ke-{{ hour }}
                    </td>

                    <!-- Cells for days -->
                    <td v-for="day in days" :key="day"
                      class="p-1.5 sm:p-2 text-center border-r border-zinc-800/60 transition-all relative animate-none">
                      <div @mousedown="startDrag(day, hour)" @mouseenter="enterDrag(day, hour)" :class="[
                        isSlotSelected(day, hour)
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg border-emerald-400/20 scale-[1.02]'
                          : 'bg-zinc-950/40 text-zinc-600 border-zinc-800/50 hover:bg-zinc-850 hover:text-zinc-400 hover:border-zinc-700/50',
                        'w-full min-h-[44px] sm:min-h-[52px] rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none',
                      ]">
                        <template v-if="isSlotSelected(day, hour)">
                          <Clock class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100 mb-0.5" />
                          <span class="text-[10px] sm:text-xs font-bold tracking-wide">1 JP</span>
                        </template>
                        <template v-else>
                          <span
                            class="text-[10px] sm:text-xs font-medium opacity-0 hover:opacity-100 transition-opacity duration-200">+
                            JP</span>
                        </template>
                      </div>
                    </td>
                  </tr>

                  <!-- Total JP Harian Row -->
                  <tr class="bg-zinc-950/30 border-t border-zinc-800 font-semibold">
                    <td
                      class="p-3 sm:p-4 text-center text-[10px] sm:text-xs font-bold text-zinc-400 border-r border-zinc-800/60 uppercase">
                      Total Harian
                    </td>
                    <td v-for="day in days" :key="day"
                      class="p-3 sm:p-4 text-center text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 border-r border-zinc-800/60">
                      {{ getDailyTotal(day) }} JP
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Instructions Card -->
          <div
            class="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3 sm:p-4 flex gap-2 sm:gap-3 text-zinc-400 text-[10px] sm:text-xs">
            <Sparkles class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-605 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div class="space-y-1">
              <p class="font-semibold text-zinc-300">Tips Simulasi</p>
              <p>
                Anda dapat mengklik satu kotak untuk mengaktifkan/menonaktifkan
                Jam Pelajaran. Anda juga dapat menekan klik kiri mouse dan
                menggeser (drag) kursor ke kotak lain untuk memilih atau
                menghapus pilihan beberapa slot JP secara cepat.
              </p>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === 'emis_mapel'">
          <p v-if="isLoading" class="text-center text-zinc-500 text-base sm:text-lg font-semibold py-12">
            Memuat data Mapel EMIS-GTK...
          </p>

          <div v-else-if="kelasData.length === 0"
            class="text-center py-12 sm:py-16 px-4 bg-zinc-800/10 rounded-xl border border-zinc-800">
            <Database class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-zinc-600" stroke-width="1.5" />
            <p class="text-zinc-400 text-base sm:text-lg font-medium">
              Tidak ada data rombongan belajar (kelas) ditemukan
            </p>
            <p class="text-zinc-500 text-xs sm:text-sm mt-1">
              Silakan tambahkan rombel kelas terlebih dahulu sebelum mengatur referensi EMIS-GTK.
            </p>
          </div>

          <template v-else>
            <!-- Info Banner -->
            <div class="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3 sm:p-4 flex gap-2 sm:gap-3 text-zinc-400 text-[10px] sm:text-xs mb-4">
              <ClipboardList class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div class="space-y-0.5">
                <p class="font-semibold text-zinc-300">Tentang Referensi EMIS-GTK</p>
                <p>Data JP di sini digunakan sebagai acuan (Ref) saat mengisi kurikulum. Nilai referensi ditampilkan di bawah setiap kolom JP pada tab Alokasi Kurikulum.</p>
              </div>
            </div>

            <!-- Matrix Table for EMIS GTK -->
            <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              <div class="overflow-x-auto">
                <table class="w-full border-collapse text-left min-w-[800px]">
                  <thead>
                    <tr class="border-b border-zinc-800 bg-zinc-950/40 text-[10px] sm:text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                      <th class="p-3 sm:p-4 w-12 text-center border-r border-zinc-800/60 whitespace-nowrap">No</th>
                      <th class="p-3 sm:p-4 min-w-[180px] sm:min-w-[220px] border-r border-zinc-800/60 whitespace-nowrap">
                        Nama Mata Pelajaran EMIS
                      </th>
                      <th class="p-3 sm:p-4 w-32 sm:w-40 border-r border-zinc-800/60 whitespace-nowrap">
                        Kode Abreviasi
                      </th>
                      <th v-for="t in tingkatList" :key="t"
                        class="p-3 sm:p-4 text-center border-r border-zinc-800/60 min-w-[90px] sm:min-w-[100px] whitespace-nowrap">
                        Kelas {{ t }} (JP Ref)
                      </th>
                      <th v-if="isAdmin" class="p-3 sm:p-4 w-20 text-center whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-800/60">
                    <tr v-for="(row, idx) in emisMatrixRows" :key="row.rowId" :class="[
                      editingEmisRowId === row.rowId
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-y border-emerald-500/30'
                        : 'hover:bg-zinc-900/10',
                      'transition-colors',
                    ]">
                      <!-- Index -->
                      <td class="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-zinc-500 border-r border-zinc-800/60">
                        {{ idx + 1 }}
                      </td>

                      <!-- Subject Name -->
                      <td class="p-2 sm:p-3 border-r border-zinc-800/60">
                        <input v-if="isAdmin && editingEmisRowId === row.rowId" type="text" v-model="row.nama_mapel"
                          placeholder="Contoh: Matematika"
                          class="w-full px-2 sm:px-3 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 text-xs sm:text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold" />
                        <span v-else class="text-zinc-200 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1.5 block">
                          {{ row.nama_mapel || "(Belum diisi)" }}
                        </span>
                      </td>

                      <!-- Subject Code -->
                      <td class="p-2 sm:p-3 border-r border-zinc-800/60">
                        <input v-if="isAdmin && editingEmisRowId === row.rowId" type="text" v-model="row.kode_mapel"
                          placeholder="Contoh: MAT"
                          @input="row.kode_mapel = $event.target.value.toUpperCase()"
                          class="w-full px-2 sm:px-3 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 text-xs sm:text-sm font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                        <span v-else class="text-zinc-400 text-xs sm:text-sm font-mono px-2 sm:px-3 py-1.5 block">
                          {{ row.kode_mapel || "-" }}
                        </span>
                      </td>

                      <!-- Hourly allocations per Grade Level -->
                      <td v-for="t in tingkatList" :key="t" class="p-2 sm:p-3 text-center border-r border-zinc-800/60">
                        <input v-if="isAdmin && editingEmisRowId === row.rowId" type="number" min="0"
                          :value="getEmisCellHours(row, t)"
                          @input="onEmisHoursInput(row, t, $event.target.value)"
                          placeholder="0"
                          class="w-14 sm:w-16 mx-auto px-1 sm:px-2 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 text-xs sm:text-sm text-center font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                        <span v-else class="text-zinc-300 text-xs sm:text-sm font-bold block text-center">
                          {{ getEmisCellHours(row, t) || "-" }}
                        </span>
                      </td>

                      <!-- Actions -->
                      <td v-if="isAdmin" class="p-2 sm:p-3 text-center">
                        <div class="flex items-center justify-center gap-1 sm:gap-2">
                          <button v-if="editingEmisRowId === row.rowId" @click="finishEditingEmisRow(row)"
                            class="p-1.5 sm:p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"
                            title="Selesai Edit">
                            <Check class="w-4 h-4" />
                          </button>
                          <button v-else @click="startEditingEmisRow(row)"
                            class="p-1.5 sm:p-2 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                            title="Edit Baris">
                            <Pencil class="w-4 h-4" />
                          </button>
                          <button @click="deleteEmisSubjectRow(row, idx)"
                            class="p-1.5 sm:p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Hapus Baris">
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    <!-- Total JP per Kelas Row -->
                    <tr v-if="emisMatrixRows.length > 0" class="bg-zinc-950/30 border-t border-zinc-800 font-semibold">
                      <td colspan="3"
                        class="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold text-zinc-400 border-r border-zinc-800/60">
                        Total JP / Kelas (1 Minggu)
                      </td>
                      <td v-for="t in tingkatList" :key="t"
                        class="p-3 sm:p-4 text-center text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 border-r border-zinc-800/60">
                        {{ getEmisTotalHours(t) }}
                      </td>
                      <td v-if="isAdmin" class="p-3 sm:p-4"></td>
                    </tr>

                    <tr v-if="emisMatrixRows.length === 0">
                      <td :colspan="4 + tingkatList.length + (isAdmin ? 1 : 0)"
                        class="p-8 sm:p-12 text-center text-zinc-500 italic text-xs sm:text-sm">
                        Belum ada data mata pelajaran EMIS-GTK. Klik tombol "Tambah Mapel EMIS" di atas untuk memulai.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </template>
      </div>

      <!-- Floating Save Changes Bar (Admin Only) -->
      <div v-if="isAdmin && hasChanges && activeTab === 'kurikulum'"
        class="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] sm:w-max max-w-2xl bg-zinc-950/95 sm:bg-zinc-950/90 border border-emerald-500/30 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-2xl animate-fade-in">
        <div class="flex flex-col text-center sm:text-left">
          <span class="text-xs sm:text-sm font-bold text-zinc-200">Perubahan Kurikulum</span>
          <span class="text-[10px] sm:text-xs text-zinc-400">Ada perubahan yang belum disimpan ke database.</span>
        </div>
        <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center">
          <button @click="discardChanges" :disabled="isSaving"
            class="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
            <RotateCcw class="w-3.5 h-3.5" />
            Batal
          </button>
          <button @click="saveChanges" :disabled="isSaving"
            class="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-950/20">
            <Loader2 v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            {{ isSaving ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>

      <!-- Floating Save Changes Bar for EMIS Mapel (Admin Only) -->
      <div v-if="isAdmin && hasEmisChanges && activeTab === 'emis_mapel'"
        class="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] sm:w-max max-w-2xl bg-zinc-950/95 sm:bg-zinc-950/90 border border-emerald-500/30 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-2xl animate-fade-in">
        <div class="flex flex-col text-center sm:text-left">
          <span class="text-xs sm:text-sm font-bold text-zinc-200">Perubahan Mapel EMIS-GTK</span>
          <span class="text-[10px] sm:text-xs text-zinc-400">Ada perubahan referensi EMIS yang belum disimpan.</span>
        </div>
        <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center">
          <button @click="discardEmisChanges" :disabled="isSaving"
            class="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
            <RotateCcw class="w-3.5 h-3.5" />
            Batal
          </button>
          <button @click="saveEmisChanges" :disabled="isSaving"
            class="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-950/20">
            <Loader2 v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            {{ isSaving ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Excel Modal -->
    <UploadKurikulumModal
      :show="showUploadModal"
      :tingkatList="tingkatList"
      :existingRows="matrixRows"
      @close="showUploadModal = false"
      @apply="handleApplyExcel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import {
  BookOpen,
  Database,
  Plus,
  Trash2,
  Loader2,
  Save,
  RotateCcw,
  Pencil,
  Check,
  CalendarRange,
  Clock,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  ClipboardList,
} from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { postToApi, putToApi, deleteFromApi } from "~/utils/api";
import UploadKurikulumModal from "~/components/jadwal/UploadKurikulumModal.vue";

// Tab selection state
const activeTab = ref("kurikulum");

// Days and max hours for simulator
const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const maxHours = 8;

// Simulator State
const selectedSlots = ref({}); // key: 'Day-Hour', value: boolean
const isDragging = ref(false);
const dragMode = ref(null); // 'select' | 'deselect'

const isSlotSelected = (day, hour) => {
  return !!selectedSlots.value[`${day}-${hour}`];
};

const startDrag = (day, hour) => {
  isDragging.value = true;
  const key = `${day}-${hour}`;
  const nextState = !selectedSlots.value[key];
  selectedSlots.value[key] = nextState;
  dragMode.value = nextState ? "select" : "deselect";
};

const enterDrag = (day, hour) => {
  if (!isDragging.value) return;
  const key = `${day}-${hour}`;
  selectedSlots.value[key] = dragMode.value === "select";
};

const stopDrag = () => {
  isDragging.value = false;
  dragMode.value = null;
};

// Register/Unregister global mouse up event listeners for grid drag selection
onMounted(() => {
  window.addEventListener("mouseup", stopDrag);
});

onBeforeUnmount(() => {
  window.removeEventListener("mouseup", stopDrag);
});

// Statistics Calculations
const totalSelectedJP = computed(() => {
  return Object.values(selectedSlots.value).filter(Boolean).length;
});

const occupancyPercentage = computed(() => {
  const totalSlots = days.length * maxHours; // 48
  return Math.round((totalSelectedJP.value / totalSlots) * 100) || 0;
});

const averageJPHarian = computed(() => {
  const avg = totalSelectedJP.value / days.length;
  return Number(avg.toFixed(1));
});

const getDailyTotal = (day) => {
  let count = 0;
  for (let hour = 1; hour <= maxHours; hour++) {
    if (selectedSlots.value[`${day}-${hour}`]) {
      count++;
    }
  }
  return count;
};

const resetSimulator = () => {
  selectedSlots.value = {};
};

const { Notify, Confirm } = useNotiflix();

// Core DB datasets
const {
  cardData: kurikulumData,
  isLoading: isKurikulumLoading,
  loadData: loadKurikulum,
  refreshData: refreshKurikulum,
} = useTableData();
const {
  cardData: kelasData,
  isLoading: isKelasLoading,
  loadData: loadKelas,
} = useTableData();
const {
  cardData: emisMapelData,
  isLoading: isEmisMapelLoading,
  loadData: loadEmisMapel,
  refreshData: refreshEmisMapel,
} = useTableData();

// Combined loading state
const isLoading = computed(
  () => isKurikulumLoading.value || isKelasLoading.value || isEmisMapelLoading.value,
);

// Get Admin role
const { isAdmin } = useCrud("kurikulum");

// Saving state
const isSaving = ref(false);

// Active editing row ID
const editingRowId = ref(null);
const editingEmisRowId = ref(null);

// Local state for interactive matrix
const matrixRows = ref([]);
const initialMatrixRowsJson = ref("[]"); // for change detection

const emisMatrixRows = ref([]);
const initialEmisMatrixRowsJson = ref("[]");

// Dynamically compute unique grade levels (tingkat) from classes, curriculum, and EMIS tables
const tingkatList = computed(() => {
  const levels = new Set();
  if (kelasData.value) {
    kelasData.value.forEach((k) => {
      if (k.tingkat) levels.add(k.tingkat);
    });
  }
  if (kurikulumData.value) {
    kurikulumData.value.forEach((m) => {
      if (m.tingkat) levels.add(m.tingkat);
    });
  }
  if (emisMapelData.value) {
    emisMapelData.value.forEach((m) => {
      if (m.tingkat) levels.add(m.tingkat);
    });
  }
  // Natural sorting for levels
  return Array.from(levels).sort((a, b) =>
    String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
});

// Group flat kurikulum records into unique subject matrix rows
const loadMatrixData = () => {
  if (!kurikulumData.value || kurikulumData.value.length === 0) {
    matrixRows.value = [];
    initialMatrixRowsJson.value = JSON.stringify([]);
    return;
  }

  const grouped = {};

  kurikulumData.value.forEach((item) => {
    const name = item.nama_mapel;
    if (!grouped[name]) {
      grouped[name] = {
        rowId: `db_${name}`,
        nama_mapel: name,
        kode_mapel: item.kode_mapel || "",
        hours: {},
      };

      // Initialize all levels with 0 alokasi_jam
      tingkatList.value.forEach((t) => {
        grouped[name].hours[t] = {
          alokasi_jam: 0,
        };
      });
    }

    if (item.tingkat) {
      grouped[name].hours[item.tingkat] = {
        id: item.id,
        alokasi_jam: item.alokasi_jam || 0,
      };
    }

    // Keep non-empty subject code if encountered
    if (item.kode_mapel && !grouped[name].kode_mapel) {
      grouped[name].kode_mapel = item.kode_mapel;
    }
  });

  const rows = Object.values(grouped);
  // Sort alphabetically by subject name
  rows.sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel));

  matrixRows.value = rows;
  initialMatrixRowsJson.value = JSON.stringify(rows);
};

// Check for any edits by comparing matrix JSON to initial state
const hasChanges = computed(() => {
  return JSON.stringify(matrixRows.value) !== initialMatrixRowsJson.value;
});

// Populate matrix on load or updates
watch(
  [kurikulumData, kelasData],
  ([newKurikulum, newKelas]) => {
    if (newKelas && newKelas.length > 0 && !hasChanges.value) {
      loadMatrixData();
    }
  },
  { deep: true, immediate: true },
);

// Safe cell hours accessor to prevent TypeErrors during loading states
const getCellHours = (row, t) => {
  if (!row.hours || !row.hours[t]) return "";
  const val = row.hours[t].alokasi_jam;
  return val === 0 ? "" : val;
};

// Calculate total hours for a grade level
const getTotalHours = (t) => {
  return matrixRows.value.reduce((sum, row) => {
    const hours = row.hours?.[t]?.alokasi_jam || 0;
    return sum + hours;
  }, 0);
};

// Group flat emis_mapel_gtk records into unique subject matrix rows
const loadEmisMatrixData = () => {
  if (!emisMapelData.value || emisMapelData.value.length === 0) {
    emisMatrixRows.value = [];
    initialEmisMatrixRowsJson.value = JSON.stringify([]);
    return;
  }

  const grouped = {};

  emisMapelData.value.forEach((item) => {
    const name = item.nama_mapel;
    if (!grouped[name]) {
      grouped[name] = {
        rowId: `db_${name}`,
        nama_mapel: name,
        kode_mapel: item.kode_mapel || "",
        hours: {},
      };

      // Initialize all levels with 0 alokasi_jam
      tingkatList.value.forEach((t) => {
        grouped[name].hours[t] = {
          alokasi_jam: 0,
        };
      });
    }

    if (item.tingkat) {
      grouped[name].hours[item.tingkat] = {
        id: item.id,
        alokasi_jam: item.alokasi_jam || 0,
      };
    }

    // Keep non-empty subject code if encountered
    if (item.kode_mapel && !grouped[name].kode_mapel) {
      grouped[name].kode_mapel = item.kode_mapel;
    }
  });

  const rows = Object.values(grouped);
  // Sort alphabetically by subject name
  rows.sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel));

  emisMatrixRows.value = rows;
  initialEmisMatrixRowsJson.value = JSON.stringify(rows);
};

// Check for any edits by comparing matrix JSON to initial state
const hasEmisChanges = computed(() => {
  return JSON.stringify(emisMatrixRows.value) !== initialEmisMatrixRowsJson.value;
});

// Populate matrix on load or updates
watch(
  [emisMapelData, kelasData],
  ([newEmisMapel, newKelas]) => {
    if (newKelas && newKelas.length > 0 && !hasEmisChanges.value) {
      loadEmisMatrixData();
    }
  },
  { deep: true, immediate: true },
);

// Safe cell hours accessor to prevent TypeErrors during loading states
const getEmisCellHours = (row, t) => {
  if (!row.hours || !row.hours[t]) return "";
  const val = row.hours[t].alokasi_jam;
  return val === 0 ? "" : val;
};

// Calculate total hours for a grade level
const getEmisTotalHours = (t) => {
  return emisMatrixRows.value.reduce((sum, row) => {
    const hours = row.hours?.[t]?.alokasi_jam || 0;
    return sum + hours;
  }, 0);
};

// Format numeric inputs properly on typing and ensure key exists
const onEmisHoursInput = (row, t, val) => {
  if (!row.hours) row.hours = {};
  if (!row.hours[t]) {
    row.hours[t] = { alokasi_jam: 0 };
  }
  const parsed = parseInt(val, 10);
  row.hours[t].alokasi_jam = isNaN(parsed) || parsed < 0 ? 0 : parsed;
};

// Get EMIS Reference hours for a subject and grade level
const getEmisRefHours = (subjectName, tingkat) => {
  if (!emisMatrixRows.value || !subjectName) return null;
  const match = emisMatrixRows.value.find(
    (row) => row.nama_mapel.trim().toLowerCase() === subjectName.trim().toLowerCase()
  );
  if (!match || !match.hours || !match.hours[tingkat]) return null;
  const val = match.hours[tingkat].alokasi_jam;
  return val === 0 ? null : val;
};

// Format numeric inputs properly on typing and ensure key exists
const onHoursInput = (row, t, val) => {
  if (!row.hours) row.hours = {};
  if (!row.hours[t]) {
    row.hours[t] = { alokasi_jam: 0 };
  }
  const parsed = parseInt(val, 10);
  row.hours[t].alokasi_jam = isNaN(parsed) || parsed < 0 ? 0 : parsed;
};

// Upload modal visibility state
const showUploadModal = ref(false);

const handleApplyExcel = (importedRows) => {
  importedRows.forEach((newRow) => {
    const idx = matrixRows.value.findIndex(
      (r) => r.nama_mapel.trim().toLowerCase() === newRow.nama_mapel.trim().toLowerCase()
    );
    if (idx !== -1) {
      // Update existing row code
      if (newRow.kode_mapel) {
        matrixRows.value[idx].kode_mapel = newRow.kode_mapel;
      }
      // Merge hours
      Object.entries(newRow.hours).forEach(([t, val]) => {
        if (!matrixRows.value[idx].hours[t]) {
          matrixRows.value[idx].hours[t] = { alokasi_jam: 0 };
        }
        matrixRows.value[idx].hours[t].alokasi_jam = val.alokasi_jam;
      });
    } else {
      // Add new row
      matrixRows.value.push(newRow);
    }
  });

  // Sort matrixRows alphabetically by subject name
  matrixRows.value.sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel));

  Notify.success("Data kurikulum dari Excel berhasil diimpor ke tabel!");
};

// Validate editing status for EMIS before starting another edit
const startEditingEmisRow = (row) => {
  if (editingEmisRowId.value) {
    const activeRow = emisMatrixRows.value.find((r) => r.rowId === editingEmisRowId.value);
    if (activeRow) {
      const name = activeRow.nama_mapel.trim();
      if (!name) {
        Notify.failure("Nama mata pelajaran pada baris yang sedang diedit tidak boleh kosong.");
        return;
      }
      const isDuplicate = emisMatrixRows.value.some(
        (r) =>
          r.rowId !== activeRow.rowId &&
          r.nama_mapel.trim().toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        Notify.failure(`Mata pelajaran "${name}" pada baris yang sedang diedit sudah ada.`);
        return;
      }
    }
  }
  editingEmisRowId.value = row.rowId;
};

// Finish edit validate duplicate / empty for EMIS
const finishEditingEmisRow = (row) => {
  const name = row.nama_mapel.trim();
  if (!name) {
    Notify.failure("Nama mata pelajaran tidak boleh kosong.");
    return;
  }
  const isDuplicate = emisMatrixRows.value.some(
    (r) =>
      r.rowId !== row.rowId &&
      r.nama_mapel.trim().toLowerCase() === name.toLowerCase()
  );
  if (isDuplicate) {
    Notify.failure(`Mata pelajaran "${name}" sudah terdaftar.`);
    return;
  }
  editingEmisRowId.value = null;
};

// Add a new empty row to EMIS matrix table
const addEmisSubjectRow = () => {
  if (editingEmisRowId.value) {
    const activeRow = emisMatrixRows.value.find((r) => r.rowId === editingEmisRowId.value);
    if (activeRow) {
      const name = activeRow.nama_mapel.trim();
      if (!name) {
        Notify.failure("Nama mata pelajaran pada baris yang sedang diedit tidak boleh kosong.");
        return;
      }
      const isDuplicate = emisMatrixRows.value.some(
        (r) =>
          r.rowId !== activeRow.rowId &&
          r.nama_mapel.trim().toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        Notify.failure(`Mata pelajaran "${name}" pada baris yang sedang diedit sudah ada.`);
        return;
      }
    }
  }

  const tempId = `temp_${Date.now()}_${Math.random()}`;
  const newRow = {
    rowId: tempId,
    nama_mapel: "",
    kode_mapel: "",
    hours: {},
  };

  tingkatList.value.forEach((t) => {
    newRow.hours[t] = {
      alokasi_jam: 0,
    };
  });

  emisMatrixRows.value.push(newRow);

  // Auto-edit newly added row
  editingEmisRowId.value = tempId;
};

// Remove an EMIS subject row with confirmation check if there are database entries
const deleteEmisSubjectRow = (row, index) => {
  const hasDbRecords =
    row.hours && Object.values(row.hours).some((h) => h && h.id !== undefined);

  if (hasDbRecords) {
    Confirm.show(
      "Hapus Mata Pelajaran EMIS-GTK",
      `Apakah Anda yakin ingin menghapus "${row.nama_mapel || "mapel ini"}" dari seluruh tingkat referensi EMIS?`,
      "Ya, Hapus",
      "Batal",
      () => {
        emisMatrixRows.value.splice(index, 1);
      },
      () => { },
    );
  } else {
    emisMatrixRows.value.splice(index, 1);
  }
};

// Reset EMIS matrix table back to database snapshot
const discardEmisChanges = () => {
  loadEmisMatrixData();
  editingEmisRowId.value = null;
  Notify.info("Perubahan referensi EMIS dibatalkan.");
};

// Input validation for EMIS matrix
const validateEmisMatrix = () => {
  const names = new Set();
  for (let i = 0; i < emisMatrixRows.value.length; i++) {
    const row = emisMatrixRows.value[i];
    const name = row.nama_mapel.trim();
    if (!name) {
      Notify.failure(
        `Baris ke-${i + 1}: Nama mata pelajaran tidak boleh kosong.`,
      );
      return false;
    }
    if (names.has(name.toLowerCase())) {
      Notify.failure(`Mata pelajaran "${row.nama_mapel}" terduplikasi.`);
      return false;
    }
    names.add(name.toLowerCase());
  }
  return true;
};

// Batch save EMIS modifications
const saveEmisChanges = async () => {
  if (!validateEmisMatrix()) return;

  isSaving.value = true;

  const toDelete = [];
  const toUpdate = [];
  const toCreate = [];

  const dbRecords = emisMapelData.value || [];

  // 1. Find deleted records
  dbRecords.forEach((rec) => {
    const stillExists = emisMatrixRows.value.some(
      (row) =>
        row.hours &&
        Object.values(row.hours).some(
          (h) => h && h.id === rec.id && h.alokasi_jam > 0,
        ),
    );

    if (!stillExists) {
      toDelete.push(rec.id);
    }
  });

  // 2. Find records to update or insert
  emisMatrixRows.value.forEach((row) => {
    if (row.hours) {
      Object.entries(row.hours).forEach(([t, cell]) => {
        if (cell && cell.alokasi_jam > 0) {
          if (cell.id !== undefined) {
            const original = dbRecords.find((r) => r.id === cell.id);
            if (original) {
              const hasChanged =
                original.nama_mapel !== row.nama_mapel.trim() ||
                original.kode_mapel !== row.kode_mapel.trim().toUpperCase() ||
                original.alokasi_jam !== cell.alokasi_jam;

              if (hasChanged) {
                toUpdate.push({
                  id: cell.id,
                  data: {
                    nama_mapel: row.nama_mapel.trim(),
                    kode_mapel: row.kode_mapel.trim().toUpperCase(),
                    alokasi_jam: cell.alokasi_jam,
                    tingkat: t,
                  },
                });
              }
            }
          } else {
            toCreate.push({
              nama_mapel: row.nama_mapel.trim(),
              kode_mapel: row.kode_mapel.trim().toUpperCase(),
              alokasi_jam: cell.alokasi_jam,
              tingkat: t,
            });
          }
        }
      });
    }
  });

  try {
    const deletePromises = toDelete.map((id) => deleteFromApi("emis_mapel_gtk", id));
    const updatePromises = toUpdate.map((item) =>
      putToApi("emis_mapel_gtk", item.id, item.data),
    );
    const createPromises = toCreate.map((data) => postToApi("emis_mapel_gtk", data));

    await Promise.all([
      ...deletePromises,
      ...updatePromises,
      ...createPromises,
    ]);

    Notify.success("Semua perubahan referensi EMIS-GTK berhasil disimpan!");
    await refreshEmisMapel("emis_mapel_gtk");
    loadEmisMatrixData();
    editingEmisRowId.value = null;
  } catch (err) {
    console.error("Gagal menyimpan perubahan EMIS-GTK:", err);
    Notify.failure("Gagal menyimpan beberapa perubahan. Silakan coba kembali.");
  } finally {
    isSaving.value = false;
  }
};

// Sync EMIS mapel reference to main curriculum draft matrix
const syncFromEmisGtk = () => {
  if (emisMatrixRows.value.length === 0) {
    Notify.warning("Tidak ada data referensi Mapel EMIS-GTK untuk disinkronkan.");
    return;
  }

  Confirm.show(
    "Sinkronkan Mapel EMIS-GTK",
    "Apakah Anda yakin ingin menyinkronkan data kurikulum dengan referensi EMIS-GTK? Ini akan memperbarui nilai JP dan kode mapel pada kurikulum saat ini berdasarkan data EMIS-GTK, serta menambahkan mapel baru yang belum terdaftar.",
    "Ya, Sinkronkan",
    "Batal",
    () => {
      let updatedCount = 0;
      let addedCount = 0;

      const currentRows = [...matrixRows.value];

      emisMatrixRows.value.forEach((emisRow) => {
        const matchingRowIdx = currentRows.findIndex(
          (row) => row.nama_mapel.trim().toLowerCase() === emisRow.nama_mapel.trim().toLowerCase()
        );

        if (matchingRowIdx !== -1) {
          const row = currentRows[matchingRowIdx];
          let rowChanged = false;

          // Sync code if present in EMIS
          if (emisRow.kode_mapel && row.kode_mapel !== emisRow.kode_mapel) {
            row.kode_mapel = emisRow.kode_mapel;
            rowChanged = true;
          }

          // Sync hours for each tingkat
          Object.entries(emisRow.hours).forEach(([tingkat, cell]) => {
            if (!row.hours[tingkat]) {
              row.hours[tingkat] = { alokasi_jam: 0 };
            }
            if (row.hours[tingkat].alokasi_jam !== cell.alokasi_jam) {
              row.hours[tingkat].alokasi_jam = cell.alokasi_jam;
              rowChanged = true;
            }
          });

          if (rowChanged) {
            updatedCount++;
          }
        } else {
          // Add new subject from EMIS
          const tempId = `temp_sync_${Date.now()}_${Math.random()}`;
          const newRow = {
            rowId: tempId,
            nama_mapel: emisRow.nama_mapel,
            kode_mapel: emisRow.kode_mapel || "",
            hours: {},
          };

          // Initialize hours from tingkatList
          tingkatList.value.forEach((t) => {
            newRow.hours[t] = {
              alokasi_jam: emisRow.hours[t]?.alokasi_jam || 0,
            };
          });

          currentRows.push(newRow);
          addedCount++;
        }
      });

      // Sort alphabetically by subject name
      currentRows.sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel));
      matrixRows.value = currentRows;

      Notify.success(
        `Sinkronisasi selesai! ${updatedCount} mapel diperbarui, ${addedCount} mapel baru ditambahkan ke draft kurikulum. Klik tombol "Simpan" di bawah untuk menerapkan perubahan ke database.`
      );
    },
    () => {}
  );
};

// Validate editing status before starting another edit
const startEditingRow = (row) => {
  if (editingRowId.value) {
    const activeRow = matrixRows.value.find((r) => r.rowId === editingRowId.value);
    if (activeRow) {
      const name = activeRow.nama_mapel.trim();
      if (!name) {
        Notify.failure("Nama mata pelajaran pada baris yang sedang diedit tidak boleh kosong.");
        return;
      }
      const isDuplicate = matrixRows.value.some(
        (r) =>
          r.rowId !== activeRow.rowId &&
          r.nama_mapel.trim().toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        Notify.failure(`Mata pelajaran "${name}" pada baris yang sedang diedit sudah ada.`);
        return;
      }
    }
  }
  editingRowId.value = row.rowId;
};

// Finish edit validate duplicate / empty
const finishEditingRow = (row) => {
  const name = row.nama_mapel.trim();
  if (!name) {
    Notify.failure("Nama mata pelajaran tidak boleh kosong.");
    return;
  }
  const isDuplicate = matrixRows.value.some(
    (r) =>
      r.rowId !== row.rowId &&
      r.nama_mapel.trim().toLowerCase() === name.toLowerCase()
  );
  if (isDuplicate) {
    Notify.failure(`Mata pelajaran "${name}" sudah terdaftar.`);
    return;
  }
  editingRowId.value = null;
};

// Add a new empty row to matrix table with validation checks
const addSubjectRow = () => {
  if (editingRowId.value) {
    const activeRow = matrixRows.value.find((r) => r.rowId === editingRowId.value);
    if (activeRow) {
      const name = activeRow.nama_mapel.trim();
      if (!name) {
        Notify.failure("Nama mata pelajaran pada baris yang sedang diedit tidak boleh kosong.");
        return;
      }
      const isDuplicate = matrixRows.value.some(
        (r) =>
          r.rowId !== activeRow.rowId &&
          r.nama_mapel.trim().toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        Notify.failure(`Mata pelajaran "${name}" pada baris yang sedang diedit sudah ada.`);
        return;
      }
    }
  }

  const tempId = `temp_${Date.now()}_${Math.random()}`;
  const newRow = {
    rowId: tempId,
    nama_mapel: "",
    kode_mapel: "",
    hours: {},
  };

  tingkatList.value.forEach((t) => {
    newRow.hours[t] = {
      alokasi_jam: 0,
    };
  });

  matrixRows.value.push(newRow);

  // Auto-edit newly added row
  editingRowId.value = tempId;
};

// Remove a subject row with a confirmation check if there are database entries
const deleteSubjectRow = (row, index) => {
  const hasDbRecords =
    row.hours && Object.values(row.hours).some((h) => h && h.id !== undefined);

  if (hasDbRecords) {
    Confirm.show(
      "Hapus Mata Pelajaran",
      `Apakah Anda yakin ingin menghapus "${row.nama_mapel || "mapel ini"}" dari seluruh tingkat? Ini juga akan menghapus data guru pengajar (alokasi jam) dan jadwal pelajaran terkait.`,
      "Ya, Hapus",
      "Batal",
      () => {
        matrixRows.value.splice(index, 1);
      },
      () => { },
    );
  } else {
    matrixRows.value.splice(index, 1);
  }
};

// Reset matrix table back to database snapshot
const discardChanges = () => {
  loadMatrixData();
  editingRowId.value = null;
  Notify.info("Perubahan kurikulum dibatalkan.");
};

// Input validation
const validateMatrix = () => {
  const names = new Set();
  for (let i = 0; i < matrixRows.value.length; i++) {
    const row = matrixRows.value[i];
    const name = row.nama_mapel.trim();
    if (!name) {
      Notify.failure(
        `Baris ke-${i + 1}: Nama mata pelajaran tidak boleh kosong.`,
      );
      return false;
    }
    if (names.has(name.toLowerCase())) {
      Notify.failure(`Mata pelajaran "${row.nama_mapel}" terduplikasi.`);
      return false;
    }
    names.add(name.toLowerCase());
  }
  return true;
};

// Batch save modifications to Cloudflare D1
const saveChanges = async () => {
  if (!validateMatrix()) return;

  isSaving.value = true;

  const toDelete = [];
  const toUpdate = [];
  const toCreate = [];

  const dbRecords = kurikulumData.value || [];

  // 1. Find deleted records (existed in DB but are no longer in matrix rows with hours > 0)
  dbRecords.forEach((rec) => {
    const stillExists = matrixRows.value.some(
      (row) =>
        row.hours &&
        Object.values(row.hours).some(
          (h) => h && h.id === rec.id && h.alokasi_jam > 0,
        ),
    );

    if (!stillExists) {
      toDelete.push(rec.id);
    }
  });

  // 2. Find records to update or insert
  matrixRows.value.forEach((row) => {
    if (row.hours) {
      Object.entries(row.hours).forEach(([t, cell]) => {
        if (cell && cell.alokasi_jam > 0) {
          if (cell.id !== undefined) {
            const original = dbRecords.find((r) => r.id === cell.id);
            if (original) {
              const hasChanged =
                original.nama_mapel !== row.nama_mapel.trim() ||
                original.kode_mapel !== row.kode_mapel.trim().toUpperCase() ||
                original.alokasi_jam !== cell.alokasi_jam;

              if (hasChanged) {
                toUpdate.push({
                  id: cell.id,
                  data: {
                    nama_mapel: row.nama_mapel.trim(),
                    kode_mapel: row.kode_mapel.trim().toUpperCase(),
                    alokasi_jam: cell.alokasi_jam,
                    tingkat: t,
                  },
                });
              }
            }
          } else {
            toCreate.push({
              nama_mapel: row.nama_mapel.trim(),
              kode_mapel: row.kode_mapel.trim().toUpperCase(),
              alokasi_jam: cell.alokasi_jam,
              tingkat: t,
            });
          }
        }
      });
    }
  });

  try {
    const deletePromises = toDelete.map((id) => deleteFromApi("kurikulum", id));
    const updatePromises = toUpdate.map((item) =>
      putToApi("kurikulum", item.id, item.data),
    );
    const createPromises = toCreate.map((data) => postToApi("kurikulum", data));

    await Promise.all([
      ...deletePromises,
      ...updatePromises,
      ...createPromises,
    ]);

    Notify.success("Semua perubahan kurikulum berhasil disimpan!");
    await refreshKurikulum("kurikulum");
    loadMatrixData();
    editingRowId.value = null;
  } catch (err) {
    console.error("Gagal menyimpan perubahan kurikulum:", err);
    Notify.failure("Gagal menyimpan beberapa perubahan. Silakan coba kembali.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  loadKurikulum("kurikulum");
  loadKelas("data_kelas");
  loadEmisMapel("emis_mapel_gtk");
});
</script>

<style scoped>
/* Floating bar entrance animation */
.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 1.5rem);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
