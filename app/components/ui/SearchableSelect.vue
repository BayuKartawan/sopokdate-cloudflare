<template>
  <div class="relative searchable-select" ref="dropdownRef">
    <!-- Trigger Button -->
    <button
      ref="triggerRef"
      type="button"
      @click="toggleDropdown"
      :class="[
        'w-full text-left rounded-lg border px-3 py-1.5 text-[11px] transition-all flex items-center justify-between !h-8',
        'bg-zinc-800 border-zinc-600 text-zinc-100 hover:border-zinc-500',
      ]"
    >
      <span class="truncate">{{ selectedLabel || placeholder }}</span>
      <ChevronDown class="w-3 h-3 ml-1 text-zinc-400" stroke-width="2.5" />
    </button>

    <!-- Dropdown Menu using Teleport -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="menuRef"
        :style="menuStyle"
        :class="[
          'fixed z-[9999] rounded-xl border shadow-2xl overflow-hidden backdrop-blur-md transition-opacity duration-200',
          'bg-zinc-900/95 border-zinc-700',
        ]"
      >
        <!-- Search Input -->
        <div class="p-2 border-b border-zinc-800">
          <div class="relative">
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              :class="[
                'w-full pl-8 pr-3 py-1.5 rounded-lg text-[11px] outline-none transition-all focus:ring-2',
                'bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-emerald-500/40',
              ]"
              @click.stop
            />
            <Search
              class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500"
              stroke-width="2.5"
            />
          </div>
        </div>

        <!-- Options List -->
        <div class="max-h-60 overflow-y-auto custom-scrollbar">
          <div
            v-for="(option, idx) in filteredOptions"
            :key="idx"
            @click="selectOption(option)"
            :class="[
              'px-3 py-2 text-[11px] cursor-pointer transition-colors flex items-center justify-between',
              isSelected(option)
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-300 hover:bg-zinc-800',
            ]"
          >
            <span class="truncate">{{ getOptionLabel(option) }}</span>
            <Check v-if="isSelected(option)" class="w-3 h-3" stroke-width="3" />
          </div>
          <div
            v-if="filteredOptions.length === 0"
            class="px-3 py-4 text-center text-[11px] text-zinc-500 italic"
          >
            Tidak ada data ditemukan
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { ChevronDown, Search, Check } from "lucide-vue-next";

const props = defineProps({
  modelValue: [String, Number, Object],
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: "Pilih data...",
  },
  searchPlaceholder: {
    type: String,
    default: "Cari...",
  },
  optionLabel: String,
  optionValue: String,
});

const emit = defineEmits(["update:modelValue", "change"]);

const isOpen = ref(false);
const searchQuery = ref("");
const dropdownRef = ref(null);
const triggerRef = ref(null);
const searchInputRef = ref(null);
const menuRef = ref(null);

const menuStyle = ref({
  top: "0px",
  left: "0px",
  width: "0px",
});

const updatePosition = () => {
  if (!triggerRef.value || !isOpen.value) return;
  const rect = triggerRef.value.getBoundingClientRect();

  // Hitung posisi (fixed relative to viewport)
  let top = rect.bottom + 4;
  let left = rect.left;

  // Pastikan tidak keluar layar bawah
  const menuHeight = 300; // Estimasi max height
  if (rect.bottom + menuHeight > window.innerHeight) {
    top = rect.top - menuHeight - 5;
  }

  menuStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${rect.width}px`,
  };
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = "";
    updatePosition();
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
};

const getOptionLabel = (option) => {
  if (typeof option === "string") return option;
  return props.optionLabel ? option[props.optionLabel] : option.label;
};

const getOptionValue = (option) => {
  if (typeof option === "string") return option;
  return props.optionValue ? option[props.optionValue] : option.value;
};

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;
  const query = searchQuery.value.toLowerCase();
  return props.options.filter((opt) =>
    getOptionLabel(opt).toLowerCase().includes(query),
  );
});

const selectedLabel = computed(() => {
  const selected = props.options.find(
    (opt) => getOptionValue(opt) === props.modelValue,
  );
  return selected ? getOptionLabel(selected) : props.modelValue;
});

const isSelected = (option) => getOptionValue(option) === props.modelValue;

const selectOption = (option) => {
  const value = getOptionValue(option);
  emit("update:modelValue", value);
  emit("change", option);
  isOpen.value = false;
};

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    // Juga cek apakah klik di dalam menu yang di-teleport
    if (menuRef.value && !menuRef.value.contains(event.target)) {
      isOpen.value = false;
    }
  }
};

const handleScroll = () => {
  if (isOpen.value) {
    updatePosition();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("scroll", handleScroll, true);
  window.addEventListener("resize", updatePosition);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("scroll", handleScroll, true);
  window.removeEventListener("resize", updatePosition);
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.2);
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
}
</style>
