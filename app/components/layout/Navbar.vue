<template>
  <header class="fixed w-full z-30">
    <div
      class="max-w-7xl mx-auto flex justify-between items-center h-16 px-4 bg-zinc-900 text-zinc-100"
    >
      <!-- Bagian 1: Toggle Hamburger + Toggle Tema -->
      <div class="flex items-center space-x-4 flex-shrink-0">
        <!-- Sidebar Toggle Component (Inlined) -->
        <button
          @click="toggleSidebar"
          class="p-2 rounded-lg transition-all duration-300 hover:bg-zinc-800 text-zinc-200"
          :aria-label="isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'"
        >
          <Menu
            v-if="!isSidebarOpen"
            class="transform transition-all duration-300 hover:translate-x-0.5"
          />
          <X
            v-if="isSidebarOpen"
            class="transform transition-all duration-300 hover:rotate-90"
          />
        </button>

        <!-- Theme Toggle -->
      </div>

      <!-- Bagian 2: Logo/Teks di Tengah dengan Animasi Ketikan -->
      <div class="text-xl font-semibold flex-1 flex justify-center">
        <div class="w-28 sm:w-32 md:w-36 text-center">
          <span class="font-bold text-emerald-400 text-lg sm:text-xl">
            {{ displayedText }}<span class="animate-pulse">|</span>
          </span>
        </div>
      </div>

      <!-- Bagian 3: Fullscreen + User Dropdown -->
      <div class="flex items-center space-x-4 flex-shrink-0">
        <!-- User Dropdown -->
        <div class="relative" ref="userDropdownRef">
          <!-- User Avatar/Icon Button -->
          <button
            @click="toggleUserDropdown"
            class="flex items-center justify-center p-2 rounded-lg transition-all duration-300 hover:bg-zinc-800 text-zinc-200"
            :class="{ 'bg-zinc-800': isUserDropdownOpen }"
            aria-label="User Menu"
          >
            <!-- User Icon -->
            <UserCircle />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="isUserDropdownOpen"
            class="absolute right-0 mt-2 w-44 rounded-lg shadow-lg border z-50 bg-zinc-800 border-zinc-700"
          >
            <div>
              <!-- Logout Button (Inlined) -->
              <button
                @click="handleLogout"
                class="flex w-full items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-300 hover:bg-zinc-800 text-red-400 hover:text-red-300"
                aria-label="Logout"
                :disabled="isLoggingOut"
              >
                <Loader2
                  v-if="isLoggingOut"
                  class="w-5 h-5 animate-spin mx-auto"
                />
                <div v-else class="flex items-center space-x-2">
                  <SignOut
                    class="w-5 h-5 group-hover:rotate-12 transition-transform duration-300"
                  />
                  <span class="font-medium">Keluar</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import {
  UserCircle,
  Menu,
  X,
  LogOut as SignOut,
  Loader2,
} from "lucide-vue-next";
import { ref, onMounted, onUnmounted } from "vue";

import { useAuth } from "~/composables/auth/useAuth";
import { useNotiflix } from "~/composables/ui/useFeedback";

const router = useRouter();
const { Notify, Loading, Confirm } = useNotiflix();
const { logout, isLoading: authLoading } = useAuth();

const isLoggingOut = ref(false);

const handleLogout = () => {
  if (isLoggingOut.value || authLoading.value) return; // Mencegah klik ganda

  logout({
    router,
    notiflix: { Notify, Loading, Confirm },
    onStart: () => {
      isLoggingOut.value = true;
    },
    onFinish: () => {
      isLoggingOut.value = false;
    },
  });
};

// Props dan Emits untuk sidebar
defineProps({
  isSidebarOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["toggleSidebar"]);

const toggleSidebar = () => {
  emit("toggleSidebar");
};

// User Dropdown State
const isUserDropdownOpen = ref(false);
const userDropdownRef = ref(null);

// Toggle user dropdown
const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (userDropdownRef.value && !userDropdownRef.value.contains(event.target)) {
    isUserDropdownOpen.value = false;
  }
};

// Animasi Ketikan
const texts = ["SopokDate", "SatuData", "OneData"];
const displayedText = ref("");
const currentTextIndex = ref(0);
const currentCharIndex = ref(0);
const isDeleting = ref(false);
const typewriterInterval = ref(null);

const typeWriter = () => {
  const currentText = texts[currentTextIndex.value];

  if (!isDeleting.value) {
    if (currentCharIndex.value < currentText.length) {
      displayedText.value = currentText.substring(
        0,
        currentCharIndex.value + 1,
      );
      currentCharIndex.value++;
      typewriterInterval.value = setTimeout(typeWriter, 100);
    } else {
      typewriterInterval.value = setTimeout(() => {
        isDeleting.value = true;
        typeWriter();
      }, 2000);
    }
  } else {
    if (currentCharIndex.value > 0) {
      displayedText.value = currentText.substring(
        0,
        currentCharIndex.value - 1,
      );
      currentCharIndex.value--;
      typewriterInterval.value = setTimeout(typeWriter, 50);
    } else {
      isDeleting.value = false;
      currentTextIndex.value = (currentTextIndex.value + 1) % texts.length;
      typewriterInterval.value = setTimeout(typeWriter, 500);
    }
  }
};

onMounted(() => {
  typeWriter();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  if (typewriterInterval.value) {
    clearTimeout(typewriterInterval.value);
  }
  document.removeEventListener("click", handleClickOutside);
});
</script>
