<template>
  <div class="min-h-screen">
    <div class="page-layout">
    <!-- Top Nav -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/edm/isi"
          class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-emerald-500/10"
          style="background: var(--bg-secondary); color: var(--text-primary)">
          <ArrowLeft class="w-5 h-5" />
        </NuxtLink>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-2xl font-bold" style="color: var(--text-heading)">
              Pengisian EDM
            </h1>
            <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-bold text-white"
              :class="bagianColor(bagianCode)">
              Bagian {{ bagianCode }}
            </span>
          </div>
          <p class="mt-0.5 text-xs sm:text-sm font-medium" style="color: var(--text-muted)">
            {{ bagianFullName }} · {{ indikatorList.length }} pertanyaan · Jawaban Tersinkronisasi
          </p>
        </div>
      </div>

      <!-- Status Perubahan Jawaban -->
      <div class="flex items-center gap-2">
        <div v-if="hasUnsavedChanges"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          Belum Disimpan
        </div>
        <div v-else
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 class="w-3.5 h-3.5" />
          Tersimpan
        </div>
      </div>
    </div>

    <!-- Bagian Banner -->
    <div class="mb-6 rounded-xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      style="background: var(--bg-card); border-color: var(--border-primary)">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <UsersRound class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 class="text-sm font-semibold" style="color: var(--text-heading)">
            Pengisian Bersama — {{ bagianFullName }}
          </h2>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">
            Jawaban yang diisi di halaman ini otomatis tersinkronisasi untuk seluruh anggota Bagian {{ bagianCode }}
          </p>
        </div>
      </div>

      <div v-if="anggotaBagian.length > 0" class="flex flex-wrap gap-1.5 shrink-0">
        <span v-for="a in anggotaBagian" :key="a.gtk_id"
          class="text-xs px-2.5 py-1 rounded-lg"
          :class="a.gtk_id === myGtkId ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-medium' : ''"
          :style="a.gtk_id !== myGtkId ? 'background: var(--bg-secondary); color: var(--text-muted)' : ''">
          {{ a.nama_lengkap }} {{ a.gtk_id === myGtkId ? '(Anda)' : '' }}
        </span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="indikatorList.length > 0" class="mb-6 rounded-xl p-4"
      style="background: var(--bg-card); border: 1px solid var(--border-primary)">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium" style="color: var(--text-secondary)">Progres Pengisian Bagian</span>
        <span class="text-sm font-bold" style="color: var(--text-heading)">
          {{ answeredCount }} / {{ indikatorList.length }} ({{ progressPercent }}%)
        </span>
      </div>
      <div class="w-full h-3 rounded-full" style="background: var(--bg-tertiary)">
        <div class="h-3 rounded-full bg-emerald-500 transition-all duration-500"
          :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

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
      <!-- Quick Nav Grid per Soal -->
      <div class="p-4 rounded-xl shadow-xs"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b"
          style="border-color: var(--border-subtle)">
          <div class="flex items-center gap-2">
            <span class="text-xs sm:text-sm font-bold" style="color: var(--text-heading)">
              Navigasi Soal Bagian {{ bagianCode }}
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {{ answeredCount }}/{{ indikatorList.length }} Terisi
            </span>
          </div>
          <div class="flex items-center gap-3 text-xs" style="color: var(--text-muted)">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Terisi
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span> Belum
            </span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-md"
              style="background: var(--bg-secondary); color: var(--text-secondary)">
              Soal {{ currentPage }} / {{ totalPages }}
            </span>
          </div>
        </div>

        <!-- Number Badges Grid -->
        <div class="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
          <button v-for="(item, idx) in indikatorList" :key="item.kode_soal || idx"
            @click="goToPage(idx + 1)"
            class="relative px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center transition-all border cursor-pointer min-w-[2.75rem]"
            :class="[
              currentPage === idx + 1
                ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500 text-white shadow-md scale-105 z-10'
                : localAnswers[item.kode_soal]?.skor
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-200'
                  : 'hover:border-emerald-400'
            ]"
            :style="currentPage !== idx + 1 && !localAnswers[item.kode_soal]?.skor ? 'background: var(--bg-secondary); color: var(--text-muted); border-color: var(--border-primary)' : ''">
            <span>{{ item.kode_soal || (idx + 1) }}</span>
            <span v-if="localAnswers[item.kode_soal]?.skor && currentPage !== idx + 1"
              class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900">
            </span>
          </button>
        </div>
      </div>

      <!-- Single Soal Card (1 Soal 1 Halaman) -->
      <div v-if="currentItem" class="rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-sm"
        :class="localAnswers[currentItem.kode_soal]?.skor ? 'ring-1 ring-emerald-500/40' : ''"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">

        <!-- Header: Nomor + Kode Soal + Bobot + Pertanyaan + Last Updated Info -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 pb-4 border-b"
          style="border-color: var(--border-subtle)">
          <div class="flex items-start gap-3">
            <span class="inline-flex items-center justify-center min-w-[2.25rem] h-9 rounded-xl text-sm font-bold flex-shrink-0 px-2.5 shadow-xs"
              :class="localAnswers[currentItem.kode_soal]?.skor ? 'bg-emerald-500 text-white' : ''"
              :style="!localAnswers[currentItem.kode_soal]?.skor ? 'background: var(--bg-secondary); color: var(--text-muted)' : ''">
              {{ currentItem.kode_soal || `No. ${currentPage}` }}
            </span>
            <div>
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span v-if="currentItem.bobot" class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  🏋️ Bobot: {{ currentItem.bobot }}
                </span>
              </div>
              <h2 class="text-base sm:text-lg font-bold leading-relaxed break-words whitespace-pre-line" style="color: var(--text-heading)">
                {{ currentItem.pertanyaan }}
              </h2>
            </div>
          </div>

          <span v-if="localAnswers[currentItem.kode_soal]?.updated_by_nama"
            class="text-xs px-2.5 py-1 rounded-md self-start shrink-0 whitespace-normal break-words"
            style="background: var(--bg-secondary); color: var(--text-muted)">
            Diperbarui oleh: <strong>{{ localAnswers[currentItem.kode_soal].updated_by_nama }}</strong>
          </span>
        </div>

        <!-- Bukti yang diminta -->
        <div v-if="currentItem.bukti_yang_diminta" class="mb-5 p-3.5 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm break-words whitespace-pre-line"
          style="background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-subtle)">
          <FileCheck class="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div class="flex-1 min-w-0">
            <strong class="font-semibold block text-emerald-700 dark:text-emerald-400">Bukti yang diminta:</strong>
            <span class="leading-relaxed whitespace-pre-line">{{ currentItem.bukti_yang_diminta }}</span>
          </div>
        </div>

        <!-- Bukti File Upload (R2) — WAJIB sebelum memilih jawaban -->
        <div class="mb-5">
          <label class="block text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--text-muted)">
            Upload Bukti Fisik <span class="text-rose-500">*wajib (min. 1 file)</span>:
          </label>

          <!-- File Count & Size Info -->
          <div class="flex items-center gap-3 mb-2.5">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="currentFileCount >= 10 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : currentFileCount >= 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'">
              {{ currentFileCount }}/10 file
            </span>
            <span class="text-xs" style="color: var(--text-muted)">
              Maks 2 MB/file · JPG, PNG, WEBP, PDF
            </span>
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
                <a :href="getBuktiPreviewUrl(file.r2_key)" target="_blank"
                  class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-emerald-500/10"
                  title="Preview / Download">
                  <ExternalLink class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </a>
                <button @click="confirmDeleteFile(file)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-500/10 cursor-pointer"
                  title="Hapus file">
                  <Trash2 class="w-4 h-4 text-rose-500" />
                </button>
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

        <!-- Input Text Ringkasan Pembuktian / Deskripsi (upload_text) -->
        <div class="mb-5">
          <div class="flex items-center justify-between gap-2 mb-2">
            <label class="block text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">
              Deskripsi / Ringkasan Pembuktian Kondisi Real <span class="text-rose-500">*wajib (min. 30 kata)</span>:
            </label>
            <span v-if="currentItem && localAnswers[currentItem.kode_soal]"
              class="text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors"
              :class="getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) >= 30
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'">
              📝 {{ getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) }} / 30 kata
            </span>
          </div>

          <textarea
            v-if="currentItem && localAnswers[currentItem.kode_soal]"
            v-model="localAnswers[currentItem.kode_soal].upload_text"
            @input="hasUnsavedChanges = true"
            rows="4"
            placeholder="Tuliskan uraian ringkas penjelasan kondisi real madrasah dan bukti pendukung yang tersedia (minimal 30 kata)..."
            class="w-full p-3.5 rounded-xl text-sm transition-all border outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            :class="getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) < 30 ? 'border-amber-400 dark:border-amber-600' : 'border-emerald-500'"
            style="background: var(--bg-input); color: var(--text-primary)"
          ></textarea>

          <!-- Warning jika teks kurang dari 30 kata -->
          <div v-if="currentItem && localAnswers[currentItem.kode_soal] && getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) < 30"
            class="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
            <AlertTriangle class="w-4 h-4 flex-shrink-0" />
            <span>Penjelasan ringkas minimal 30 kata agar jawaban dapat disimpan (saat ini {{ getWordCount(localAnswers[currentItem.kode_soal]?.upload_text) }} kata).</span>
          </div>
        </div>

        <!-- Pilihan Skor -->
        <div class="mb-5">
          <label class="block text-xs font-semibold uppercase tracking-wider mb-2.5" style="color: var(--text-muted)">
            Pilihan Jawaban / Skor:
          </label>
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
              <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors"
                :class="localAnswers[currentItem.kode_soal]?.skor === p.skor
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'">
                {{ p.skor }}
              </span>
              <div class="flex-1 min-w-0">
                <span class="block text-xs font-bold mb-1 text-emerald-700 dark:text-emerald-400">
                  {{ p.nama || `Tingkat ${p.skor}` }}
                </span>
                <span class="text-xs leading-relaxed break-words block whitespace-pre-line"
                  style="color: var(--text-primary)">
                  {{ p.label }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Pagination Controls Bar -->
        <div class="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style="border-color: var(--border-subtle)">
          <UiBaseButton
            text="Sebelumnya"
            title="Soal sebelumnya"
            :disabled="currentPage === 1"
            @click="prevPage"
          >
            <template #icon><ChevronLeft class="w-4 h-4" /></template>
          </UiBaseButton>

          <div class="text-xs sm:text-sm font-semibold text-center" style="color: var(--text-secondary)">
            Soal {{ currentPage }} dari {{ totalPages }}
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

    <!-- Bottom Save Button -->
    <div v-if="indikatorList.length > 0" class="mt-6 flex justify-center">
      <UiBaseButton
        :text="isSaving ? 'Menyimpan...' : 'Simpan Semua Jawaban Bagian'"
        title="Simpan semua jawaban untuk bagian ini"
        :loading="isSaving"
        :disabled="isSaving"
        :class="hasUnsavedChanges ? 'ring-2 ring-emerald-500 ring-offset-2' : ''"
        class="w-full sm:w-auto"
        @click="handleSaveAll"
      >
        <template #icon><Save class="w-5 h-5" /></template>
      </UiBaseButton>
    </div>
    </div>
  </div>

  <!-- Delete Confirmation Dialog -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="deleteDialog.show" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="deleteDialog.show = false">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
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
            <button @click="deleteDialog.show = false"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style="background: var(--bg-secondary); color: var(--text-primary)">
              Batal
            </button>
            <button @click="executeDeleteFile"
              class="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer">
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useEdm, EDM_BAGIAN_LIST } from "~/composables/edm/useEdm";
import { useNotiflix } from "~/composables/ui/useFeedback";
import {
  ArrowLeft, Save, FileCheck, UsersRound, ListChecks, Plus,
  ChevronLeft, ChevronRight, CheckCircle2,
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
const myBagianId = ref(null);
const anggotaBagian = ref([]);

// State Perubahan Jawaban
const hasUnsavedChanges = ref(false);

// Pagination State
const currentPage = ref(1);

const totalPages = computed(() => indikatorList.value.length);

const currentItem = computed(() => {
  if (indikatorList.value.length === 0) return null;
  const idx = currentPage.value - 1;
  if (idx < 0 || idx >= indikatorList.value.length) return indikatorList.value[0];
  return indikatorList.value[idx];
});

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const bagianColor = (name) => {
  const c = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return c[name] || "bg-zinc-600";
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
  return Object.values(localAnswers).filter(
    (a) => a.skor !== null && a.skor !== undefined && getWordCount(a.upload_text) >= 30
  ).length;
});

const progressPercent = computed(() => {
  if (indikatorList.value.length === 0) return 0;
  return Math.round((answeredCount.value / indikatorList.value.length) * 100);
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
  hasUnsavedChanges.value = true;
};

const resetAnswers = () => {
  indikatorList.value.forEach((item) => {
    localAnswers[item.kode_soal] = {
      kode_soal: item.kode_soal,
      skor: null,
      upload_text: item.upload_text || "",
      updated_by_nama: "",
    };
  });
  hasUnsavedChanges.value = false;
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
    }
  });
  hasUnsavedChanges.value = false;
};

const handleSaveAll = async () => {
  if (!myBagianId.value) {
    Notify?.failure?.("Data bagian tidak ditemukan");
    return;
  }

  // Validasi 30 kata per instrumen yang sudah dipilih skornya atau memiliki isi teks
  for (const item of indikatorList.value) {
    const ans = localAnswers[item.kode_soal] || {};
    const wordCount = getWordCount(ans.upload_text);
    if (ans.skor !== null && ans.skor !== undefined) {
      if (wordCount < 30) {
        const idx = indikatorList.value.findIndex((i) => i.kode_soal === item.kode_soal);
        if (idx !== -1) goToPage(idx + 1);
        Notify?.failure?.(`Jawaban ${item.kode_soal} belum bisa disimpan! Uraian deskripsi ringkas minimal 30 kata (saat ini ${wordCount} kata).`);
        return;
      }
    }
  }

  const jawabanArray = indikatorList.value.map((item) => {
    const ans = localAnswers[item.kode_soal] || {};
    return {
      kode_soal: item.kode_soal,
      skor: ans.skor ?? null,
      upload_text: ans.upload_text || "",
    };
  });

  const ok = await saveJawaban({
    bagian_id: myBagianId.value,
    gtk_id: myGtkId.value || undefined,
    jawaban: jawabanArray,
  });

  if (ok) {
    hasUnsavedChanges.value = false;
    if (selectedTahunId.value) {
      await loadExistingAnswers(selectedTahunId.value, myBagianId.value);
    }
  }
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

const deleteDialog = reactive({ show: false, fileId: null, fileName: '' });

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

