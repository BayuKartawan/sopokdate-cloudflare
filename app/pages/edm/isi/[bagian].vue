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

    <!-- Skeleton Loader (Minimalist & Hemat DOM) -->
    <div v-if="isPageLoading || isLoading" class="space-y-4 animate-pulse">
      <!-- Navigasi Indikator Skeleton -->
      <div class="rounded-xl p-3.5 sm:p-4"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="h-4 w-28 rounded-md" style="background: var(--bg-tertiary)"></div>
          <div class="h-4 w-16 rounded-md bg-emerald-500/20"></div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div v-for="i in 8" :key="'skel-btn-' + i"
            class="h-8.5 w-10 rounded-lg"
            style="background: var(--bg-tertiary)">
          </div>
        </div>
      </div>

      <!-- Card Indikator Skeleton (Simple & Clean) -->
      <div class="rounded-xl p-4 sm:p-6 space-y-4"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        <!-- Header Pertanyaan -->
        <div class="space-y-2 pb-4 border-b" style="border-color: var(--border-subtle)">
          <div class="h-4 w-20 rounded-md bg-emerald-500/20"></div>
          <div class="h-5 w-4/5 rounded-md" style="background: var(--bg-tertiary)"></div>
          <div class="h-4 w-2/3 rounded-md" style="background: var(--bg-tertiary)"></div>
        </div>

        <!-- Content Area Skeleton (Ringkas) -->
        <div class="space-y-3 pt-1">
          <div class="h-20 w-full rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)"></div>
          <div class="h-14 w-full rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)"></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div class="h-16 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)"></div>
            <div class="h-16 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)"></div>
          </div>
        </div>
      </div>

      <!-- Footer Navigasi Skeleton -->
      <div class="rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        <div class="h-8 w-24 rounded-lg" style="background: var(--bg-tertiary)"></div>
        <div class="h-8 w-32 rounded-lg bg-emerald-600/30"></div>
        <div class="h-8 w-24 rounded-lg" style="background: var(--bg-tertiary)"></div>
      </div>
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
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-xs font-bold" style="color: var(--text-heading)">
            Navigasi Indikator
          </span>
          <span class="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {{ answeredCount }}/{{ indikatorList.length }} Terisi
          </span>
        </div>

        <!-- Button Pills (Wrap tanpa scroll, margin & touch-friendly) -->
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button v-for="(item, idx) in indikatorList" :key="item.kode_soal || idx"
            @click="goToPage(idx + 1)"
            class="h-8.5 min-w-10 px-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer select-none border"
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
          <div class="flex-1 min-w-0 space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Indikator {{ currentItem.kode_soal }}
              </span>
            </div>
            <h2 class="text-base sm:text-lg font-bold leading-relaxed wrap-break-word whitespace-pre-line" style="color: var(--text-heading)">
              {{ currentItem.pertanyaan }}
            </h2>
          </div>

          <span v-if="localAnswers[currentItem.kode_soal]?.updated_by_nama"
            class="text-xs px-2.5 py-1 rounded-md self-start shrink-0 whitespace-normal wrap-break-word"
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
                <div v-for="(line, lIdx) in getLines(currentItem.bukti_yang_diminta)" :key="lIdx" class="flex items-start wrap-break-word">
                  <span v-if="parseLineItem(line).number" class="font-bold shrink-0 text-emerald-600 dark:text-emerald-400 select-none min-w-5 text-left">
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
                  Gambar (JPG, PNG, WEBP) atau PDF · Maks 2 MB/ file·
                </p>
              </div>
            </div>
          </div>

          <!-- Upload Progress (shown during save) -->
          <div v-if="isUploading" class="mt-3 rounded-xl p-3" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)">
            <div class="flex items-center gap-3">
              <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <span class="text-sm font-medium" style="color: var(--text-heading)">Mengunggah & menyimpan file...</span>
            </div>
          </div>

          <!-- Draft indicator banner -->
          <div v-if="currentItem && hasDraftFileChanges(currentItem.kode_soal)" class="mt-3 p-3 rounded-xl flex items-center gap-2.5"
            style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25)">
            <AlertTriangle class="w-4 h-4 text-amber-500 shrink-0" />
            <span class="text-xs font-medium text-amber-700 dark:text-amber-400">
              Ada perubahan file (draf) yang belum disimpan.
              <span v-if="getDraftNewFiles(currentItem.kode_soal).length > 0">{{ getDraftNewFiles(currentItem.kode_soal).length }} file baru.</span>
              <span v-if="getDraftDeleteIds(currentItem.kode_soal).length > 0">{{ getDraftDeleteIds(currentItem.kode_soal).length }} file dihapus.</span>
              Tekan <strong>Simpan</strong> untuk menyimpan perubahan.
            </span>
          </div>

          <!-- Combined Files List (server files + draft new files) -->
          <div v-if="currentDisplayFiles.length > 0" class="mt-3 space-y-2">

            <!-- Server files (existing, not marked for deletion) -->
            <div v-for="file in currentServerFilesVisible" :key="'srv-' + file.id"
              class="flex items-center gap-3 p-3 rounded-xl transition-all group/file"
              style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)">

              <!-- Thumbnail / Icon -->
              <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
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
                  <span class="ml-1 text-emerald-600 dark:text-emerald-400 font-medium">✓ Tersimpan</span>
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
                  title="Hapus file (draf)"
                  :icon-only="true"
                  size="sm"
                  @click="confirmDeleteFile(file)"
                >
                  <template #icon><Trash2 class="w-3.5 h-3.5 text-rose-500" /></template>
                </UiBaseButton>
              </div>
            </div>

            <!-- Draft new files (belum diupload ke server) -->
            <div v-for="(draft, dIdx) in currentDraftNewFiles" :key="'draft-' + dIdx"
              class="flex items-center gap-3 p-3 rounded-xl transition-all group/file"
              style="background: rgba(245, 158, 11, 0.06); border: 1px dashed rgba(245, 158, 11, 0.35)">

              <!-- Thumbnail / Icon -->
              <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                style="background: var(--bg-tertiary)">
                <img v-if="draft.file.type.startsWith('image/')"
                  :src="draft.previewUrl"
                  :alt="draft.file.name"
                  class="w-10 h-10 object-cover rounded-lg">
                <FileText v-else class="w-5 h-5 text-rose-500" />
              </div>

              <!-- File Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate" style="color: var(--text-heading)">
                  {{ draft.file.name }}
                </p>
                <p class="text-xs" style="color: var(--text-muted)">
                  {{ formatFileSize(draft.file.size) }}
                  <span class="ml-1 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                    Draf — belum disimpan
                  </span>
                </p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1.5 opacity-60 group-hover/file:opacity-100 transition-opacity">
                <UiBaseButton
                  v-if="draft.previewUrl"
                  :href="draft.previewUrl"
                  target="_blank"
                  title="Preview"
                  :icon-only="true"
                  size="sm"
                >
                  <template #icon><ExternalLink class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /></template>
                </UiBaseButton>
                <UiBaseButton
                  title="Hapus draf file"
                  :icon-only="true"
                  size="sm"
                  @click="removeDraftFile(dIdx)"
                >
                  <template #icon><Trash2 class="w-3.5 h-3.5 text-rose-500" /></template>
                </UiBaseButton>
              </div>
            </div>
          </div>

          <!-- Files marked for deletion (shown as strikethrough) -->
          <div v-if="currentItem && getDraftDeleteIds(currentItem.kode_soal).length > 0" class="mt-2 space-y-1.5">
            <p class="text-xs font-medium text-rose-500 mb-1">File ditandai untuk dihapus (akan dihapus saat Simpan):</p>
            <div v-for="file in currentDeletedServerFiles" :key="'del-' + file.id"
              class="flex items-center gap-3 p-2.5 rounded-xl transition-all group/file opacity-50"
              style="background: var(--bg-secondary); border: 1px dashed rgba(239, 68, 68, 0.3)">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--bg-tertiary)">
                <Trash2 class="w-4 h-4 text-rose-400" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium line-through truncate" style="color: var(--text-muted)">{{ file.original_name }}</p>
              </div>
              <UiBaseButton
                title="Batalkan hapus"
                :icon-only="true"
                size="sm"
                @click="undoDraftDelete(file.id)"
              >
                <template #icon><X class="w-3.5 h-3.5 text-amber-500" /></template>
              </UiBaseButton>
            </div>
          </div>

          <!-- Warning: belum upload -->
          <div v-if="currentFileCount === 0 && !isUploading" class="mt-3 p-3 rounded-xl flex items-center gap-2.5"
            style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)">
            <AlertTriangle class="w-4 h-4 text-amber-500 shrink-0" />
            <span class="text-xs font-medium" style="color: var(--text-muted)">Upload minimal 1 file bukti fisik.</span>
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
              <PencilLine class="w-3 h-3 shrink-0" />
              {{ getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) }} / 30 kata
            </span>
          </div>

          <textarea
            v-if="currentItem && localAnswers[currentItem.kode_soal]"
            v-model="localAnswers[currentItem.kode_soal].upload_text"
            rows="3"
            placeholder="Berikan jawaban sesuai dengan kondisi madrasah saat ini, benar jujur dan transparan agar sistem memberikan jenis kegiatan yang sesuai untuk meningkatkan kualitas madrasah anda"
            class="w-full px-3.5 py-2.5 rounded-xl text-sm transition-[border-color,box-shadow] border outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-none overflow-hidden"
            :class="getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) < 30 ? 'border-amber-400 dark:border-amber-600' : 'border-emerald-500'"
            style="background: var(--bg-input); color: var(--text-primary); min-height: 5.5rem;"
            ref="textareaRef"
            @input="autoResize"
          ></textarea>

          <!-- Warning jika teks kurang dari 30 kata -->
          <div v-if="currentItem && localAnswers[currentItem.kode_soal] && getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) < 30"
            class="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
            <AlertTriangle class="w-4 h-4 shrink-0" />
            <span>Penjelasan ringkas minimal 30 kata agar jawaban dapat disimpan.</span>
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
              :class="getPilihanCardClass(p.skor, localAnswers[currentItem.kode_soal]?.skor === p.skor)"
              :style="localAnswers[currentItem.kode_soal]?.skor !== p.skor ? 'background: var(--bg-secondary); color: var(--text-primary)' : ''">
              <div class="flex-1 min-w-0">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border mb-2 transition-colors"
                  :class="getTingkatBadgeClass(p.skor)">
                  {{ p.nama || `Tingkat ${p.skor}` }}
                </span>
                <div v-if="getLines(p.label).length > 1" class="space-y-1.5">
                  <div v-for="(line, lIdx) in getLines(p.label)" :key="lIdx" class="flex items-start gap-2 text-xs leading-relaxed wrap-break-word">
                    <span v-if="parseLineItem(line).number" class="font-bold shrink-0 text-emerald-600 dark:text-emerald-400 select-none min-w-5 text-left">
                      {{ parseLineItem(line).number }}
                    </span>
                    <span v-else class="w-1.5 h-1.5 rounded-full bg-current opacity-60 mt-1.5 shrink-0"></span>
                    <span class="flex-1 font-normal" style="color: var(--text-primary)">
                      {{ parseLineItem(line).text }}
                    </span>
                  </div>
                </div>
                <span v-else class="text-xs leading-relaxed wrap-break-word block font-normal"
                  style="color: var(--text-primary)">
                  {{ normalizeText(p.label) }}
                </span>
              </div>
            </button>
          </div>
        </div>

      </div>

      <!-- ─── Kontainer Baru: Navigasi Soal & Bar Progres Kesiapan Simpan ─── -->
      <div v-if="currentItem" class="rounded-xl p-3.5 sm:p-4 transition-all duration-200 shadow-sm space-y-3"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        
        <!-- Header Progres Simpel (dengan indikator 1/3) -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold" style="color: var(--text-heading)">
              Progres Pengisian
            </span>
            <span class="text-xs font-bold font-mono px-2 py-0.5 rounded-md"
              :class="completedRequirementsCount === 3
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'">
              {{ completedRequirementsCount }}/3
            </span>
          </div>

          <!-- Progress Bar Track -->
          <div class="h-2 w-full rounded-full overflow-hidden p-0.5"
            style="background: var(--bg-secondary); border: 1px solid var(--border-subtle)">
            <div class="h-full rounded-full transition-all duration-300 ease-out"
              :class="completedRequirementsCount === 3
                ? (isCurrentItemChanged ? 'bg-linear-to-r from-emerald-500 to-teal-400' : 'bg-emerald-500')
                : 'bg-linear-to-r from-amber-500 to-emerald-400'"
              :style="{ width: `${(completedRequirementsCount / 3) * 100}%` }">
            </div>
          </div>
        </div>

        <!-- Tombol Aksi Navigasi (Divider di atasnya) -->
        <div class="pt-2.5 border-t" style="border-color: var(--border-subtle)">
          <!-- Mobile layout (< sm) -->
          <div class="flex flex-col gap-2.5 sm:hidden">
            <!-- Simpan Button (Full Width) -->
            <UiBaseButton
              :text="isSaving ? 'Menyimpan...' : 'Simpan Jawaban Ini'"
              title="Simpan jawaban untuk soal ini"
              :loading="isSaving"
              :disabled="!canSaveCurrentItem || isSaving"
              class="w-full justify-center"
              :class="canSaveCurrentItem ? 'ring-2 ring-emerald-500 ring-offset-2' : ''"
              @click="handleSaveCurrent"
            >
              <template #icon><Save class="w-4 h-4" /></template>
            </UiBaseButton>

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
              title="Indikator sebelumnya"
              :disabled="currentPage === 1"
              @click="prevPage"
            >
              <template #icon><ChevronLeft class="w-4 h-4" /></template>
            </UiBaseButton>

            <UiBaseButton
              :text="isSaving ? 'Menyimpan...' : 'Simpan Jawaban'"
              title="Simpan jawaban untuk indikator ini"
              :loading="isSaving"
              :disabled="!canSaveCurrentItem || isSaving"
              :class="canSaveCurrentItem ? 'ring-2 ring-emerald-500 ring-offset-2' : ''"
              @click="handleSaveCurrent"
            >
              <template #icon><Save class="w-4 h-4" /></template>
            </UiBaseButton>

            <UiBaseButton
              text="Selanjutnya"
              title="Indikator berikutnya"
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

  <!-- Delete Confirmation Dialog (now marks as draft-delete, not immediate) -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="deleteDialog.show" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="deleteDialog.show = false">
        <div class="absolute inset-0 bg-black/60"></div>
        <div class="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <Trash2 class="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 class="text-base font-bold" style="color: var(--text-heading)">Hapus File Bukti?</h3>
              <p class="text-sm mt-1" style="color: var(--text-muted)">
                File <strong>"{{ deleteDialog.fileName }}"</strong> akan ditandai untuk dihapus. Penghapusan baru berlaku setelah Anda menekan <strong>Simpan</strong>.
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
              Tandai Hapus
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
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
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
              <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
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
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
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
                  class="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500 text-white shrink-0">
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

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import type { NavigationGuardNext } from "vue-router";
import { useEdm, EDM_BAGIAN_LIST } from "~/composables/edm/useEdm";
import type { AnggotaBagian, BuktiFile } from "~/composables/edm/useEdm";
import { useNotiflix } from "~/composables/ui/useFeedback";
import {
  ArrowLeft, Save, UsersRound, ListChecks, Plus,
  ChevronLeft, ChevronRight, CheckCircle2, X, PencilLine,
  Upload, FileText, ExternalLink, Trash2, AlertTriangle, Undo2
} from "lucide-vue-next";

interface LocalAnswer {
  kode_soal: string;
  skor: number | null;
  upload_text: string;
  updated_by_nama: string;
}

interface IndikatorItem {
  id: string;
  kode_soal: string;
  bagian_target: string;
  kelompok_target: string;
  nomor_urut: number;
  urutan: number;
  pertanyaan: string;
  bukti_yang_diminta?: string;
  bobot: number;
  pilihan: Array<{
    kode?: string;
    skor?: number;
    nama?: string;
    keterangan?: string;
    label?: string;
  }>;
  upload_text?: string;
}

interface ParsedPilihan {
  skor: number;
  nama: string;
  label: string;
}

interface ParsedLineItem {
  number: string;
  text: string;
}

const route = useRoute();
const { Notify } = useNotiflix();
const {
  isLoading, isSaving, listTahun, selectedTahunId,
  fetchTahunAnggaran, fetchBagian, fetchIndikator, fetchJawaban, saveJawaban,
  uploadBuktiFiles, fetchBuktiFiles, deleteBuktiFile, getBuktiDownloadUrl,
} = useEdm();

const isPageLoading = ref<boolean>(true);

const bagianCode = computed<string>(() => {
  return (route.params.bagian || route.params.kelompok || "A").toString().toUpperCase();
});

const bagianFullName = computed<string>(() => {
  const meta = EDM_BAGIAN_LIST.find((m) => m.code === bagianCode.value);
  return meta ? meta.name : `Bagian ${bagianCode.value}`;
});

const isAdmin = computed<boolean>(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("user-role") === "admin";
});

const myGtkId = computed<number | null>(() => {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("user-gtk-id");
  return id ? parseInt(id) : null;
});

const indikatorList = ref<IndikatorItem[]>([]);
const localAnswers = reactive<Record<string, LocalAnswer>>({});
const savedAnswers = reactive<Record<string, { skor: number | null; upload_text: string }>>({});
const myBagianId = ref<number | null>(null);
const anggotaBagian = ref<AnggotaBagian[]>([]);

// Pagination State
const currentPage = ref<number>(1);

const totalPages = computed<number>(() => indikatorList.value.length);

const currentItem = computed<IndikatorItem | null>(() => {
  if (indikatorList.value.length === 0) return null;
  const idx = currentPage.value - 1;
  if (idx < 0 || idx >= indikatorList.value.length) return indikatorList.value[0];
  return indikatorList.value[idx];
});

// Navigation Unsaved Dialog State
const navDialog = reactive<{
  show: boolean;
  targetPage: number | null;
}>({
  show: false,
  targetPage: null,
});

const isCurrentItemChanged = computed<boolean>(() => {
  if (!currentItem.value) return false;
  const k = currentItem.value.kode_soal;
  const local = localAnswers[k] || {} as LocalAnswer;
  const saved = savedAnswers[k] || {} as { skor: number | null; upload_text: string };
  const answerChanged = (local.skor ?? null) !== (saved.skor ?? null) ||
         (local.upload_text || "") !== (saved.upload_text || "");
  const fileChanged = hasDraftFileChanges(k);
  return answerChanged || fileChanged;
});



const attemptNavigation = (targetPage: number): void => {
  if (targetPage < 1 || targetPage > totalPages.value || targetPage === currentPage.value) return;
  if (isCurrentItemChanged.value) {
    navDialog.targetPage = targetPage;
    navDialog.show = true;
  } else {
    currentPage.value = targetPage;
  }
};

const goToPage = (page: number): void => {
  attemptNavigation(page);
};

const prevPage = (): void => {
  attemptNavigation(currentPage.value - 1);
};

const nextPage = (): void => {
  attemptNavigation(currentPage.value + 1);
};

const handleDialogCancel = (): void => {
  navDialog.show = false;
  navDialog.targetPage = null;
};

const handleDialogDiscardAndProceed = (): void => {
  if (currentItem.value) {
    const k = currentItem.value.kode_soal;
    const saved = savedAnswers[k] || {} as { skor: number | null; upload_text: string };
    localAnswers[k].skor = saved.skor ?? null;
    localAnswers[k].upload_text = saved.upload_text || "";
    // Discard draft file changes
    discardDraftFileChanges(k);
  }
  const target = navDialog.targetPage;
  navDialog.show = false;
  navDialog.targetPage = null;
  if (target) {
    currentPage.value = target;
  }
};

const handleDialogSaveAndProceed = async (): Promise<void> => {
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

onBeforeRouteLeave((_to, _from, next: NavigationGuardNext) => {
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

const bagianColor = (name: string): string => {
  const c: Record<string, string> = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return c[name] || "bg-zinc-600";
};

// Normalisasi teks dari data instrumen: hapus \r, trim tab trailing & bullet prefix per baris
const normalizeText = (str: string | null | undefined): string => {
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
const getLines = (str: string | null | undefined): string[] => {
  if (!str || typeof str !== "string") return [];
  return str
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[\s\-\u2022\*\t]+/, "").replace(/\t+$/g, "").trim())
    .filter(Boolean);
};

const parseLineItem = (line: string | null | undefined): ParsedLineItem => {
  if (!line || typeof line !== "string") return { number: "", text: "" };
  const match = line.match(/^(\d+[\.)])\s*(.*)/);
  if (match) {
    return { number: match[1], text: match[2] };
  }
  return { number: "", text: line };
};

const isNumbered = (str: string | null | undefined): boolean => {
  if (!str || typeof str !== "string") return false;
  return /^\d+[\.\)]/.test(str);
};

const getWordCount = (str: string | null | undefined): number => {
  if (!str || typeof str !== "string") return 0;
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

const parsePilihan = (item: IndikatorItem | null): ParsedPilihan[] => {
  if (!item) return [];
  if (Array.isArray(item.pilihan)) {
    return item.pilihan.map((p) => ({
      skor: parseInt(String(p.kode || p.skor || 0)),
      nama: p.nama || `Tingkat ${p.kode}`,
      label: p.keterangan || p.label || '',
    }));
  }
  return [];
};

const answeredCount = computed<number>(() => {
  return Object.values(savedAnswers).filter(
    (a) => a.skor !== null && a.skor !== undefined && getWordCount(a.upload_text) >= 30
  ).length;
});

const setAnswer = (kodeSoal: string, skor: number): void => {
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

const resetAnswers = (): void => {
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

const loadExistingAnswers = async (tahunId: number, bId: number): Promise<void> => {
  if (!bId) return;
  const existing = await fetchJawaban(tahunId, bagianCode.value, bId);
  existing.forEach((j: { kode_soal?: string; indikator_id?: string | number; skor?: number | null; upload_text?: string | null; updated_by_nama?: string }) => {
    const k = j.kode_soal || String(j.indikator_id || "");
    if (localAnswers[k]) {
      localAnswers[k].skor = j.skor ?? null;
      localAnswers[k].upload_text = j.upload_text || "";
      localAnswers[k].updated_by_nama = j.updated_by_nama || "";
      savedAnswers[k] = {
        skor: j.skor ?? null,
        upload_text: j.upload_text || "",
      };
    }
  });
};

const handleSaveCurrent = async (): Promise<boolean> => {
  if (!currentItem.value || !myBagianId.value) {
    Notify?.failure?.("Data bagian tidak ditemukan");
    return false;
  }

  const k = currentItem.value.kode_soal;
  const ans = localAnswers[k] || {} as LocalAnswer;
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

  isUploading.value = true;
  try {
    // ── Step 1: Process draft file uploads to R2 ──
    const draftNew = getDraftNewFiles(k);
    if (draftNew.length > 0) {
      const filesToUpload = draftNew.map(d => d.file);
      const uploaded = await uploadBuktiFiles(
        filesToUpload,
        k,
        myBagianId.value!,
        myGtkId.value ?? undefined,
      );
      if (uploaded.length === 0 && filesToUpload.length > 0) {
        Notify?.failure?.("Gagal mengunggah file baru. Coba lagi.");
        return false;
      }
    }

    // ── Step 2: Process draft file deletions from R2/D1 ──
    const draftDel = getDraftDeleteIds(k);
    for (const fileId of draftDel) {
      await deleteBuktiFile(fileId);
    }

    // ── Step 3: Save jawaban to D1 ──
    const ok = await saveJawaban({
      bagian_id: myBagianId.value ?? undefined,
      gtk_id: myGtkId.value ?? undefined,
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

      // Clear draft state and reload server files
      clearDraftState(k);
      await loadBuktiForIndikator(k);

      Notify?.success?.(`Jawaban soal ${k} berhasil disimpan.`);
      return true;
    }
    return false;
  } finally {
    isUploading.value = false;
  }
};

// ── Bukti File Upload (R2) — Draft-based approach ──
const buktiFilesMap = reactive<Record<string, BuktiFile[]>>({}); // { [kode_soal]: BuktiFile[] } — server state
const isUploading = ref<boolean>(false);
const isDragging = ref<boolean>(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Draft state: new files pending upload, and IDs pending deletion
interface DraftFile {
  file: File;
  previewUrl: string;
}
const draftNewFilesMap = reactive<Record<string, DraftFile[]>>({}); // { [kode_soal]: DraftFile[] }
const draftDeleteIdsMap = reactive<Record<string, number[]>>({}); // { [kode_soal]: fileId[] }

const getDraftNewFiles = (kodeSoal: string): DraftFile[] => draftNewFilesMap[kodeSoal] || [];
const getDraftDeleteIds = (kodeSoal: string): number[] => draftDeleteIdsMap[kodeSoal] || [];

const hasDraftFileChanges = (kodeSoal: string): boolean => {
  return getDraftNewFiles(kodeSoal).length > 0 || getDraftDeleteIds(kodeSoal).length > 0;
};

const clearDraftState = (kodeSoal: string): void => {
  // Revoke object URLs to free memory
  const drafts = draftNewFilesMap[kodeSoal] || [];
  for (const d of drafts) {
    if (d.previewUrl) URL.revokeObjectURL(d.previewUrl);
  }
  draftNewFilesMap[kodeSoal] = [];
  draftDeleteIdsMap[kodeSoal] = [];
};

const discardDraftFileChanges = (kodeSoal: string): void => {
  clearDraftState(kodeSoal);
};

const ALLOWED_TYPES: string[] = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE: number = 2 * 1024 * 1024; // 2 MB

// Server files visible (not marked for draft deletion)
const currentServerFilesVisible = computed<BuktiFile[]>(() => {
  if (!currentItem.value) return [];
  const k = currentItem.value.kode_soal;
  const serverFiles = buktiFilesMap[k] || [];
  const deleteIds = getDraftDeleteIds(k);
  return serverFiles.filter(f => !deleteIds.includes(f.id));
});

// Server files marked for deletion (for strikethrough display)
const currentDeletedServerFiles = computed<BuktiFile[]>(() => {
  if (!currentItem.value) return [];
  const k = currentItem.value.kode_soal;
  const serverFiles = buktiFilesMap[k] || [];
  const deleteIds = getDraftDeleteIds(k);
  return serverFiles.filter(f => deleteIds.includes(f.id));
});

// Draft new files for current item
const currentDraftNewFiles = computed<DraftFile[]>(() => {
  if (!currentItem.value) return [];
  return getDraftNewFiles(currentItem.value.kode_soal);
});

// Combined display list (for v-if length check)
const currentDisplayFiles = computed(() => {
  return [...currentServerFilesVisible.value, ...currentDraftNewFiles.value];
});

// Effective file count = server visible + draft new
const currentFileCount = computed<number>(() => currentDisplayFiles.value.length);

// ── Kesiapan Simpan & Validasi Persyaratan ──
const currentWordCount = computed<number>(() => {
  if (!currentItem.value) return 0;
  return getWordCount(localAnswers[currentItem.value.kode_soal]?.upload_text);
});

const hasProofRequirement = computed<boolean>(() => currentFileCount.value >= 1);
const hasWordsRequirement = computed<boolean>(() => currentWordCount.value >= 30);
const hasScoreRequirement = computed<boolean>(() => {
  if (!currentItem.value) return false;
  const ans = localAnswers[currentItem.value.kode_soal];
  return ans?.skor !== null && ans?.skor !== undefined;
});

const completedRequirementsCount = computed<number>(() => {
  let count = 0;
  if (hasProofRequirement.value) count++;
  if (hasWordsRequirement.value) count++;
  if (hasScoreRequirement.value) count++;
  return count;
});

const canSaveCurrentItem = computed<boolean>(() => {
  if (!currentItem.value) return false;
  return isCurrentItemChanged.value &&
         hasProofRequirement.value &&
         hasWordsRequirement.value &&
         hasScoreRequirement.value;
});

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getBuktiPreviewUrl = (r2Key: string): string => {
  const token = typeof window !== "undefined" ? localStorage.getItem("user-token") : null;
  return `/api/edm/bukti/download/${r2Key}?token=${token}`;
};

const triggerFileInput = (): void => {
  fileInputRef.value?.click();
};

const validateFiles = (files: File[]): string[] => {
  const errors: string[] = [];
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

// Draft-based upload: only adds to local draft, no server call
const processUpload = (fileList: FileList): void => {
  if (!currentItem.value) return;

  const files = Array.from(fileList);
  if (files.length === 0) return;

  const errors = validateFiles(files);
  if (errors.length > 0) {
    Notify?.failure?.(errors[0]);
    return;
  }

  const k = currentItem.value.kode_soal;
  if (!draftNewFilesMap[k]) draftNewFilesMap[k] = [];

  for (const file of files) {
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    draftNewFilesMap[k].push({ file, previewUrl });
  }

  Notify?.info?.(`${files.length} file ditambahkan sebagai draf. Tekan Simpan untuk mengunggah.`);
};

const handleFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    processUpload(files);
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const handleFileDrop = (event: DragEvent): void => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    processUpload(files);
  }
};

// Remove a draft new file (not yet uploaded)
const removeDraftFile = (index: number): void => {
  if (!currentItem.value) return;
  const k = currentItem.value.kode_soal;
  const drafts = draftNewFilesMap[k];
  if (drafts && drafts[index]) {
    if (drafts[index].previewUrl) URL.revokeObjectURL(drafts[index].previewUrl);
    drafts.splice(index, 1);
  }
};

// Undo a draft deletion of server file
const undoDraftDelete = (fileId: number): void => {
  if (!currentItem.value) return;
  const k = currentItem.value.kode_soal;
  const ids = draftDeleteIdsMap[k];
  if (ids) {
    const idx = ids.indexOf(fileId);
    if (idx !== -1) ids.splice(idx, 1);
  }
};

const getTingkatBadgeClass = (skor: number | string): string => {
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

const getPilihanCardClass = (skor: number | string, isSelected: boolean): string => {
  const num = Number(skor);
  if (isSelected) {
    switch (num) {
      case 1:
        return "border-rose-500 bg-rose-50/90 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100 font-semibold shadow-xs ring-2 ring-rose-500/25";
      case 2:
        return "border-amber-500 bg-amber-50/90 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100 font-semibold shadow-xs ring-2 ring-amber-500/25";
      case 3:
        return "border-blue-500 bg-blue-50/90 text-blue-950 dark:bg-blue-950/40 dark:text-blue-100 font-semibold shadow-xs ring-2 ring-blue-500/25";
      case 4:
        return "border-emerald-500 bg-emerald-50/90 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100 font-semibold shadow-xs ring-2 ring-emerald-500/25";
      default:
        return "border-indigo-500 bg-indigo-50/90 text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-100 font-semibold shadow-xs ring-2 ring-indigo-500/25";
    }
  }

  switch (num) {
    case 1:
      return "border-[var(--border-primary)] hover:border-rose-400 dark:hover:border-rose-500/80";
    case 2:
      return "border-[var(--border-primary)] hover:border-amber-400 dark:hover:border-amber-500/80";
    case 3:
      return "border-[var(--border-primary)] hover:border-blue-400 dark:hover:border-blue-500/80";
    case 4:
      return "border-[var(--border-primary)] hover:border-emerald-400 dark:hover:border-emerald-500/80";
    default:
      return "border-[var(--border-primary)] hover:border-indigo-400 dark:hover:border-indigo-500/80";
  }
};

const deleteDialog = reactive<{ show: boolean; fileId: number | null; fileName: string }>({ show: false, fileId: null, fileName: '' });
const teamInfoDialog = reactive<{ show: boolean }>({ show: false });
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const autoResize = (e?: Event): void => {
  const el = (e?.target as HTMLTextAreaElement | undefined) || textareaRef.value;
  if (!el) return;
  el.style.height = "auto";

  // Jika teks kosong, hitung scrollHeight dari teks placeholder agar terlihat utuh tanpa terpotong
  if (!el.value && el.placeholder) {
    const originalValue = el.value;
    el.value = el.placeholder;
    const placeholderHeight = el.scrollHeight;
    el.value = originalValue;
    el.style.height = `${placeholderHeight}px`;
  } else {
    el.style.height = `${el.scrollHeight}px`;
  }
};

const adjustTextareaHeight = async (): Promise<void> => {
  await nextTick();
  autoResize();
};

// Resize saat value berubah dari luar (load data, pindah soal, selesai loading, atau input teks)
watch(
  [
    () => isPageLoading.value,
    () => currentItem.value?.kode_soal,
    () => currentItem.value ? localAnswers[currentItem.value.kode_soal]?.upload_text : null
  ],
  () => {
    adjustTextareaHeight();
  },
  { immediate: true, flush: 'post' }
);

const confirmDeleteFile = (file: BuktiFile): void => {
  deleteDialog.fileId = file.id;
  deleteDialog.fileName = file.original_name;
  deleteDialog.show = true;
};

// Draft-based delete: only marks for deletion, actual delete happens on Save
const executeDeleteFile = (): void => {
  if (!currentItem.value || !deleteDialog.fileId) return;
  const k = currentItem.value.kode_soal;
  if (!draftDeleteIdsMap[k]) draftDeleteIdsMap[k] = [];
  if (!draftDeleteIdsMap[k].includes(deleteDialog.fileId)) {
    draftDeleteIdsMap[k].push(deleteDialog.fileId);
  }
  deleteDialog.show = false;
  deleteDialog.fileId = null;
  deleteDialog.fileName = '';
  Notify?.info?.("File ditandai untuk dihapus. Tekan Simpan untuk mengonfirmasi.");
};

const loadBuktiForIndikator = async (kodeSoal: string): Promise<void> => {
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
  isPageLoading.value = true;
  try {
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
  } finally {
    isPageLoading.value = false;
    await adjustTextareaHeight();
  }

  if (typeof window !== "undefined") {
    window.addEventListener("resize", autoResize);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", autoResize);
  }
});
</script>

