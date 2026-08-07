<template>
  <div class="min-h-screen">
    <!-- Main Container -->
    <div class="page-layout px-4 sm:px-6">
      <!-- Welcome Header -->
      <div class="mt-6 p-5 sm:p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md"
        :style="{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }">
        <!-- Background Glow effects -->
        <div class="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 group-hover:scale-110 transition-transform duration-500"></div>
        <div class="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-violet-500/10 dark:bg-violet-500/5 group-hover:scale-110 transition-transform duration-500"></div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div class="flex items-center gap-4">
            <div class="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 transform group-hover:scale-105 transition-transform duration-300">
              <User class="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <p class="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                Selamat Datang, {{ userRoleLabel }}
              </p>
              <h1 class="text-xl sm:text-2xl font-bold mt-1 tracking-tight" :style="{ color: 'var(--text-heading)' }">
                {{ userDisplayName || 'Pengguna Sopokdate' }}
              </h1>
              <p class="text-xs sm:text-sm mt-0.5" :style="{ color: 'var(--text-secondary)' }">
                Senang melihat Anda kembali. Akses dan kelola data madrasah Anda dengan mudah.
              </p>
            </div>
          </div>
          
          <div class="hidden sm:block text-right">
            <div class="text-xs" :style="{ color: 'var(--text-muted)' }">Tanggal Hari Ini</div>
            <div class="text-sm font-semibold mt-1" :style="{ color: 'var(--text-secondary)' }">
              {{ currentFormattedDate }}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Action Cards Section -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Card 1: Rekap Tanggal Absen Belum Terkirim -->
        <div
          @click="openMissingModal"
          class="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col justify-between"
          :style="{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform duration-300 border border-amber-500/20">
              <CalendarX class="w-6 h-6" />
            </div>
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span>Semester Aktif</span>
            </span>
          </div>
          <div>
            <h3 class="text-base font-bold mb-1 group-hover:text-emerald-500 transition-colors" :style="{ color: 'var(--text-heading)' }">
              Tanggal Belum Kirim Absen
            </h3>
            <p class="text-xs leading-relaxed" :style="{ color: 'var(--text-secondary)' }">
              <template v-if="userRole === 'guru'">
                {{ isWaliKelas ? 'Cek tanggal absensi kelas binaan & mapel mengajar Anda yang belum terkirim' : 'Cek tanggal absensi jadwal mengajar mapel Anda yang belum terkirim' }}
              </template>
              <template v-else>
                Cek rincian tanggal absensi siswa per kelas yang belum terkirim pada semester ini
              </template>
            </p>
          </div>
          <div class="mt-4 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 pt-3 border-t" :style="{ borderColor: 'var(--border-subtle)' }">
            <span>Periksa Tanggal Belum Absen</span>
            <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <!-- Card 2: Lihat Jadwal Hari Ini -->
        <div
          @click="openTodayScheduleModal"
          class="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col justify-between"
          :style="{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-300 border border-emerald-500/20">
              <Clock class="w-6 h-6" />
            </div>
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span>Hari {{ namaHariIni }}</span>
            </span>
          </div>
          <div>
            <h3 class="text-base font-bold mb-1 group-hover:text-emerald-500 transition-colors" :style="{ color: 'var(--text-heading)' }">
              Jadwal Mengajar Hari Ini
            </h3>
            <p class="text-xs leading-relaxed" :style="{ color: 'var(--text-secondary)' }">
              <template v-if="userRole === 'guru'">
                Lihat daftar jam mengajar, mata pelajaran, dan kelas Anda pada hari {{ namaHariIni }}
              </template>
              <template v-else>
                Lihat seluruh distribusi jadwal pelajaran harian madrasah pada hari {{ namaHariIni }}
              </template>
            </p>
          </div>
          <div class="mt-4 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-3 border-t" :style="{ borderColor: 'var(--border-subtle)' }">
            <span>Lihat Jam & Kelas Hari Ini</span>
            <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      <!-- Announcement Section -->
      <header class="mt-6 pb-12">
        <div class="group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg p-5"
          :style="{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }">
          <div class="flex items-center justify-between mb-4 pb-2 border-b"
            :style="{ borderColor: 'var(--border-primary)' }">
            <div class="flex items-center gap-2">
              <span class="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Bell class="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h2 class="text-sm sm:text-lg font-semibold" :style="{ color: 'var(--text-heading)' }">
                Pengumuman
              </h2>
            </div>
            <div class="flex items-center gap-2">
              <button v-if="isAdmin" @click="openCreateModal"
                class="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] sm:text-xs font-semibold transition-all shadow-sm animate-fade-in">
                <Plus class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Tambah</span>
              </button>
              <span v-else class="text-[10px] sm:text-xs" :style="{ color: 'var(--text-muted)' }">Portal Digital</span>
            </div>
          </div>

          <!-- Mobile: flex overflow scroll, Desktop: grid -->
          <div v-if="isLoading" class="flex md:grid overflow-x-auto md:overflow-x-visible gap-3 sm:gap-4 pb-2 md:pb-0">
            <div v-for="i in 3" :key="i"
              class="w-[85vw] md:w-auto shrink-0 md:shrink-1 p-3.5 sm:p-4 rounded-xl border animate-pulse flex flex-col justify-between"
              :style="{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)',
              }">
              <div>
                <div class="flex items-center justify-between gap-2 mb-3">
                  <div class="h-5 w-16 rounded-md" :style="{ backgroundColor: 'var(--border-primary)' }"></div>
                  <div class="h-4 w-20 rounded-md" :style="{ backgroundColor: 'var(--border-primary)' }"></div>
                </div>
                <div class="h-4 w-3/4 rounded-md mb-2" :style="{ backgroundColor: 'var(--border-primary)' }"></div>
                <div class="h-3 w-full rounded-md mb-1.5" :style="{ backgroundColor: 'var(--border-primary)' }"></div>
                <div class="h-3 w-5/6 rounded-md" :style="{ backgroundColor: 'var(--border-primary)' }"></div>
              </div>
            </div>
          </div>

          <div v-else-if="!announcements || announcements.length === 0"
            class="flex flex-col items-center justify-center py-8 text-center w-full">
            <Bell class="w-8 h-8 mb-2 stroke-[1.5]" :style="{ color: 'var(--text-muted)' }" />
            <p class="text-xs sm:text-sm" :style="{ color: 'var(--text-secondary)' }">
              Tidak ada pengumuman terbaru
            </p>
          </div>

          <div v-else
            class="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-none gap-3 sm:gap-4 pb-2 md:pb-0">
            <div v-for="item in announcements" :key="item.id"
              class="w-[85vw] md:w-auto shrink-0 md:shrink-1 snap-center p-3.5 sm:p-4 border rounded-lg overflow-hidden transition-all duration-300 hover:border-emerald-500/40 flex flex-col justify-between"
              :style="{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)',
              }">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span :class="[
                    'px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border',
                    item.tagColor,
                  ]">
                    {{ item.tag }}
                  </span>
                  <div class="flex items-center gap-1.5 sm:gap-2">
                    <span class="text-[10px] sm:text-xs" :style="{ color: 'var(--text-muted)' }">{{ item.date }}</span>
                    <!-- Admin Actions -->
                    <div v-if="isAdmin" class="flex items-center gap-1">
                      <button @click.stop="openEditModal(item)" class="p-1 rounded-md transition-all"
                        :style="{ color: 'var(--text-muted)' }" title="Edit">
                        <Pencil class="w-3 h-3" />
                      </button>
                      <button @click.stop="handleDelete(item)" class="p-1 rounded-md transition-all"
                        :style="{ color: 'var(--text-muted)' }" title="Hapus">
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <h3 class="text-xs sm:text-sm font-semibold mb-1 line-clamp-1"
                  :style="{ color: 'var(--text-heading)' }">
                  {{ item.title }}
                </h3>
                <p class="text-[11px] sm:text-xs leading-relaxed line-clamp-2 sm:line-clamp-none"
                  :style="{ color: 'var(--text-secondary)' }">
                  {{ item.content }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- CRUD Modal Pengumuman -->
      <CrudModal :show="showModal" :mode="modalMode" :title="modalMode === 'create' ? 'Tambah Pengumuman' : 'Edit Pengumuman'
        " :fields="announcementFields" :initialData="editingItem" :isSaving="isSaving" @submit="handleFormSubmit"
        @close="showModal = false" />

      <!-- Modal 1: Cek Tanggal Belum Kirim Absen -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div
            v-if="showMissingModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <!-- Backdrop -->
            <div
              class="absolute inset-0 bg-black/75"
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

      <!-- Modal 2: Lihat Jadwal Hari Ini -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div
            v-if="showScheduleModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <!-- Backdrop -->
            <div
              class="absolute inset-0 bg-black/75"
              @click="showScheduleModal = false"
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
                    class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
                  >
                    <Clock class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 class="text-base font-bold theme-text">
                      Jadwal Mengajar Hari Ini (Hari {{ namaHariIni }})
                    </h3>
                    <p class="text-xs theme-text-muted">
                      {{ currentFormattedDate }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="showScheduleModal = false"
                  class="p-2 rounded-lg theme-text-muted hover:theme-text hover:theme-bg-tertiary transition-colors"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Filter for Admin / Selector -->
              <div
                v-if="userRole === 'admin' || userRole === 'kepala_madrasah'"
                class="p-4 theme-bg-secondary/50 border-b theme-border flex items-center justify-between gap-3 shrink-0"
              >
                <div class="flex flex-col gap-1 w-full sm:w-64">
                  <label class="text-xs font-semibold theme-text-muted">Filter Kelas</label>
                  <select
                    v-model="scheduleSelectedClass"
                    class="h-9 px-3 rounded-lg theme-border border theme-bg theme-text text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Semua Kelas --</option>
                    <option
                      v-for="k in sortedClasses"
                      :key="k.id_kelas"
                      :value="k.id_kelas"
                    >
                      {{ k.nama_kelas || k.id_kelas }}
                    </option>
                  </select>
                </div>
                <div class="text-xs theme-text-muted">
                  Total {{ todayScheduleList.length }} Sesi Mengajar
                </div>
              </div>

              <!-- Modal Body -->
              <div class="p-4 sm:p-5 overflow-y-auto flex-1">
                <!-- Weekend / Sunday State -->
                <div v-if="namaHariIni === 'Minggu'" class="text-center py-12">
                  <CalendarDays class="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <p class="text-sm font-bold theme-text">Hari Minggu - Libur Sekolah</p>
                  <p class="text-xs theme-text-muted mt-1">Tidak ada aktivitas jadwal mengajar reguler pada hari Minggu.</p>
                </div>

                <!-- Empty Schedule State -->
                <div v-else-if="todayScheduleList.length === 0" class="text-center py-12">
                  <BookOpen class="w-12 h-12 theme-text-muted mx-auto mb-2 opacity-40" />
                  <p class="text-sm font-semibold theme-text">Tidak Ada Jadwal Mengajar Hari Ini</p>
                  <p class="text-xs theme-text-muted mt-1">
                    {{ userRole === 'guru' ? 'Anda tidak memiliki jadwal mengajar pada hari ' + namaHariIni + '.' : 'Tidak ditemukan jadwal mengajar untuk filter terpilih pada hari ' + namaHariIni + '.' }}
                  </p>
                </div>

                <!-- Schedule List -->
                <div v-else class="flex flex-col gap-3">
                  <div
                    v-for="sch in todayScheduleList"
                    :key="sch.id || (sch.kelas_id + sch.jam_ke)"
                    class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border theme-border theme-bg-secondary hover:theme-bg-tertiary transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        Jam {{ sch.jam_ke || sch.jamKe || '-' }}
                      </div>
                      <div>
                        <h4 class="text-sm font-bold theme-text">
                          {{ getMapelName(sch.mapel_id || sch.mapel, sch) }}
                        </h4>
                        <div class="flex items-center gap-2 mt-0.5 text-xs theme-text-muted flex-wrap">
                          <span class="font-semibold text-emerald-600 dark:text-emerald-400">
                            Kelas {{ getKelasName(sch.kelas_id || sch.kelasId || sch.kelas) }}
                          </span>
                          <span v-if="userRole !== 'guru'">• Guru: {{ getGuruName(sch.guru_id || sch.guruId || sch.guru, sch) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Quick Link to Input Absensi -->
                    <button
                      type="button"
                      @click="goToInputAbsensiToday(sch.kelas_id || sch.kelasId || sch.kelas)"
                      class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer self-end sm:self-center"
                    >
                      <span>Input Absensi</span>
                      <ExternalLink class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="p-4 theme-bg-secondary border-t theme-border flex items-center justify-between shrink-0 text-xs theme-text-muted">
                <span>Hari ini: <strong>{{ currentFormattedDate }}</strong></span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="goToJadwalCetak"
                    class="px-3 py-1.5 rounded-lg theme-border border theme-bg text-emerald-600 dark:text-emerald-400 font-semibold hover:theme-bg-tertiary transition-colors cursor-pointer"
                  >
                    Cetak Lengkap
                  </button>
                  <button
                    type="button"
                    @click="showScheduleModal = false"
                    class="px-4 py-1.5 rounded-lg theme-border border theme-bg theme-text font-semibold hover:theme-bg-tertiary transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import {
  Bell, Plus, Pencil, Trash2, User,
  CalendarX, Clock, ChevronRight, X, Loader2,
  CheckCircle2, ExternalLink, CalendarDays, BookOpen,
} from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useAuth } from "~/composables/auth/useAuth";
import { authenticatedFetch, fetchFromApi } from "~/utils/api";
import { dapatkanTahunDanSemester, dapatkanAwalSemesterAktif } from "~/utils/dateHelper";
import { useNotiflix } from "~/composables/ui/useFeedback";
import CrudModal from "~/components/ui/CrudModal.vue";

definePageMeta({
  requiresAuth: true,
});

const { Notify } = useNotiflix();

const {
  cardData: announcements,
  isLoading,
  loadData,
  refreshData,
} = useTableData();
const { isAdmin, isSaving, createItem, updateItem, deleteItem } = useCrud(
  "Pengumuman",
  () => refreshData("Pengumuman"),
);
const { getUserRole, getUserData, getGtkId } = useAuth();

// Core data loaders
const { cardData: kelasData, loadData: loadKelas } = useTableData();
const { cardData: jadwalData, loadData: loadJadwal } = useTableData();
const { cardData: gtkData, loadData: loadGtk } = useTableData();
const { cardData: kurikulumData, loadData: loadKurikulum } = useTableData();

const userDisplayName = ref("");
const userRole = ref("");
const userGtkId = ref(null);
const isWaliKelas = ref(false);
const waliKelasClassId = ref("");

const userRoleLabel = computed(() => {
  const r = userRole.value;
  if (r === "admin") return "Admin";
  if (r === "guru") return "Guru";
  if (r === "kepala_madrasah") return "Kepala Madrasah";
  return r;
});

const currentFormattedDate = computed(() => {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const NAMA_HARI_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const namaHariIni = computed(() => {
  return NAMA_HARI_MAP[new Date().getDay()];
});

const todayStr = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
});

const awalSemesterAktifStr = computed(() => {
  return dapatkanAwalSemesterAktif(new Date());
});

const sortedClasses = computed(() => {
  return [...(kelasData.value || [])].sort((a, b) => {
    const levelA = Number(a.tingkat) || 0;
    const levelB = Number(b.tingkat) || 0;
    if (levelA !== levelB) return levelA - levelB;
    const nameA = a.nama_kelas || a.id_kelas || "";
    const nameB = b.nama_kelas || b.id_kelas || "";
    return nameA.localeCompare(nameB, undefined, { numeric: true });
  });
});

// =============================================
// MODAL 1: Cek Tanggal Belum Kirim Absen
// =============================================
const showMissingModal = ref(false);
const missingSelectedClass = ref("");
const isLoadingMissing = ref(false);
const missingDatesList = ref([]);
const totalHariEfektifModal = ref(0);
const totalSudahKirimModal = ref(0);
const hariLiburKalender = ref([]);
const hariLiburMingguanIndex = ref(0);

const accessibleClassesForMissing = computed(() => {
  if (!kelasData.value) return [];
  if (userRole.value === "admin" || userRole.value === "kepala_madrasah") {
    return kelasData.value.map(c => ({ id_kelas: c.id_kelas || c.idKelas, nama_kelas: c.nama_kelas || c.namaKelas }));
  }
  if (userRole.value === "guru") {
    const list = [];
    if (isWaliKelas.value && waliKelasClassId.value) {
      const match = kelasData.value.find(c => (c.id_kelas || c.idKelas) === waliKelasClassId.value);
      if (match) list.push({ id_kelas: match.id_kelas || match.idKelas, nama_kelas: match.nama_kelas || match.namaKelas });
    }
    (jadwalData.value || []).forEach(sch => {
      const gId = sch.guru_id || sch.guruId || sch.guru;
      const cId = sch.kelas_id || sch.kelasId || sch.kelas;
      if (String(gId) === String(userGtkId.value)) {
        if (!list.some(item => item.id_kelas === cId)) {
          const match = kelasData.value.find(c => (c.id_kelas || c.idKelas) === cId);
          if (match) list.push({ id_kelas: match.id_kelas || match.idKelas, nama_kelas: match.nama_kelas || match.namaKelas });
        }
      }
    });
    if (list.length === 0) {
      return kelasData.value.map(c => ({ id_kelas: c.id_kelas || c.idKelas, nama_kelas: c.nama_kelas || c.namaKelas }));
    }
    return list;
  }
  return [];
});

const currentMissingClassName = computed(() => {
  if (!missingSelectedClass.value) return "";
  const match = kelasData.value.find(k => (k.id_kelas || k.idKelas) === missingSelectedClass.value);
  return match ? (match.nama_kelas || match.namaKelas) : missingSelectedClass.value;
});

const formatDateIndo = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

const openMissingModal = async () => {
  showMissingModal.value = true;
  if (!missingSelectedClass.value) {
    if (accessibleClassesForMissing.value.length > 0) {
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
    // 1. Load kalender pendidikan
    if (!hariLiburKalender.value.length) {
      const currentInfo = dapatkanTahunDanSemester(new Date());
      try {
        const kalenderData = await fetchFromApi("kalender_pendidikan", false, null, {
          filter_col: "tahun_pelajaran",
          filter_val: currentInfo.tahunPelajaran,
        });
        if (Array.isArray(kalenderData)) {
          hariLiburKalender.value = kalenderData.filter((item) => item.tipe === "libur");
        }
      } catch (e) {
        console.error("Gagal load kalender:", e);
      }

      try {
        const configData = await fetchFromApi("pengaturan_tapel", false, null, {
          filter_col: "tahun_pelajaran",
          filter_val: currentInfo.tahunPelajaran,
        });
        if (Array.isArray(configData) && configData.length > 0) {
          const match = configData.find((item) => item.tahun_pelajaran === currentInfo.tahunPelajaran);
          if (match) hariLiburMingguanIndex.value = parseInt(match.hari_libur_mingguan);
        }
      } catch (e) {
        console.error("Gagal load pengaturan tapel:", e);
      }
    }

    // 2. Ambil jadwal mengajar guru ini untuk kelas terpilih
    const scheduledDays = new Set();
    if (userRole.value === "guru" && userGtkId.value) {
      (jadwalData.value || []).forEach((sch) => {
        const gId = sch.guru_id || sch.guruId || sch.guru;
        const cId = sch.kelas_id || sch.kelasId || sch.kelas;
        if (String(gId) === String(userGtkId.value) && String(cId) === String(missingSelectedClass.value)) {
          if (sch.hari) scheduledDays.add(String(sch.hari).trim().toLowerCase());
        }
      });
    }

    const isWaliOfClass = isWaliKelas.value && waliKelasClassId.value === missingSelectedClass.value;
    const isTeacherRole = userRole.value === "guru";

    // 3. Kumpulkan daftar tanggal wajib
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

      if (dayIndex === hariLiburMingguanIndex.value) { current.setDate(current.getDate() + 1); continue; }
      const isHoliday = hariLiburKalender.value.some(h => dateStr >= h.tanggal_mulai && dateStr <= h.tanggal_selesai);
      if (isHoliday) { current.setDate(current.getDate() + 1); continue; }

      let isRequired = false;
      let isJadwalMapel = false;

      if (userRole.value === "admin" || userRole.value === "kepala_madrasah" || isWaliOfClass) {
        isRequired = true;
      } else if (isTeacherRole && scheduledDays.has(namaHariLower)) {
        isRequired = true;
        isJadwalMapel = true;
      }

      if (isRequired) {
        requiredCandidates.push({ dateStr, formattedDate: formatDateIndo(dateStr), dayNum: d, namaHari, isJadwalMapel, isWali: isWaliOfClass });
      }

      current.setDate(current.getDate() + 1);
    }

    // 4. Periksa status pengisian via /api/absensi
    let totalEfektif = requiredCandidates.length;
    let totalSudah = 0;
    const missingList = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < requiredCandidates.length; i += BATCH_SIZE) {
      const batch = requiredCandidates.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (item) => ({
          item,
          isSubmitted: await checkSubmittedStatusForDate(item.dateStr, missingSelectedClass.value),
        }))
      );
      results.forEach(({ item, isSubmitted }) => {
        if (isSubmitted) totalSudah++;
        else missingList.push(item);
      });
    }

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
  navigateTo({ path: "/absensi/siswa", query: { tanggal: dateStr, kelas_id: classId } });
};

// =============================================
// MODAL 2: Jadwal Hari Ini
// =============================================
const showScheduleModal = ref(false);
const scheduleSelectedClass = ref("");

const todayScheduleList = computed(() => {
  const schedules = jadwalData.value || [];
  const hariIni = namaHariIni.value;

  let filtered = schedules.filter(sch => {
    const schHari = String(sch.hari || "").trim();
    return schHari.toLowerCase() === hariIni.toLowerCase();
  });

  // Guru: hanya tampilkan jadwal guru tersebut
  if (userRole.value === "guru" && userGtkId.value) {
    filtered = filtered.filter(sch => {
      const gId = sch.guru_id || sch.guruId || sch.guru;
      return String(gId) === String(userGtkId.value);
    });
  }

  // Admin filter by class
  if ((userRole.value === "admin" || userRole.value === "kepala_madrasah") && scheduleSelectedClass.value) {
    filtered = filtered.filter(sch => {
      const cId = sch.kelas_id || sch.kelasId || sch.kelas;
      return cId === scheduleSelectedClass.value;
    });
  }

  // Sort by jam_ke
  return filtered.sort((a, b) => {
    const jamA = Number(a.jam_ke || a.jamKe || 0);
    const jamB = Number(b.jam_ke || b.jamKe || 0);
    if (jamA !== jamB) return jamA - jamB;
    const kelasA = String(a.kelas_id || a.kelasId || a.kelas || "");
    const kelasB = String(b.kelas_id || b.kelasId || b.kelas || "");
    return kelasA.localeCompare(kelasB, undefined, { numeric: true });
  });
});

const getKelasName = (id) => {
  if (!id) return "-";
  const kelas = (kelasData.value || []).find(k => (k.id_kelas || k.idKelas) === id);
  return kelas ? (kelas.nama_kelas || kelas.namaKelas || id) : id;
};

const getMapelName = (id, sch) => {
  if (!id) return sch?.nama_mapel || sch?.mapel || "-";
  const mapel = (kurikulumData.value || []).find(m => m.id === Number(id));
  return mapel ? (mapel.nama_mapel || mapel.namaMapel) : (sch?.nama_mapel || `Mapel ID: ${id}`);
};

const getGuruName = (id, sch) => {
  if (!id) return sch?.nama_guru || sch?.guru || "-";
  const guru = (gtkData.value || []).find(g => g.id === Number(id));
  return guru ? (guru.nama_lengkap || guru.namaLengkap) : (sch?.nama_guru || `Guru ID: ${id}`);
};

const openTodayScheduleModal = () => {
  scheduleSelectedClass.value = "";
  showScheduleModal.value = true;
};

const goToInputAbsensiToday = (classId) => {
  showScheduleModal.value = false;
  navigateTo({ path: "/absensi/siswa", query: { tanggal: todayStr.value, kelas_id: classId } });
};

const goToJadwalCetak = () => {
  showScheduleModal.value = false;
  navigateTo("/jadwal/cetak");
};

// =============================================
// Helpers: Wali Kelas detection
// =============================================
function cleanName(name) {
  if (!name) return "";
  let cleaned = name.split(",")[0];
  cleaned = cleaned.replace(/^(h\.|hj\.|dra\.|drs\.|prof\.|dr\.)\s+/gi, "");
  return cleaned.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

const checkWaliKelasStatus = async () => {
  if (userRole.value !== "guru" || !userGtkId.value) return;
  try {
    const gtkDataFetched = await fetchFromApi("data_gtk", false, null, {
      filter_col: "id",
      filter_val: String(userGtkId.value),
    });
    if (!Array.isArray(gtkDataFetched)) return;

    const myRecord = gtkDataFetched.find(g =>
      g.id === userGtkId.value || String(g.id) === String(userGtkId.value)
    );
    if (!myRecord) return;

    const namaGuru = myRecord.nama_lengkap || myRecord.title || myRecord.NamaLengkap || "";
    const classes = kelasData.value || [];

    const myClass = classes.find(c => {
      const cWali = c.wali_kelas || c.waliKelas || c["Wali Kelas"] || "";
      const myPegId = myRecord.peg_id || myRecord.PegID || myRecord["Peg ID"];
      const myId = myRecord.id;
      const matchName = cleanName(cWali) === cleanName(namaGuru);
      const matchPegId = String(cWali).trim() === String(myPegId).trim();
      const matchId = String(cWali).trim() === String(myId).trim();
      return matchId || matchPegId || matchName;
    });

    if (myClass) {
      isWaliKelas.value = true;
      waliKelasClassId.value = myClass.id_kelas || myClass.idKelas;
    }
  } catch (err) {
    console.error("Gagal validasi status wali kelas:", err);
  }
};

// =============================================
// CRUD Modal states (existing)
// =============================================
const showModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});

const announcementFields = [
  {
    key: "title",
    label: "Judul Pengumuman",
    required: true,
    placeholder: "Masukkan judul pengumuman",
  },
  {
    key: "content",
    label: "Isi Pengumuman",
    type: "textarea",
    required: true,
    placeholder: "Tulis isi pengumuman...",
  },
  {
    key: "date",
    label: "Tanggal",
    required: true,
    placeholder: "Contoh: 22 Mei 2026",
  },
  {
    key: "tag",
    label: "Tag / Kategori",
    required: true,
    type: "select",
    options: ["Penting", "Info", "Update"],
  },
  {
    key: "tagColor",
    label: "Warna Tag",
    required: true,
    type: "select",
    options: [
      "bg-red-500/20 text-red-400 border-red-500/30",
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "bg-amber-500/20 text-amber-400 border-amber-500/30",
    ],
  },
];

const openCreateModal = () => {
  modalMode.value = "create";
  editingItem.value = {
    title: "",
    content: "",
    date: new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    tag: "Info",
    tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };
  showModal.value = true;
};

const openEditModal = (item) => {
  modalMode.value = "edit";
  editingItem.value = {
    id: item.id,
    title: item.title || "",
    content: item.content || "",
    date: item.date || "",
    tag: item.tag || "",
    tagColor: item.tagColor || "",
  };
  showModal.value = true;
};

const handleFormSubmit = async (formData) => {
  let success = false;
  if (modalMode.value === "create") {
    success = await createItem(formData);
  } else {
    const id = editingItem.value.id;
    success = await updateItem(id, formData);
  }
  if (success) {
    showModal.value = false;
  }
};

const handleDelete = (item) => {
  deleteItem(item.id, `pengumuman "${item.title}"`);
};

// =============================================
// Lifecycle
// =============================================
onMounted(async () => {
  const data = getUserData();
  if (data) {
    userDisplayName.value = data.displayName || "";
    userRole.value = data.role || "";
  } else {
    userDisplayName.value = localStorage.getItem("user-displayName") || "";
    userRole.value = localStorage.getItem("user-role") || "";
  }

  const gId = getGtkId();
  userGtkId.value = gId ? parseInt(gId) : null;

  loadData("Pengumuman");

  // Load core data needed for both modals
  try {
    await loadKelas("data_kelas");
    await loadJadwal("jadwal_pelajaran");
    await loadGtk("data_gtk");
    await loadKurikulum("kurikulum");
    await checkWaliKelasStatus();
  } catch (err) {
    console.error("Gagal memuat data pendukung beranda:", err);
  }
});
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Modal transition */
.modal-fade-enter-active {
  transition: opacity 0.2s ease;
}
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

