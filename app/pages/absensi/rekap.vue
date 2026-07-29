<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title & Actions -->
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6"
      >
        <div>
          <h2
            class="text-xl sm:text-2xl font-bold flex items-center gap-2"
            :style="{ color: 'var(--text-heading)' }"
          >
            <ClipboardList class="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Rekap Absensi Siswa
          </h2>
          <p class="text-sm text-zinc-400 mt-1">
            Laporan rekapitulasi kehadiran siswa per kelas berdasarkan periode yang dipilih
          </p>
        </div>

        <!-- Action Buttons Top Header -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Button Cek Tanggal Belum Kirim -->
          <button
            type="button"
            @click="openMissingModal"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold theme-bg-secondary theme-border border text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors shadow-sm cursor-pointer"
          >
            <CalendarX class="w-4.5 h-4.5 text-amber-500 shrink-0" />
            <span>Cek Tanggal Belum Kirim</span>
          </button>

          <!-- Export Excel Button -->
          <BaseButton
            v-if="activeTab === 'kehadiran' && rekapData.length > 0"
            :text="isExporting ? 'Mengekspor...' : 'Export Excel'"
            @click="exportToExcel"
            :disabled="isExporting || isLoading"
          >
            <template #icon>
              <Download v-if="!isExporting" class="w-4 h-4" />
              <Loader2 v-else class="w-4 h-4 animate-spin" />
            </template>
          </BaseButton>

          <!-- Print Button -->
          <PrintButton>
            <div class="p-10 mx-auto bg-white text-black font-sans">
              <!-- Kop Surat -->
              <KopSurat class="mb-4" />

              <!-- Header -->
              <div class="text-center mb-6">
                <h1 class="font-bold uppercase text-lg">
                  REKAPITULASI PRESENSI SISWA
                </h1>
                <p class="text-sm font-semibold mt-1" v-if="rekapType === 'semester'">
                  Kelas: {{ currentClassName }} | Semester:
                  {{ selectedSemester }} | Tahun Pelajaran: {{ selectedTapel }}
                </p>
                <p class="text-sm font-semibold mt-1" v-else-if="rekapType === 'bulanan'">
                  Kelas: {{ currentClassName }} | Bulan:
                  {{ monthNames[selectedMonth - 1] }} | Tahun Pelajaran: {{ selectedTapel }}
                </p>
                <p class="text-sm font-semibold mt-1" v-else-if="rekapType === 'mingguan'">
                  Kelas: {{ currentClassName }} | Periode:
                  {{ formatDateIndo(startDate) }} s.d. {{ formatDateIndo(endDate) }} | Tahun Pelajaran: {{ selectedTapel }}
                </p>
              </div>

              <!-- Tabel Cetak -->
              <table
                class="w-full table-auto border border-gray-800 mb-6 text-xs"
              >
                <thead class="bg-gray-100">
                  <tr>
                    <th
                      class="border border-gray-800 px-2 py-2 text-center w-8"
                      rowspan="2"
                    >
                      No
                    </th>
                    <th
                      class="border border-gray-800 px-2 py-2 text-left"
                      rowspan="2"
                    >
                      Nama Siswa
                    </th>
                    <th
                      class="border border-gray-800 px-2 py-2 text-center w-24"
                      rowspan="2"
                    >
                      NISN
                    </th>
                    <th
                      class="border border-gray-800 px-2 py-1 text-center"
                      colspan="4"
                    >
                      Kehadiran (Hari)
                    </th>
                    <th
                      class="border border-gray-800 px-2 py-2 text-center w-16"
                      rowspan="2"
                    >
                      H. Efektif
                    </th>
                    <th
                      class="border border-gray-800 px-2 py-2 text-center w-16"
                      rowspan="2"
                    >
                      Persentase
                    </th>
                  </tr>
                  <tr>
                    <th
                      class="border border-gray-800 px-1 py-1 text-center w-10"
                    >
                      H
                    </th>
                    <th
                      class="border border-gray-800 px-1 py-1 text-center w-10"
                    >
                      S
                    </th>
                    <th
                      class="border border-gray-800 px-1 py-1 text-center w-10"
                    >
                      I
                    </th>
                    <th
                      class="border border-gray-800 px-1 py-1 text-center w-10"
                    >
                      A
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(siswa, index) in rekapData" :key="siswa.siswa_id">
                    <td class="border border-gray-800 px-2 py-1.5 text-center">
                      {{ index + 1 }}
                    </td>
                    <td
                      class="border border-gray-800 px-2 py-1.5 font-semibold"
                    >
                      {{ toTitleCase(siswa.nama) }}
                    </td>
                    <td
                      class="border border-gray-800 px-2 py-1.5 text-center font-mono"
                    >
                      {{ siswa.nisn || "-" }}
                    </td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center">
                      {{ siswa.total_hadir }}
                    </td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center">
                      {{ siswa.total_sakit }}
                    </td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center">
                      {{ siswa.total_izin }}
                    </td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center">
                      {{ siswa.total_alpa }}
                    </td>
                    <td
                      class="border border-gray-800 px-2 py-1.5 text-center font-bold"
                    >
                      {{ siswa.total_hari_efektif }}
                    </td>
                    <td
                      class="border border-gray-800 px-2 py-1.5 text-center font-bold"
                    >
                      {{
                        hitungPersentase(
                          siswa.total_hadir,
                          siswa.total_hari_efektif,
                        )
                      }}%
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Footer Cetak -->
              <div class="flex justify-between items-end mt-12 text-xs">
                <div>
                  <p class="italic">
                    Dicetak otomatis via SopokDate pada {{ printTimestamp }}
                  </p>
                </div>
                <div class="text-center w-48">
                  <p class="mb-16">Wali Kelas {{ currentClassName }}</p>
                  <p class="font-bold underline">
                    {{ waliKelasName || "_________________" }}
                  </p>
                </div>
              </div>
            </div>
          </PrintButton>
        </div>

        <!-- Action Buttons: Status Pengiriman -->
        <div class="flex items-center gap-2" v-if="activeTab === 'status' && userRole === 'admin' && statusTableData.length > 0">
          <!-- Export Excel Button -->
          <BaseButton
            :text="isExportingStatus ? 'Mengekspor...' : 'Export Excel'"
            @click="exportStatusToExcel"
            :disabled="isExportingStatus || isLoadingStatus"
          >
            <template #icon>
              <Download v-if="!isExportingStatus" class="w-4 h-4" />
              <Loader2 v-else class="w-4 h-4 animate-spin" />
            </template>
          </BaseButton>

          <!-- Print Button -->
          <PrintButton>
            <div class="p-10 mx-auto bg-white text-black font-sans">
              <!-- Kop Surat -->
              <KopSurat class="mb-4" />

              <!-- Header -->
              <div class="text-center mb-6">
                <h1 class="font-bold uppercase text-lg">
                  STATUS PENGIRIMAN ABSENSI
                </h1>
                <p class="text-sm font-semibold mt-1">
                  Semester: {{ statusSemester }} | Tahun Pelajaran: {{ statusTapel }}
                </p>
                <p class="text-xs text-gray-600 mt-0.5">
                  Periode: {{ statusPeriodeLabel }}
                </p>
              </div>

              <!-- Tabel Cetak Status -->
              <table class="w-full table-auto border border-gray-800 mb-6 text-xs">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="border border-gray-800 px-2 py-2 text-center w-8">No</th>
                    <th class="border border-gray-800 px-2 py-2 text-left">Kelas</th>
                    <th class="border border-gray-800 px-2 py-2 text-left">Wali Kelas</th>
                    <th class="border border-gray-800 px-2 py-2 text-center w-20">Hari Efektif</th>
                    <th class="border border-gray-800 px-2 py-2 text-center w-20">Sudah Diabsen</th>
                    <th class="border border-gray-800 px-2 py-2 text-center w-20">Belum Diabsen</th>
                    <th class="border border-gray-800 px-2 py-2 text-center w-20">Persentase</th>
                    <th class="border border-gray-800 px-2 py-2 text-center w-16">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in statusTableData" :key="row.kelas_id">
                    <td class="border border-gray-800 px-2 py-1.5 text-center">{{ index + 1 }}</td>
                    <td class="border border-gray-800 px-2 py-1.5 font-semibold">{{ row.namaKelas }}</td>
                    <td class="border border-gray-800 px-2 py-1.5">{{ row.waliKelas || '-' }}</td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center font-bold">{{ row.hariEfektif }}</td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center">{{ row.sudahDiabsen }}</td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center">{{ row.belumDiabsen }}</td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center font-bold">{{ row.persentase.toFixed(1) }}%</td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center font-semibold">
                      {{ row.persentase >= 90 ? 'Baik' : row.persentase >= 75 ? 'Cukup' : 'Kurang' }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Ringkasan -->
              <div class="flex gap-8 text-xs mb-6">
                <div>Total Kelas: <strong>{{ statusTableData.length }}</strong></div>
                <div>Rata-rata Pengiriman: <strong>{{ avgPersentaseStatus }}%</strong></div>
                <div>Kelas Belum Lengkap (&lt;75%): <strong>{{ kelasRendahCount }}</strong></div>
              </div>

              <!-- Footer Cetak -->
              <div class="flex justify-between items-end mt-12 text-xs">
                <div>
                  <p class="italic">
                    Dicetak otomatis via SopokDate pada {{ printTimestamp }}
                  </p>
                </div>
                <div class="text-center w-48">
                  <p class="mb-16">Kepala Sekolah</p>
                  <p class="font-bold underline">_______________________</p>
                </div>
              </div>
            </div>
          </PrintButton>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div v-if="userRole === 'admin'" class="flex items-center gap-1 mb-6 p-1 rounded-xl bg-zinc-800/30 border border-zinc-700/40 w-fit">
        <button
          @click="activeTab = 'kehadiran'"
          :class="[
            'px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2',
            activeTab === 'kehadiran'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40'
          ]"
        >
          <ClipboardList class="w-4 h-4" />
          Rekap Kehadiran
        </button>
        <button
          @click="switchToStatusTab"
          :class="[
            'px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2',
            activeTab === 'status'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40'
          ]"
        >
          <BarChart3 class="w-4 h-4" />
          Status Pengiriman
        </button>
      </div>

      <!-- ============================================ -->
      <!-- TAB 1: REKAP KEHADIRAN (Existing Content)    -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'kehadiran'">
        <!-- Filter Section (Kelas, Tapel, Tipe, Sub-Filter) -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border bg-zinc-800/20 border-zinc-700/40 mb-6"
        >
          <!-- Pilihan Kelas -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-zinc-400"
              >Kelas / Rombel</label
            >
            <select
              v-model="selectedClass"
              :disabled="isLoading || isWaliKelas"
              class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="" disabled>-- Pilih Kelas --</option>
              <option
                v-for="kelas in dataKelas"
                :key="kelas.idKelas"
                :value="kelas.idKelas"
              >
                {{ kelas.namaKelas }}
              </option>
            </select>
          </div>

          <!-- Tahun Pelajaran -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-zinc-400"
              >Tahun Pelajaran</label
            >
            <select
              v-model="selectedTapel"
              :disabled="isLoading"
              class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            >
              <option v-for="opt in tapelOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </div>

          <!-- Tipe Rekap -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-zinc-400">Tipe Rekap</label>
            <select
              v-model="rekapType"
              :disabled="isLoading"
              class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            >
              <option value="semester">Per Semester</option>
              <option value="bulanan">Per Bulan</option>
              <option value="mingguan">Per Minggu / Kustom</option>
            </select>
          </div>

          <!-- Sub Filter (Semester / Bulan / Rentang Tanggal) -->
          <div class="flex flex-col gap-1.5">
            <!-- Jika Tipe Rekap = Semester -->
            <template v-if="rekapType === 'semester'">
              <label class="text-xs font-semibold text-zinc-400">Semester</label>
              <select
                v-model="selectedSemester"
                :disabled="isLoading"
                class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </template>

            <!-- Jika Tipe Rekap = Bulanan -->
            <template v-else-if="rekapType === 'bulanan'">
              <label class="text-xs font-semibold text-zinc-400">Pilih Bulan</label>
              <select
                v-model="selectedMonth"
                :disabled="isLoading"
                class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
              >
                <option v-for="(name, index) in monthNames" :key="index" :value="index + 1">
                  {{ name }}
                </option>
              </select>
            </template>

            <!-- Jika Tipe Rekap = Mingguan / Kustom -->
            <template v-else-if="rekapType === 'mingguan'">
              <label class="text-xs font-semibold text-zinc-400">Rentang Tanggal</label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  v-model="startDate"
                  :disabled="isLoading"
                  class="h-10 px-2 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs"
                />
                <input
                  type="date"
                  v-model="endDate"
                  :disabled="isLoading"
                  class="h-10 px-2 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs"
                />
              </div>
            </template>
          </div>
        </div>

        <!-- Main Content Area -->
        <div
          class="rounded-xl border border-zinc-700/40 bg-zinc-900/20 overflow-hidden"
        >
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-16">
            <Loader2
              class="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3"
            />
            <p class="text-zinc-400 text-sm">Menghitung rekap absensi...</p>
          </div>

          <!-- Empty State (No Class Selected) -->
          <div v-else-if="!selectedClass" class="text-center py-16 px-4">
            <ClipboardList
              class="w-16 h-16 text-zinc-500 mx-auto mb-3"
              stroke-width="1.5"
            />
            <p class="text-zinc-400 font-semibold text-lg">Kelas belum dipilih</p>
            <p class="text-zinc-500 text-sm mt-1">
              Silakan pilih kelas terlebih dahulu untuk melihat rekapitulasi
              kehadiran.
            </p>
          </div>

          <!-- Empty State (No Rekap Data) -->
          <div v-else-if="rekapData.length === 0" class="text-center py-16 px-4">
            <Users
              class="w-16 h-16 text-zinc-500 mx-auto mb-3"
              stroke-width="1.5"
            />
            <p class="text-zinc-400 font-semibold text-lg">Tidak ada data</p>
            <p class="text-zinc-500 text-sm mt-1" v-if="rekapType === 'semester'">
              Belum ada rekaman absensi terisi di kelas
              {{ currentClassName }} pada {{ selectedTapel }} -
              {{ selectedSemester }}.
            </p>
            <p class="text-zinc-500 text-sm mt-1" v-else-if="rekapType === 'bulanan'">
              Belum ada rekaman absensi terisi di kelas
              {{ currentClassName }} pada Bulan {{ monthNames[selectedMonth - 1] }} ({{ selectedTapel }}).
            </p>
            <p class="text-zinc-500 text-sm mt-1" v-else-if="rekapType === 'mingguan'">
              Belum ada rekaman absensi terisi di kelas
              {{ currentClassName }} pada Rentang {{ formatDateIndo(startDate) }} s.d. {{ formatDateIndo(endDate) }}.
            </p>
          </div>

          <!-- Rekap Table -->
          <div v-else class="flex flex-col">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr
                    class="bg-zinc-800/40 border-b border-zinc-700/50 text-zinc-300 uppercase text-xs font-semibold"
                  >
                    <th class="py-4 px-4 text-center w-12" rowspan="2">No</th>
                    <th class="py-4 px-4" rowspan="2">Nama Siswa</th>
                    <th class="py-4 px-4 w-28 text-center" rowspan="2">NISN</th>
                    <th
                      class="py-2 px-4 text-center border-b border-zinc-700/40"
                      colspan="4"
                    >
                      Kehadiran (Hari)
                    </th>
                    <th class="py-4 px-4 text-center w-24" rowspan="2">
                      Hari Efektif
                    </th>
                    <th class="py-4 px-4 text-center w-24" rowspan="2">
                      Persentase
                    </th>
                  </tr>
                  <tr
                    class="bg-zinc-800/20 border-b border-zinc-700/50 text-zinc-400 text-[10px]"
                  >
                    <th class="py-2 px-2 text-center w-12 text-emerald-600 dark:text-emerald-400">
                      Hadir
                    </th>
                    <th class="py-2 px-2 text-center w-12 text-amber-600 dark:text-amber-400">
                      Sakit
                    </th>
                    <th class="py-2 px-2 text-center w-12 text-blue-600 dark:text-blue-400">Izin</th>
                    <th class="py-2 px-2 text-center w-12 text-red-600 dark:text-red-400">Alpa</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/60 text-zinc-300">
                  <tr
                    v-for="(siswa, idx) in rekapData"
                    :key="siswa.siswa_id"
                    class="hover:bg-zinc-800/10 transition-colors"
                  >
                    <td class="py-4 px-4 text-center text-zinc-500 font-mono">
                      {{ idx + 1 }}
                    </td>
                    <td class="py-4 px-4 font-semibold text-zinc-100">
                      {{ toTitleCase(siswa.nama) }}
                    </td>
                    <td class="py-4 px-4 text-center text-zinc-400 font-mono">
                      {{ siswa.nisn || "-" }}
                    </td>
                    <td
                      class="py-4 px-2 text-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/[0.06] dark:bg-emerald-500/[0.02]"
                    >
                      {{ siswa.total_hadir }}
                    </td>
                    <td class="py-4 px-2 text-center text-amber-600 dark:text-amber-400">
                      {{ siswa.total_sakit }}
                    </td>
                    <td class="py-4 px-2 text-center text-blue-600 dark:text-blue-400">
                      {{ siswa.total_izin }}
                    </td>
                    <td class="py-4 px-2 text-center text-red-600 dark:text-red-400">
                      {{ siswa.total_alpa }}
                    </td>
                    <td class="py-4 px-4 text-center text-zinc-300 font-bold">
                      {{ siswa.total_hari_efektif }}
                    </td>
                    <td class="py-4 px-4 text-center">
                      <span
                        :class="[
                          parseFloat(
                            hitungPersentase(
                              siswa.total_hadir,
                              siswa.total_hari_efektif,
                            ),
                          ) >= 90
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/20 dark:border-emerald-800/30'
                            : parseFloat(
                                  hitungPersentase(
                                    siswa.total_hadir,
                                    siswa.total_hari_efektif,
                                  ),
                                ) >= 75
                              ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/20 dark:border-amber-800/30'
                              : 'text-red-700 dark:text-red-400 bg-red-500/10 dark:bg-red-950/30 border-red-500/20 dark:border-red-800/30',
                          'px-2 py-0.5 rounded text-[11px] font-mono border',
                        ]"
                      >
                        {{
                          hitungPersentase(
                            siswa.total_hadir,
                            siswa.total_hari_efektif,
                          )
                        }}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Bottom Action Info -->
            <div
              class="flex items-center justify-between p-4 bg-zinc-800/20 border-t border-zinc-700/40"
            >
              <div class="text-xs text-zinc-400">
                Total siswa:
                <span class="font-bold text-zinc-300">{{
                  rekapData.length
                }}</span>
                anak
              </div>
              <div class="text-xs text-zinc-500">
                Ket: H = Hadir, S = Sakit, I = Izin, A = Alpa
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB 2: STATUS PENGIRIMAN ABSENSI (New)       -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'status' && userRole === 'admin'">
        <!-- Filter Section for Status Tab -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border bg-zinc-800/20 border-zinc-700/40 mb-6"
        >
          <!-- Tahun Pelajaran -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-zinc-400">Tahun Pelajaran</label>
            <select
              v-model="statusTapel"
              :disabled="isLoadingStatus"
              class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            >
              <option v-for="opt in tapelOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </div>

          <!-- Semester -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-zinc-400">Semester</label>
            <select
              v-model="statusSemester"
              :disabled="isLoadingStatus"
              class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        </div>

        <!-- Summary Cards -->
        <div v-if="!isLoadingStatus && statusTableData.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <!-- Total Kelas -->
          <div class="p-4 rounded-xl border border-zinc-700/40 bg-zinc-800/20">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users class="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p class="text-xs text-zinc-500 font-medium">Total Kelas</p>
                <p class="text-xl font-bold text-zinc-100">{{ statusTableData.length }}</p>
              </div>
            </div>
          </div>

          <!-- Rata-rata Persentase -->
          <div class="p-4 rounded-xl border border-zinc-700/40 bg-zinc-800/20">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 class="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p class="text-xs text-zinc-500 font-medium">Rata-rata Pengiriman</p>
                <p class="text-xl font-bold text-zinc-100">{{ avgPersentaseStatus }}%</p>
              </div>
            </div>
          </div>

          <!-- Kelas Bermasalah -->
          <div class="p-4 rounded-xl border border-zinc-700/40 bg-zinc-800/20">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle class="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p class="text-xs text-zinc-500 font-medium">Kelas Belum Lengkap (< 75%)</p>
                <p class="text-xl font-bold text-red-400">{{ kelasRendahCount }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Table Content Area -->
        <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/20 overflow-hidden">
          <!-- Loading State -->
          <div v-if="isLoadingStatus" class="text-center py-16">
            <Loader2 class="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
            <p class="text-zinc-400 text-sm">Menghitung status pengiriman absensi...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="statusTableData.length === 0" class="text-center py-16 px-4">
            <BarChart3 class="w-16 h-16 text-zinc-500 mx-auto mb-3" stroke-width="1.5" />
            <p class="text-zinc-400 font-semibold text-lg">Belum ada data pengiriman</p>
            <p class="text-zinc-500 text-sm mt-1">
              Belum ada rekaman absensi pada {{ statusTapel }} - {{ statusSemester }}.
            </p>
          </div>

          <!-- Status Table -->
          <div v-else class="flex flex-col">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="bg-zinc-800/40 border-b border-zinc-700/50 text-zinc-300 uppercase text-xs font-semibold">
                    <th class="py-4 px-4 text-center w-12">No</th>
                    <th class="py-4 px-4">Kelas</th>
                    <th class="py-4 px-4">Wali Kelas</th>
                    <th class="py-4 px-4 text-center w-28">Hari Efektif</th>
                    <th class="py-4 px-4 text-center w-28">Sudah Diabsen</th>
                    <th class="py-4 px-4 text-center w-28">Belum Diabsen</th>
                    <th class="py-4 px-4 text-center w-36">Progress</th>
                    <th class="py-4 px-4 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/60 text-zinc-300">
                  <tr
                    v-for="(row, idx) in statusTableData"
                    :key="row.kelas_id"
                    class="hover:bg-zinc-800/10 transition-colors"
                  >
                    <td class="py-4 px-4 text-center text-zinc-500 font-mono">
                      {{ idx + 1 }}
                    </td>
                    <td class="py-4 px-4 font-semibold text-zinc-100">
                      {{ row.namaKelas }}
                    </td>
                    <td class="py-4 px-4 text-zinc-300">
                      {{ row.waliKelas || '-' }}
                    </td>
                    <td class="py-4 px-4 text-center text-zinc-300 font-bold">
                      {{ row.hariEfektif }}
                    </td>
                    <td class="py-4 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                      {{ row.sudahDiabsen }}
                    </td>
                    <td class="py-4 px-4 text-center font-bold"
                      :class="row.belumDiabsen > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'"
                    >
                      {{ row.belumDiabsen }}
                    </td>
                    <!-- Progress Bar -->
                    <td class="py-4 px-4">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-2.5 rounded-full bg-zinc-700/50 overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all duration-500"
                            :class="[
                              row.persentase >= 90 ? 'bg-emerald-500' :
                              row.persentase >= 75 ? 'bg-amber-500' : 'bg-red-500'
                            ]"
                            :style="{ width: Math.min(row.persentase, 100) + '%' }"
                          ></div>
                        </div>
                        <span class="text-xs font-mono text-zinc-400 w-12 text-right">{{ row.persentase.toFixed(1) }}%</span>
                      </div>
                    </td>
                    <!-- Status Badge -->
                    <td class="py-4 px-4 text-center">
                      <span
                        :class="[
                          row.persentase >= 90
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/20 dark:border-emerald-800/30'
                            : row.persentase >= 75
                              ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/20 dark:border-amber-800/30'
                              : 'text-red-700 dark:text-red-400 bg-red-500/10 dark:bg-red-950/30 border-red-500/20 dark:border-red-800/30',
                          'px-2.5 py-1 rounded-md text-[11px] font-semibold border inline-flex items-center gap-1',
                        ]"
                      >
                        <CheckCircle v-if="row.persentase >= 90" class="w-3 h-3" />
                        <AlertTriangle v-else-if="row.persentase >= 75" class="w-3 h-3" />
                        <XCircle v-else class="w-3 h-3" />
                        {{ row.persentase >= 90 ? 'Baik' : row.persentase >= 75 ? 'Cukup' : 'Kurang' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Bottom Info -->
            <div class="flex items-center justify-between p-4 bg-zinc-800/20 border-t border-zinc-700/40">
              <div class="text-xs text-zinc-400">
                Total kelas:
                <span class="font-bold text-zinc-300">{{ statusTableData.length }}</span>
                | Hari efektif semester:
                <span class="font-bold text-zinc-300">{{ totalHariEfektifSemester }}</span>
                hari
              </div>
              <div class="text-xs text-zinc-500">
                Periode: {{ statusPeriodeLabel }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Modal Cek Tanggal Belum Kirim Absen -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div
            v-if="showMissingModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <!-- Backdrop -->
            <div
              class="absolute inset-0 bg-black/75 backdrop-blur-sm"
              @click="showMissingModal = false"
            ></div>

            <!-- Modal Card -->
            <div
              class="relative z-10 w-full max-w-2xl theme-bg theme-border border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <!-- Modal Header -->
              <div
                class="flex items-center justify-between p-4 sm:p-5 theme-bg-secondary border-b theme-border shrink-0"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20"
                  >
                    <CalendarX class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 class="text-base font-bold theme-text">
                      Tanggal Belum Kirim Absen
                    </h3>
                    <p class="text-xs theme-text-muted">
                      Daftar hari efektif mengajar pada semester aktif yang belum diisi absensinya
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="showMissingModal = false"
                  class="p-2 rounded-lg theme-text-muted hover:theme-text hover:theme-bg-tertiary transition-colors"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Modal Controls / Filters -->
              <div
                class="p-4 theme-bg-secondary/50 border-b theme-border grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0"
              >
                <!-- Pilihan Kelas -->
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-semibold theme-text-muted">Pilih Kelas</label>
                  <select
                    v-model="missingSelectedClass"
                    :disabled="isWaliKelas && userRole === 'guru'"
                    class="h-9 px-3 rounded-lg theme-border border theme-bg theme-text text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="" disabled>-- Pilih Kelas --</option>
                    <option
                      v-for="k in accessibleClassesForMissing"
                      :key="k.id_kelas"
                      :value="k.id_kelas"
                    >
                      {{ k.nama_kelas }}
                    </option>
                  </select>
                </div>

                <!-- Summary Status -->
                <div class="flex items-center justify-end gap-2 text-xs">
                  <div class="px-3 py-1.5 rounded-lg theme-bg theme-border border text-center">
                    <span class="theme-text-muted block text-[10px]">Hari Efektif</span>
                    <span class="font-bold theme-text">{{ totalHariEfektifModal }}</span>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span class="text-emerald-600 dark:text-emerald-400 block text-[10px]">Sudah Kirim</span>
                    <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ totalSudahKirimModal }}</span>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                    <span class="text-amber-600 dark:text-amber-400 block text-[10px]">Belum Kirim</span>
                    <span class="font-bold text-amber-600 dark:text-amber-400">{{ missingDatesList.length }}</span>
                  </div>
                </div>
              </div>

              <!-- Modal Body / Content -->
              <div class="p-4 sm:p-5 overflow-y-auto flex-1">
                <!-- Loading State -->
                <div v-if="isLoadingMissing" class="text-center py-12">
                  <Loader2 class="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
                  <p class="text-xs theme-text-muted">Memeriksa tanggal absensi...</p>
                </div>

                <!-- No Class Selected -->
                <div v-else-if="!missingSelectedClass" class="text-center py-12">
                  <CalendarX class="w-12 h-12 theme-text-muted mx-auto mb-2 opacity-50" />
                  <p class="text-sm font-semibold theme-text">Silakan Pilih Kelas</p>
                  <p class="text-xs theme-text-muted mt-1">Pilih kelas di atas untuk melihat tanggal yang belum diabsen.</p>
                </div>

                <!-- All Submitted State -->
                <div v-else-if="missingDatesList.length === 0" class="text-center py-12">
                  <CheckCircle2 class="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                  <p class="text-base font-bold theme-text">Semua Absensi Sudah Terkirim!</p>
                  <p class="text-xs theme-text-muted mt-1 max-w-md mx-auto">
                    Tidak ada tanggal efektif mengajar yang terlewat pada semester aktif ini untuk kelas {{ currentMissingClassName }}.
                  </p>
                </div>

                <!-- List of Missing Dates -->
                <div v-else class="flex flex-col gap-2.5">
                  <div
                    v-for="item in missingDatesList"
                    :key="item.dateStr"
                    class="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border theme-border theme-bg-secondary hover:theme-bg-tertiary transition-colors"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        {{ item.dayNum }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-bold theme-text truncate">
                          {{ item.formattedDate }}
                        </p>
                        <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span class="text-[11px] font-medium theme-text-muted">
                            Hari {{ item.namaHari }}
                          </span>
                          <span
                            v-if="item.isJadwalMapel"
                            class="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20"
                          >
                            Jadwal Mapel
                          </span>
                          <span
                            v-else-if="item.isWali"
                            class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20"
                          >
                            Wali Kelas
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Direct Action Link -->
                    <button
                      type="button"
                      @click="goToInputAbsensi(item.dateStr, missingSelectedClass)"
                      class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                    >
                      <span>Isi Absen</span>
                      <ExternalLink class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="p-4 theme-bg-secondary border-t theme-border flex items-center justify-between shrink-0 text-xs theme-text-muted">
                <span>Periode Semester Aktif: <strong>{{ awalSemesterAktifStr }} s.d. {{ todayStr }}</strong></span>
                <button
                  type="button"
                  @click="showMissingModal = false"
                  class="px-4 py-2 rounded-xl theme-border border theme-bg theme-text font-semibold hover:theme-bg-tertiary transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import {
  ClipboardList,
  Loader2,
  Users,
  Download,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CalendarX,
  CheckCircle2,
  ExternalLink,
  X,
} from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import PrintButton from "~/components/ui/PrintButton.vue";
import KopSurat from "~/components/document/KopSurat.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useAuth } from "~/composables/auth/useAuth";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch, fetchFromApi } from "~/utils/api";
import { dapatkanTahunDanSemester, dapatkanAwalSemesterAktif } from "~/utils/dateHelper";
import * as XLSX from "xlsx";

// --- Services & Config
const { Notify } = useNotiflix();
const { getUserRole, getGtkId } = useAuth();
const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();

// --- Tab State
const activeTab = ref("kehadiran");

// --- States (Tab 1: Rekap Kehadiran - existing)
const selectedClass = ref("");
const selectedTapel = ref("");
const selectedSemester = ref("Ganjil");
const rekapType = ref("semester");
const selectedMonth = ref(new Date().getMonth() + 1);
const startDate = ref("");
const endDate = ref("");
const rekapData = ref([]);

const userRole = ref("");
const userGtkId = ref(null);
const isWaliKelas = ref(false);
const selectedWaliClassId = ref("");
const waliKelasName = ref("");

const isLoading = ref(false);
const isLoadingKelas = ref(false);
const isExporting = ref(false);
const isExportingStatus = ref(false);
const printTimestamp = ref("");

// --- States (Tab 2: Status Pengiriman)
const statusTapel = ref("");
const statusSemester = ref("Ganjil");
const isLoadingStatus = ref(false);
const statusRawData = ref([]); // Data dari API rekap-status
const dataGtk = ref([]); // Data GTK untuk lookup nama wali kelas
const hariLiburKalender = ref([]); // Hari libur dari kalender pendidikan
const hariLiburMingguanIndex = ref(0); // 0 = Minggu

const { cardData: jadwalData, loadData: loadJadwal } = useTableData();

// --- States (Modal Tanggal Belum Kirim)
const showMissingModal = ref(false);
const missingSelectedClass = ref("");
const isLoadingMissing = ref(false);
const missingDatesList = ref([]);
const totalHariEfektifModal = ref(0);
const totalSudahKirimModal = ref(0);


const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diffToMonday));
  const sunday = new Date(now.setDate(diffToMonday + 6));
  
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };
  
  return {
    start: formatDate(monday),
    end: formatDate(sunday),
  };
};

const formatDateIndo = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const monthRange = computed(() => {
  if (!selectedTapel.value || !selectedMonth.value) return null;
  const parts = selectedTapel.value.split("/");
  if (parts.length !== 2) return null;
  const year = selectedMonth.value >= 7 ? parseInt(parts[0]) : parseInt(parts[1]);
  
  const startDay = "01";
  const formattedMonth = String(selectedMonth.value).padStart(2, "0");
  const startDateStr = `${year}-${formattedMonth}-${startDay}`;
  
  const lastDay = new Date(year, selectedMonth.value, 0).getDate();
  const endDateStr = `${year}-${formattedMonth}-${String(lastDay).padStart(2, "0")}`;
  
  return {
    start: startDateStr,
    end: endDateStr,
  };
});

// --- Computed Options
const tapelOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    options.push(`${y}/${y + 1}`);
  }
  return options;
});

const currentClassName = computed(() => {
  if (!selectedClass.value) return "";
  const match = dataKelas.value.find((k) => k.idKelas === selectedClass.value);
  return match ? match.namaKelas : selectedClass.value;
});

// --- Computed: Status Pengiriman (Tab 2) ---

/**
 * Menghitung rentang tanggal semester berdasarkan tahun pelajaran dan semester.
 * Ganjil: 1 Juli - 31 Desember (atau hari ini jika lebih kecil)
 * Genap: 1 Januari - 30 Juni (atau hari ini jika lebih kecil)
 */
const semesterDateRange = computed(() => {
  if (!statusTapel.value) return null;
  const parts = statusTapel.value.split("/");
  if (parts.length !== 2) return null;

  const tahunAwal = parseInt(parts[0]);
  const tahunAkhir = parseInt(parts[1]);

  let rangeStart, rangeEnd;
  if (statusSemester.value === "Ganjil") {
    rangeStart = `${tahunAwal}-07-01`;
    rangeEnd = `${tahunAwal}-12-31`;
  } else {
    rangeStart = `${tahunAkhir}-01-01`;
    rangeEnd = `${tahunAkhir}-06-30`;
  }

  // Batasi akhir ke hari ini jika semester belum selesai
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (rangeEnd > todayStr) {
    rangeEnd = todayStr;
  }

  // Jika start > end (semester belum mulai), return null
  if (rangeStart > rangeEnd) return null;

  return { start: rangeStart, end: rangeEnd };
});

/**
 * Menghitung total hari efektif dalam rentang semester
 * (mengurangi hari libur mingguan dan hari libur kalender)
 */
const totalHariEfektifSemester = computed(() => {
  if (!semesterDateRange.value) return 0;

  const { start, end } = semesterDateRange.value;
  let count = 0;
  const current = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");

  while (current <= endDate) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    
    // Skip hari libur mingguan
    if (current.getDay() === hariLiburMingguanIndex.value) {
      current.setDate(current.getDate() + 1);
      continue;
    }
    
    // Skip hari libur kalender
    const isHoliday = hariLiburKalender.value.some(
      (h) => dateStr >= h.tanggal_mulai && dateStr <= h.tanggal_selesai,
    );
    if (isHoliday) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
});

/**
 * Map dari ID / PegID / nama guru → nama lengkap.
 * Digunakan untuk resolve field waliKelas di DataKelas yang bisa berisi
 * ID guru (id), PegID, atau nama langsung.
 */
const gtkNameMap = computed(() => {
  const map = {};
  dataGtk.value.forEach((g) => {
    const nama = toTitleCase(
      g.title || g.NamaLengkap || g["Nama Lengkap"] || g.nama_lengkap || "",
    );
    if (!nama) return;

    // Index by numeric id
    if (g.id != null) map[String(g.id).trim()] = nama;
    // Index by PegID
    const pegId = g.PegID || g["Peg ID"] || g.peg_id;
    if (pegId) map[String(pegId).trim()] = nama;
    // Index by cleaned name (fallback)
    const nameLower = nama.toLowerCase();
    if (nameLower) map[nameLower] = nama;
  });
  return map;
});

/**
 * Resolve nilai waliKelas (bisa berupa ID, PegID, atau nama) ke nama lengkap.
 */
const resolveWaliKelasName = (raw) => {
  if (!raw) return "";
  const trimmed = raw.trim();
  // Coba lookup langsung (by ID / PegID)
  if (gtkNameMap.value[trimmed]) return gtkNameMap.value[trimmed];
  // Coba lookup by nama lowercase
  const lower = trimmed.toLowerCase();
  if (gtkNameMap.value[lower]) return gtkNameMap.value[lower];
  // Fallback: tampilkan apa adanya dengan title case
  return toTitleCase(trimmed);
};

/**
 * Menggabungkan data kelas dengan data status pengiriman
 * Menghasilkan tabel lengkap untuk ditampilkan
 */
const statusTableData = computed(() => {
  if (!dataKelas.value || dataKelas.value.length === 0) return [];

  const hariEfektif = totalHariEfektifSemester.value;

  // Buat map dari statusRawData
  const statusMap = {};
  statusRawData.value.forEach((item) => {
    statusMap[item.kelas_id] = item.total_hari_diabsen || 0;
  });

  return dataKelas.value.map((kelas) => {
    const kelasId = kelas.idKelas;
    const sudahDiabsen = statusMap[kelasId] || 0;
    const belumDiabsen = Math.max(0, hariEfektif - sudahDiabsen);
    const persentase = hariEfektif > 0 ? (sudahDiabsen / hariEfektif) * 100 : 0;

    return {
      kelas_id: kelasId,
      namaKelas: kelas.namaKelas || kelasId,
      waliKelas: resolveWaliKelasName(kelas.waliKelas || kelas["Wali Kelas"] || kelas.wali_kelas || ""),
      hariEfektif,
      sudahDiabsen,
      belumDiabsen,
      persentase,
    };
  });
});

const avgPersentaseStatus = computed(() => {
  if (statusTableData.value.length === 0) return "0.0";
  const total = statusTableData.value.reduce((sum, row) => sum + row.persentase, 0);
  return (total / statusTableData.value.length).toFixed(1);
});

const kelasRendahCount = computed(() => {
  return statusTableData.value.filter((row) => row.persentase < 75).length;
});

const statusPeriodeLabel = computed(() => {
  if (!semesterDateRange.value) return "-";
  return `${formatDateIndo(semesterDateRange.value.start)} s.d. ${formatDateIndo(semesterDateRange.value.end)}`;
});

// --- Methods
const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

function cleanName(name) {
  if (!name) return "";
  let cleaned = name.split(",")[0];
  cleaned = cleaned.replace(/^(h\.|hj\.|dra\.|drs\.|prof\.|dr\.)\s+/gi, "");
  return cleaned.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

const hitungPersentase = (hadir, total) => {
  if (!total || total === 0) return "0.0";
  return ((hadir / total) * 100).toFixed(1);
};

// Fetch rekap when filters change
watch(
  [selectedClass, selectedTapel, selectedSemester, rekapType, selectedMonth, startDate, endDate],
  async () => {
    if (!selectedClass.value || !selectedTapel.value) {
      rekapData.value = [];
      return;
    }
    await fetchRekap();
  },
);

const fetchRekap = async () => {
  isLoading.value = true;
  try {
    let url = `/api/absensi/rekap?kelas_id=${encodeURIComponent(selectedClass.value)}&tahun_pelajaran=${encodeURIComponent(selectedTapel.value)}`;
    
    if (rekapType.value === "semester") {
      url += `&semester=${encodeURIComponent(selectedSemester.value)}`;
    } else if (rekapType.value === "bulanan" && monthRange.value) {
      url += `&start_date=${encodeURIComponent(monthRange.value.start)}&end_date=${encodeURIComponent(monthRange.value.end)}`;
    } else if (rekapType.value === "mingguan") {
      if (!startDate.value || !endDate.value) {
        rekapData.value = [];
        isLoading.value = false;
        return;
      }
      url += `&start_date=${encodeURIComponent(startDate.value)}&end_date=${encodeURIComponent(endDate.value)}`;
    }
    
    const response = await authenticatedFetch(url);
    const data = await response.json();
    if (Array.isArray(data)) {
      rekapData.value = data;
    } else {
      rekapData.value = [];
    }
  } catch (err) {
    console.error("Gagal memuat rekap absensi:", err);
    Notify.failure("Gagal mengambil data rekap absensi");
    rekapData.value = [];
  } finally {
    isLoading.value = false;
  }
};

// --- Status Pengiriman Methods (Tab 2) ---

const switchToStatusTab = () => {
  if (userRole.value !== "admin") return;
  activeTab.value = "status";
  if (!statusRawData.value.length && statusTapel.value && statusSemester.value) {
    fetchStatusData();
  }
};

const fetchStatusData = async () => {
  if (!statusTapel.value || !statusSemester.value) return;
  
  isLoadingStatus.value = true;
  try {
    // 1. Fetch status pengiriman dari API
    const url = `/api/absensi/rekap-status?tahun_pelajaran=${encodeURIComponent(statusTapel.value)}&semester=${encodeURIComponent(statusSemester.value)}`;
    const response = await authenticatedFetch(url);
    const data = await response.json();
    if (Array.isArray(data)) {
      statusRawData.value = data;
    } else {
      statusRawData.value = [];
    }

    // 2. Fetch kalender pendidikan (hari libur)
    const kalenderData = await fetchFromApi("kalender_pendidikan", false, null, {
      filter_col: "tahun_pelajaran",
      filter_val: statusTapel.value,
    });
    if (Array.isArray(kalenderData)) {
      hariLiburKalender.value = kalenderData.filter((item) => item.tipe === "libur");
    }

    // 3. Fetch pengaturan hari libur mingguan
    const configData = await fetchFromApi("pengaturan_tapel", false, null, {
      filter_col: "tahun_pelajaran",
      filter_val: statusTapel.value,
    });
    if (Array.isArray(configData) && configData.length > 0) {
      const match = configData.find((item) => item.tahun_pelajaran === statusTapel.value);
      if (match) {
        hariLiburMingguanIndex.value = parseInt(match.hari_libur_mingguan);
      } else {
        hariLiburMingguanIndex.value = 0;
      }
    } else {
      hariLiburMingguanIndex.value = 0;
    }
  } catch (err) {
    console.error("Gagal memuat data status pengiriman:", err);
    Notify.failure("Gagal mengambil data status pengiriman absensi");
    statusRawData.value = [];
  } finally {
    isLoadingStatus.value = false;
  }
};

// Watch untuk auto-fetch saat filter status berubah
watch([statusTapel, statusSemester], () => {
  if (activeTab.value === "status" && statusTapel.value && statusSemester.value) {
    fetchStatusData();
  }
});

// Check if logged-in guru is Wali Kelas of a class
const checkWaliKelasStatus = async () => {
  userRole.value = getUserRole();
  const gId = getGtkId();
  userGtkId.value = gId ? parseInt(gId) : null;

  if (userRole.value === "guru" && userGtkId.value) {
    try {
      const gtkData = await fetchFromApi("DataGtk", false, null, {
        filter_col: "id",
        filter_val: String(userGtkId.value),
      });

      if (Array.isArray(gtkData)) {
        const myRecord = gtkData.find(
          (g) =>
            g.id === userGtkId.value ||
            g.ID === userGtkId.value ||
            String(g.id) === String(userGtkId.value),
        );

        if (myRecord) {
          const namaGuru =
            myRecord.title ||
            myRecord.NamaLengkap ||
            myRecord["Nama Lengkap"] ||
            myRecord.nama_lengkap;
          waliKelasName.value = namaGuru;

          // Match teacher ID, Peg ID, or name with wali_kelas in classes list (backward compatibility)
          const classes = dataKelas.value;
          const myClass = classes.find((c) => {
            const cWali = c.waliKelas || c["Wali Kelas"] || c.wali_kelas;
            const myPegId =
              myRecord.PegID || myRecord["Peg ID"] || myRecord.peg_id;
            const myId = myRecord.id || myRecord._id;

            const matchName = cleanName(cWali) === cleanName(namaGuru);
            const matchPegId = String(cWali).trim() === String(myPegId).trim();
            const matchId = String(cWali).trim() === String(myId).trim();

            return matchId || matchPegId || matchName;
          });

          if (myClass) {
            isWaliKelas.value = true;
            selectedWaliClassId.value = myClass.idKelas || myClass["ID Kelas"];
            selectedClass.value = myClass.idKelas || myClass["ID Kelas"];
          }
        }
      }
    } catch (err) {
      console.error("Gagal validasi status wali kelas:", err);
    }
  }
};

const updatePrintTimestamp = () => {
  const now = new Date();
  printTimestamp.value =
    now.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }) + " WITA";
};

// Export rekap to Excel
const exportToExcel = async () => {
  if (rekapData.value.length === 0) return;

  try {
    isExporting.value = true;

    // Map raw data to user-friendly excel rows
    const excelRows = rekapData.value.map((siswa, index) => ({
      No: index + 1,
      "Nama Siswa": toTitleCase(siswa.nama),
      NISN: siswa.nisn || "-",
      "Hadir (H)": siswa.total_hadir,
      "Sakit (S)": siswa.total_sakit,
      "Izin (I)": siswa.total_izin,
      "Alpa (A)": siswa.total_alpa,
      "Hari Efektif": siswa.total_hari_efektif,
      "Persentase Kehadiran (%)": `${hitungPersentase(siswa.total_hadir, siswa.total_hari_efektif)}%`,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelRows);

    // Set Column Widths
    ws["!cols"] = [
      { wch: 5 }, // No
      { wch: 28 }, // Nama
      { wch: 15 }, // NISN
      { wch: 10 }, // H
      { wch: 10 }, // S
      { wch: 10 }, // I
      { wch: 10 }, // A
      { wch: 12 }, // Hari Efektif
      { wch: 24 }, // Persentase
    ];

    // Apply header style (emerald-600 background)
    const headerKeys = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1"];
    headerKeys.forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");

    const dateStr = new Date().toISOString().slice(0, 10);
    let periodSuffix = "";
    if (rekapType.value === "semester") {
      periodSuffix = `Smt_${selectedSemester.value}`;
    } else if (rekapType.value === "bulanan") {
      periodSuffix = `Bulan_${monthNames[selectedMonth.value - 1]}`;
    } else if (rekapType.value === "mingguan") {
      periodSuffix = `Rentang_${startDate.value}_sd_${endDate.value}`;
    }
    const filename = `Rekap_Absensi_${currentClassName.value.replace(/[^a-zA-Z0-9]/g, "_")}_${periodSuffix}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);

    setTimeout(() => {
      Notify.success(`Rekap berhasil diekspor ke file: ${filename}`);
    }, 100);
  } catch (err) {
    console.error("Gagal export excel:", err);
    Notify.failure("Gagal mengekspor rekap absensi.");
  } finally {
    isExporting.value = false;
  }
};

// Export status pengiriman ke Excel
const exportStatusToExcel = async () => {
  if (statusTableData.value.length === 0) return;

  try {
    isExportingStatus.value = true;

    const excelRows = statusTableData.value.map((row, index) => ({
      No: index + 1,
      Kelas: row.namaKelas,
      "Wali Kelas": row.waliKelas || "-",
      "Hari Efektif": row.hariEfektif,
      "Sudah Diabsen": row.sudahDiabsen,
      "Belum Diabsen": row.belumDiabsen,
      "Persentase (%)": `${row.persentase.toFixed(1)}%`,
      Status: row.persentase >= 90 ? "Baik" : row.persentase >= 75 ? "Cukup" : "Kurang",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelRows);

    // Set Column Widths
    ws["!cols"] = [
      { wch: 5 },  // No
      { wch: 20 }, // Kelas
      { wch: 28 }, // Wali Kelas
      { wch: 14 }, // Hari Efektif
      { wch: 16 }, // Sudah Diabsen
      { wch: 16 }, // Belum Diabsen
      { wch: 15 }, // Persentase
      { wch: 10 }, // Status
    ];

    // Header style
    const headerKeys = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"];
    headerKeys.forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, "Status Pengiriman");

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Status_Pengiriman_Absensi_Smt_${statusSemester.value}_${statusTapel.value.replace("/", "-")}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);

    setTimeout(() => {
      Notify.success(`Data berhasil diekspor ke file: ${filename}`);
    }, 100);
  } catch (err) {
    console.error("Gagal export status excel:", err);
    Notify.failure("Gagal mengekspor data status pengiriman.");
  } finally {
    isExportingStatus.value = false;
  }
};

// --- Logic & Helpers Modal Cek Tanggal Belum Kirim Absen ---
const awalSemesterAktifStr = computed(() => {
  return dapatkanAwalSemesterAktif(new Date());
});

const todayStr = computed(() => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

const accessibleClassesForMissing = computed(() => {
  if (!dataKelas.value) return [];
  if (userRole.value === "admin") {
    return dataKelas.value.map(c => ({ id_kelas: c.idKelas, nama_kelas: c.namaKelas }));
  }
  if (userRole.value === "guru") {
    const list = [];
    if (isWaliKelas.value && selectedWaliClassId.value) {
      const match = dataKelas.value.find(c => c.idKelas === selectedWaliClassId.value);
      if (match) list.push({ id_kelas: match.idKelas, nama_kelas: match.namaKelas });
    }
    (jadwalData.value || []).forEach(sch => {
      const gId = sch.guru_id || sch.guruId || sch.guru;
      const cId = sch.kelas_id || sch.kelasId || sch.kelas;
      if (String(gId) === String(userGtkId.value)) {
        if (!list.some(item => item.id_kelas === cId)) {
          const match = dataKelas.value.find(c => c.idKelas === cId);
          if (match) list.push({ id_kelas: match.idKelas, nama_kelas: match.namaKelas });
        }
      }
    });
    if (list.length === 0) {
      return dataKelas.value.map(c => ({ id_kelas: c.idKelas, nama_kelas: c.namaKelas }));
    }
    return list;
  }
  return [];
});

const currentMissingClassName = computed(() => {
  if (!missingSelectedClass.value) return "";
  const match = dataKelas.value.find((k) => k.idKelas === missingSelectedClass.value);
  return match ? match.namaKelas : missingSelectedClass.value;
});

const NAMA_HARI_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const openMissingModal = async () => {
  showMissingModal.value = true;
  if (!missingSelectedClass.value) {
    if (selectedClass.value) {
      missingSelectedClass.value = selectedClass.value;
    } else if (accessibleClassesForMissing.value.length > 0) {
      missingSelectedClass.value = accessibleClassesForMissing.value[0].id_kelas;
    }
  }
  await fetchAndCalculateMissingDates();
};

watch(missingSelectedClass, async (newVal) => {
  if (showMissingModal.value && newVal) {
    await fetchAndCalculateMissingDates();
  }
});

const checkSubmittedStatusForDate = async (dateStr, classId) => {
  try {
    const response = await authenticatedFetch(
      `/api/absensi?tanggal=${encodeURIComponent(dateStr)}&kelas_id=${encodeURIComponent(classId)}`
    );
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.some((s) => s.status !== null && s.status !== undefined);
    }
    return false;
  } catch {
    return false;
  }
};

const fetchAndCalculateMissingDates = async () => {
  if (!missingSelectedClass.value) {
    missingDatesList.value = [];
    totalHariEfektifModal.value = 0;
    totalSudahKirimModal.value = 0;
    return;
  }

  isLoadingMissing.value = true;
  try {
    // 1. Load kalender pendidikan jika belum ada
    if (!hariLiburKalender.value.length && selectedTapel.value) {
      try {
        const kalenderData = await fetchFromApi("kalender_pendidikan", false, null, {
          filter_col: "tahun_pelajaran",
          filter_val: selectedTapel.value,
        });
        if (Array.isArray(kalenderData)) {
          hariLiburKalender.value = kalenderData.filter((item) => item.tipe === "libur");
        }
      } catch (e) {
        console.error("Gagal load kalender:", e);
      }
    }

    // 2. Ambil jadwal mengajar guru ini untuk kelas terpilih
    const scheduledDays = new Set();
    if (userRole.value === "guru" && userGtkId.value) {
      (jadwalData.value || []).forEach((sch) => {
        const gId = sch.guru_id || sch.guruId || sch.guru;
        const cId = sch.kelas_id || sch.kelasId || sch.kelas;
        if (String(gId) === String(userGtkId.value) && String(cId) === String(missingSelectedClass.value)) {
          if (sch.hari) {
            scheduledDays.add(String(sch.hari).trim().toLowerCase());
          }
        }
      });
    }

    const isWaliOfClass = isWaliKelas.value && selectedWaliClassId.value === missingSelectedClass.value;
    const isTeacherRole = userRole.value === "guru";

    // 3. Kumpulkan daftar tanggal wajib dari awal semester aktif s.d hari ini
    const start = new Date(awalSemesterAktifStr.value + "T00:00:00");
    const end = new Date(todayStr.value + "T00:00:00");

    const requiredCandidates = [];
    const current = new Date(start);

    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const dayIndex = current.getDay();
      const namaHari = NAMA_HARI_MAP[dayIndex];
      const namaHariLower = namaHari.toLowerCase();

      // Skip libur mingguan
      if (dayIndex === hariLiburMingguanIndex.value) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Skip libur kalender
      const isHoliday = hariLiburKalender.value.some(
        (h) => dateStr >= h.tanggal_mulai && dateStr <= h.tanggal_selesai,
      );
      if (isHoliday) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Evaluasi apakah tanggal ini wajib diabsen sesuai peran
      let isRequired = false;
      let isJadwalMapel = false;

      if (userRole.value === "admin" || isWaliOfClass) {
        isRequired = true;
      } else if (isTeacherRole) {
        if (scheduledDays.has(namaHariLower)) {
          isRequired = true;
          isJadwalMapel = true;
        }
      }

      if (isRequired) {
        requiredCandidates.push({
          dateStr,
          formattedDate: formatDateIndo(dateStr),
          dayNum: d,
          namaHari,
          isJadwalMapel,
          isWali: isWaliOfClass,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    // 4. Periksa status pengisian absensi pada setiap tanggal wajib menggunakan API absensi yang terbukti valid
    let totalEfektif = requiredCandidates.length;
    let totalSudah = 0;
    const missingList = [];

    // Lakukan pemeriksaan dalam batch paralel (misal 10 sekaligus)
    const BATCH_SIZE = 10;
    for (let i = 0; i < requiredCandidates.length; i += BATCH_SIZE) {
      const batch = requiredCandidates.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          const isSubmitted = await checkSubmittedStatusForDate(
            item.dateStr,
            missingSelectedClass.value
          );
          return { item, isSubmitted };
        })
      );

      batchResults.forEach(({ item, isSubmitted }) => {
        if (isSubmitted) {
          totalSudah++;
        } else {
          missingList.push(item);
        }
      });
    }

    // Urutkan tanggal terbaru paling atas
    missingList.sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    missingDatesList.value = missingList;
    totalHariEfektifModal.value = totalEfektif;
    totalSudahKirimModal.value = totalSudah;
  } catch (err) {
    console.error("Gagal menghitung tanggal belum kirim absensi:", err);
    Notify.failure("Gagal memuat tanggal belum kirim absensi");
  } finally {
    isLoadingMissing.value = false;
  }
};


const goToInputAbsensi = (dateStr, classId) => {
  showMissingModal.value = false;
  navigateTo({
    path: "/absensi/siswa",
    query: { tanggal: dateStr, kelas_id: classId },
  });
};

// --- Lifecycle
onMounted(async () => {
  isLoadingKelas.value = true;
  userRole.value = getUserRole() || "";

  // Set default Tapel, Semester & Dates
  const currentInfo = dapatkanTahunDanSemester(new Date());
  selectedTapel.value = currentInfo.tahunPelajaran;
  selectedSemester.value = currentInfo.semester;
  
  // Set default status tab filters to match
  statusTapel.value = currentInfo.tahunPelajaran;
  statusSemester.value = currentInfo.semester;
  
  const week = getWeekRange();
  startDate.value = week.start;
  endDate.value = week.end;

  updatePrintTimestamp();

  try {
    await loadDataKelas("DataKelas");
    await loadJadwal("jadwal_pelajaran");

    // Fetch DataGtk untuk lookup nama wali kelas
    try {
      const gtkRaw = await fetchFromApi("DataGtk", false, null, {});
      if (Array.isArray(gtkRaw)) {
        dataGtk.value = gtkRaw;
      }
    } catch (e) {
      console.error("Gagal memuat DataGtk:", e);
    }

    await checkWaliKelasStatus();
  } catch (err) {
    console.error(err);
  } finally {
    isLoadingKelas.value = false;
  }
});

</script>
