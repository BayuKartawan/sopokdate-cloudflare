<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" />

        <!-- Modal -->
        <div
          class="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
          :style="{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-primary)',
          }"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b shrink-0"
            :style="{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
            }"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center"
                :class="
                  mode === 'create'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                "
              >
                <Plus v-if="mode === 'create'" class="w-5 h-5" />
                <Pencil v-else class="w-5 h-5" />
              </div>
              <h3
                class="text-lg font-semibold"
                :style="{ color: 'var(--text-primary)' }"
              >
                {{ title || (mode === "create" ? "Tambah Data" : "Edit Data") }}
              </h3>
            </div>
            <button
              @click="$emit('close')"
              class="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              :style="{ color: 'var(--text-secondary)' }"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5">
            <form
              @submit.prevent="handleSubmit"
              class="space-y-4"
              id="crud-form"
            >
              <div v-for="field in fields" :key="field.key">
                <label
                  :for="'field-' + field.key"
                  class="block text-sm font-medium mb-1.5"
                  :style="{ color: 'var(--text-primary)' }"
                >
                  {{ field.label }}
                  <span v-if="field.required" class="text-red-400 ml-0.5"
                    >*</span
                  >
                </label>

                <!-- Select -->
                <select
                  v-if="field.type === 'select'"
                  :id="'field-' + field.key"
                  v-model="formData[field.key]"
                  :disabled="field.disabled"
                  class="w-full h-10 px-3 rounded-lg border text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  :style="{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-input-alpha)',
                    color: 'var(--text-primary)',
                  }"
                >
                  <option
                    value=""
                    :style="{ backgroundColor: 'var(--bg-secondary)' }"
                  >
                    -- Pilih --
                  </option>
                  <option
                    v-for="opt in field.options"
                    :key="typeof opt === 'object' ? opt.value : opt"
                    :value="typeof opt === 'object' ? opt.value : opt"
                    :style="{ backgroundColor: 'var(--bg-secondary)' }"
                  >
                    {{ typeof opt === "object" ? opt.label : opt }}
                  </option>
                </select>

                <!-- Textarea -->
                <textarea
                  v-else-if="field.type === 'textarea'"
                  :id="'field-' + field.key"
                  v-model="formData[field.key]"
                  :disabled="field.disabled"
                  rows="3"
                  class="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  :style="{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-input-alpha)',
                    color: 'var(--text-primary)',
                  }"
                  :placeholder="field.placeholder || ''"
                />

                <!-- Input -->
                <input
                  v-else
                  :id="'field-' + field.key"
                  v-model="formData[field.key]"
                  :type="field.type || 'text'"
                  :disabled="field.disabled"
                  class="w-full h-10 px-3 rounded-lg border text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  :style="{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-input-alpha)',
                    color: 'var(--text-primary)',
                  }"
                  :placeholder="field.placeholder || ''"
                />
              </div>
            </form>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0"
            :style="{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
            }"
          >
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              :style="{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
              }"
            >
              Batal
            </button>
            <button
              type="submit"
              form="crud-form"
              :disabled="isSaving"
              class="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              :class="
                mode === 'create'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              "
            >
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
              {{
                isSaving
                  ? "Menyimpan..."
                  : mode === "create"
                    ? "Tambah"
                    : "Simpan"
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from "vue";
import { Plus, Pencil, X, Loader2 } from "lucide-vue-next";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: "create", // 'create' | 'edit'
  },
  title: {
    type: String,
    default: "",
  },
  fields: {
    type: Array,
    required: true,
    // Each item: { key, label, type?, placeholder?, required?, options? }
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit", "close", "change"]);

const formData = ref({});

// Initialize form data when modal opens or initialData changes
watch(
  () => [props.show, props.initialData],
  ([isVisible]) => {
    if (isVisible) {
      const data = {};
      for (const field of props.fields) {
        data[field.key] = props.initialData?.[field.key] ?? "";
      }
      formData.value = data;
    }
  },
  { immediate: true, deep: true },
);

// Watch for any form data changes and emit them to the parent
watch(
  formData,
  (newVal) => {
    emit("change", { ...newVal });
  },
  { deep: true },
);

const handleSubmit = () => {
  // Simple required validation
  for (const field of props.fields) {
    if (field.required && !formData.value[field.key]?.toString().trim()) {
      return;
    }
  }
  emit("submit", { ...formData.value });
};
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
