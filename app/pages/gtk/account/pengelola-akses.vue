<template>
  <div class="min-h-screen">
    <div class="page-layout px-4 sm:px-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:gap-5 mt-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl theme-text-heading sm:text-2xl">Pengelola Akses</h2>
            <p class="theme-text-secondary text-xs sm:text-sm mt-1">
              Atur menu yang dapat diakses oleh setiap role atau per guru individu
            </p>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="flex rounded-xl overflow-hidden border theme-border theme-bg-secondary">
          <button
            @click="activeTab = 'role'"
            :class="[
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200',
              activeTab === 'role'
                ? 'bg-emerald-600 text-white'
                : 'theme-text-secondary theme-bg-card-hover',
            ]"
          >
            <Shield class="w-4 h-4" />
            <span>Akses per Role</span>
          </button>
          <button
            @click="activeTab = 'user'"
            :class="[
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200',
              activeTab === 'user'
                ? 'bg-emerald-600 text-white'
                : 'theme-text-secondary theme-bg-card-hover',
            ]"
          >
            <UserCog class="w-4 h-4" />
            <span>Akses per Guru</span>
          </button>
        </div>
      </div>

      <!-- ======================== TAB: Akses per Role ======================== -->
      <div v-if="activeTab === 'role'" class="mt-5">
        <!-- Role Selector -->
        <div class="flex items-center gap-3 mb-5">
          <label class="text-sm theme-text font-medium">Pilih Role:</label>
          <div class="flex gap-2">
            <button
              v-for="r in managedRoles"
              :key="r.value"
              @click="selectRole(r.value)"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
                selectedRole === r.value
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'theme-bg-input theme-text-secondary theme-border hover:theme-text hover:theme-border-secondary',
              ]"
            >
              {{ r.label }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoadingRole" class="flex items-center justify-center py-16">
          <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
          <span class="ml-3 theme-text-secondary">Memuat pengaturan akses...</span>
        </div>

        <!-- Menu Access Cards -->
        <div v-else-if="selectedRole">
          <!-- Select All -->
          <div
            class="flex items-center justify-between mb-4 p-3 rounded-xl border theme-border theme-bg-secondary"
          >
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="isAllRoleChecked"
                :indeterminate="isRoleIndeterminate"
                @change="toggleAllRole"
                class="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <span class="text-sm font-semibold theme-text">Pilih Semua Menu</span>
            </div>
            <span class="text-xs theme-text-muted">
              {{ roleCheckedCount }}/{{ roleMenuFlat.length }} dipilih
            </span>
          </div>

          <!-- Groups -->
          <div class="space-y-3">
            <div
              v-for="group in roleMenuGroups"
              :key="group.label"
              class="rounded-xl border theme-border theme-bg-card overflow-hidden"
            >
              <!-- Group header -->
              <div
                class="flex items-center justify-between px-4 py-3 theme-bg-card"
              >
                <div class="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    :checked="isGroupRoleChecked(group.label)"
                    :indeterminate="isGroupRoleIndeterminate(group.label)"
                    @change="toggleGroupRole(group.label)"
                    class="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <span class="text-sm font-semibold theme-text">{{ group.label }}</span>
                </div>
                <span class="text-xs theme-text-muted">
                  {{ getGroupRoleCheckedCount(group.label) }}/{{ group.items.length }}
                </span>
              </div>

              <!-- Group items -->
              <div class="group-items-divider">
                <label
                  v-for="item in group.items"
                  :key="item.to"
                  class="flex items-center gap-3 px-4 py-2.5 theme-bg-card-hover transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="roleAccessMap[item.to]"
                    @change="toggleRoleItem(item.to)"
                    class="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <div class="flex-1 min-w-0">
                    <span class="text-sm theme-text">{{ item.label }}</span>
                    <span class="text-xs theme-text-muted ml-2">{{ item.to }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="mt-5 flex justify-end pb-8">
            <button
              @click="saveRoleAccess"
              :disabled="isSavingRole"
              class="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save v-if="!isSavingRole" class="w-4 h-4" />
              <Loader2 v-else class="w-4 h-4 animate-spin" />
              <span>{{ isSavingRole ? "Menyimpan..." : "Simpan Pengaturan" }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ======================== TAB: Akses per Guru ======================== -->
      <div v-if="activeTab === 'user'" class="mt-5">
        <!-- Guru Selector -->
        <div class="mb-5 space-y-3">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1">
              <label class="text-sm theme-text font-medium mb-1.5 block">Pilih Guru:</label>
              <SearchableSelect
                v-model="selectedUserId"
                :options="guruUsersOptions"
                option-label="display_name"
                option-value="id"
                placeholder="-- Pilih Guru --"
                search-placeholder="Cari nama atau username..."
                class="w-full"
                @change="loadUserAccess"
              />
            </div>
            <!-- Reset Button -->
            <div v-if="selectedUserId && userHasCustom" class="flex items-end">
              <button
                @click="resetUserAccess"
                :disabled="isResettingUser"
                class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-sm font-medium transition-all duration-200 disabled:opacity-50"
              >
                <RotateCcw v-if="!isResettingUser" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
                <span>Reset ke Default</span>
              </button>
            </div>
          </div>

          <!-- Custom Badge -->
          <div
            v-if="selectedUserId && userHasCustom"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20"
          >
            <Sparkles class="w-4 h-4 text-violet-400" />
            <span class="text-xs text-violet-600 dark:text-violet-300">
              Guru ini memiliki pengaturan akses <strong>custom</strong> — tidak mengikuti default role.
            </span>
          </div>
          <div
            v-else-if="selectedUserId && !userHasCustom && !isLoadingUser"
            class="flex items-center gap-2 px-3 py-2 rounded-lg theme-bg-secondary border theme-border"
          >
            <Info class="w-4 h-4 theme-text-muted" />
            <span class="text-xs theme-text-secondary">
              Guru ini menggunakan pengaturan akses <strong>default role</strong>. Ubah di bawah untuk membuat pengaturan custom.
            </span>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoadingUser" class="flex items-center justify-center py-16">
          <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
          <span class="ml-3 theme-text-secondary">Memuat pengaturan akses guru...</span>
        </div>

        <!-- Loading Users List -->
        <div v-else-if="isLoadingUsers" class="flex items-center justify-center py-16">
          <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
          <span class="ml-3 theme-text-secondary">Memuat daftar guru...</span>
        </div>

        <!-- Empty: No guru selected -->
        <div
          v-else-if="!selectedUserId"
          class="text-center py-16"
        >
          <UserCog class="w-16 h-16 mx-auto mb-4 theme-text-muted" />
          <p class="theme-text-secondary mb-2">Pilih guru dari dropdown di atas</p>
          <p class="theme-text-muted text-sm">
            untuk mengatur akses menu secara individual
          </p>
        </div>

        <!-- User Menu Access Cards -->
        <div v-else-if="selectedUserId">
          <!-- Select All -->
          <div
            class="flex items-center justify-between mb-4 p-3 rounded-xl border theme-border theme-bg-secondary"
          >
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="isAllUserChecked"
                :indeterminate="isUserIndeterminate"
                @change="toggleAllUser"
                class="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <span class="text-sm font-semibold theme-text">Pilih Semua Menu</span>
            </div>
            <span class="text-xs theme-text-muted">
              {{ userCheckedCount }}/{{ userMenuFlat.length }} dipilih
            </span>
          </div>

          <!-- Groups (same structure as role tab) -->
          <div class="space-y-3">
            <div
              v-for="group in userMenuGroups"
              :key="group.label"
              class="rounded-xl border theme-border theme-bg-card overflow-hidden"
            >
              <div
                class="flex items-center justify-between px-4 py-3 theme-bg-card"
              >
                <div class="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    :checked="isGroupUserChecked(group.label)"
                    :indeterminate="isGroupUserIndeterminate(group.label)"
                    @change="toggleGroupUser(group.label)"
                    class="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <span class="text-sm font-semibold theme-text">{{ group.label }}</span>
                </div>
                <span class="text-xs theme-text-muted">
                  {{ getGroupUserCheckedCount(group.label) }}/{{ group.items.length }}
                </span>
              </div>

              <div class="group-items-divider">
                <label
                  v-for="item in group.items"
                  :key="item.to"
                  class="flex items-center gap-3 px-4 py-2.5 theme-bg-card-hover transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="userAccessMap[item.to]"
                    @change="toggleUserItem(item.to)"
                    class="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <div class="flex-1 min-w-0">
                    <span class="text-sm theme-text">{{ item.label }}</span>
                    <span class="text-xs theme-text-muted ml-2">{{ item.to }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="mt-5 flex justify-end pb-8">
            <button
              @click="saveUserAccess"
              :disabled="isSavingUser"
              class="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save v-if="!isSavingUser" class="w-4 h-4" />
              <Loader2 v-else class="w-4 h-4 animate-spin" />
              <span>{{ isSavingUser ? "Menyimpan..." : "Simpan Pengaturan" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import {
  Shield,
  UserCog,
  Loader2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-vue-next";
import SearchableSelect from "~/components/ui/SearchableSelect.vue";
import { useAuth } from "~/composables/auth/useAuth";
import { useMenuConfig } from "~/composables/ui/useMenuConfig";
import { useNotiflix } from "~/composables/ui/useFeedback";

definePageMeta({
  requiresAuth: true,
  role: "admin",
});

const { getToken } = useAuth();
const { getAllMenuKeysFlat } = useMenuConfig();

const { Notify } = useNotiflix();
const showToast = (message, type = "info") => {
  if (type === "error" || type === "failure") {
    Notify.failure(message);
  } else if (type === "success") {
    Notify.success(message);
  } else if (type === "warning") {
    Notify.warning(message);
  } else {
    Notify.info(message);
  }
};

// ======================== SHARED ========================
const activeTab = ref("role");
const allMenuFlat = computed(() => getAllMenuKeysFlat());

// Helper to group flat menu items
const groupMenuItems = (flatItems) => {
  const groups = {};
  flatItems.forEach((item) => {
    if (!groups[item.group]) {
      groups[item.group] = { label: item.group, items: [] };
    }
    groups[item.group].items.push(item);
  });
  return Object.values(groups);
};

const managedRoles = [
  { value: "guru", label: "Guru" },
  { value: "kepala_madrasah", label: "Kepala Madrasah" },
];

// ======================== TAB: ROLE ========================
const selectedRole = ref("guru");
const isLoadingRole = ref(false);
const isSavingRole = ref(false);
const roleAccessMap = reactive({});

// Filtered menu list for the currently selected role
const roleMenuFlat = computed(() => getAllMenuKeysFlat(selectedRole.value));
const roleMenuGroups = computed(() => groupMenuItems(roleMenuFlat.value));

const roleCheckedCount = computed(() => {
  return roleMenuFlat.value.filter((item) => roleAccessMap[item.to]).length;
});

const isAllRoleChecked = computed(() => {
  return roleMenuFlat.value.length > 0 && roleCheckedCount.value === roleMenuFlat.value.length;
});

const isRoleIndeterminate = computed(() => {
  return roleCheckedCount.value > 0 && roleCheckedCount.value < roleMenuFlat.value.length;
});

const isGroupRoleChecked = (groupLabel) => {
  const group = roleMenuGroups.value.find((g) => g.label === groupLabel);
  if (!group) return false;
  return group.items.every((item) => roleAccessMap[item.to]);
};

const isGroupRoleIndeterminate = (groupLabel) => {
  const group = roleMenuGroups.value.find((g) => g.label === groupLabel);
  if (!group) return false;
  const checked = group.items.filter((item) => roleAccessMap[item.to]).length;
  return checked > 0 && checked < group.items.length;
};

const getGroupRoleCheckedCount = (groupLabel) => {
  const group = roleMenuGroups.value.find((g) => g.label === groupLabel);
  if (!group) return 0;
  return group.items.filter((item) => roleAccessMap[item.to]).length;
};

const toggleAllRole = () => {
  const newVal = !isAllRoleChecked.value;
  roleMenuFlat.value.forEach((item) => {
    roleAccessMap[item.to] = newVal;
  });
};

const toggleGroupRole = (groupLabel) => {
  const group = roleMenuGroups.value.find((g) => g.label === groupLabel);
  if (!group) return;
  const newVal = !isGroupRoleChecked(groupLabel);
  group.items.forEach((item) => {
    roleAccessMap[item.to] = newVal;
  });
};

const toggleRoleItem = (menuKey) => {
  roleAccessMap[menuKey] = !roleAccessMap[menuKey];
};

const selectRole = async (role) => {
  selectedRole.value = role;
  await loadRoleAccess();
};

const loadRoleAccess = async () => {
  if (!selectedRole.value) return;
  isLoadingRole.value = true;

  try {
    const token = getToken();
    const response = await fetch("/api/auth-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "get-menu-akses-role",
        role: selectedRole.value,
      }),
    });

    const result = await response.json();

    // Reset all to unchecked first (only role-relevant menus)
    roleMenuFlat.value.forEach((item) => {
      roleAccessMap[item.to] = false;
    });

    if (result.success && result.menu_akses) {
      if (result.menu_akses.length === 0) {
        // Belum ada pengaturan: default semua aktif
        roleMenuFlat.value.forEach((item) => {
          roleAccessMap[item.to] = true;
        });
      } else {
        // Build a set of allowed keys for this role
        const roleKeys = new Set(roleMenuFlat.value.map((i) => i.to));
        result.menu_akses.forEach((akses) => {
          if (roleKeys.has(akses.menu_key)) {
            roleAccessMap[akses.menu_key] = akses.is_allowed === 1;
          }
        });
      }
    } else {
      // Default semua aktif jika belum diatur
      roleMenuFlat.value.forEach((item) => {
        roleAccessMap[item.to] = true;
      });
    }
  } catch (err) {
    console.error("Gagal memuat akses role:", err);
    showToast("Gagal memuat pengaturan akses role", "error");
  } finally {
    isLoadingRole.value = false;
  }
};

const saveRoleAccess = async () => {
  if (!selectedRole.value) return;
  isSavingRole.value = true;

  try {
    const token = getToken();
    // Build a set of role-relevant keys
    const roleKeys = new Set(roleMenuFlat.value.map((i) => i.to));
    // Send all menu keys, but force is_allowed=0 for menus outside this role
    const items = allMenuFlat.value.map((item) => ({
      menu_key: item.to,
      is_allowed: roleKeys.has(item.to) && roleAccessMap[item.to] ? 1 : 0,
    }));

    const response = await fetch("/api/auth-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "save-menu-akses-role",
        role: selectedRole.value,
        items,
      }),
    });

    const result = await response.json();

    if (result.success) {
      showToast(`Pengaturan akses untuk role "${selectedRole.value}" berhasil disimpan`, "success");
    } else {
      throw new Error(result.error || "Gagal menyimpan");
    }
  } catch (err) {
    console.error("Gagal menyimpan akses role:", err);
    showToast("Gagal menyimpan pengaturan akses", "error");
  } finally {
    isSavingRole.value = false;
  }
};

// ======================== TAB: USER (PER GURU) ========================
const selectedUserId = ref("");
const isLoadingUser = ref(false);
const isLoadingUsers = ref(false);
const isSavingUser = ref(false);
const isResettingUser = ref(false);
const userHasCustom = ref(false);
const userAccessMap = reactive({});
const guruUsers = ref([]);

// Format untuk SearchableSelect: tampilkan nama saja
const guruUsersOptions = computed(() => guruUsers.value);

// Get the role of the currently selected user
const selectedUserRole = computed(() => {
  if (!selectedUserId.value) return "guru";
  const user = guruUsers.value.find((u) => u.id === Number(selectedUserId.value));
  return user?.role || "guru";
});

// Filtered menu list for the selected user's role
const userMenuFlat = computed(() => getAllMenuKeysFlat(selectedUserRole.value));
const userMenuGroups = computed(() => groupMenuItems(userMenuFlat.value));

const userCheckedCount = computed(() => {
  return userMenuFlat.value.filter((item) => userAccessMap[item.to]).length;
});

const isAllUserChecked = computed(() => {
  return userMenuFlat.value.length > 0 && userCheckedCount.value === userMenuFlat.value.length;
});

const isUserIndeterminate = computed(() => {
  return userCheckedCount.value > 0 && userCheckedCount.value < userMenuFlat.value.length;
});

const isGroupUserChecked = (groupLabel) => {
  const group = userMenuGroups.value.find((g) => g.label === groupLabel);
  if (!group) return false;
  return group.items.every((item) => userAccessMap[item.to]);
};

const isGroupUserIndeterminate = (groupLabel) => {
  const group = userMenuGroups.value.find((g) => g.label === groupLabel);
  if (!group) return false;
  const checked = group.items.filter((item) => userAccessMap[item.to]).length;
  return checked > 0 && checked < group.items.length;
};

const getGroupUserCheckedCount = (groupLabel) => {
  const group = userMenuGroups.value.find((g) => g.label === groupLabel);
  if (!group) return 0;
  return group.items.filter((item) => userAccessMap[item.to]).length;
};

const toggleAllUser = () => {
  const newVal = !isAllUserChecked.value;
  userMenuFlat.value.forEach((item) => {
    userAccessMap[item.to] = newVal;
  });
};

const toggleGroupUser = (groupLabel) => {
  const group = userMenuGroups.value.find((g) => g.label === groupLabel);
  if (!group) return;
  const newVal = !isGroupUserChecked(groupLabel);
  group.items.forEach((item) => {
    userAccessMap[item.to] = newVal;
  });
};

const toggleUserItem = (menuKey) => {
  userAccessMap[menuKey] = !userAccessMap[menuKey];
};

const loadGuruUsers = async () => {
  isLoadingUsers.value = true;

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

    const result = await response.json();

    if (Array.isArray(result)) {
      guruUsers.value = result.filter(
        (u) => u.role === "guru" || u.role === "kepala_madrasah",
      );
    }
  } catch (err) {
    console.error("Gagal memuat daftar guru:", err);
    showToast("Gagal memuat daftar guru", "error");
  } finally {
    isLoadingUsers.value = false;
  }
};

const loadUserAccess = async () => {
  if (!selectedUserId.value) return;
  isLoadingUser.value = true;

  try {
    const token = getToken();
    const response = await fetch("/api/auth-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "get-menu-akses-user",
        userId: selectedUserId.value,
      }),
    });

    const result = await response.json();

    // Reset all (only user-role-relevant menus)
    const userRoleKeys = new Set(userMenuFlat.value.map((i) => i.to));
    userMenuFlat.value.forEach((item) => {
      userAccessMap[item.to] = false;
    });

    if (result.success) {
      userHasCustom.value = result.has_custom;

      if (result.has_custom && result.menu_akses) {
        // User memiliki custom akses
        result.menu_akses.forEach((akses) => {
          if (userRoleKeys.has(akses.menu_key)) {
            userAccessMap[akses.menu_key] = akses.is_allowed === 1;
          }
        });
      } else {
        // User mengikuti default role — ambil data role
        const userRole = selectedUserRole.value;

        const roleResponse = await fetch("/api/auth-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "get-menu-akses-role",
            role: userRole,
          }),
        });

        const roleResult = await roleResponse.json();

        if (roleResult.success && roleResult.menu_akses && roleResult.menu_akses.length > 0) {
          roleResult.menu_akses.forEach((akses) => {
            if (userRoleKeys.has(akses.menu_key)) {
              userAccessMap[akses.menu_key] = akses.is_allowed === 1;
            }
          });
        } else {
          // Default: semua aktif
          userMenuFlat.value.forEach((item) => {
            userAccessMap[item.to] = true;
          });
        }
      }
    }
  } catch (err) {
    console.error("Gagal memuat akses user:", err);
    showToast("Gagal memuat pengaturan akses guru", "error");
  } finally {
    isLoadingUser.value = false;
  }
};

const saveUserAccess = async () => {
  if (!selectedUserId.value) return;
  isSavingUser.value = true;

  try {
    const token = getToken();
    // Build a set of user-role-relevant keys
    const userRoleKeys = new Set(userMenuFlat.value.map((i) => i.to));
    // Send all menu keys, but force is_allowed=0 for menus outside the user's role
    const items = allMenuFlat.value.map((item) => ({
      menu_key: item.to,
      is_allowed: userRoleKeys.has(item.to) && userAccessMap[item.to] ? 1 : 0,
    }));

    const response = await fetch("/api/auth-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "save-menu-akses-user",
        userId: selectedUserId.value,
        items,
      }),
    });

    const result = await response.json();

    if (result.success) {
      userHasCustom.value = true;
      showToast("Pengaturan akses guru berhasil disimpan", "success");
    } else {
      throw new Error(result.error || "Gagal menyimpan");
    }
  } catch (err) {
    console.error("Gagal menyimpan akses user:", err);
    showToast("Gagal menyimpan pengaturan akses", "error");
  } finally {
    isSavingUser.value = false;
  }
};

const resetUserAccess = async () => {
  if (!selectedUserId.value) return;

  if (!confirm("Reset akses guru ini ke pengaturan default role?")) return;

  isResettingUser.value = true;

  try {
    const token = getToken();
    const response = await fetch("/api/auth-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "reset-menu-akses-user",
        userId: selectedUserId.value,
      }),
    });

    const result = await response.json();

    if (result.success) {
      showToast("Akses guru berhasil direset ke default", "success");
      await loadUserAccess();
    } else {
      throw new Error(result.error || "Gagal mereset");
    }
  } catch (err) {
    console.error("Gagal mereset akses user:", err);
    showToast("Gagal mereset pengaturan akses", "error");
  } finally {
    isResettingUser.value = false;
  }
};

// ======================== LIFECYCLE ========================
onMounted(async () => {
  await Promise.all([loadRoleAccess(), loadGuruUsers()]);
});
</script>
