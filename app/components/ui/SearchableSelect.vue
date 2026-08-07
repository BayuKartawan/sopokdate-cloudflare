<template>
  <div class="relative searchable-select" ref="dropdownRef">
    <!-- Trigger Button -->
    <button ref="triggerRef" type="button" @click="toggleDropdown" :class="[
      'w-full text-left rounded-lg border pl-4 pr-3 py-2 text-sm transition-all flex items-center justify-between',
      disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
    ]" :style="{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-secondary)',
        color: 'var(--text-primary)',
      }" :disabled="disabled">
      <span class="truncate">{{ selectedLabel || placeholder }}</span>
      <ChevronDown class="w-3 h-3 ml-1" :style="{ color: 'var(--text-secondary)' }" stroke-width="2.5" />
    </button>

    <!-- Dropdown Menu using Teleport -->
    <Teleport to="body">
      <div v-if="isOpen" ref="menuRef" :style="[
        menuStyle,
        {
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
        },
      ]" :class="[
          'fixed z-[9999] rounded-xl border shadow-2xl overflow-hidden transition-opacity duration-200',
        ]">
        <!-- Search Input -->
        <div class="p-2 border-b" :style="{ borderColor: 'var(--border-primary)' }">
          <div class="relative">
            <input ref="searchInputRef" v-model="searchQuery" type="text" :placeholder="searchPlaceholder" :class="[
              'w-full pl-8 pr-3 py-1.5 rounded-lg text-[11px] outline-none transition-all focus:ring-2',
              'focus:ring-emerald-500/40',
            ]" :style="{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }" @click.stop />
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              :style="{ color: 'var(--text-muted)' }" stroke-width="2.5" />
          </div>
        </div>

        <!-- Options List -->
        <div class="max-h-60 overflow-y-auto custom-scrollbar">
          <div v-for="(option, idx) in filteredOptions" :key="idx" @click="selectOption(option)" :class="[
            'px-3 py-2 text-[11px] cursor-pointer transition-colors flex items-start justify-between gap-2',
            isSelected(option)
              ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400'
              : 'hover:bg-[var(--bg-secondary)]',
          ]" :style="!isSelected(option) ? { color: 'var(--text-primary)' } : {}">
            <span class="break-words whitespace-normal leading-relaxed">{{ getOptionLabel(option) }}</span>
            <Check v-if="isSelected(option)" class="w-3 h-3 shrink-0 mt-0.5" stroke-width="3" />
          </div>
          <div v-if="filteredOptions.length === 0" class="px-3 py-4 text-center text-[11px] italic"
            :style="{ color: 'var(--text-muted)' }">
            Tidak ada data ditemukan
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import type { PropType, CSSProperties } from "vue";
import { ChevronDown, Search, Check } from "lucide-vue-next";

interface SelectOption {
  [key: string]: unknown;
  label?: string;
  value?: string | number;
}

const props = defineProps({
  modelValue: [String, Number, Object] as PropType<string | number | Record<string, unknown> | null>,
  options: {
    type: Array as PropType<(string | SelectOption)[]>,
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
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
  (e: "change", option: string | SelectOption): void;
}>();

const isOpen = ref<boolean>(false);
const searchQuery = ref<string>("");
const dropdownRef = ref<HTMLDivElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const menuRef = ref<HTMLDivElement | null>(null);

const menuStyle = ref<CSSProperties>({
  top: "0px",
  left: "0px",
  width: "0px",
});

const updatePosition = (): void => {
  if (!triggerRef.value || !isOpen.value) return;
  const rect = triggerRef.value.getBoundingClientRect();

  // Hitung posisi (fixed relative to viewport)
  let top = rect.bottom + 4;
  const left = rect.left;

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

const toggleDropdown = (): void => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = "";
    updatePosition();
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
};

const getOptionLabel = (option: string | SelectOption): string => {
  if (typeof option === "string") return option;
  return props.optionLabel ? (option[props.optionLabel] as string) : (option.label as string);
};

const getOptionValue = (option: string | SelectOption): string | number => {
  if (typeof option === "string") return option;
  return props.optionValue ? (option[props.optionValue] as string | number) : (option.value as string | number);
};

const filteredOptions = computed((): (string | SelectOption)[] => {
  if (!searchQuery.value) return props.options;
  const query = searchQuery.value.toLowerCase();
  return props.options.filter((opt) =>
    getOptionLabel(opt).toLowerCase().includes(query),
  );
});

const selectedLabel = computed((): string | number | Record<string, unknown> | null => {
  const selected = props.options.find(
    (opt) => getOptionValue(opt) === props.modelValue,
  );
  return selected ? getOptionLabel(selected) : (props.modelValue ?? null);
});

const isSelected = (option: string | SelectOption): boolean => getOptionValue(option) === props.modelValue;

const selectOption = (option: string | SelectOption): void => {
  const value = getOptionValue(option);
  emit("update:modelValue", value);
  emit("change", option);
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent): void => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    // Juga cek apakah klik di dalam menu yang di-teleport
    if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
      isOpen.value = false;
    }
  }
};

const handleScroll = (): void => {
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
