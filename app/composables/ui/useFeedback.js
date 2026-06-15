import { ref, shallowRef } from "vue";

// ============================================================================
// TOAST STATE & METHODS (from useToast.js)
// ============================================================================
const toasts = ref([]);
let nextId = 0;

function addToast(message, type = "info", timeout = 3500) {
  const id = ++nextId;
  toasts.value.push({ id, message, type, timeout });
  // Auto-remove after timeout
  setTimeout(() => removeToast(id), timeout);
}

function removeToast(id) {
  const idx = toasts.value.findIndex((t) => t.id === id);
  if (idx !== -1) toasts.value.splice(idx, 1);
}

export function useToast() {
  const Notify = {
    success: (msg, opts = {}) => addToast(msg, "success", opts.timeout ?? 3500),
    failure: (msg, opts = {}) => addToast(msg, "failure", opts.timeout ?? 4000),
    warning: (msg, opts = {}) => addToast(msg, "warning", opts.timeout ?? 3500),
    info: (msg, opts = {}) => addToast(msg, "info", opts.timeout ?? 3500),
  };
  return { toasts, remove: removeToast, Notify };
}

// ============================================================================
// LOADING STATE & METHODS (from useLoading.js)
// ============================================================================
const isLoadingVisible = ref(false);
const loadingMessage = ref("");

function showLoading(msg = "") {
  loadingMessage.value = msg;
  isLoadingVisible.value = true;
}

function removeLoading() {
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
    change: (msg) => {
      loadingMessage.value = msg;
    },
  };
  return { isVisible: isLoadingVisible, message: loadingMessage, Loading };
}

// ============================================================================
// CONFIRM STATE & METHODS (from useConfirm.js)
// ============================================================================
const isConfirmVisible = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
const confirmOkText = ref("Ya");
const confirmCancelText = ref("Batal");
const onConfirmOk = shallowRef(null);
const onConfirmCancel = shallowRef(null);

function showConfirm(
  titleStr,
  msgStr,
  okStr,
  cancelStr,
  okCallback,
  cancelCallback,
) {
  confirmTitle.value = titleStr;
  confirmMessage.value = msgStr;
  confirmOkText.value = okStr || "Ya";
  confirmCancelText.value = cancelStr || "Batal";
  onConfirmOk.value = okCallback || null;
  onConfirmCancel.value = cancelCallback || null;
  isConfirmVisible.value = true;
}

function triggerConfirmOk() {
  isConfirmVisible.value = false;
  onConfirmOk.value?.();
}

function triggerConfirmCancel() {
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
// NOTIFLIX COMPATIBILITY BRIDGE (from useNotiflix.js)
// ============================================================================
export function useNotiflix() {
  const { Notify } = useToast();
  const { Loading } = useLoading();
  const { Confirm } = useConfirm();
  return { Notify, Loading, Confirm };
}
