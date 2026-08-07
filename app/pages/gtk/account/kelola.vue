<template>
  <div class="min-h-screen">
    <div class="page-layout px-4 sm:px-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:gap-6 mt-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 class="text-xl text-white sm:text-2xl">Kelola Akun Guru</h2>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
            <!-- Row 1 (mobile): Buat Akun Otomatis full width -->
            <UiBaseButton
              :text="isSeeding ? 'Membuat...' : 'Buat Akun'"
              :loading="isSeeding"
              title="Buat Akun Otomatis"
              :disabled="isSeeding"
              class="w-full sm:w-auto"
              @click="handleSeedGuru"
            >
              <template #icon>
                <UserPlus class="w-4 h-4 flex-shrink-0" />
              </template>
            </UiBaseButton>

            <!-- Row 2 (mobile): Ekspor, Cetak, Refresh sejajar -->
            <div class="flex items-center gap-2">
              <!-- Export Excel Button -->
              <UiBaseButton
                text="Ekspor"
                title="Ekspor ke Excel"
                :disabled="filteredUsers.length === 0"
                class="flex-1 sm:flex-initial"
                @click="exportToExcel"
              >
                <template #icon>
                  <FileSpreadsheet class="w-4 h-4 flex-shrink-0" />
                </template>
              </UiBaseButton>

              <!-- Print Button -->
              <UiBaseButton
                text="Cetak"
                title="Cetak Akun"
                :disabled="filteredUsers.length === 0"
                class="flex-1 sm:flex-initial"
                @click="printAccounts"
              >
                <template #icon>
                  <Printer class="w-4 h-4 flex-shrink-0" />
                </template>
              </UiBaseButton>

              <!-- Refresh Button -->
              <UiBaseButton
                text="Refresh"
                title="Refresh"
                :disabled="isLoading"
                @click="loadUsers"
              >
                <template #icon>
                  <RefreshCw class="w-4 h-4 flex-shrink-0" :class="{ 'animate-spin': isLoading }" />
                </template>
              </UiBaseButton>
            </div>
          </div>
        </div>

        <!-- Info banner -->
        <div class="p-3 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20">
          <p class="text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm">
            <strong>Info:</strong> Klik "Buat Akun Otomatis" untuk membuat akun
            login bagi semua guru yang ada di Data GTK (menggunakan Peg ID
            sebagai username dan password acak). Password bisa dilihat dan
            direset di tabel di bawah.
          </p>
        </div>

        <!-- Search -->
        <div class="w-full">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input v-model="searchQuery" type="text" placeholder="Cari berdasarkan nama atau username..."
              class="w-full h-10 sm:h-11 pl-10 pr-4 rounded-lg border bg-zinc-800/30 text-white placeholder-zinc-500 border-zinc-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-300 text-sm" />
          </div>
        </div>
      </div>

      <!-- Users Table Container -->
      <div class="mt-5">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-16">
          <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
          <span class="ml-3 text-zinc-400">Memuat data akun...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredUsers.length === 0 && !isLoading" class="text-center py-16">
          <KeyRound class="w-16 h-16 mx-auto mb-4 text-zinc-600" />
          <p class="text-zinc-400 mb-2">
            {{
              searchQuery
                ? "Tidak ada akun yang cocok dengan pencarian"
                : "Belum ada akun guru"
            }}
          </p>
          <p v-if="!searchQuery" class="text-zinc-500 text-sm">
            Klik "Buat Akun Otomatis" untuk membuat akun dari data GTK
          </p>
        </div>

        <!-- Table & Mobile Cards -->
        <template v-else>
          <!-- Table (Desktop View) -->
          <div class="hidden md:block rounded-xl border border-zinc-700/50 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-zinc-800/60 border-b border-zinc-700/50">
                  <th class="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    No
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Nama
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Username
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Password
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/50">
                <tr v-for="(user, index) in filteredUsers" :key="user.id"
                  class="hover:bg-zinc-800/30 transition-colors">
                  <td class="px-4 py-3 text-zinc-400">{{ index + 1 }}</td>
                  <td class="px-4 py-3">
                    <span class="text-zinc-100 font-medium text-sm">
                      {{ user.display_name || "-" }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1.5 group/copy">
                      <code @click="copyToClipboard(user.username, 'Username')"
                        class="px-2 py-0.5 rounded bg-zinc-800 text-emerald-600 dark:text-emerald-400 text-xs font-mono cursor-pointer hover:bg-zinc-700/80 transition-colors select-all"
                        title="Klik untuk menyalin username">
                        {{ user.username }}
                      </code>
                      <button @click="copyToClipboard(user.username, 'Username')"
                        class="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover/copy:opacity-100 transition-opacity p-0.5"
                        title="Salin Username">
                        <Copy class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2 group/copy">
                      <code @click="copyToClipboard(user.password, 'Password')"
                        class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-mono cursor-pointer hover:bg-zinc-700/80 transition-colors select-all"
                        title="Klik untuk menyalin password">
                        {{
                          showPasswordMap[user.id] ? user.password : "••••••••"
                        }}
                      </code>
                      <button @click="toggleShowPassword(user.id)"
                        class="text-zinc-500 hover:text-zinc-300 transition-colors" :title="showPasswordMap[user.id] ? 'Sembunyikan' : 'Tampilkan'
                          ">
                        <Eye v-if="!showPasswordMap[user.id]" class="w-3.5 h-3.5" />
                        <EyeOff v-else class="w-3.5 h-3.5" />
                      </button>
                      <button @click="copyToClipboard(user.password, 'Password')"
                        class="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover/copy:opacity-100 transition-opacity p-0.5"
                        title="Salin Password">
                        <Copy class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-md text-xs font-semibold border" :class="user.role === 'admin'
                        ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30'
                        : user.role === 'kepala_madrasah'
                          ? 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/20 dark:border-violet-500/30'
                          : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30'
                      ">
                      {{ user.role === "admin" ? "Admin" : user.role === "kepala_madrasah" ? "Kepala Madrasah" : "Guru"
                      }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-md text-xs font-semibold" :class="user.is_active
                        ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                      ">
                      {{ user.is_active ? "Aktif" : "Nonaktif" }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-1">
                      <!-- QR Code Login -->
                      <UiBaseButton
                        text=""
                        title="QR Login"
                        icon-only
                        size="sm"
                        @click="openQrModal(user)"
                      >
                        <template #icon><QrCode class="w-3.5 h-3.5" /></template>
                      </UiBaseButton>

                      <!-- Edit Password Manual -->
                      <UiBaseButton
                        text=""
                        title="Edit Password Manual"
                        icon-only
                        size="sm"
                        :disabled="actionLoading === user.id"
                        @click="openEditPasswordModal(user)"
                      >
                        <template #icon><Key class="w-3.5 h-3.5" /></template>
                      </UiBaseButton>

                      <!-- Reset Password -->
                      <UiBaseButton
                        text=""
                        title="Reset Password"
                        icon-only
                        size="sm"
                        :disabled="actionLoading === user.id"
                        @click="resetPassword(user)"
                      >
                        <template #icon><RefreshCw class="w-3.5 h-3.5" /></template>
                      </UiBaseButton>

                      <!-- Toggle Active -->
                      <UiBaseButton
                        text=""
                        :title="user.is_active ? 'Nonaktifkan' : 'Aktifkan'"
                        icon-only
                        size="sm"
                        :disabled="actionLoading === user.id || user.role === 'admin'"
                        @click="toggleActive(user)"
                      >
                        <template #icon>
                          <Ban v-if="user.is_active" class="w-3.5 h-3.5" />
                          <Check v-else class="w-3.5 h-3.5" />
                        </template>
                      </UiBaseButton>

                      <!-- Delete -->
                      <UiBaseButton
                        text=""
                        title="Hapus Akun"
                        icon-only
                        size="sm"
                        :disabled="actionLoading === user.id || user.role === 'admin'"
                        @click="deleteUser(user)"
                      >
                        <template #icon><Trash2 class="w-3.5 h-3.5" /></template>
                      </UiBaseButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cards (Mobile View) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            <div v-for="(user, index) in filteredUsers" :key="user.id"
              class="rounded-xl border border-zinc-700/50 bg-zinc-800/10 p-4 transition-colors duration-200 hover:border-zinc-600/50 force-gpu">
              <!-- Card Header -->
              <div class="flex items-start justify-between gap-3 mb-4">
                <div class="flex items-center gap-3">
                  <div>
                    <h3 class="text-zinc-100 font-medium text-sm sm:text-base leading-snug">
                      {{ user.display_name || "-" }}
                    </h3>
                  </div>
                </div>

                <!-- Badges -->
                <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold border leading-tight" :class="user.role === 'admin'
                      ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30'
                      : user.role === 'kepala_madrasah'
                        ? 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/20 dark:border-violet-500/30'
                        : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30'
                    ">
                    {{ user.role === "admin" ? "Admin" : user.role === "kepala_madrasah" ? "Kepala M." : "Guru" }}
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold leading-tight" :class="user.is_active
                      ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                      : 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                    ">
                    {{ user.is_active ? "Aktif" : "Nonaktif" }}
                  </span>
                </div>
              </div>

              <!-- Credentials Section -->
              <div class="space-y-2.5 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80 mb-4 text-xs">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-zinc-500">Username</span>
                  <div class="flex items-center gap-1.5">
                    <code @click="copyToClipboard(user.username, 'Username')"
                      class="px-2 py-0.5 rounded bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-mono cursor-pointer hover:bg-zinc-750 transition-colors select-all"
                      title="Klik untuk menyalin username">
                      {{ user.username }}
                    </code>
                    <button @click="copyToClipboard(user.username, 'Username')"
                      class="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors" title="Salin Username">
                      <Copy class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-zinc-500">Password</span>
                  <div class="flex items-center gap-1.5">
                    <code @click="copyToClipboard(user.password, 'Password')"
                      class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono cursor-pointer hover:bg-zinc-750 transition-colors select-all"
                      title="Klik untuk menyalin password">
                      {{
                        showPasswordMap[user.id] ? user.password : "••••••••"
                      }}
                    </code>
                    <button @click="toggleShowPassword(user.id)"
                      class="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors" :title="showPasswordMap[user.id] ? 'Sembunyikan' : 'Tampilkan'
                        ">
                      <Eye v-if="!showPasswordMap[user.id]" class="w-3.5 h-3.5" />
                      <EyeOff v-else class="w-3.5 h-3.5" />
                    </button>
                    <button @click="copyToClipboard(user.password, 'Password')"
                      class="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors" title="Salin Password">
                      <Copy class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Action Section -->
              <div class="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <span class="text-xs text-zinc-500">Aksi Akun</span>
                <div class="flex items-center gap-1">
                  <!-- QR Code Login -->
                  <UiBaseButton
                    text="QR"
                    title="QR Login"
                    size="sm"
                    @click="openQrModal(user)"
                  >
                    <template #icon><QrCode class="w-3 h-3" /></template>
                  </UiBaseButton>

                  <!-- Edit Password Manual -->
                  <UiBaseButton
                    text="Edit"
                    title="Edit Password Manual"
                    size="sm"
                    :disabled="actionLoading === user.id"
                    @click="openEditPasswordModal(user)"
                  >
                    <template #icon><Key class="w-3 h-3" /></template>
                  </UiBaseButton>

                  <!-- Reset Password -->
                  <UiBaseButton
                    text="Reset"
                    title="Reset Password"
                    size="sm"
                    :disabled="actionLoading === user.id"
                    @click="resetPassword(user)"
                  >
                    <template #icon>
                      <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': actionLoading === user.id }" />
                    </template>
                  </UiBaseButton>

                  <!-- Toggle Active -->
                  <UiBaseButton
                    :text="user.is_active ? 'Nonaktif' : 'Aktifkan'"
                    :title="user.is_active ? 'Nonaktifkan' : 'Aktifkan'"
                    size="sm"
                    :disabled="actionLoading === user.id || user.role === 'admin'"
                    @click="toggleActive(user)"
                  >
                    <template #icon>
                      <Ban v-if="user.is_active" class="w-3 h-3" />
                      <Check v-else class="w-3 h-3" />
                    </template>
                  </UiBaseButton>

                  <!-- Delete -->
                  <UiBaseButton
                    text=""
                    title="Hapus Akun"
                    icon-only
                    size="sm"
                    :disabled="actionLoading === user.id || user.role === 'admin'"
                    @click="deleteUser(user)"
                  >
                    <template #icon><Trash2 class="w-3 h-3" /></template>
                  </UiBaseButton>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Summary -->
        <div v-if="users.length > 0" class="mt-3 text-xs text-zinc-500">
          Total: {{ users.length }} akun ({{
            users.filter((u) => u.role === "guru").length
          }}
          guru, {{users.filter((u) => u.role === "kepala_madrasah").length}} kepala madrasah, {{users.filter((u) =>
            u.role
            === "admin").length }} admin)
        </div>
      </div>

      <!-- QR Code Modal -->
      <div v-if="isQrModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
        @click.self="closeQrModal">
        <div
          class="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform scale-100">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
            <h3 class="text-lg font-semibold text-white flex items-center gap-2">
              <QrCode class="w-5 h-5 text-blue-500" />
              <span>QR Code Login</span>
            </h3>
            <button @click="closeQrModal" class="text-zinc-400 hover:text-zinc-200 transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex flex-col items-center gap-4 text-center" v-if="selectedUserForQr">
            <div>
              <p class="text-sm font-semibold text-zinc-200">
                {{ selectedUserForQr.display_name || "-" }}
              </p>
              <p class="text-xs text-zinc-500 mt-1">
                Username: <code class="text-emerald-400 font-mono px-1 py-0.5 rounded bg-zinc-800">{{
                  selectedUserForQr.username }}</code>
              </p>
            </div>

            <!-- QR Container -->
            <div class="p-4 bg-white rounded-xl shadow-inner border border-zinc-700">
              <div id="qr-code-svg-container">
                <QrcodeVue :value="`${selectedUserForQr.username}|${selectedUserForQr.password}`" :size="200" level="H"
                  render-as="svg" />
              </div>
            </div>

            <p class="text-xs text-zinc-400">
              Scan QR code di atas menggunakan fitur scan kamera pada halaman login aplikasi untuk masuk otomatis.
            </p>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-zinc-800">
            <UiBaseButton text="Tutup" @click="closeQrModal" />
            <UiBaseButton text="Unduh SVG" @click="downloadQrCodeSvg" />
          </div>
        </div>
      </div>

      <!-- Edit Password Modal -->
      <div v-if="isEditPasswordModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
        @click.self="closeEditPasswordModal">
        <div
          class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform scale-100">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
            <h3 class="text-lg font-semibold text-white flex items-center gap-2">
              <Key class="w-5 h-5 text-emerald-500" />
              <span>Edit Password Manual</span>
            </h3>
            <button @click="closeEditPasswordModal" class="text-zinc-400 hover:text-zinc-200 transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="space-y-4" v-if="selectedUserForPassword">
            <div>
              <p class="text-xs text-zinc-500">Nama Guru / Akun</p>
              <p class="text-sm font-semibold text-zinc-200">
                {{ selectedUserForPassword.display_name || "-" }}
              </p>
            </div>
            <div>
              <p class="text-xs text-zinc-500">Username</p>
              <code class="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 text-xs font-mono">
          {{ selectedUserForPassword.username }}
        </code>
            </div>

            <!-- Password Input -->
            <div class="space-y-1.5">
              <label class="text-xs text-zinc-400 font-medium">Password Baru</label>
              <div class="relative">
                <input v-model="manualPasswordInput" :type="showManualPassword ? 'text' : 'password'"
                  placeholder="Masukkan password baru..."
                  class="w-full h-10 pl-3 pr-10 rounded-lg border bg-zinc-800/40 text-white placeholder-zinc-500 border-zinc-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200 text-sm font-mono"
                  @keyup.enter="saveManualPassword" />
                <button type="button" @click="showManualPassword = !showManualPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors">
                  <Eye v-if="!showManualPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
              <div class="flex items-center justify-between pt-1">
                <span class="text-[11px] text-zinc-500">Minimal 4 karakter</span>
                <button type="button" @click="generateSuggestedPassword"
                  class="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Generate Acak
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-zinc-800">
            <UiBaseButton
              text="Batal"
              :disabled="isSubmittingManualPassword"
              @click="closeEditPasswordModal"
            />
            <UiBaseButton
              text="Simpan"
              :loading="isSubmittingManualPassword"
              :disabled="isSubmittingManualPassword"
              @click="saveManualPassword"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuth } from "~/composables/auth/useAuth";
import { useNotiflix } from "~/composables/ui/useFeedback";
import QrcodeVue from "qrcode.vue";
import * as XLSX from "xlsx";
import {
  UserPlus,
  RefreshCw,
  Loader2,
  Key,
  KeyRound,
  Eye,
  EyeOff,
  Ban,
  Check,
  Trash2,
  Search,
  FileSpreadsheet,
  Printer,
  QrCode,
  Copy,
} from "lucide-vue-next";

definePageMeta({
  requiresAuth: true,
  role: "admin",
});

const { getToken } = useAuth();
const { Notify, Confirm } = useNotiflix();

const users = ref([]);
const isLoading = ref(false);
const isSeeding = ref(false);
const actionLoading = ref(null);
const searchQuery = ref("");
const showPasswordMap = ref({});

const isEditPasswordModalOpen = ref(false);
const selectedUserForPassword = ref(null);
const manualPasswordInput = ref("");
const showManualPassword = ref(false);

const isQrModalOpen = ref(false);
const selectedUserForQr = ref(null);

const copyToClipboard = async (text, label) => {
  try {
    await navigator.clipboard.writeText(text);
    Notify?.success?.(`${label} berhasil disalin ke clipboard`);
  } catch (err) {
    console.error("Gagal menyalin:", err);
    Notify?.failure?.("Gagal menyalin ke clipboard");
  }
};

const openQrModal = (user) => {
  selectedUserForQr.value = user;
  isQrModalOpen.value = true;
};

const closeQrModal = () => {
  isQrModalOpen.value = false;
  selectedUserForQr.value = null;
};

const downloadQrCodeSvg = () => {
  const container = document.getElementById("qr-code-svg-container");
  if (!container) return;
  const svgEl = container.querySelector("svg");
  if (!svgEl) return;

  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgEl);

  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = `QR_Login_${selectedUserForQr.value.username}.svg`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  Notify?.success?.("QR Code berhasil diunduh");
};

const exportToExcel = () => {
  try {
    const dataToExport = filteredUsers.value.map((user, idx) => ({
      No: idx + 1,
      Nama: user.display_name || "-",
      Username: user.username,
      Password: user.password,
      Role: user.role === "admin" ? "Admin" : user.role === "kepala_madrasah" ? "Kepala Madrasah" : "Guru",
      Status: user.is_active ? "Aktif" : "Nonaktif",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Akun");

    worksheet["!cols"] = [
      { wch: 5 },  // No
      { wch: 30 }, // Nama
      { wch: 20 }, // Username
      { wch: 20 }, // Password
      { wch: 20 }, // Role
      { wch: 15 }, // Status
    ];

    XLSX.writeFile(workbook, "Daftar_Akun_Guru.xlsx");
    Notify?.success?.("Berhasil mengekspor data akun ke Excel");
  } catch (err) {
    console.error("Gagal ekspor excel:", err);
    Notify?.failure?.("Gagal mengekspor data ke Excel");
  }
};

const printAccounts = () => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    Notify?.failure?.("Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir.");
    return;
  }

  const htmlContent = `
    <html>
      <head>
        <title>Daftar Akun Guru - ${new Date().toLocaleDateString('id-ID')}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          h1 { text-align: center; font-size: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background-color: #f4f4f4; }
          tr:nth-child(even) { background-color: #fafafa; }
        </style>
      </head>
      <body>
        <h1>Daftar Akun Guru / Staff</h1>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama</th>
              <th>Username</th>
              <th>Password</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.value.map((user, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${user.display_name || "-"}</td>
                <td><code>${user.username}</code></td>
                <td><code>${user.password}</code></td>
                <td>${user.role === 'admin' ? 'Admin' : user.role === 'kepala_madrasah' ? 'Kepala Madrasah' : 'Guru'}</td>
                <td>${user.is_active ? 'Aktif' : 'Nonaktif'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        <\/script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const q = searchQuery.value.toLowerCase();
  return users.value.filter(
    (u) =>
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.gtk_nuptk && u.gtk_nuptk.toLowerCase().includes(q)),
  );
});

const toggleShowPassword = (userId) => {
  showPasswordMap.value = {
    ...showPasswordMap.value,
    [userId]: !showPasswordMap.value[userId],
  };
};

/**
 * Fetch semua akun dari server
 */
const loadUsers = async () => {
  isLoading.value = true;
  try {
    const token = getToken();
    const response = await fetch("/api/auth-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "get-users" }),
    });

    if (!response.ok) {
      throw new Error("Gagal memuat daftar akun");
    }

    const data = await response.json();
    users.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Gagal memuat akun:", err);
    Notify?.failure?.("Gagal memuat daftar akun");
  } finally {
    isLoading.value = false;
  }
};

/**
 * Buat akun guru otomatis dari data GTK
 */
const handleSeedGuru = async () => {
  Confirm?.show(
    "Buat Akun Otomatis",
    "Akan membuat akun login untuk semua guru di Data GTK yang belum memiliki akun. Username menggunakan Peg ID dan password akan diacak.",
    "Ya, Buat",
    "Batal",
    async () => {
      isSeeding.value = true;
      try {
        const token = getToken();
        const response = await fetch("/api/auth-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "seed-guru" }),
        });

        if (!response.ok) {
          throw new Error("Gagal membuat akun guru");
        }

        const result = await response.json();
        Notify?.success?.(
          result.message || `Berhasil membuat ${result.created} akun guru`,
        );

        // Reload users
        await loadUsers();
      } catch (err) {
        console.error("Gagal seed guru:", err);
        Notify?.failure?.("Gagal membuat akun guru otomatis");
      } finally {
        isSeeding.value = false;
      }
    },
    () => { },
  );
};

/**
 * Reset password akun
 */
const resetPassword = async (user) => {
  Confirm?.show(
    "Reset Password",
    `Apakah Anda yakin ingin mereset password untuk ${user.display_name || user.username}? Password baru akan diacak.`,
    "Ya, Reset",
    "Batal",
    async () => {
      actionLoading.value = user.id;
      try {
        // Generate random password
        const chars = "abcdefghjkmnpqrstuvwxyz23456789";
        let newPassword = "";
        for (let i = 0; i < 8; i++) {
          newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const token = getToken();
        const response = await fetch("/api/auth-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "update-user",
            userId: user.id,
            password: newPassword,
          }),
        });

        if (!response.ok) {
          throw new Error("Gagal mereset password");
        }

        // Update local state
        const idx = users.value.findIndex((u) => u.id === user.id);
        if (idx !== -1) {
          users.value[idx] = { ...users.value[idx], password: newPassword };
        }

        // Auto-show new password
        showPasswordMap.value = {
          ...showPasswordMap.value,
          [user.id]: true,
        };

        Notify?.success?.(
          `Password ${user.display_name || user.username} berhasil direset`,
        );
      } catch (err) {
        console.error("Gagal reset password:", err);
        Notify?.failure?.("Gagal mereset password");
      } finally {
        actionLoading.value = null;
      }
    },
    () => { },
  );
};

/**
 * Membuka modal edit password manual
 */
const openEditPasswordModal = (user) => {
  selectedUserForPassword.value = user;
  manualPasswordInput.value = "";
  showManualPassword.value = false;
  isEditPasswordModalOpen.value = true;
};

/**
 * Menutup modal edit password manual
 */
const closeEditPasswordModal = () => {
  isEditPasswordModalOpen.value = false;
  selectedUserForPassword.value = null;
  manualPasswordInput.value = "";
};

/**
 * Generate password acak 8 karakter di input manual
 */
const generateSuggestedPassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let newPassword = "";
  for (let i = 0; i < 8; i++) {
    newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  manualPasswordInput.value = newPassword;
  showManualPassword.value = true;
};

/**
 * Menyimpan password manual
 */
const isSubmittingManualPassword = ref(false);
const saveManualPassword = async () => {
  const user = selectedUserForPassword.value;
  if (!user) return;

  const password = manualPasswordInput.value.trim();
  if (!password) {
    Notify?.warning?.("Password tidak boleh kosong");
    return;
  }

  if (password.length < 4) {
    Notify?.warning?.("Password minimal terdiri dari 4 karakter");
    return;
  }

  isSubmittingManualPassword.value = true;
  try {
    const token = getToken();
    const response = await fetch("/api/auth-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "update-user",
        userId: user.id,
        password: password,
      }),
    });

    if (!response.ok) {
      throw new Error("Gagal menyimpan password baru");
    }

    // Update local state
    const idx = users.value.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], password: password };
    }

    // Auto-show password di list utama
    showPasswordMap.value = {
      ...showPasswordMap.value,
      [user.id]: true,
    };

    Notify?.success?.(
      `Password untuk ${user.display_name || user.username} berhasil diperbarui`,
    );
    closeEditPasswordModal();
  } catch (err) {
    console.error("Gagal menyimpan password manual:", err);
    Notify?.failure?.("Gagal menyimpan password baru");
  } finally {
    isSubmittingManualPassword.value = false;
  }
};

/**
 * Toggle status aktif/nonaktif
 */
const toggleActive = async (user) => {
  const newStatus = !user.is_active;
  const statusText = newStatus ? "mengaktifkan" : "menonaktifkan";

  actionLoading.value = user.id;
  try {
    const token = getToken();
    const response = await fetch("/api/auth-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "update-user",
        userId: user.id,
        is_active: newStatus,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gagal ${statusText} akun`);
    }

    // Update local state
    const idx = users.value.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users.value[idx] = {
        ...users.value[idx],
        is_active: newStatus ? 1 : 0,
      };
    }

    Notify?.success?.(
      `Akun ${user.display_name || user.username} berhasil di${newStatus ? "aktifkan" : "nonaktifkan"}`,
    );
  } catch (err) {
    console.error(`Gagal ${statusText}:`, err);
    Notify?.failure?.(`Gagal ${statusText} akun`);
  } finally {
    actionLoading.value = null;
  }
};

/**
 * Hapus akun
 */
const deleteUser = async (user) => {
  if (user.role === "admin") return;

  Confirm?.show(
    "Hapus Akun",
    `Apakah Anda yakin ingin menghapus akun ${user.display_name || user.username}? Tindakan ini tidak dapat dibatalkan.`,
    "Ya, Hapus",
    "Batal",
    async () => {
      actionLoading.value = user.id;
      try {
        const token = getToken();
        const response = await fetch("/api/auth-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "delete-user",
            userId: user.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Gagal menghapus akun");
        }

        // Remove from local state
        users.value = users.value.filter((u) => u.id !== user.id);

        Notify?.success?.(
          `Akun ${user.display_name || user.username} berhasil dihapus`,
        );
      } catch (err) {
        console.error("Gagal menghapus:", err);
        Notify?.failure?.("Gagal menghapus akun");
      } finally {
        actionLoading.value = null;
      }
    },
    () => { },
  );
};

onMounted(() => {
  loadUsers();
});
</script>
