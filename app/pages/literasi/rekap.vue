<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Section Header -->
      <PageHeader
        title="Rekap Literasi Siswa"
        :breadcrumbs="[
          { label: 'Literasi Siswa', to: '/literasi/data' },
          { label: 'Rekap Literasi' },
        ]"
      >
        <template #leading>
          <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border theme-border theme-bg text-xs font-medium theme-text">
            <Calendar class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>TP {{ tapel }} • Semester {{ semester }}</span>
          </div>
        </template>

        <template #actions>
          <div class="flex items-center gap-2">
            <PrintButton
              :documentTitle="printDocumentTitle"
            >
              <div class="w-full print:p-0 print:pt-0 p-4 sm:p-8 pt-0 sm:pt-0 mx-auto bg-white text-black font-sans">
                <!-- Kop Surat -->
                <KopSurat class="mb-4" />

                <!-- Judul Dokumen -->
                <div class="text-center mb-6">
                  <h1 class="font-bold uppercase text-base sm:text-lg tracking-wide text-black">
                    REKAPITULASI CAPAIAN & TARGET LITERASI SISWA
                  </h1>
                  <p class="text-xs sm:text-sm font-semibold mt-1 text-black">
                    Kelas: {{ currentKelasName }} | Tahun Pelajaran: {{ tapel }} | Semester: {{ semester }}
                  </p>
                </div>

                <!-- I. Ringkasan Capaian & Target Literasi -->
                <div class="mb-6">
                  <h2 class="text-xs font-bold uppercase tracking-wider mb-2 text-black">
                    I. Ringkasan Capaian dan Target Literasi
                  </h2>
                  <table class="w-full table-auto border border-gray-800 text-xs text-left text-black">
                    <thead class="bg-gray-100">
                      <tr>
                        <th class="border border-gray-800 px-3 py-1.5 w-10 text-center">No</th>
                        <th class="border border-gray-800 px-3 py-1.5">Tingkat / Level Kemampuan</th>
                        <th class="border border-gray-800 px-3 py-1.5 text-center w-28">Jumlah Capaian</th>
                        <th class="border border-gray-800 px-3 py-1.5 text-center w-20">Persentase</th>
                        <th class="border border-gray-800 px-3 py-1.5 text-center w-28">Jumlah Target</th>
                        <th class="border border-gray-800 px-3 py-1.5 text-center w-20">Persentase Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="border border-gray-800 px-3 py-1 text-center font-medium">1</td>
                        <td class="border border-gray-800 px-3 py-1 font-semibold">Intervensi Khusus</td>
                        <td class="border border-gray-800 px-3 py-1 text-center font-bold">{{ stats.data?.intervensi_khusus || 0 }}</td>
                        <td class="border border-gray-800 px-3 py-1 text-center">{{ getPercent(stats.data?.intervensi_khusus, stats.data?.total) }}%</td>
                        <td class="border border-gray-800 px-3 py-1 text-center font-bold">{{ stats.target?.intervensi_khusus || 0 }}</td>
                        <td class="border border-gray-800 px-3 py-1 text-center">{{ getPercent(stats.target?.intervensi_khusus, stats.data?.total) }}%</td>
                      </tr>
                      <tr class="text-[11px] bg-gray-50">
                        <td class="border border-gray-800"></td>
                        <td class="border border-gray-800 px-4 py-0.5 italic text-gray-700" colspan="5">
                          Rincian: Pemula ({{ stats.data?.intervensi_khusus_pemula || 0 }}), 
                          Huruf ({{ stats.data?.intervensi_khusus_huruf || 0 }}), 
                          Kata ({{ stats.data?.intervensi_khusus_kata || 0 }}), 
                          Paragraf ({{ stats.data?.intervensi_khusus_paragraf || 0 }}), 
                          Cerita ({{ stats.data?.intervensi_khusus_cerita || 0 }})
                        </td>
                      </tr>
                      <tr>
                        <td class="border border-gray-800 px-3 py-1 text-center font-medium">2</td>
                        <td class="border border-gray-800 px-3 py-1 font-semibold">Dasar</td>
                        <td class="border border-gray-800 px-3 py-1 text-center font-bold">{{ stats.data?.dasar || 0 }}</td>
                        <td class="border border-gray-800 px-3 py-1 text-center">{{ getPercent(stats.data?.dasar, stats.data?.total) }}%</td>
                        <td class="border border-gray-800 px-3 py-1 text-center font-bold">{{ stats.target?.dasar || 0 }}</td>
                        <td class="border border-gray-800 px-3 py-1 text-center">{{ getPercent(stats.target?.dasar, stats.data?.total) }}%</td>
                      </tr>
                      <tr>
                        <td class="border border-gray-800 px-3 py-1 text-center font-medium">3</td>
                        <td class="border border-gray-800 px-3 py-1 font-semibold">Cakap</td>
                        <td class="border border-gray-800 px-3 py-1 text-center font-bold">{{ stats.data?.cakap || 0 }}</td>
                        <td class="border border-gray-800 px-3 py-1 text-center">{{ getPercent(stats.data?.cakap, stats.data?.total) }}%</td>
                        <td class="border border-gray-800 px-3 py-1 text-center font-bold">{{ stats.target?.cakap || 0 }}</td>
                        <td class="border border-gray-800 px-3 py-1 text-center">{{ getPercent(stats.target?.cakap, stats.data?.total) }}%</td>
                      </tr>
                      <tr>
                        <td class="border border-gray-800 px-3 py-1 text-center font-medium">4</td>
                        <td class="border border-gray-800 px-3 py-1 font-semibold">Mahir</td>
                        <td class="border border-gray-800 px-3 py-1 text-center font-bold">{{ stats.data?.mahir || 0 }}</td>
                        <td class="border border-gray-800 px-3 py-1 text-center">{{ getPercent(stats.data?.mahir, stats.data?.total) }}%</td>
                        <td class="border border-gray-800 px-3 py-1 text-center font-bold">{{ stats.target?.mahir || 0 }}</td>
                        <td class="border border-gray-800 px-3 py-1 text-center">{{ getPercent(stats.target?.mahir, stats.data?.total) }}%</td>
                      </tr>
                      <tr class="bg-gray-100 font-bold">
                        <td colspan="2" class="border border-gray-800 px-3 py-1.5 text-center">TOTAL SISWA</td>
                        <td class="border border-gray-800 px-3 py-1.5 text-center">{{ stats.data?.total || 0 }}</td>
                        <td class="border border-gray-800 px-3 py-1.5 text-center">100%</td>
                        <td class="border border-gray-800 px-3 py-1.5 text-center">{{ stats.data?.total || 0 }}</td>
                        <td class="border border-gray-800 px-3 py-1.5 text-center">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- II. Daftar Siswa -->
                <div class="mb-6">
                  <h2 class="text-xs font-bold uppercase tracking-wider mb-2 text-black">
                    II. Daftar Capaian dan Target Siswa
                  </h2>
                  <table class="w-full table-auto border border-gray-800 text-xs text-left text-black">
                    <thead class="bg-gray-100">
                      <tr>
                        <th class="border border-gray-800 px-2 py-1.5 w-8 text-center">No</th>
                        <th class="border border-gray-800 px-2 py-1.5">Nama Siswa</th>
                        <th class="border border-gray-800 px-2 py-1.5 w-24 text-center">NISN</th>
                        <th class="border border-gray-800 px-2 py-1.5 w-12 text-center">L/P</th>
                        <th class="border border-gray-800 px-2 py-1.5">Level Saat Ini</th>
                        <th class="border border-gray-800 px-2 py-1.5">Target Literasi</th>
                        <th class="border border-gray-800 px-2 py-1.5 w-20 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="!students || students.length === 0">
                        <td colspan="7" class="border border-gray-800 px-2 py-4 text-center text-gray-500">
                          Tidak ada data siswa
                        </td>
                      </tr>
                      <tr v-else v-for="(student, idx) in students" :key="student.siswa_id || idx">
                        <td class="border border-gray-800 px-2 py-1 text-center">{{ idx + 1 }}</td>
                        <td class="border border-gray-800 px-2 py-1 font-semibold">{{ student.nama }}</td>
                        <td class="border border-gray-800 px-2 py-1 text-center font-mono">{{ student.nisn || student.nis_lokal || '-' }}</td>
                        <td class="border border-gray-800 px-2 py-1 text-center">{{ student.jenis_kelamin || '-' }}</td>
                        <td class="border border-gray-800 px-2 py-1">
                          {{ student.current_level || 'Belum Dinilai' }}
                          <span v-if="student.current_level === 'Intervensi Khusus' && student.current_sub_level">
                            ({{ student.current_sub_level }})
                          </span>
                        </td>
                        <td class="border border-gray-800 px-2 py-1">
                          {{ student.target_level || getAutoTarget(student.current_level, student.current_sub_level).targetLevel }}
                          <span v-if="(student.target_level || getAutoTarget(student.current_level, student.current_sub_level).targetLevel) === 'Intervensi Khusus'">
                            ({{ student.target_sub_level || getAutoTarget(student.current_level, student.current_sub_level).targetSubLevel }})
                          </span>
                        </td>
                        <td class="border border-gray-800 px-2 py-1 text-center">
                          {{ student.is_custom ? 'Custom' : 'Otomatis' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Tanda Tangan Pengesahan -->
                <div class="mt-8 pt-4 flex justify-between text-xs break-inside-avoid text-black">
                  <div class="text-center w-52">
                    <p>Mengetahui,</p>
                    <p class="font-semibold">Kepala Madrasah</p>
                    <div class="h-16"></div>
                    <p class="font-bold underline">{{ kepalaMadrasahName }}</p>
                    <p class="text-[11px]">NUPTK: {{ kepalaMadrasahNIP }}</p>
                  </div>
                  <div class="text-center w-52">
                    <p>Penyenggir, {{ currentDateFormatted }}</p>
                    <p class="font-semibold">Guru Kelas / Pembimbing</p>
                    <div class="h-16"></div>
                    <p class="font-bold underline">{{ currentUserName }}</p>
                    <p class="text-[11px]">NIP. -</p>
                  </div>
                </div>
              </div>
            </PrintButton>
            <BaseButton
              text="Perbarui Data"
              title="Perbarui data rekapitulasi"
              :loading="isLoading"
              :disabled="isLoading"
              class="print:hidden"
              @click="fetchRekap"
            >
              <template #icon>
                <RefreshCw class="w-4 h-4" />
              </template>
            </BaseButton>
          </div>
        </template>
      </PageHeader>

      <!-- FILTER BAR (Print Hidden) -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border theme-bg-secondary theme-border mb-4 sm:mb-6 print:hidden">
        <div class="flex flex-col gap-1.5 min-w-[200px] sm:min-w-[220px]">
          <label class="text-xs font-semibold theme-text-muted">Pilih Kelas</label>
          <UiSearchableSelect
            v-model="selectedKelasId"
            :options="kelasList.map(k => ({ label: `${k.nama_kelas} (${k.tingkat || ''})`, value: k.id_kelas }))"
            placeholder="Pilih Kelas"
          />
        </div>

        <div class="flex items-end flex-1 sm:max-w-xs gap-1.5 min-w-[180px]">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-xs font-semibold theme-text-muted">Cari Siswa</label>
            <div class="relative">
              <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari nama / NISN..."
                class="theme-input pl-9 pr-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- LOADING STATE -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
        <Loader2 class="w-10 h-10 animate-spin text-emerald-600 dark:text-emerald-400 mb-3" />
        <p class="theme-text-muted text-sm font-medium">Memuat rekapitulasi literasi siswa...</p>
      </div>

      <!-- NO KELAS SELECTED -->
      <div v-else-if="!selectedKelasId" class="border theme-border rounded-2xl p-12 text-center theme-bg-secondary">
        <BookOpenText class="w-14 h-14 mx-auto text-emerald-600/80 mb-3" />
        <h3 class="font-bold text-lg mb-1" :style="{ color: 'var(--text-heading)' }">Pilih Kelas Terlebih Dahulu</h3>
        <p class="theme-text-muted text-sm max-w-md mx-auto">
          Silakan pilih kelas melalui filter di atas untuk melihat grafik statistik dan tabel rekapitulasi literasi.
        </p>
      </div>

      <!-- CONTENT: GRAFIK & TABEL -->
      <div v-else class="space-y-6">
        <!-- 1. SUMMARY STAT CARDS -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <!-- Total Siswa -->
          <div class="border theme-border rounded-2xl p-4 theme-bg flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
              <Users class="w-5 h-5" />
            </div>
            <div>
              <p class="text-xs theme-text-muted font-medium">Total Siswa</p>
              <h4 class="text-xl font-extrabold" :style="{ color: 'var(--text-heading)' }">
                {{ stats.data?.total || 0 }}
              </h4>
            </div>
          </div>

          <!-- Intervensi Khusus -->
          <div class="border theme-border rounded-2xl p-4 theme-bg flex items-center gap-3.5 border-l-4 border-l-rose-500">
            <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <AlertCircle class="w-5 h-5" />
            </div>
            <div>
              <p class="text-xs theme-text-muted font-medium">Intervensi Khusus</p>
              <div class="flex items-baseline gap-1.5">
                <h4 class="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                  {{ stats.data?.intervensi_khusus || 0 }}
                </h4>
                <span class="text-[11px] theme-text-muted">
                  ({{ getPercent(stats.data?.intervensi_khusus, stats.data?.total) }}%)
                </span>
              </div>
            </div>
          </div>

          <!-- Dasar -->
          <div class="border theme-border rounded-2xl p-4 theme-bg flex items-center gap-3.5 border-l-4 border-l-amber-500">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <BookOpen class="w-5 h-5" />
            </div>
            <div>
              <p class="text-xs theme-text-muted font-medium">Dasar</p>
              <div class="flex items-baseline gap-1.5">
                <h4 class="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {{ stats.data?.dasar || 0 }}
                </h4>
                <span class="text-[11px] theme-text-muted">
                  ({{ getPercent(stats.data?.dasar, stats.data?.total) }}%)
                </span>
              </div>
            </div>
          </div>

          <!-- Cakap -->
          <div class="border theme-border rounded-2xl p-4 theme-bg flex items-center gap-3.5 border-l-4 border-l-sky-500">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <CheckCircle2 class="w-5 h-5" />
            </div>
            <div>
              <p class="text-xs theme-text-muted font-medium">Cakap</p>
              <div class="flex items-baseline gap-1.5">
                <h4 class="text-xl font-extrabold text-sky-600 dark:text-sky-400">
                  {{ stats.data?.cakap || 0 }}
                </h4>
                <span class="text-[11px] theme-text-muted">
                  ({{ getPercent(stats.data?.cakap, stats.data?.total) }}%)
                </span>
              </div>
            </div>
          </div>

          <!-- Mahir -->
          <div class="border theme-border rounded-2xl p-4 theme-bg flex items-center gap-3.5 border-l-4 border-l-emerald-500 col-span-2 sm:col-span-1">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Award class="w-5 h-5" />
            </div>
            <div>
              <p class="text-xs theme-text-muted font-medium">Mahir</p>
              <div class="flex items-baseline gap-1.5">
                <h4 class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {{ stats.data?.mahir || 0 }}
                </h4>
                <span class="text-[11px] theme-text-muted">
                  ({{ getPercent(stats.data?.mahir, stats.data?.total) }}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. GRAFIK VISUALISASI SVG -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 print:break-inside-avoid">
          <!-- KOMPARASI BAR CHART SVG (2 Kolom) -->
          <div class="lg:col-span-2 border theme-border rounded-2xl p-5 theme-bg flex flex-col justify-between">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 class="font-bold text-base" :style="{ color: 'var(--text-heading)' }">
                    Grafik Perbandingan: Data Capaian vs Target Literasi
                  </h3>
                  <p class="text-xs theme-text-muted">Distribusi jumlah siswa pada level saat ini dibandingkan dengan target</p>
                </div>
                <!-- Legend -->
                <div class="flex items-center gap-4 text-xs font-semibold">
                  <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
                    <span class="theme-text">Data Saat Ini</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded bg-sky-500 inline-block"></span>
                    <span class="theme-text">Target Literasi</span>
                  </div>
                </div>
              </div>

              <!-- SVG BAR CHART -->
              <div class="w-full overflow-x-auto py-2">
                <svg viewBox="0 0 600 240" class="w-full h-56 font-sans select-none">
                  <!-- Background Grid Lines -->
                  <line x1="60" y1="30" x2="560" y2="30" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="3,3" />
                  <line x1="60" y1="75" x2="560" y2="75" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="3,3" />
                  <line x1="60" y1="120" x2="560" y2="120" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="3,3" />
                  <line x1="60" y1="165" x2="560" y2="165" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="3,3" />
                  <line x1="60" y1="200" x2="560" y2="200" stroke="currentColor" stroke-opacity="0.25" />

                  <!-- Y-Axis Labels -->
                  <text x="45" y="34" font-size="10" fill="currentColor" opacity="0.6" text-anchor="end">{{ maxBarVal }}</text>
                  <text x="45" y="124" font-size="10" fill="currentColor" opacity="0.6" text-anchor="end">{{ Math.round(maxBarVal / 2) }}</text>
                  <text x="45" y="204" font-size="10" fill="currentColor" opacity="0.6" text-anchor="end">0</text>

                  <!-- BARS: 4 Categories (Intervensi, Dasar, Cakap, Mahir) -->
                  <!-- Category 1: Intervensi Khusus -->
                  <g transform="translate(100, 0)">
                    <!-- Current Bar (Rose/Emerald) -->
                    <rect
                      :x="0"
                      :y="getY(stats.data?.intervensi_khusus)"
                      width="36"
                      :height="getHeight(stats.data?.intervensi_khusus)"
                      rx="6"
                      fill="#e11d48"
                      class="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                    <text
                      :x="18"
                      :y="getY(stats.data?.intervensi_khusus) - 6"
                      font-size="11"
                      font-weight="bold"
                      fill="#e11d48"
                      text-anchor="middle"
                    >
                      {{ stats.data?.intervensi_khusus || 0 }}
                    </text>

                    <!-- Target Bar (Sky) -->
                    <rect
                      :x="42"
                      :y="getY(stats.target?.intervensi_khusus)"
                      width="36"
                      :height="getHeight(stats.target?.intervensi_khusus)"
                      rx="6"
                      fill="#0284c7"
                      class="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                    <text
                      :x="60"
                      :y="getY(stats.target?.intervensi_khusus) - 6"
                      font-size="11"
                      font-weight="bold"
                      fill="#0284c7"
                      text-anchor="middle"
                    >
                      {{ stats.target?.intervensi_khusus || 0 }}
                    </text>
                    <text x="39" y="220" font-size="11" font-weight="600" fill="currentColor" opacity="0.8" text-anchor="middle">
                      Intervensi
                    </text>
                  </g>

                  <!-- Category 2: Dasar -->
                  <g transform="translate(225, 0)">
                    <rect
                      :x="0"
                      :y="getY(stats.data?.dasar)"
                      width="36"
                      :height="getHeight(stats.data?.dasar)"
                      rx="6"
                      fill="#d97706"
                      class="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                    <text
                      :x="18"
                      :y="getY(stats.data?.dasar) - 6"
                      font-size="11"
                      font-weight="bold"
                      fill="#d97706"
                      text-anchor="middle"
                    >
                      {{ stats.data?.dasar || 0 }}
                    </text>

                    <rect
                      :x="42"
                      :y="getY(stats.target?.dasar)"
                      width="36"
                      :height="getHeight(stats.target?.dasar)"
                      rx="6"
                      fill="#0284c7"
                      class="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                    <text
                      :x="60"
                      :y="getY(stats.target?.dasar) - 6"
                      font-size="11"
                      font-weight="bold"
                      fill="#0284c7"
                      text-anchor="middle"
                    >
                      {{ stats.target?.dasar || 0 }}
                    </text>
                    <text x="39" y="220" font-size="11" font-weight="600" fill="currentColor" opacity="0.8" text-anchor="middle">
                      Dasar
                    </text>
                  </g>

                  <!-- Category 3: Cakap -->
                  <g transform="translate(350, 0)">
                    <rect
                      :x="0"
                      :y="getY(stats.data?.cakap)"
                      width="36"
                      :height="getHeight(stats.data?.cakap)"
                      rx="6"
                      fill="#0284c7"
                      class="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                    <text
                      :x="18"
                      :y="getY(stats.data?.cakap) - 6"
                      font-size="11"
                      font-weight="bold"
                      fill="#0284c7"
                      text-anchor="middle"
                    >
                      {{ stats.data?.cakap || 0 }}
                    </text>

                    <rect
                      :x="42"
                      :y="getY(stats.target?.cakap)"
                      width="36"
                      :height="getHeight(stats.target?.cakap)"
                      rx="6"
                      fill="#0284c7"
                      class="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                    <text
                      :x="60"
                      :y="getY(stats.target?.cakap) - 6"
                      font-size="11"
                      font-weight="bold"
                      fill="#0284c7"
                      text-anchor="middle"
                    >
                      {{ stats.target?.cakap || 0 }}
                    </text>
                    <text x="39" y="220" font-size="11" font-weight="600" fill="currentColor" opacity="0.8" text-anchor="middle">
                      Cakap
                    </text>
                  </g>

                  <!-- Category 4: Mahir -->
                  <g transform="translate(475, 0)">
                    <rect
                      :x="0"
                      :y="getY(stats.data?.mahir)"
                      width="36"
                      :height="getHeight(stats.data?.mahir)"
                      rx="6"
                      fill="#059669"
                      class="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                    <text
                      :x="18"
                      :y="getY(stats.data?.mahir) - 6"
                      font-size="11"
                      font-weight="bold"
                      fill="#059669"
                      text-anchor="middle"
                    >
                      {{ stats.data?.mahir || 0 }}
                    </text>

                    <rect
                      :x="42"
                      :y="getY(stats.target?.mahir)"
                      width="36"
                      :height="getHeight(stats.target?.mahir)"
                      rx="6"
                      fill="#0284c7"
                      class="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                    <text
                      :x="60"
                      :y="getY(stats.target?.mahir) - 6"
                      font-size="11"
                      font-weight="bold"
                      fill="#0284c7"
                      text-anchor="middle"
                    >
                      {{ stats.target?.mahir || 0 }}
                    </text>
                    <text x="39" y="220" font-size="11" font-weight="600" fill="currentColor" opacity="0.8" text-anchor="middle">
                      Mahir
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            <!-- Breakdown Sub-Level Intervensi -->
            <div class="mt-3 pt-3 border-t theme-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="font-semibold theme-text-muted">Rincian Sub-Level Intervensi Khusus:</span>
              <div class="flex flex-wrap gap-2">
                <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  Pemula: {{ stats.data?.intervensi_khusus_pemula || 0 }}
                </span>
                <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  Huruf: {{ stats.data?.intervensi_khusus_huruf || 0 }}
                </span>
                <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  Kata: {{ stats.data?.intervensi_khusus_kata || 0 }}
                </span>
                <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  Paragraf: {{ stats.data?.intervensi_khusus_paragraf || 0 }}
                </span>
                <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  Cerita: {{ stats.data?.intervensi_khusus_cerita || 0 }}
                </span>
              </div>
            </div>
          </div>

          <!-- DONUT CHART SVG (1 Kolom) -->
          <div class="border theme-border rounded-2xl p-5 theme-bg flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-base mb-1" :style="{ color: 'var(--text-heading)' }">
                Proporsi Level Saat Ini
              </h3>
              <p class="text-xs theme-text-muted mb-4">Persentase sebaran level kemampuan literasi siswa</p>

              <!-- SVG DONUT -->
              <div class="flex flex-col items-center justify-center my-3">
                <svg viewBox="0 0 160 160" class="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="transparent"
                    stroke="currentColor"
                    stroke-opacity="0.08"
                    stroke-width="20"
                  />
                  <!-- Slices -->
                  <circle
                    v-for="(slice, i) in donutSlices"
                    :key="i"
                    cx="80"
                    cy="80"
                    r="60"
                    fill="transparent"
                    :stroke="slice.color"
                    stroke-width="20"
                    :stroke-dasharray="`${slice.length} 377`"
                    :stroke-dashoffset="slice.offset"
                    class="transition-all duration-500"
                  />
                </svg>
                <!-- Center Info -->
                <div class="text-center -mt-24 mb-14 pointer-events-none">
                  <span class="text-2xl font-black block leading-none" :style="{ color: 'var(--text-heading)' }">
                    {{ stats.data?.total || 0 }}
                  </span>
                  <span class="text-[11px] theme-text-muted font-medium">Siswa</span>
                </div>
              </div>
            </div>

            <!-- Donut Legend List -->
            <div class="space-y-1.5 pt-3 border-t theme-border text-xs">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span class="theme-text">Intervensi Khusus</span>
                </div>
                <span class="font-bold text-rose-600 dark:text-rose-400">
                  {{ stats.data?.intervensi_khusus || 0 }} ({{ getPercent(stats.data?.intervensi_khusus, stats.data?.total) }}%)
                </span>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span class="theme-text">Dasar</span>
                </div>
                <span class="font-bold text-amber-600 dark:text-amber-400">
                  {{ stats.data?.dasar || 0 }} ({{ getPercent(stats.data?.dasar, stats.data?.total) }}%)
                </span>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span class="theme-text">Cakap</span>
                </div>
                <span class="font-bold text-sky-600 dark:text-sky-400">
                  {{ stats.data?.cakap || 0 }} ({{ getPercent(stats.data?.cakap, stats.data?.total) }}%)
                </span>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="theme-text">Mahir</span>
                </div>
                <span class="font-bold text-emerald-600 dark:text-emerald-400">
                  {{ stats.data?.mahir || 0 }} ({{ getPercent(stats.data?.mahir, stats.data?.total) }}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. TABEL DETAIL REKAP LITERASI SISWA -->
        <div class="border theme-border rounded-2xl theme-bg overflow-hidden">
          <div class="p-5 border-b theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="font-bold text-base" :style="{ color: 'var(--text-heading)' }">
                Daftar Capaian & Target Siswa
              </h3>
              <p class="text-xs theme-text-muted">Rincian level literasi dan target per siswa {{ currentKelasName }}</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 theme-text">
              Menampilkan {{ filteredStudents.length }} dari {{ students.length }} siswa
            </span>
          </div>

          <!-- TABLE -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="border-b theme-border bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider theme-text-muted">
                  <th class="py-3 px-4 w-12 text-center">No</th>
                  <th class="py-3 px-4">Nama Siswa</th>
                  <th class="py-3 px-4 w-28">NISN / NIS</th>
                  <th class="py-3 px-4 w-16 text-center">L/P</th>
                  <th class="py-3 px-4">Level Saat Ini</th>
                  <th class="py-3 px-4">Target Literasi</th>
                  <th class="py-3 px-4 w-28 text-center">Status Target</th>
                  <th class="py-3 px-4 w-36 print:hidden">Update Terakhir</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(student, idx) in filteredStudents"
                  :key="student.siswa_id"
                  class="border-b theme-border last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td class="py-3 px-4 text-center font-medium text-xs theme-text-muted">
                    {{ idx + 1 }}
                  </td>
                  <td class="py-3 px-4 font-bold text-xs" :style="{ color: 'var(--text-heading)' }">
                    {{ student.nama }}
                  </td>
                  <td class="py-3 px-4 text-xs theme-text-muted font-mono">
                    {{ student.nisn || student.nis_lokal || '-' }}
                  </td>
                  <td class="py-3 px-4 text-center text-xs theme-text-muted font-medium">
                    {{ student.jenis_kelamin || '-' }}
                  </td>
                  <td class="py-3 px-4">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border"
                      :class="getLevelBadgeClass(student.current_level)"
                    >
                      {{ student.current_level || 'Belum Dinilai' }}
                      <span v-if="student.current_level === 'Intervensi Khusus' && student.current_sub_level" class="font-normal opacity-90">
                        ({{ student.current_sub_level }})
                      </span>
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border"
                      :class="getLevelBadgeClass(student.target_level || getAutoTarget(student.current_level, student.current_sub_level).targetLevel)"
                    >
                      {{ student.target_level || getAutoTarget(student.current_level, student.current_sub_level).targetLevel }}
                      <span
                        v-if="(student.target_level || getAutoTarget(student.current_level, student.current_sub_level).targetLevel) === 'Intervensi Khusus'"
                        class="font-normal opacity-90"
                      >
                        ({{ student.target_sub_level || getAutoTarget(student.current_level, student.current_sub_level).targetSubLevel }})
                      </span>
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span
                      class="text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block"
                      :class="student.is_custom 
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20' 
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'"
                    >
                      {{ student.is_custom ? 'Custom' : 'Otomatis' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-xs theme-text-muted print:hidden">
                    <div class="truncate max-w-[140px]" :title="student.data_updated_at">
                      {{ student.data_updater || '-' }}
                    </div>
                    <div class="text-[10px] opacity-70">
                      {{ formatDateShort(student.data_updated_at) }}
                    </div>
                  </td>
                </tr>

                <tr v-if="filteredStudents.length === 0">
                  <td colspan="8" class="py-8 text-center theme-text-muted text-xs">
                    Tidak ada siswa yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  Printer,
  RefreshCw,
  Loader2,
  Users,
  BookOpenText,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Award,
  Search,
  Calendar,
} from "lucide-vue-next";
import PageHeader from "~/components/ui/PageHeader.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import PrintButton from "~/components/ui/PrintButton.vue";
import KopSurat from "~/components/document/KopSurat.vue";
import { useAcademicYear } from "~/composables/utils/useAcademicYear";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch } from "~/utils/api";

const { Notify } = useNotiflix();
const { currentAcademicYear, currentSemester } = useAcademicYear();

// State (Tahun Pelajaran & Semester Berjalan)
const tapel = computed(() => currentAcademicYear.value || "2025/2026");
const semester = computed(() => currentSemester.value || "Ganjil");
const selectedKelasId = ref("");
const kelasList = ref<any[]>([]);
const students = ref<any[]>([]);
const stats = ref<any>({ data: {}, target: {} });

const searchQuery = ref("");
const isLoading = ref(false);
const kepalaMadrasah = ref<any>(null);

// Kepala Madrasah & Cetak Helper
const loadKepalaMadrasah = async () => {
  try {
    const storedGtk = localStorage.getItem("data_gtk");
    if (storedGtk) {
      const parsed = JSON.parse(storedGtk);
      if (Array.isArray(parsed)) {
        const kamad = parsed.find(
          (guru: any) =>
            guru.tugas && guru.tugas.toLowerCase().includes("kepala madrasah")
        );
        if (kamad) {
          kepalaMadrasah.value = kamad;
          return;
        }
      }
    }
  } catch (err) {
    console.error("Gagal memuat data Kepala Madrasah:", err);
  }
};

const kepalaMadrasahName = computed(() => {
  return kepalaMadrasah.value?.nama_lengkap || "ABDUL HALIM, S.Pd.I";
});

const kepalaMadrasahNIP = computed(() => {
  return kepalaMadrasah.value?.nip || kepalaMadrasah.value?.nuptk || "-";
});

const currentUserName = computed(() => {
  try {
    const name = localStorage.getItem("user-displayName");
    return name || "...............................";
  } catch {
    return "...............................";
  }
});

const currentDateFormatted = computed(() => {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  } catch {
    return "";
  }
});

const printDocumentTitle = computed(() => {
  const k = (currentKelasName.value || "Kelas").replace(/[^a-zA-Z0-9]/g, "_");
  const tp = tapel.value.replace(/[^a-zA-Z0-9]/g, "_");
  return `Rekap_Literasi_${k}_TP_${tp}_Semester_${semester.value}`;
});

// Current Kelas Name
const currentKelasName = computed(() => {
  const k = kelasList.value.find(c => c.id_kelas === selectedKelasId.value);
  return k ? k.nama_kelas : selectedKelasId.value;
});

// Filtered Students
const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value;
  const q = searchQuery.value.toLowerCase().trim();
  return students.value.filter(
    s => s.nama?.toLowerCase().includes(q) || s.nisn?.includes(q) || s.nis_lokal?.includes(q)
  );
});

// Formula Otomatis 1 Level di Atas
function getAutoTarget(level: string, subLevel: string | null): { targetLevel: string; targetSubLevel: string | null } {
  if (!level || level === "Intervensi Khusus") {
    const sub = subLevel || "Pemula";
    switch (sub) {
      case "Pemula":
        return { targetLevel: "Intervensi Khusus", targetSubLevel: "Huruf" };
      case "Huruf":
        return { targetLevel: "Intervensi Khusus", targetSubLevel: "Kata" };
      case "Kata":
        return { targetLevel: "Intervensi Khusus", targetSubLevel: "Paragraf" };
      case "Paragraf":
        return { targetLevel: "Intervensi Khusus", targetSubLevel: "Cerita" };
      case "Cerita":
      default:
        return { targetLevel: "Dasar", targetSubLevel: null };
    }
  } else if (level === "Dasar") {
    return { targetLevel: "Cakap", targetSubLevel: null };
  } else if (level === "Cakap") {
    return { targetLevel: "Mahir", targetSubLevel: null };
  } else if (level === "Mahir") {
    return { targetLevel: "Mahir", targetSubLevel: null };
  }
  return { targetLevel: "Dasar", targetSubLevel: null };
}

// Helpers for Percents & SVG Charts
function getPercent(val: number | undefined, total: number | undefined) {
  if (!val || !total) return 0;
  return Math.round((val / total) * 100);
}

const maxBarVal = computed(() => {
  const d = stats.value?.data || {};
  const t = stats.value?.target || {};
  const max = Math.max(
    d.intervensi_khusus || 0,
    d.dasar || 0,
    d.cakap || 0,
    d.mahir || 0,
    t.intervensi_khusus || 0,
    t.dasar || 0,
    t.cakap || 0,
    t.mahir || 0,
    5
  );
  return Math.ceil(max / 5) * 5;
});

function getY(val: number | undefined): number {
  if (!val) return 200;
  const max = maxBarVal.value || 10;
  const h = (val / max) * 170;
  return 200 - h;
}

function getHeight(val: number | undefined): number {
  if (!val) return 0;
  const max = maxBarVal.value || 10;
  return (val / max) * 170;
}

// Donut Slices Computed (Circumference of r=60 is 2 * PI * 60 ~= 376.99)
const donutSlices = computed(() => {
  const total = stats.value?.data?.total || 0;
  if (!total) return [];
  const circumference = 376.99;
  let accumulated = 0;

  const dataLevels = [
    { count: stats.value?.data?.intervensi_khusus || 0, color: "#e11d48" },
    { count: stats.value?.data?.dasar || 0, color: "#d97706" },
    { count: stats.value?.data?.cakap || 0, color: "#0284c7" },
    { count: stats.value?.data?.mahir || 0, color: "#059669" },
  ];

  return dataLevels.map(item => {
    const len = (item.count / total) * circumference;
    const offset = -accumulated;
    accumulated += len;
    return {
      length: len,
      offset,
      color: item.color,
    };
  });
});

function getLevelBadgeClass(level: string) {
  switch (level) {
    case "Intervensi Khusus":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
    case "Dasar":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case "Cakap":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20";
    case "Mahir":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  }
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function printRekap() {
  window.print();
}

// Fetch Kelas
async function fetchKelas() {
  try {
    const response = await authenticatedFetch("/api/literasi/kelas-guru");
    if (!response.ok) throw new Error("Gagal mengambil data kelas");
    const res = await response.json();
    kelasList.value = Array.isArray(res) ? res : [];
    if (kelasList.value.length > 0 && !selectedKelasId.value) {
      selectedKelasId.value = kelasList.value[0].id_kelas;
      fetchRekap();
    }
  } catch (err: any) {
    Notify.failure(err?.message || "Gagal memuat data kelas");
  }
}

// Fetch Rekap Data
async function fetchRekap() {
  if (!selectedKelasId.value || !tapel.value || !semester.value) return;
  isLoading.value = true;
  try {
    const url = `/api/literasi/rekap?kelas_id=${encodeURIComponent(selectedKelasId.value)}&tapel=${encodeURIComponent(tapel.value)}&semester=${encodeURIComponent(semester.value)}`;
    const response = await authenticatedFetch(url);
    if (!response.ok) throw new Error("Gagal mengambil data rekap");
    const res: any = await response.json();
    students.value = res?.students || [];
    stats.value = res?.stats || { data: {}, target: {} };
  } catch (err: any) {
    Notify.failure(err?.message || "Gagal memuat rekap literasi");
  } finally {
    isLoading.value = false;
  }
}

// Watchers
watch([selectedKelasId, tapel, semester], () => {
  if (selectedKelasId.value) {
    fetchRekap();
  }
});

// Mounted
onMounted(() => {
  fetchKelas();
  loadKepalaMadrasah();
});
</script>
