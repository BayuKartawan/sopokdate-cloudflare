<template>
  <div class="min-h-screen">
    <div class="page-layout">
    <!-- Top Nav -->
    <UiPageHeader
      :title="`Pengisian EDM — Bagian ${bagianCode}`"
      :breadcrumbs="[{ label: 'EDM' }, { label: 'Isi EDM', to: '/edm/isi' }, { label: `Bagian ${bagianCode}` }]"
    >
      <template #leading>
        <UiBaseButton
          :to="'/edm/isi'"
          text="Kembali"
          title="Kembali ke Isi EDM"
          class="w-full sm:w-auto"
        >
          <template #icon><ArrowLeft class="w-4 h-4" /></template>
        </UiBaseButton>
      </template>
      <template #actions>
        <!-- Info Tim -->
        <UiBaseButton
          text="Info Tim"
          title="Lihat info tim bagian ini"
          class="w-full sm:w-auto"
          @click="teamInfoDialog.show = true"
        >
          <template #icon><UsersRound class="w-3.5 h-3.5" /></template>
        </UiBaseButton>
      </template>
    </UiPageHeader>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Empty State: No Indicators -->
    <div v-else-if="indikatorList.length === 0"
      class="flex flex-col items-center justify-center py-16 text-center rounded-xl"
      style="background: var(--bg-card); border: 1px solid var(--border-primary)">
      <ListChecks class="w-12 h-12 mb-3 opacity-30" style="color: var(--text-muted)" />
      <h2 class="font-semibold text-lg mb-1" style="color: var(--text-heading)">
        Belum Ada Indikator / Soal
      </h2>
      <p class="text-sm max-w-md mb-5" style="color: var(--text-muted)">
        Tidak ada instrumen yang ditemukan untuk Bagian {{ bagianCode }}.
      </p>
    </div>

    <!-- Soal Pagination & Card Container -->
    <div v-else class="space-y-4">
      <!-- Minimalist & Mobile-Responsive Navigasi Soal -->
      <div class="rounded-xl p-3 sm:p-4"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        
        <!-- Header minimalis -->
        <div class="flex items-center justify-between gap-2 mb-2.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold" style="color: var(--text-heading)">
              Navigasi Soal
            </span>
            <span class="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {{ answeredCount }}/{{ indikatorList.length }} Terisi
            </span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md"
              style="background: var(--bg-secondary); color: var(--text-secondary)">
              Soal {{ currentPage }} / {{ totalPages }}
            </span>
          </div>
        </div>

        <!-- Scrollable Button Pills (Horizontal on mobile, Grid Wrap on desktop) -->
        <div class="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap pb-1 pt-0.5 scrollbar-none sm:max-h-32 sm:overflow-y-auto">
          <button v-for="(item, idx) in indikatorList" :key="item.kode_soal || idx"
            @click="goToPage(idx + 1)"
            class="shrink-0 h-8 min-w-[2.5rem] px-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center transition-all cursor-pointer select-none border"
            :class="[
              currentPage === idx + 1
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-extrabold ring-2 ring-emerald-500/30'
                : savedAnswers[item.kode_soal]?.skor
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold hover:bg-emerald-500/25'
                  : 'hover:border-emerald-500/40 text-zinc-600 dark:text-zinc-400'
            ]"
            :style="currentPage !== idx + 1 && !savedAnswers[item.kode_soal]?.skor ? 'background: var(--bg-secondary); border-color: var(--border-primary)' : ''">
            <span>{{ item.kode_soal || (idx + 1) }}</span>
            <span v-if="savedAnswers[item.kode_soal]?.skor && currentPage !== idx + 1"
              class="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 shrink-0">
            </span>
          </button>
        </div>
      </div>

      <!-- Single Soal Card (1 Soal 1 Halaman) -->
      <div v-if="currentItem" class="rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-sm"
        :class="localAnswers[currentItem.kode_soal]?.skor ? 'ring-1 ring-emerald-500/40' : ''"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">

        <!-- Header: Pertanyaan + Last Updated Info -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 pb-4 border-b"
          style="border-color: var(--border-subtle)">
          <div class="flex-1 min-w-0">
            <h2 class="text-base sm:text-lg font-bold leading-relaxed break-words whitespace-pre-line" style="color: var(--text-heading)">
              {{ currentItem.pertanyaan }}
            </h2>
          </div>

          <span v-if="localAnswers[currentItem.kode_soal]?.updated_by_nama"
            class="text-xs px-2.5 py-1 rounded-md self-start shrink-0 whitespace-normal break-words"
            style="background: var(--bg-secondary); color: var(--text-muted)">
            Diperbarui oleh: <strong>{{ localAnswers[currentItem.kode_soal].updated_by_nama }}</strong>
          </span>
        </div>

        <!-- ─── Step 1: Bukti yang diminta ─── -->
        <div v-if="currentItem.bukti_yang_diminta" class="mb-0">
          <div class="p-3.5 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm"
            style="background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-subtle)">
            <div class="flex-1 min-w-0 overflow-hidden">
              <strong class="font-semibold block text-emerald-700 dark:text-emerald-400 mb-2">Detail berkas-berkas yg harus diunggah:</strong>
              <div v-if="getLines(currentItem.bukti_yang_diminta).length > 0" class=" leading-relaxed mt-1">
                <div v-for="(line, lIdx) in getLines(currentItem.bukti_yang_diminta)" :key="lIdx" class="flex items-start break-words">
                  <span v-if="parseLineItem(line).number" class="font-bold shrink-0 text-emerald-600 dark:text-emerald-400 select-none min-w-[1.25rem] text-left">
                    {{ parseLineItem(line).number }}
                  </span>
                  <span v-else class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span class="flex-1 text-xs sm:text-sm leading-relaxed" style="color: var(--text-primary)">
                    {{ parseLineItem(line).text }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Step 1: Unggah Berkas ─── -->
        <div class="pt-5 mt-5 border-t" style="border-color: var(--border-subtle)">
          <div class="flex items-center gap-2.5 mb-3">
            <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold inline-flex items-center justify-center shrink-0">1</span>
            <span class="text-sm font-semibold" style="color: var(--text-heading)">Unggah Berkas</span>
            <span class="text-xs font-medium text-rose-500">(min. 1 file)</span>
          </div>

          <!-- Drop Zone -->
          <div
            v-if="currentFileCount < 10"
            class="relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer group"
            :class="isDragging ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' : 'hover:border-emerald-400'"
            :style="!isDragging ? 'border-color: var(--border-input); background: var(--bg-input)' : ''"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
            @click="triggerFileInput"
          >
            <input
              ref="fileInputRef"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              class="hidden"
              @change="handleFileSelect"
            >
            <div class="flex flex-col items-center gap-2">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                :class="isDragging ? 'bg-emerald-500/20' : 'bg-emerald-500/10'">
                <Upload class="w-6 h-6" :class="isDragging ? 'text-emerald-500' : 'text-emerald-600 dark:text-emerald-400'" />
              </div>
              <div>
                <p class="text-sm font-medium" style="color: var(--text-heading)">
                  <span v-if="isDragging">Lepaskan file di sini</span>
                  <span v-else>Drag & drop file, atau <span class="text-emerald-600 dark:text-emerald-400 underline">pilih file</span></span>
                </p>
                <p class="text-xs mt-0.5" style="color: var(--text-muted)">
                  Gambar (JPG, PNG, WEBP) atau PDF · Maks 2 MB per file
                </p>
              </div>
            </div>
          </div>

          <!-- Upload Progress -->
          <div v-if="isUploading" class="mt-3 rounded-xl p-3" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)">
            <div class="flex items-center gap-3">
              <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              <span class="text-sm font-medium" style="color: var(--text-heading)">Mengupload file...</span>
            </div>
          </div>

          <!-- Uploaded Files List -->
          <div v-if="currentBuktiFiles.length > 0" class="mt-3 space-y-2">
            <div v-for="file in currentBuktiFiles" :key="file.id"
              class="flex items-center gap-3 p-3 rounded-xl transition-all group/file"
              style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)">

              <!-- Thumbnail / Icon -->
              <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                style="background: var(--bg-tertiary)">
                <img v-if="file.mime_type.startsWith('image/')"
                  :src="getBuktiPreviewUrl(file.r2_key)"
                  :alt="file.original_name"
                  class="w-10 h-10 object-cover rounded-lg">
                <FileText v-else class="w-5 h-5 text-rose-500" />
              </div>

              <!-- File Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate" style="color: var(--text-heading)">
                  {{ file.original_name }}
                </p>
                <p class="text-xs" style="color: var(--text-muted)">
                  {{ formatFileSize(file.file_size) }}
                  <span v-if="file.uploader_nama"> · oleh {{ file.uploader_nama }}</span>
                </p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1.5 opacity-60 group-hover/file:opacity-100 transition-opacity">
                <UiBaseButton
                  :href="getBuktiPreviewUrl(file.r2_key)"
                  target="_blank"
                  title="Preview / Download"
                  :icon-only="true"
                  size="sm"
                >
                  <template #icon><ExternalLink class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /></template>
                </UiBaseButton>
                <UiBaseButton
                  title="Hapus file"
                  :icon-only="true"
                  size="sm"
                  @click="confirmDeleteFile(file)"
                >
                  <template #icon><Trash2 class="w-3.5 h-3.5 text-rose-500" /></template>
                </UiBaseButton>
              </div>
            </div>
          </div>

          <!-- Warning: belum upload -->
          <div v-if="currentFileCount === 0 && !isUploading" class="mt-3 p-3 rounded-xl flex items-center gap-2.5"
            style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)">
            <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span class="text-xs font-medium" style="color: var(--text-muted)">Upload minimal 1 file bukti fisik untuk dapat memilih jawaban.</span>
          </div>
        </div>

        <!-- ─── Step 2: Jawaban ─── -->
        <div class="pt-5 mt-5 border-t" style="border-color: var(--border-subtle)">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold inline-flex items-center justify-center shrink-0">2</span>
              <span class="text-sm font-semibold" style="color: var(--text-heading)">Jawaban</span>
            </div>
            <span v-if="currentItem && localAnswers[currentItem.kode_soal]"
              class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors"
              :class="getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) >= 30
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'">
              <PencilLine class="w-3 h-3 flex-shrink-0" />
              {{ getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) }} / 30 kata
            </span>
          </div>

          <textarea
            v-if="currentItem && localAnswers[currentItem.kode_soal]"
            v-model="localAnswers[currentItem.kode_soal].upload_text"
            rows="1"
            placeholder="Berikan jawaban sesuai dengan kondisi madrasah saat ini, benar jujur dan transparan agar sistem memberikan jenis kegiatan yang sesuai untuk meningkatkan kualitas madrasah anda"
            class="w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors border outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-none overflow-hidden"
            :class="getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) < 30 ? 'border-amber-400 dark:border-amber-600' : 'border-emerald-500'"
            style="background: var(--bg-input); color: var(--text-primary); min-height: 2.5rem;"
            ref="textareaRef"
            @input="autoResize"
          ></textarea>

          <!-- Warning jika teks kurang dari 30 kata -->
          <div v-if="currentItem && localAnswers[currentItem.kode_soal] && getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) < 30"
            class="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
            <AlertTriangle class="w-4 h-4 flex-shrink-0" />
            <span>Penjelasan ringkas minimal 30 kata agar jawaban dapat disimpan (saat ini {{ getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) }} kata).</span>
          </div>
        </div>

        <!-- ─── Step 3: Pilih Tingkat ─── -->
        <div class="pt-5 mt-5 border-t" style="border-color: var(--border-subtle)">
          <div class="flex items-center gap-2.5 mb-3">
            <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold inline-flex items-center justify-center shrink-0">3</span>
            <span class="text-sm font-semibold" style="color: var(--text-heading)">Pilih Tingkat</span>
          </div>

          <!-- Lock overlay when no files uploaded -->
          <div v-if="currentFileCount === 0"
            class="relative rounded-xl p-6 text-center"
            style="background: var(--bg-secondary); border: 1px dashed var(--border-input); opacity: 0.6">
            <p class="text-sm font-medium" style="color: var(--text-muted)">Upload bukti fisik terlebih dahulu untuk membuka pilihan jawaban</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button v-for="p in parsePilihan(currentItem)" :key="p.skor"
              @click="setAnswer(currentItem.kode_soal, p.skor)"
              class="flex items-start gap-3 p-4 rounded-xl text-sm transition-all border-2 text-left w-full h-full cursor-pointer"
              :class="localAnswers[currentItem.kode_soal]?.skor === p.skor
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-500 font-semibold shadow-xs'
                : 'hover:border-emerald-300 dark:hover:border-emerald-700'"
              :style="localAnswers[currentItem.kode_soal]?.skor !== p.skor ? 'border-color: var(--border-primary); background: var(--bg-secondary); color: var(--text-primary)' : ''">
              <div class="flex-1 min-w-0">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border mb-2 transition-colors"
                  :class="getTingkatBadgeClass(p.skor)">
                  {{ p.nama || `Tingkat ${p.skor}` }}
                </span>
                <div v-if="getLines(p.label).length > 1" class="space-y-1.5">
                  <div v-for="(line, lIdx) in getLines(p.label)" :key="lIdx" class="flex items-start gap-2 text-xs leading-relaxed break-words">
                    <span v-if="parseLineItem(line).number" class="font-bold shrink-0 text-emerald-600 dark:text-emerald-400 select-none min-w-[1.25rem] text-left">
                      {{ parseLineItem(line).number }}
                    </span>
                    <span v-else class="w-1.5 h-1.5 rounded-full bg-current opacity-60 mt-1.5 shrink-0"></span>
                    <span class="flex-1 font-normal" style="color: var(--text-primary)">
                      {{ parseLineItem(line).text }}
                    </span>
                  </div>
                </div>
                <span v-else class="text-xs leading-relaxed break-words block font-normal"
                  style="color: var(--text-primary)">
                  {{ normalizeText(p.label) }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Pagination Controls Bar -->
        <div class="pt-4 border-t" style="border-color: var(--border-subtle)">
          
          <!-- Mobile layout (< sm) -->
          <div class="flex flex-col gap-3 sm:hidden">
            <!-- Simpan Button (Full Width) -->
            <div class="w-full text-center">
              <UiBaseButton
                :text="isSaving ? 'Menyimpan...' : 'Simpan Soal Ini'"
                title="Simpan jawaban untuk soal ini"
                :loading="isSaving"
                :disabled="!canSaveCurrentItem || isSaving"
                class="w-full justify-center"
                :class="canSaveCurrentItem ? 'ring-2 ring-emerald-500 ring-offset-2' : ''"
                @click="handleSaveCurrent"
              >
                <template #icon><Save class="w-4 h-4" /></template>
              </UiBaseButton>
              <p v-if="isCurrentItemChanged && !canSaveCurrentItem" class="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1.5 leading-tight">
                Lengkapi min. 1 bukti, min. 30 kata, & pilih skor untuk menyimpan
              </p>
            </div>

            <!-- Nav prev/next buttons (Grid 2 Kolom Sejajar) -->
            <div class="grid grid-cols-2 gap-2">
              <UiBaseButton
                text="Sebelumnya"
                title="Soal sebelumnya"
                :disabled="currentPage === 1"
                class="w-full justify-center"
                @click="prevPage"
              >
                <template #icon><ChevronLeft class="w-4 h-4" /></template>
              </UiBaseButton>
              <UiBaseButton
                text="Selanjutnya"
                title="Soal berikutnya"
                :disabled="currentPage === totalPages"
                class="w-full justify-center"
                @click="nextPage"
              >
                <template #icon><ChevronRight class="w-4 h-4" /></template>
              </UiBaseButton>
            </div>
          </div>

          <!-- Desktop / Tablet layout (>= sm) -->
          <div class="hidden sm:flex items-center justify-between gap-3">
            <UiBaseButton
              text="Sebelumnya"
              title="Soal sebelumnya"
              :disabled="currentPage === 1"
              @click="prevPage"
            >
              <template #icon><ChevronLeft class="w-4 h-4" /></template>
            </UiBaseButton>

            <div class="flex flex-col items-center gap-1">
              <UiBaseButton
                :text="isSaving ? 'Menyimpan...' : 'Simpan Soal Ini'"
                title="Simpan jawaban untuk soal ini"
                :loading="isSaving"
                :disabled="!canSaveCurrentItem || isSaving"
                :class="canSaveCurrentItem ? 'ring-2 ring-emerald-500 ring-offset-2' : ''"
                @click="handleSaveCurrent"
              >
                <template #icon><Save class="w-4 h-4" /></template>
              </UiBaseButton>
              <span v-if="isCurrentItemChanged && !canSaveCurrentItem" class="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Lengkapi min. 1 bukti, min. 30 kata, & pilih skor untuk menyimpan
              </span>
            </div>

            <UiBaseButton
              text="Selanjutnya"
              title="Soal berikutnya"
              :disabled="currentPage === totalPages"
              @click="nextPage"
            >
              <template #icon><ChevronRight class="w-4 h-4" /></template>
            </UiBaseButton>
          </div>

        </div>
      </div>
    </div>
    </div>
  </div>

  <!-- Delete Confirmation Dialog -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="deleteDialog.show" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="deleteDialog.show = false">
        <div class="absolute inset-0 bg-black/60"></div>
        <div class="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
              <Trash2 class="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 class="text-base font-bold" style="color: var(--text-heading)">Hapus File Bukti?</h3>
              <p class="text-sm mt-1" style="color: var(--text-muted)">
                File <strong>"{{ deleteDialog.fileName }}"</strong> akan dihapus permanen dan tidak dapat dikembalikan.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 justify-end">
            <UiBaseButton
              text="Batal"
              @click="deleteDialog.show = false"
            />
            <button @click="executeDeleteFile"
              class="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer">
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Navigation Unsaved Confirmation Dialog -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="navDialog.show" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="handleDialogCancel">
        <div class="absolute inset-0 bg-black/60"></div>
        <div class="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle class="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 class="text-base font-bold" style="color: var(--text-heading)">Simpan Perubahan Soal {{ currentItem?.kode_soal }}?</h3>
              <p class="text-sm mt-1 leading-relaxed" style="color: var(--text-muted)">
                Ada perubahan jawaban pada soal <strong>{{ currentItem?.kode_soal }}</strong> yang belum disimpan. Apakah Anda ingin menyimpan perubahan ini sebelum berpindah?
              </p>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-end mt-6">
            <UiBaseButton
              text="Batal"
              @click="handleDialogCancel"
            />
            <button @click="handleDialogDiscardAndProceed"
              class="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer text-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400">
              Buang Perubahan
            </button>
            <button @click="handleDialogSaveAndProceed"
              :disabled="!canSaveCurrentItem || isSaving"
              class="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors cursor-pointer text-center">
              {{ isSaving ? 'Menyimpan...' : 'Simpan & Lanjut' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Team Info Dialog -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="teamInfoDialog.show" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="teamInfoDialog.show = false">
        <div class="absolute inset-0 bg-black/60"></div>
        <div class="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">

          <!-- Modal Header -->
          <div class="flex items-center px-5 py-4 border-b"
            style="border-color: var(--border-primary)">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                :class="bagianColor(bagianCode)">
                <UsersRound class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-bold" style="color: var(--text-heading)">
                  Tim Bagian {{ bagianCode }}
                </h3>
                <p class="text-xs" style="color: var(--text-muted)">{{ bagianFullName }}</p>
              </div>
            </div>
          </div>

          <!-- Info Sinkronisasi -->
          <div class="px-5 py-3.5 border-b flex items-start gap-2.5"
            style="border-color: var(--border-subtle); background: var(--bg-secondary)">
            <p class="text-xs leading-relaxed" style="color: var(--text-secondary)">
              Jawaban yang diisi di halaman ini <strong>otomatis tersinkronisasi</strong> untuk seluruh anggota tim bagian ini.
            </p>
          </div>

          <!-- Daftar Anggota -->
          <div class="px-5 py-4">
            <p class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--text-muted)">
              Anggota Tim ({{ anggotaBagian.length }} orang)
            </p>
            <div v-if="anggotaBagian.length > 0" class="space-y-2">
              <div v-for="a in anggotaBagian" :key="a.gtk_id"
                class="flex items-center gap-3 p-3 rounded-xl"
                :class="a.gtk_id === myGtkId ? 'bg-emerald-500/10 border border-emerald-500/30' : ''"
                :style="a.gtk_id !== myGtkId ? 'background: var(--bg-secondary); border: 1px solid var(--border-subtle)' : ''">
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  :class="a.gtk_id === myGtkId ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'">
                  {{ (a.nama_lengkap || '?').charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate"
                    :class="a.gtk_id === myGtkId ? 'text-emerald-700 dark:text-emerald-300' : ''"
                    :style="a.gtk_id !== myGtkId ? 'color: var(--text-primary)' : ''">
                    {{ a.nama_lengkap }}
                  </p>
                </div>
                <span v-if="a.gtk_id === myGtkId"
                  class="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500 text-white flex-shrink-0">
                  Anda
                </span>
              </div>
            </div>
            <div v-else class="py-6 text-center">
              <UsersRound class="w-10 h-10 mx-auto mb-2 opacity-20" style="color: var(--text-muted)" />
              <p class="text-sm" style="color: var(--text-muted)">Belum ada anggota terdaftar</p>
            </div>
          </div>

          <div class="px-5 py-3 border-t flex justify-end"
            style="border-color: var(--border-primary); background: var(--bg-secondary)">
            <UiBaseButton
              text="Tutup"
              @click="teamInfoDialog.show = false"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import { useEdm, EDM_BAGIAN_LIST } from "~/composables/edm/useEdm";
import { useNotiflix } from "~/composables/ui/useFeedback";
import {
  ArrowLeft, Save, UsersRound, ListChecks, Plus,
  ChevronLeft, ChevronRight, CheckCircle2, X, PencilLine,
  Upload, FileText, ExternalLink, Trash2, AlertTriangle
} from "lucide-vue-next";

const route = useRoute();
const { Notify } = useNotiflix();
const {
  isLoading, isSaving, listTahun, selectedTahunId,
  fetchTahunAnggaran, fetchBagian, fetchIndikator, fetchJawaban, saveJawaban,
  uploadBuktiFiles, fetchBuktiFiles, deleteBuktiFile, getBuktiDownloadUrl,
} = useEdm();

const bagianCode = computed(() => {
  return (route.params.bagian || route.params.kelompok || "A").toString().toUpperCase();
});

const bagianFullName = computed(() => {
  const meta = EDM_BAGIAN_LIST.find((m) => m.code === bagianCode.value);
  return meta ? meta.name : `Bagian ${bagianCode.value}`;
});

const isAdmin = computed(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("user-role") === "admin";
});

const myGtkId = computed(() => {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("user-gtk-id");
  return id ? parseInt(id) : null;
});

const indikatorList = ref([]);
const localAnswers = reactive({});
const savedAnswers = reactive({});
const myBagianId = ref(null);
const anggotaBagian = ref([]);

// Pagination State
const currentPage = ref(1);

const totalPages = computed(() => indikatorList.value.length);

const currentItem = computed(() => {
  if (indikatorList.value.length === 0) return null;
  const idx = currentPage.value - 1;
  if (idx < 0 || idx >= indikatorList.value.length) return indikatorList.value[0];
  return indikatorList.value[idx];
});

// Navigation Unsaved Dialog State
const navDialog = reactive({
  show: false,
  targetPage: null,
});

const isCurrentItemChanged = computed(() => {
  if (!currentItem.value) return false;
  const k = currentItem.value.kode_soal;
  const local = localAnswers[k] || {};
  const saved = savedAnswers[k] || {};
  return (local.skor ?? null) !== (saved.skor ?? null) ||
         (local.upload_text || "") !== (saved.upload_text || "");
});

const canSaveCurrentItem = computed(() => {
  if (!currentItem.value) return false;
  const k = currentItem.value.kode_soal;
  const ans = localAnswers[k];
  if (!ans) return false;

  const hasChanges = isCurrentItemChanged.value;
  const hasScore = ans.skor !== null && ans.skor !== undefined;
  const hasProof = currentFileCount.value >= 1;
  const hasMinWords = getWordCount(ans.upload_text) >= 30;

  return hasChanges && hasScore && hasProof && hasMinWords;
});

const attemptNavigation = (targetPage) => {
  if (targetPage < 1 || targetPage > totalPages.value || targetPage === currentPage.value) return;
  if (isCurrentItemChanged.value) {
    navDialog.targetPage = targetPage;
    navDialog.show = true;
  } else {
    currentPage.value = targetPage;
  }
};

const goToPage = (page) => {
  attemptNavigation(page);
};

const prevPage = () => {
  attemptNavigation(currentPage.value - 1);
};

const nextPage = () => {
  attemptNavigation(currentPage.value + 1);
};

const handleDialogCancel = () => {
  navDialog.show = false;
  navDialog.targetPage = null;
};

const handleDialogDiscardAndProceed = () => {
  if (currentItem.value) {
    const k = currentItem.value.kode_soal;
    const saved = savedAnswers[k] || {};
    localAnswers[k].skor = saved.skor ?? null;
    localAnswers[k].upload_text = saved.upload_text || "";
  }
  const target = navDialog.targetPage;
  navDialog.show = false;
  navDialog.targetPage = null;
  if (target) {
    currentPage.value = target;
  }
};

const handleDialogSaveAndProceed = async () => {
  if (!canSaveCurrentItem.value) {
    Notify?.failure?.("Persyaratan simpan belum lengkap (upload bukti, min. 30 kata, & pilih skor).");
    return;
  }
  const ok = await handleSaveCurrent();
  if (ok) {
    const target = navDialog.targetPage;
    navDialog.show = false;
    navDialog.targetPage = null;
    if (target) {
      currentPage.value = target;
    }
  }
};

onBeforeRouteLeave((to, from, next) => {
  if (isCurrentItemChanged.value) {
    const answer = window.confirm(
      `Ada perubahan jawaban pada soal ${currentItem.value?.kode_soal} yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?`
    );
    if (answer) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

const bagianColor = (name) => {
  const c = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return c[name] || "bg-zinc-600";
};

// Normalisasi teks dari data instrumen: hapus \r, trim tab trailing & bullet prefix per baris
const normalizeText = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/\r\n/g, "\n")   // Windows line ending → Unix
    .replace(/\r/g, "\n")      // carriage return sisa → newline
    .split("\n")
    .map((line) => line.replace(/^[\s\-\u2022\*\t]+/, "").replace(/\t+$/g, "").trim())
    .filter(Boolean)
    .join("\n");
};

// Ambil array baris teks untuk rendering list rapi
const getLines = (str) => {
  if (!str || typeof str !== "string") return [];
  return str
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[\s\-\u2022\*\t]+/, "").replace(/\t+$/g, "").trim())
    .filter(Boolean);
};

const parseLineItem = (line) => {
  if (!line || typeof line !== "string") return { number: "", text: "" };
  const match = line.match(/^(\d+[\.\)])\s*(.*)/);
  if (match) {
    return { number: match[1], text: match[2] };
  }
  return { number: "", text: line };
};

const isNumbered = (str) => {
  if (!str || typeof str !== "string") return false;
  return /^\d+[\.\)]/.test(str);
};

const getWordCount = (str) => {
  if (!str || typeof str !== "string") return 0;
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

const parsePilihan = (item) => {
  if (!item) return [];
  if (Array.isArray(item.pilihan)) {
    return item.pilihan.map((p) => ({
      skor: parseInt(p.kode || p.skor || 0),
      nama: p.nama || `Tingkat ${p.kode}`,
      label: p.keterangan || p.label || '',
    }));
  }
  return [];
};

const answeredCount = computed(() => {
  return Object.values(savedAnswers).filter(
    (a) => a.skor !== null && a.skor !== undefined && getWordCount(a.upload_text) >= 30
  ).length;
});

const setAnswer = (kodeSoal, skor) => {
  if (!localAnswers[kodeSoal]) {
    localAnswers[kodeSoal] = {
      kode_soal: kodeSoal,
      skor: null,
      upload_text: "",
      updated_by_nama: "",
    };
  }

  const wordCount = getWordCount(localAnswers[kodeSoal].upload_text);
  if (skor !== null && wordCount < 30) {
    Notify?.warning?.(`Penjelasan ringkas pembuktian minimal 30 kata sebelum memilih tingkat skor (saat ini ${wordCount} kata).`);
  }

  if (localAnswers[kodeSoal].skor === skor) {
    localAnswers[kodeSoal].skor = null;
  } else {
    localAnswers[kodeSoal].skor = skor;
  }
};

const resetAnswers = () => {
  indikatorList.value.forEach((item) => {
    localAnswers[item.kode_soal] = {
      kode_soal: item.kode_soal,
      skor: null,
      upload_text: item.upload_text || "",
      updated_by_nama: "",
    };
    savedAnswers[item.kode_soal] = {
      skor: null,
      upload_text: item.upload_text || "",
    };
  });
};

const loadExistingAnswers = async (tahunId, bId) => {
  if (!bId) return;
  const existing = await fetchJawaban(tahunId, bagianCode.value, bId);
  existing.forEach((j) => {
    const k = j.kode_soal || j.indikator_id;
    if (localAnswers[k]) {
      localAnswers[k].skor = j.skor;
      localAnswers[k].upload_text = j.upload_text || "";
      localAnswers[k].updated_by_nama = j.updated_by_nama || "";
      savedAnswers[k] = {
        skor: j.skor,
        upload_text: j.upload_text || "",
      };
    }
  });
};

const handleSaveCurrent = async () => {
  if (!currentItem.value || !myBagianId.value) {
    Notify?.failure?.("Data bagian tidak ditemukan");
    return false;
  }

  const k = currentItem.value.kode_soal;
  const ans = localAnswers[k] || {};
  const wordCount = getWordCount(ans.upload_text);

  if (ans.skor === null || ans.skor === undefined) {
    Notify?.failure?.("Pilih tingkat skor/jawaban terlebih dahulu.");
    return false;
  }

  if (currentFileCount.value === 0) {
    Notify?.failure?.("Upload minimal 1 file bukti fisik sebelum menyimpan.");
    return false;
  }

  if (wordCount < 30) {
    Notify?.failure?.(`Uraian deskripsi ringkas minimal 30 kata (saat ini ${wordCount} kata).`);
    return false;
  }

  const ok = await saveJawaban({
    bagian_id: myBagianId.value,
    gtk_id: myGtkId.value || undefined,
    jawaban: [
      {
        kode_soal: k,
        skor: ans.skor,
        upload_text: ans.upload_text || "",
      },
    ],
  });

  if (ok) {
    savedAnswers[k] = {
      skor: ans.skor,
      upload_text: ans.upload_text || "",
    };
    Notify?.success?.(`Jawaban soal ${k} berhasil disimpan.`);
    return true;
  }
  return false;
};

// ── Bukti File Upload (R2) ──
const buktiFilesMap = reactive({}); // { [kode_soal]: BuktiFile[] }
const isUploading = ref(false);
const isDragging = ref(false);
const fileInputRef = ref(null);

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

const currentBuktiFiles = computed(() => {
  if (!currentItem.value) return [];
  return buktiFilesMap[currentItem.value.kode_soal] || [];
});

const currentFileCount = computed(() => currentBuktiFiles.value.length);

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getBuktiPreviewUrl = (r2Key) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("user-token") : null;
  return `/api/edm/bukti/download/${r2Key}?token=${token}`;
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const validateFiles = (files) => {
  const errors = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`"${file.name}" — tipe tidak diizinkan (${file.type})`);
    }
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      errors.push(`"${file.name}" — terlalu besar (${sizeMB} MB, maks 2 MB)`);
    }
  }
  if (currentFileCount.value + files.length > 10) {
    errors.push(`Melebihi batas 10 file (saat ini ${currentFileCount.value} file)`);
  }
  return errors;
};

const processUpload = async (fileList) => {
  if (!currentItem.value || !myBagianId.value) return;

  const files = Array.from(fileList);
  if (files.length === 0) return;

  const errors = validateFiles(files);
  if (errors.length > 0) {
    Notify?.failure?.(errors[0]);
    return;
  }

  isUploading.value = true;
  try {
    const uploaded = await uploadBuktiFiles(
      files,
      currentItem.value.kode_soal,
      myBagianId.value,
      myGtkId.value || undefined,
    );

    if (uploaded.length > 0) {
      await loadBuktiForIndikator(currentItem.value.kode_soal);
    }
  } finally {
    isUploading.value = false;
  }
};

const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files && files.length > 0) {
    processUpload(files);
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const handleFileDrop = (event) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    processUpload(files);
  }
};

const getTingkatBadgeClass = (skor) => {
  switch (Number(skor)) {
    case 1:
      return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-400/50 dark:border-rose-700/60";
    case 2:
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/50 dark:border-amber-700/60";
    case 3:
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/50 dark:border-blue-700/60";
    case 4:
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/50 dark:border-emerald-700/60";
    default:
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-400/50 dark:border-indigo-700/60";
  }
};

const deleteDialog = reactive({ show: false, fileId: null, fileName: '' });
const teamInfoDialog = reactive({ show: false });
const textareaRef = ref(null);

const autoResize = (e) => {
  const el = e?.target || textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
};

const adjustTextareaHeight = async () => {
  await nextTick();
  if (textareaRef.value) {
    textareaRef.value.style.height = "auto";
    textareaRef.value.style.height = textareaRef.value.scrollHeight + "px";
  }
};

// Resize saat value berubah dari luar (load data, pindah soal, atau input teks)
watch(
  [
    () => currentItem.value?.kode_soal,
    () => currentItem.value ? localAnswers[currentItem.value.kode_soal]?.upload_text : null
  ],
  () => {
    adjustTextareaHeight();
  },
  { immediate: true, flush: 'post' }
);

const confirmDeleteFile = (file) => {
  deleteDialog.fileId = file.id;
  deleteDialog.fileName = file.original_name;
  deleteDialog.show = true;
};

const executeDeleteFile = async () => {
  if (!currentItem.value || !deleteDialog.fileId) return;
  deleteDialog.show = false;
  const ok = await deleteBuktiFile(deleteDialog.fileId);
  if (ok) {
    await loadBuktiForIndikator(currentItem.value.kode_soal);
  }
  deleteDialog.fileId = null;
  deleteDialog.fileName = '';
};

const loadBuktiForIndikator = async (kodeSoal) => {
  if (!myBagianId.value) return;
  const files = await fetchBuktiFiles(kodeSoal, myBagianId.value);
  buktiFilesMap[kodeSoal] = files;
};

watch(currentPage, async () => {
  if (currentItem.value && myBagianId.value) {
    if (!buktiFilesMap[currentItem.value.kode_soal]) {
      await loadBuktiForIndikator(currentItem.value.kode_soal);
    }
  }
});

onMounted(async () => {
  await fetchTahunAnggaran();
  if (!selectedTahunId.value) return;

  const tahunId = selectedTahunId.value;

  const bagianData = await fetchBagian(tahunId);
  const myBag = bagianData.find(
    (b) => (b.nama_bagian || b.nama_kelompok) === bagianCode.value
  );

  if (myBag) {
    myBagianId.value = myBag.id;
    anggotaBagian.value = myBag.anggota || [];
  }

  indikatorList.value = await fetchIndikator(tahunId, bagianCode.value);
  resetAnswers();
  currentPage.value = 1;

  if (myBagianId.value) {
    await loadExistingAnswers(tahunId, myBagianId.value);

    if (indikatorList.value.length > 0) {
      await loadBuktiForIndikator(indikatorList.value[0].kode_soal);
    }
  }
});
</script>

