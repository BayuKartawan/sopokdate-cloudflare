<template>
  <div class="theme-bg">
    <NuxtLoadingIndicator
      :height="3"
      color="linear-gradient(to right, #34d399 0%, #059669 100%)"
      :throttle="100"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Scroll To Top (Inlined) -->
    <button
      v-show="isScrollVisible"
      @click="scrollToTop"
      class="fixed bottom-20 right-6 z-50 p-2 rounded-full shadow-lg transition-all duration-200 border lg:bottom-6"
      :style="{
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-secondary)',
      }"
    >
      <ArrowUp class="w-5 h-5" />
    </button>

    <!-- Toast Notification (Inlined) -->
    <Teleport to="body">
      <div class="toast-container" aria-live="polite" aria-atomic="false">
        <TransitionGroup name="toast" tag="div" class="toast-wrapper">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            :class="['toast', `toast--${toast.type}`]"
            role="alert"
          >
            <div class="flex-shrink-0 mr-3">
              <CheckCircle
                v-if="toast.type === 'success'"
                class="w-6 h-6 text-emerald-400"
              />
              <CircleX
                v-else-if="toast.type === 'failure' || toast.type === 'error'"
                class="w-6 h-6 text-red-400"
              />
              <TriangleAlert
                v-else-if="toast.type === 'warning'"
                class="w-6 h-6 text-amber-400"
              />
              <Info v-else class="w-6 h-6 text-blue-400" />
            </div>
            <p class="toast__message">{{ toast.message }}</p>
            <button
              class="toast__close"
              @click="removeToast(toast.id)"
              aria-label="Tutup"
            >
              <X class="w-5 h-5" />
            </button>
            <div
              class="toast__progress"
              :style="{ animationDuration: `${toast.timeout}ms` }"
            ></div>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>

    <!-- Confirm Dialog (Inlined) -->
    <Teleport to="body">
      <Transition name="confirm">
        <div
          v-if="isConfirmVisible"
          class="confirm-overlay"
          @click.self="confirmCancel"
        >
          <div
            class="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <div
              class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 bg-amber-500/20"
            >
              <TriangleAlert
                class="text-amber-400 h-6 w-6"
                aria-hidden="true"
              />
            </div>
            <h2 id="confirm-dialog-title" class="confirm-title">
              {{ confirmTitle }}
            </h2>
            <p class="confirm-message">{{ confirmMessage }}</p>
            <div class="confirm-actions">
              <button
                class="confirm-btn confirm-btn--cancel"
                @click="confirmCancel"
              >
                {{ confirmCancelText }}
              </button>
              <button class="confirm-btn confirm-btn--ok" @click="confirmOk">
                {{ confirmOkText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Loading Overlay (Inlined) -->
    <Teleport to="body">
      <Transition name="loading">
        <div v-if="isLoadingVisible" class="loading-overlay">
          <div class="loading-box">
            <Loader2
              class="w-12 h-12 text-emerald-500 animate-spin mb-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
            <p v-if="loadingMessage" class="loading-message">
              {{ loadingMessage }}
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import {
  ArrowUp,
  CheckCircle,
  CircleX,
  TriangleAlert,
  Info,
  X,
  Loader2,
} from "lucide-vue-next";
import { useToast, useConfirm, useLoading } from "~/composables/ui/useFeedback";

const { toasts, remove: removeToast } = useToast();
const {
  isVisible: isConfirmVisible,
  title: confirmTitle,
  message: confirmMessage,
  okText: confirmOkText,
  cancelText: confirmCancelText,
  confirmOk,
  confirmCancel,
} = useConfirm();
const { isVisible: isLoadingVisible, message: loadingMessage } = useLoading();

const isScrollVisible = ref(false);
const handleScroll = () => {
  isScrollVisible.value = window.scrollY > 200;
};
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
/* Confirm Dialog Styles */
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shadow-overlay);
  padding: 1rem;
}
.confirm-dialog {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 2rem 1.75rem 1.5rem;
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-shadow: 0 24px 60px var(--shadow-dialog);
}
.confirm-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0.5rem 0;
}
.confirm-message {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem;
  line-height: 1.5;
}
.confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}
.confirm-btn {
  flex: 1;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 160px;
}
.confirm-btn--cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
.confirm-btn--cancel:hover {
  background: var(--border-secondary);
  color: var(--text-primary);
}
.confirm-btn--ok {
  background: #dc2626;
  color: #fff;
}
.confirm-btn--ok:hover {
  background: #b91c1c;
}
.confirm-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.confirm-leave-active {
  transition: all 0.18s ease-in;
}
.confirm-enter-from {
  opacity: 0;
  transform: scale(0.88);
}
.confirm-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

/* Toast Notification Styles */
.toast-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  pointer-events: none;
  max-width: 360px;
  width: calc(100vw - 2rem);
}
.toast-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  border: 1px solid transparent;
  pointer-events: all;
  overflow: hidden;
  box-shadow:
    0 10px 25px -5px var(--shadow-card),
    0 8px 16px -6px var(--shadow-card);
}
.toast--success {
  background: #064e3b;
  border-color: #10b981;
  color: #ecfdf5;
}
.toast--failure {
  background: #7f1d1d;
  border-color: #ef4444;
  color: #fef2f2;
}
.toast--warning {
  background: #78350f;
  border-color: #f59e0b;
  color: #fffbeb;
}
.toast--info {
  background: #1e3a8a;
  border-color: #3b82f6;
  color: #eff6ff;
}
.toast__message {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.4;
  font-weight: 500;
  margin: 0;
}
.toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s;
  padding: 0;
  color: inherit;
  margin-top: -2px;
}
.toast__close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.12);
}
.toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.35;
  border-radius: 0 0 12px 12px;
  animation: progress-shrink linear forwards;
  transform-origin: left;
}
@keyframes progress-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
.toast-enter-active {
  transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40%) scale(0.95);
}
.toast-move {
  transition: transform 0.25s ease;
}

/* Loading Overlay Styles */
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shadow-overlay);
}
.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem 2.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  box-shadow: 0 24px 60px var(--shadow-dialog);
}
.loading-message {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  margin: 0;
}
.loading-enter-active,
.loading-leave-active {
  transition: opacity 0.22s ease;
}
.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}
</style>
