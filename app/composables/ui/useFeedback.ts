import { ref, shallowRef } from "vue";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "failure" | "warning" | "info" | "error";
  timeout: number;
}

// ============================================================================
// TOAST STATE & METHODS (from useToast.ts)
// ============================================================================
const toasts = ref<Toast[]>([]);
let nextId = 0;

function addToast(
  message: string,
  type: Toast["type"] = "info",
  timeout: number = 3500,
): void {
  const id = ++nextId;
  toasts.value.push({ id, message, type, timeout });
  // Auto-remove after timeout
  setTimeout(() => removeToast(id), timeout);
}

function removeToast(id: number): void {
  const idx = toasts.value.findIndex((t) => t.id === id);
  if (idx !== -1) toasts.value.splice(idx, 1);
}

export function useToast() {
  const Notify = {
    success: (msg: string, opts: { timeout?: number } = {}): void =>
      addToast(msg, "success", opts.timeout ?? 3500),
    failure: (msg: string, opts: { timeout?: number } = {}): void =>
      addToast(msg, "failure", opts.timeout ?? 4000),
    warning: (msg: string, opts: { timeout?: number } = {}): void =>
      addToast(msg, "warning", opts.timeout ?? 3500),
    info: (msg: string, opts: { timeout?: number } = {}): void =>
      addToast(msg, "info", opts.timeout ?? 3500),
  };
  return { toasts, remove: removeToast, Notify };
}

// ============================================================================
// LOADING STATE & METHODS (from useLoading.ts)
// ============================================================================
const isLoadingVisible = ref(false);
const loadingMessage = ref("");

function showLoading(msg: string = ""): void {
  loadingMessage.value = msg;
  isLoadingVisible.value = true;
}

function removeLoading(): void {
  isLoadingVisible.value = false;
  loadingMessage.value = "";
}

export function useLoading() {
  const Loading = {
    standard: showLoading,
    pulse: showLoading,
    circle: showLoading,
    hourglass: showLoading,
    arrows: showLoading,
    dots: showLoading,
    remove: removeLoading,
    change: (msg: string): void => {
      loadingMessage.value = msg;
    },
  };
  return { isVisible: isLoadingVisible, message: loadingMessage, Loading };
}

// ============================================================================
// CONFIRM STATE & METHODS (from useConfirm.ts)
// ============================================================================
const isConfirmVisible = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
const confirmOkText = ref("Ya");
const confirmCancelText = ref("Batal");
const onConfirmOk = shallowRef<(() => void) | null>(null);
const onConfirmCancel = shallowRef<(() => void) | null>(null);

function showConfirm(
  titleStr: string,
  msgStr: string,
  okStr?: string,
  cancelStr?: string,
  okCallback?: (() => void) | null,
  cancelCallback?: (() => void) | null,
): void {
  confirmTitle.value = titleStr;
  confirmMessage.value = msgStr;
  confirmOkText.value = okStr || "Ya";
  confirmCancelText.value = cancelStr || "Batal";
  onConfirmOk.value = okCallback || null;
  onConfirmCancel.value = cancelCallback || null;
  isConfirmVisible.value = true;
}

function triggerConfirmOk(): void {
  isConfirmVisible.value = false;
  onConfirmOk.value?.();
}

function triggerConfirmCancel(): void {
  isConfirmVisible.value = false;
  onConfirmCancel.value?.();
}

export function useConfirm() {
  const Confirm = {
    show: showConfirm,
  };
  return {
    isVisible: isConfirmVisible,
    title: confirmTitle,
    message: confirmMessage,
    okText: confirmOkText,
    cancelText: confirmCancelText,
    confirmOk: triggerConfirmOk,
    confirmCancel: triggerConfirmCancel,
    Confirm,
  };
}

// ============================================================================
// NOTIFLIX COMPATIBILITY BRIDGE (from useNotiflix.ts)
// ============================================================================
export function useNotiflix() {
  const { Notify } = useToast();
  const { Loading } = useLoading();
  const { Confirm } = useConfirm();
  return { Notify, Loading, Confirm };
}
