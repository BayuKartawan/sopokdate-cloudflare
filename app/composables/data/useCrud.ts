import { ref, computed } from "vue";
import { postToApi, putToApi, deleteFromApi } from "~/utils/api";
import { useNotiflix } from "~/composables/ui/useFeedback";

/**
 * Composable untuk operasi CRUD pada tabel database.
 * Menyediakan fungsi create, update, delete dengan state management.
 *
 * @param {string} tableName - Nama tabel (PascalCase sesuai TABLE_MAP, e.g. "DataGtk")
 * @param {Function} onSuccess - Callback setelah operasi berhasil (biasanya refresh data)
 */
export function useCrud(tableName: string, onSuccess?: () => void) {
  const { Notify, Confirm } = useNotiflix();

  const isSaving = ref(false);
  const isDeleting = ref(false);

  const isAdmin = computed(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("user-role") === "admin";
  });

  /**
   * Buat data baru
   */
  const createItem = async (data: any): Promise<boolean> => {
    isSaving.value = true;
    try {
      await postToApi(tableName, data);
      Notify?.success?.("Data berhasil ditambahkan");
      onSuccess?.();
      return true;
    } catch (err: any) {
      console.error("Gagal menambahkan data:", err);
      Notify?.failure?.(err.message || "Gagal menambahkan data");
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * Update data berdasarkan ID
   */
  const updateItem = async (
    id: string | number,
    data: any,
  ): Promise<boolean> => {
    isSaving.value = true;
    try {
      await putToApi(tableName, id, data);
      Notify?.success?.("Data berhasil diperbarui");
      onSuccess?.();
      return true;
    } catch (err: any) {
      console.error("Gagal memperbarui data:", err);
      Notify?.failure?.(err.message || "Gagal memperbarui data");
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * Hapus data berdasarkan ID (dengan konfirmasi)
   */
  const deleteItem = (
    id: string | number,
    itemLabel: string = "data ini",
  ): void => {
    Confirm?.show(
      "Hapus Data",
      `Apakah Anda yakin ingin menghapus ${itemLabel}? Tindakan ini tidak dapat dibatalkan.`,
      "Ya, Hapus",
      "Batal",
      async () => {
        isDeleting.value = true;
        try {
          await deleteFromApi(tableName, id);
          Notify?.success?.("Data berhasil dihapus");
          onSuccess?.();
        } catch (err: any) {
          console.error("Gagal menghapus data:", err);
          Notify?.failure?.(err.message || "Gagal menghapus data");
        } finally {
          isDeleting.value = false;
        }
      },
      () => {},
    );
  };

  return {
    isSaving,
    isDeleting,
    isAdmin,
    createItem,
    updateItem,
    deleteItem,
  };
}
