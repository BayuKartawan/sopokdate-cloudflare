<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Section Header -->
      <PageHeader
        title="Data Literasi Siswa"
        :breadcrumbs="[
          { label: 'Literasi Siswa', to: '/literasi/data' },
          { label: 'Data Literasi' },
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
            <span
              v-if="hasUnsavedChanges"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20"
            >
              <span class="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"></span>
              Belum Disimpan
            </span>
            <BaseButton
              v-if="selectedKelas"
              text="Simpan Data"
              title="Simpan data literasi siswa"
              :loading="isSaving"
              :disabled="isSaving"
              @click="saveData"
            >
              <template #icon>
                <Save class="w-4 h-4" />
              </template>
            </BaseButton>
          </div>
        </template>
      </PageHeader>

      <!-- FILTER KELAS & SEARCH SISWA (Jika Kelas Dipilih) -->
      <div v-if="selectedKelas" class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border theme-bg-secondary theme-border mb-4 sm:mb-6">
        <div class="flex flex-col gap-1.5 min-w-[200px] sm:min-w-[220px]">
          <label class="text-xs font-semibold theme-text-muted">Pilih / Ganti Kelas</label>
          <UiSearchableSelect
            :model-value="selectedKelas.id_kelas"
            @update:model-value="handleSelectKelasById"
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

      <!-- VIEW 1: PILIH KELAS (Grid Cards jika belum pilih kelas) -->
      <div v-if="!selectedKelas">
        <div v-if="isLoadingKelas" class="flex flex-col items-center justify-center py-16">
          <Loader2 class="w-10 h-10 animate-spin text-emerald-600 dark:text-emerald-400 mb-3" />
          <p class="theme-text-muted text-sm font-medium">Memuat daftar kelas yang Anda ampu...</p>
        </div>

        <div v-else-if="kelasList.length === 0" class="border theme-border rounded-2xl p-8 sm:p-10 text-center theme-bg-secondary">
          <GraduationCap class="w-14 h-14 mx-auto text-amber-500/80 mb-3" />
          <h3 class="font-bold text-lg mb-1" :style="{ color: 'var(--text-heading)' }">Tidak Ada Kelas Ditemukan</h3>
          <p class="theme-text-muted text-sm max-w-md mx-auto">
            Anda belum memiliki jadwal mengajar pada kelas manapun, atau data kelas belum dikonfigurasi oleh Administrator.
          </p>
        </div>

        <div v-else>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base sm:text-lg font-bold" :style="{ color: 'var(--text-heading)' }">Pilih Kelas</h2>
            <span class="text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {{ kelasList.length }} Kelas
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <div
              v-for="kelas in kelasList"
              :key="kelas.id_kelas"
              @click="selectKelas(kelas)"
              class="group border theme-border rounded-2xl p-4 sm:p-5 theme-bg theme-bg-card-hover cursor-pointer transition-all hover:shadow-md hover:border-emerald-500/40 relative overflow-hidden"
            >
              <div class="flex items-center gap-3 sm:gap-3.5 mb-3">
                <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm sm:text-base border border-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                  {{ kelas.tingkat || 'K' }}
                </div>
                <div>
                  <h3 class="font-bold text-sm sm:text-base leading-tight" :style="{ color: 'var(--text-heading)' }">
                    {{ kelas.nama_kelas }}
                  </h3>
                  <p class="text-xs theme-text-muted">
                    {{ kelas.tingkat ? `Tingkat ${kelas.tingkat}` : 'Kelas Aktif' }}
                  </p>
                </div>
              </div>

              <div class="border-t theme-border pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span>Mulai Penilaian</span>
                <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW 2: PENILAIAN LITERASI SISWA PER KELAS -->
      <div v-else>
        <!-- Header Kelas Terpilih & Summary Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border theme-border theme-bg mb-4 sm:mb-6">
          <div class="flex items-center gap-3">
            <button
              @click="handleBackToKelasList"
              class="p-2 rounded-xl border theme-border theme-bg-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Kembali ke pilih kelas"
            >
              <ChevronLeft class="w-5 h-5 theme-text" />
            </button>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base sm:text-lg font-bold leading-tight" :style="{ color: 'var(--text-heading)' }">
                  {{ selectedKelas.nama_kelas }}
                </h2>
                <span class="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {{ tapel }} - {{ semester }}
                </span>
              </div>
              <p class="text-xs theme-text-muted">Total: {{ students.length }} Siswa terdaftar</p>
            </div>
          </div>

          <!-- Quick Statistics Badges (Grid on mobile, flex on sm+) -->
          <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            <div class="px-2.5 py-1.5 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400 font-medium truncate">
              Intervensi: <span class="font-bold">{{ countLevel('Intervensi Khusus') }}</span>
            </div>
            <div class="px-2.5 py-1.5 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 font-medium truncate">
              Dasar: <span class="font-bold">{{ countLevel('Dasar') }}</span>
            </div>
            <div class="px-2.5 py-1.5 rounded-xl border bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400 font-medium truncate">
              Cakap: <span class="font-bold">{{ countLevel('Cakap') }}</span>
            </div>
            <div class="px-2.5 py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium truncate">
              Mahir: <span class="font-bold">{{ countLevel('Mahir') }}</span>
            </div>
          </div>
        </div>

        <!-- Loading State for Students -->
        <div v-if="isLoadingStudents" class="flex flex-col items-center justify-center py-16">
          <Loader2 class="w-10 h-10 animate-spin text-emerald-600 dark:text-emerald-400 mb-3" />
          <p class="theme-text-muted text-sm font-medium">Memuat data literasi siswa {{ selectedKelas.nama_kelas }}...</p>
        </div>

        <!-- Empty State Students -->
        <div v-else-if="filteredStudents.length === 0" class="border theme-border rounded-2xl p-8 sm:p-10 text-center theme-bg-secondary">
          <Users class="w-12 h-12 mx-auto theme-text-faint mb-3" />
          <h3 class="font-bold text-base mb-1" :style="{ color: 'var(--text-heading)' }">Tidak Ada Siswa</h3>
          <p class="theme-text-muted text-xs max-w-md mx-auto">
            {{ searchQuery ? 'Tidak ada siswa yang cocok dengan pencarian kata kunci tersebut.' : 'Belum ada siswa yang terdaftar di kelas ini pada riwayat kelas semester ini.' }}
          </p>
        </div>

        <!-- ===================== DATA SISWA CONTENT ===================== -->
        <template v-else>
        <!-- DESKTOP TABLE (lg+) -->
        <div class="hidden lg:block">
          <div class="border theme-border rounded-2xl overflow-hidden theme-bg shadow-sm">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b theme-border bg-slate-50/80 dark:bg-slate-800/50">
                  <th class="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider theme-text-muted w-12">No</th>
                  <th class="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider theme-text-muted">Nama Siswa</th>
                  <th class="text-center px-4 py-3 text-[11px] font-bold uppercase tracking-wider theme-text-muted">Level Literasi</th>
                  <th class="text-center px-4 py-3 text-[11px] font-bold uppercase tracking-wider theme-text-muted w-48">Sub-Level</th>
                  <th class="text-center px-4 py-3 text-[11px] font-bold uppercase tracking-wider theme-text-muted w-16"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(student, idx) in filteredStudents"
                  :key="student.siswa_id"
                  class="border-b theme-border last:border-b-0 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                  <!-- No -->
                  <td class="px-4 py-3 text-xs theme-text-muted font-medium align-top pt-4">
                    {{ idx + 1 }}
                  </td>

                  <!-- Nama Siswa -->
                  <td class="px-4 py-3 align-top pt-3.5">
                    <p class="font-semibold text-xs leading-snug" :style="{ color: 'var(--text-heading)' }">
                      {{ student.nama }}
                    </p>
                    <p class="text-[11px] theme-text-muted mt-0.5">
                      NISN: {{ student.nisn || student.nis_lokal || '-' }} • {{ student.jenis_kelamin || '' }}
                    </p>
                  </td>

                  <!-- Level Literasi (4 inline buttons) -->
                  <td class="px-4 py-3 align-top pt-3">
                    <div class="flex items-center justify-center gap-1.5">
                      <button
                        v-for="lv in levelOptions"
                        :key="lv.value"
                        type="button"
                        @click="setLevel(student, lv.value)"
                        class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all whitespace-nowrap"
                        :class="student.level === lv.value 
                          ? lv.activeClass 
                          : lv.inactiveClass"
                      >
                        {{ lv.label }}
                      </button>
                    </div>
                  </td>

                  <!-- Sub-Level -->
                  <td class="px-4 py-3 align-top pt-3">
                    <div v-if="student.level === 'Intervensi Khusus'" class="flex items-center justify-center gap-1">
                      <button
                        v-for="sub in subLevels"
                        :key="sub"
                        type="button"
                        @click="setSubLevel(student, sub)"
                        class="px-2 py-1 rounded-md text-[11px] font-medium border transition-all"
                        :class="(student.sub_level || 'Pemula') === sub
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-50'"
                      >
                        {{ sub }}
                      </button>
                    </div>
                    <span v-else class="text-[11px] theme-text-muted flex justify-center">—</span>
                  </td>

                  <!-- Info -->
                  <td class="px-4 py-3 align-top pt-3 text-center">
                    <button
                      type="button"
                      @click="showStudentInfo(student)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex"
                      title="Lihat info riwayat update"
                    >
                      <Info class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- MOBILE CARD GRID (<lg) -->
        <div class="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
          <div
            v-for="(student, idx) in filteredStudents"
            :key="student.siswa_id"
            class="border rounded-2xl p-4 sm:p-5 theme-bg transition-all flex flex-col justify-between relative shadow-sm"
            :class="getCardBorderClass(student.level)"
          >
            <!-- Header Siswa -->
            <div>
              <div class="mb-3 sm:mb-3.5">
                <h4 class="font-bold text-xs sm:text-sm leading-snug line-clamp-1" :style="{ color: 'var(--text-heading)' }">
                  {{ student.nama }}
                </h4>
                <p class="text-[11px] sm:text-xs theme-text-muted">
                  NISN: {{ student.nisn || student.nis_lokal || '-' }} • {{ student.jenis_kelamin || '' }}
                </p>
              </div>

              <!-- LEVEL SELECTOR (4 Level Cards) -->
              <div class="space-y-2 mt-3 sm:mt-4">
                <label class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider theme-text-muted block">
                  Level Literasi
                </label>

                <div class="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    @click="setLevel(student, 'Intervensi Khusus')"
                    class="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all"
                    :class="student.level === 'Intervensi Khusus' 
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm ring-2 ring-rose-500/20' 
                      : 'bg-rose-500/5 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'"
                  >
                    <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate">Intervensi Khusus</span>
                  </button>

                  <button
                    type="button"
                    @click="setLevel(student, 'Dasar')"
                    class="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all"
                    :class="student.level === 'Dasar' 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/20' 
                      : 'bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'"
                  >
                    <BookOpen class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate">Dasar</span>
                  </button>

                  <button
                    type="button"
                    @click="setLevel(student, 'Cakap')"
                    class="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all"
                    :class="student.level === 'Cakap' 
                      ? 'bg-sky-500 text-white border-sky-600 shadow-sm ring-2 ring-sky-500/20' 
                      : 'bg-sky-500/5 hover:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/40'"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate">Cakap</span>
                  </button>

                  <button
                    type="button"
                    @click="setLevel(student, 'Mahir')"
                    class="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all"
                    :class="student.level === 'Mahir' 
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/20' 
                      : 'bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'"
                  >
                    <Award class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate">Mahir</span>
                  </button>
                </div>
              </div>

              <!-- SUB-LEVEL SELECTOR (Jika Intervensi Khusus) -->
              <div
                v-if="student.level === 'Intervensi Khusus'"
                class="mt-3 p-2.5 sm:p-3 rounded-xl bg-rose-500/5 border border-rose-200 dark:border-rose-900/30 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] sm:text-[11px] font-bold text-rose-700 dark:text-rose-400">
                    Sub-Level Intervensi:
                  </span>
                  <span class="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium">
                    {{ student.sub_level || 'Pemula' }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-1 sm:gap-1.5">
                  <button
                    v-for="sub in subLevels"
                    :key="sub"
                    type="button"
                    @click="setSubLevel(student, sub)"
                    class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium border transition-all"
                    :class="(student.sub_level || 'Pemula') === sub
                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50'"
                  >
                    {{ sub }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Card Footer: Info Perubahan -->
            <div class="mt-3.5 pt-2.5 sm:mt-4 sm:pt-3 border-t theme-border flex items-center justify-end">
              <button
                type="button"
                @click="showStudentInfo(student)"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Lihat info riwayat update"
              >
                <Info class="w-3.5 h-3.5" />
                <span>Info Perubahan</span>
              </button>
            </div>
          </div>
        </div>
        </template>

        <!-- Floating Bottom Save Bar -->
        <div
          v-if="hasUnsavedChanges"
          class="sticky bottom-4 sm:bottom-6 mt-6 sm:mt-8 p-3 sm:p-4 rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-slate-900 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 z-20"
        >
          <div class="flex items-center gap-2.5 sm:gap-3">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
              !
            </div>
            <div>
              <p class="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">Ada Perubahan Belum Disimpan</p>
              <p class="text-[11px] sm:text-xs theme-text-muted">Tekan simpan sebelum berpindah halaman</p>
            </div>
          </div>

          <div class="flex items-center gap-2 justify-end">
            <button
              @click="resetChanges"
              class="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl border theme-border theme-text hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors text-center"
            >
              Batalkan
            </button>
            <button
              @click="saveData"
              :disabled="isSaving"
              class="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 text-center"
            >
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>Simpan Semua</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL INFO UPDATER -->
      <div
        v-if="infoModalStudent"
        class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200"
        @click.self="infoModalStudent = null"
      >
        <div class="bg-white dark:bg-slate-900 rounded-2xl border theme-border p-6 max-w-sm w-full shadow-2xl relative">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-base" :style="{ color: 'var(--text-heading)' }">Info Penilaian Literasi</h3>
            <button
              @click="infoModalStudent = null"
              class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 theme-text-muted"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border theme-border">
              <p class="theme-text-muted mb-0.5">Nama Siswa</p>
              <p class="font-bold text-sm" :style="{ color: 'var(--text-heading)' }">{{ infoModalStudent.nama }}</p>
              <p class="text-[11px] theme-text-muted">NISN: {{ infoModalStudent.nisn || '-' }}</p>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border theme-border">
              <p class="theme-text-muted mb-0.5">Level Literasi</p>
              <p class="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                {{ infoModalStudent.level || 'Belum dinilai' }}
                <span v-if="infoModalStudent.sub_level"> ({{ infoModalStudent.sub_level }})</span>
              </p>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border theme-border">
              <p class="theme-text-muted mb-0.5">Terakhir Diupdate Oleh</p>
              <p class="font-semibold" :style="{ color: 'var(--text-heading)' }">
                {{ infoModalStudent.updater_name || 'Belum ada riwayat' }}
              </p>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border theme-border">
              <p class="theme-text-muted mb-0.5">Waktu Terakhir Update</p>
              <p class="font-semibold" :style="{ color: 'var(--text-heading)' }">
                {{ infoModalStudent.updated_at ? formatDateFull(infoModalStudent.updated_at) : 'Belum pernah disimpan' }}
              </p>
            </div>
          </div>

          <div class="mt-5">
            <button
              @click="infoModalStudent = null"
              class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import {
  Save,
  Loader2,
  GraduationCap,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Award,
  Info,
  X,
  Calendar,
} from "lucide-vue-next";
import PageHeader from "~/components/ui/PageHeader.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useAcademicYear } from "~/composables/utils/useAcademicYear";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch } from "~/utils/api";

const { Notify, Confirm } = useNotiflix();
const { currentAcademicYear, currentSemester } = useAcademicYear();

// --- Options & Sub Levels ---
const subLevels = ["Pemula", "Huruf", "Kata", "Paragraf", "Cerita"];

// Level options for desktop table inline buttons
const levelOptions = [
  {
    value: "Intervensi Khusus",
    label: "Intervensi",
    activeClass: "bg-rose-500 text-white border-rose-600 shadow-sm ring-2 ring-rose-500/20",
    inactiveClass: "bg-rose-500/5 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40",
  },
  {
    value: "Dasar",
    label: "Dasar",
    activeClass: "bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/20",
    inactiveClass: "bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
  },
  {
    value: "Cakap",
    label: "Cakap",
    activeClass: "bg-sky-500 text-white border-sky-600 shadow-sm ring-2 ring-sky-500/20",
    inactiveClass: "bg-sky-500/5 hover:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/40",
  },
  {
    value: "Mahir",
    label: "Mahir",
    activeClass: "bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/20",
    inactiveClass: "bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
  },
];

// --- State (Tahun Pelajaran & Semester Berjalan) ---
const tapel = computed(() => currentAcademicYear.value || "2025/2026");
const semester = computed(() => currentSemester.value || "Ganjil");
const selectedKelas = ref<any>(null);
const kelasList = ref<any[]>([]);
const students = ref<any[]>([]);
const originalStudentsJSON = ref("");

const searchQuery = ref("");
const isLoadingKelas = ref(false);
const isLoadingStudents = ref(false);
const isSaving = ref(false);
const infoModalStudent = ref<any>(null);

// Has Unsaved Changes
const hasUnsavedChanges = computed(() => {
  if (!students.value.length || !originalStudentsJSON.value) return false;
  return JSON.stringify(students.value.map(s => ({
    siswa_id: s.siswa_id,
    level: s.level,
    sub_level: s.sub_level,
  }))) !== originalStudentsJSON.value;
});

// Filtered Students
const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value;
  const q = searchQuery.value.toLowerCase().trim();
  return students.value.filter(
    s => s.nama?.toLowerCase().includes(q) || s.nisn?.includes(q) || s.nis_lokal?.includes(q)
  );
});

// Helpers for Avatars & Colors
const avatarColors = [
  "bg-emerald-600",
  "bg-sky-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
];

function getAvatarBgClass(index: number) {
  return avatarColors[index % avatarColors.length];
}

function getInitials(name: string) {
  if (!name) return "S";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getCardBorderClass(level: string) {
  switch (level) {
    case "Intervensi Khusus":
      return "border-rose-300 dark:border-rose-900/50 hover:border-rose-400";
    case "Dasar":
      return "border-amber-300 dark:border-amber-900/50 hover:border-amber-400";
    case "Cakap":
      return "border-sky-300 dark:border-sky-900/50 hover:border-sky-400";
    case "Mahir":
      return "border-emerald-300 dark:border-emerald-900/50 hover:border-emerald-400";
    default:
      return "theme-border hover:border-slate-400";
  }
}

function getLevelDotClass(level: string) {
  switch (level) {
    case "Intervensi Khusus":
      return "bg-rose-500";
    case "Dasar":
      return "bg-amber-500";
    case "Cakap":
      return "bg-sky-500";
    case "Mahir":
      return "bg-emerald-500";
    default:
      return "bg-slate-400";
  }
}

function countLevel(level: string) {
  return students.value.filter(s => s.level === level).length;
}

// Actions
function setLevel(student: any, level: string) {
  student.level = level;
  if (level === "Intervensi Khusus") {
    if (!student.sub_level) {
      student.sub_level = "Pemula";
    }
  } else {
    student.sub_level = null;
  }
}

function setSubLevel(student: any, subLevel: string) {
  student.level = "Intervensi Khusus";
  student.sub_level = subLevel;
}



function showStudentInfo(student: any) {
  infoModalStudent.value = student;
}

function formatRelativeTime(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function formatDateFull(dateStr: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
}

function handleSelectKelasById(kelasId: string | number) {
  const target = kelasList.value.find(k => String(k.id_kelas) === String(kelasId));
  if (target) {
    selectKelas(target);
  }
}

// Fetch Kelas
async function fetchKelas() {
  isLoadingKelas.value = true;
  try {
    const response = await authenticatedFetch("/api/literasi/kelas-guru");
    if (!response.ok) throw new Error("Gagal mengambil data kelas");
    const res = await response.json();
    kelasList.value = Array.isArray(res) ? res : [];
  } catch (err: any) {
    Notify.failure(err?.message || "Gagal memuat data kelas");
  } finally {
    isLoadingKelas.value = false;
  }
}

// Select Kelas
function selectKelas(kelas: any) {
  if (hasUnsavedChanges.value) {
    Confirm.show(
      "Perubahan Belum Disimpan",
      "Ada perubahan data literasi yang belum disimpan. Apakah Anda yakin ingin beralih kelas?",
      "Beralih Kelas",
      "Batal",
      () => {
        selectedKelas.value = kelas;
        fetchStudents();
      }
    );
    return;
  }
  selectedKelas.value = kelas;
  fetchStudents();
}

function handleBackToKelasList() {
  if (hasUnsavedChanges.value) {
    Confirm.show(
      "Perubahan Belum Disimpan",
      "Ada perubahan data literasi yang belum disimpan. Apakah Anda yakin ingin kembali ke daftar kelas?",
      "Kembali",
      "Batal",
      () => {
        selectedKelas.value = null;
        students.value = [];
        originalStudentsJSON.value = "";
      }
    );
    return;
  }
  selectedKelas.value = null;
  students.value = [];
  originalStudentsJSON.value = "";
}

// Fetch Students
async function fetchStudents() {
  if (!selectedKelas.value || !tapel.value || !semester.value) return;
  isLoadingStudents.value = true;
  try {
    const url = `/api/literasi/data?kelas_id=${encodeURIComponent(selectedKelas.value.id_kelas)}&tapel=${encodeURIComponent(tapel.value)}&semester=${encodeURIComponent(semester.value)}`;
    const response = await authenticatedFetch(url);
    if (!response.ok) throw new Error("Gagal mengambil data siswa");
    const data = await response.json();

    // Default level if empty: 'Intervensi Khusus' with 'Pemula' or null
    students.value = (Array.isArray(data) ? data : []).map((item: any) => ({
      ...item,
      level: item.level || "Intervensi Khusus",
      sub_level: item.level === "Intervensi Khusus" ? (item.sub_level || "Pemula") : item.sub_level,
    }));

    originalStudentsJSON.value = JSON.stringify(students.value.map(s => ({
      siswa_id: s.siswa_id,
      level: s.level,
      sub_level: s.sub_level,
    })));
  } catch (err: any) {
    Notify.failure(err?.message || "Gagal memuat data siswa");
  } finally {
    isLoadingStudents.value = false;
  }
}

// Save Data Batch
async function saveData() {
  if (!selectedKelas.value || !tapel.value || !semester.value) return;
  isSaving.value = true;
  try {
    const payload = {
      kelas_id: selectedKelas.value.id_kelas,
      tahun_pelajaran: tapel.value,
      semester: semester.value,
      data: students.value.map(s => ({
        siswa_id: s.siswa_id,
        level: s.level,
        sub_level: s.sub_level,
      })),
    };

    const response = await authenticatedFetch("/api/literasi/data", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.statusMessage || errData.error || "Gagal menyimpan data literasi");
    }

    const res = await response.json();
    Notify.success(res?.message || "Data literasi berhasil disimpan!");
    await fetchStudents();
  } catch (err: any) {
    Notify.failure(err?.message || "Gagal menyimpan data literasi");
  } finally {
    isSaving.value = false;
  }
}

function resetChanges() {
  fetchStudents();
}

// Navigation Guard when leaving route
onBeforeRouteLeave((_to, _from, next) => {
  if (hasUnsavedChanges.value) {
    Confirm.show(
      "Perubahan Belum Disimpan",
      "Ada perubahan data literasi yang belum disimpan ke database. Apakah Anda yakin ingin meninggalkan halaman ini?",
      "Tinggalkan",
      "Tetap di Sini",
      () => {
        next();
      },
      () => {
        next(false);
      }
    );
  } else {
    next();
  }
});

// Guard when closing tab or reloading browser
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault();
    e.returnValue = "Ada perubahan data literasi yang belum disimpan.";
    return e.returnValue;
  }
};

// Watchers
watch([tapel, semester], () => {
  if (selectedKelas.value) {
    fetchStudents();
  }
});

// Mounted & Unmounted
onMounted(() => {
  fetchKelas();
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});
</script>
