import { ref, markRaw, computed } from "vue";
import {
  Building2,
  FileText,
  Home,
  Users,
  Banknote,
  GraduationCap,
  CalendarCheck,
  Calendar,
  ClipboardCheck,
} from "lucide-vue-next";

export interface MenuItemChild {
  to: string;
  label: string;
  roles: string[];
  icon?: any;
}

export interface MenuItem {
  to?: string;
  label: string;
  icon?: any;
  roles: string[];
  children?: MenuItemChild[];
}

// Shared state for allowed menus to ensure reactivity across components
const allowedMenusState = ref<string[] | null>(null);

export const useMenuConfig = () => {
  const allMenuItems = ref<MenuItem[]>([
    {
      to: "/",
      label: "Beranda",
      icon: markRaw(Home),
      roles: ["admin", "guru", "kepala_madrasah"],
    },
    {
      label: "Akun",
      icon: markRaw(Users),
      roles: ["admin", "guru", "kepala_madrasah"],
      children: [
        { to: "/akun/gtk/kelola", label: "Akun Sopokdate", roles: ["admin"] },
        { to: "/akun/gtk/emis", label: "EMIS 4.0", roles: ["admin", "guru", "kepala_madrasah"] },
        {
          to: "/akun/gtk/email",
          label: "Email Madrasah",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        { to: "/akun/gtk/rdm", label: "RDM", roles: ["admin", "guru", "kepala_madrasah"] },
        {
          to: "/akun/gtk/emis-gtk",
          label: "EMIS GTK",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        {
          to: "/akun/gtk/simpatika",
          label: "SIMPATIKA",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        { to: "/akun/madrasah", label: "Akun Madrasah", roles: ["admin"] },
        { to: "/akun/gtk/pengelola-akses", label: "Pengelola Akses", roles: ["admin"] },
      ],
    },
    {
      label: "Akademik",
      icon: markRaw(GraduationCap),
      roles: ["admin", "guru", "kepala_madrasah"],
      children: [
        { to: "/akademik/gtk", label: "Guru Tendik", roles: ["admin", "kepala_madrasah"] },
        { to: "/akademik/siswa", label: "Siswa", roles: ["admin", "guru", "kepala_madrasah"] },
        {
          to: "/akademik/rombel",
          label: "Rombel",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        {
          to: "/akademik/alumni",
          label: "Alumni",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        {
          to: "/akademik/mutasi",
          label: "Mutasi",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
      ],
    },
    {
      label: "Jadwal",
      icon: markRaw(Calendar),
      roles: ["admin", "guru", "kepala_madrasah"],
      children: [
        {
          to: "/jadwal/kurikulum",
          label: "Kurikulum",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        {
          to: "/jadwal/alokasi",
          label: "Alokasi Jam",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        { to: "/jadwal/buat", label: "Buat Jadwal", roles: ["admin", "guru", "kepala_madrasah"] },
        {
          to: "/jadwal/cetak",
          label: "Cetak Jadwal",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
      ],
    },
    {
      label: "Absensi",
      icon: markRaw(CalendarCheck),
      roles: ["admin", "guru", "kepala_madrasah"],
      children: [
        {
          to: "/absensi/kalender",
          label: "Kalender Pendidikan",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        {
          to: "/absensi/siswa",
          label: "Absensi Siswa",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        {
          to: "/absensi/rekap",
          label: "Rekap Absensi",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        {
          to: "/absensi/asesmen",
          label: "Asesmen",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
      ],
    },
    {
      label: "EDM",
      icon: markRaw(ClipboardCheck),
      roles: ["admin", "guru", "kepala_madrasah"],
      children: [
        { to: "/edm/pengaturan", label: "Pengaturan", roles: ["admin"] },
        { to: "/edm/isi", label: "Pengisian EDM", roles: ["admin", "guru", "kepala_madrasah"] },
        { to: "/edm/rekap", label: "Rekap Pengisian", roles: ["admin", "guru", "kepala_madrasah"] },
      ],
    },
    {
      label: "Madrasah",
      icon: markRaw(Building2),
      roles: ["admin", "guru", "kepala_madrasah"],
      children: [
        {
          to: "/madrasah/data",
          label: "Data Madrasah",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        {
          to: "/madrasah/berkas",
          label: "Berkas Madrasah",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        {
          to: "/madrasah/aplikasi",
          label: "Aplikasi Madrasah",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
      ],
    },
    {
      label: "Buat Dokumen",
      icon: markRaw(FileText),
      roles: ["admin", "guru", "kepala_madrasah"],
      children: [
        { to: "/dokumen/surat", label: "Surat", roles: ["admin", "guru", "kepala_madrasah"] },
        {
          to: "/dokumen/sertifikat",
          label: "Sertifikat",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        { to: "/dokumen/sampul", label: "Sampul", roles: ["admin", "guru", "kepala_madrasah"] },
        {
          to: "/dokumen/daftar-siswa",
          label: "Daftar Siswa",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
        {
          to: "/dokumen/pas-foto",
          label: "Cetak Pas Foto",
          roles: ["admin", "guru", "kepala_madrasah"],
        },
      ],
    },
    {
      label: "Keuangan BOS",
      icon: markRaw(Banknote),
      roles: ["admin", "kepala_madrasah"],
      children: [
        {
          to: "/bos/penerimaan-honor",
          label: "Penerimaan Honor",
          roles: ["admin", "kepala_madrasah"],
        },
        { to: "/bos/kuitansi", label: "Kuitansi", roles: ["admin", "kepala_madrasah"] },
        { to: "/bos/nota", label: "Nota", roles: ["admin", "kepala_madrasah"] },
      ],
    },
  ]);

  const getCurrentUserRole = (): string | null => {
    return localStorage.getItem("user-role");
  };

  const getMyAllowedMenus = (): string[] | null => {
    if (allowedMenusState.value !== null) {
      return allowedMenusState.value;
    }
    try {
      const allowed = localStorage.getItem("user-menu-akses");
      if (allowed) {
        allowedMenusState.value = JSON.parse(allowed);
        return allowedMenusState.value;
      }
      return null;
    } catch {
      return null;
    }
  };

  const setAllowedMenus = (menus: string[] | null) => {
    allowedMenusState.value = menus;
    if (menus) {
      localStorage.setItem("user-menu-akses", JSON.stringify(menus));
    } else {
      localStorage.removeItem("user-menu-akses");
    }
  };

  const filterMenuByRole = (userRole: string | null): MenuItem[] => {
    if (!userRole) return [];

    const allowedMenus = getMyAllowedMenus();

    // Helper: menu is admin-only if its roles array is exactly ["admin"]
    const isAdminOnly = (roles: string[]) => roles.length === 1 && roles[0] === "admin";

    return allMenuItems.value
      .filter((item) => {
        // Jika ada data menu akses dari DB di localStorage dan bukan admin
        if (userRole !== "admin" && allowedMenus) {
          // Selalu sembunyikan item yang hanya untuk admin
          if (item.roles && isAdminOnly(item.roles)) return false;

          if (item.to) {
            return allowedMenus.includes(item.to);
          }
          if (item.children) {
            return item.children.some((child) => {
              if (child.roles && isAdminOnly(child.roles)) return false;
              return allowedMenus.includes(child.to);
            });
          }
          return false;
        }

        // Fallback ke check role statis
        if (!item.roles || !item.roles.includes(userRole)) {
          return false;
        }

        if (item.children) {
          const filteredChildren = item.children.filter(
            (child) => child.roles && child.roles.includes(userRole),
          );
          return filteredChildren.length > 0;
        }

        return true;
      })
      .map((item) => {
        const clonedItem = { ...item };

        if (clonedItem.children) {
          if (userRole !== "admin" && allowedMenus) {
            clonedItem.children = clonedItem.children.filter(
              (child) => {
                if (child.roles && isAdminOnly(child.roles)) return false;
                return allowedMenus.includes(child.to);
              }
            );
          } else {
            clonedItem.children = clonedItem.children.filter(
              (child) => child.roles && child.roles.includes(userRole),
            );
          }
        }

        return clonedItem;
      });
  };

  const menuItems = computed((): MenuItem[] => {
    const userRole = getCurrentUserRole();
    return filterMenuByRole(userRole);
  });

  const getMenuItemsWithChildren = (): MenuItem[] => {
    return menuItems.value.filter((item) => item.children);
  };

  const getAllMenuLabels = (): string[] => {
    return menuItems.value.map((item) => item.label);
  };

  const getDropdownMenuLabels = (): string[] => {
    return getMenuItemsWithChildren().map((item) => item.label);
  };

  const addMenuItem = (newItem: MenuItem): void => {
    if (!newItem.roles) {
      newItem.roles = ["admin"];
    }
    allMenuItems.value.push(newItem);
  };

  const removeMenuItem = (label: string): void => {
    const index = allMenuItems.value.findIndex((item) => item.label === label);
    if (index > -1) {
      allMenuItems.value.splice(index, 1);
    }
  };

  const updateMenuItem = (
    label: string,
    updatedItem: Partial<MenuItem>,
  ): void => {
    const index = allMenuItems.value.findIndex((item) => item.label === label);
    if (index > -1) {
      allMenuItems.value[index] = {
        ...allMenuItems.value[index],
        ...updatedItem,
      };
    }
  };

  const addChildToMenuItem = (
    parentLabel: string,
    childItem: MenuItemChild,
  ): void => {
    const parentIndex = allMenuItems.value.findIndex(
      (item) => item.label === parentLabel,
    );
    if (parentIndex > -1) {
      if (!allMenuItems.value[parentIndex].children) {
        allMenuItems.value[parentIndex].children = [];
      }
      if (!childItem.roles) {
        childItem.roles = ["admin"];
      }
      allMenuItems.value[parentIndex].children!.push(childItem);
    }
  };

  // Helper untuk mengambil seluruh menu key (to) secara flat
  // Jika role diberikan, exclude menu yang hanya untuk admin (roles = ["admin"])
  // Menu seperti BOS (roles: ["admin", "kepala_madrasah"]) tetap muncul agar bisa dikonfigurasi
  const getAllMenuKeysFlat = (role?: string | null): Array<{ to: string; label: string; group: string }> => {
    // Helper: menu is admin-only if its roles array is exactly ["admin"]
    const isAdminOnly = (roles: string[]) => roles.length === 1 && roles[0] === "admin";

    const flat: Array<{ to: string; label: string; group: string }> = [];
    allMenuItems.value.forEach((item) => {
      if (role && item.roles && isAdminOnly(item.roles)) {
        return;
      }
      if (item.to) {
        flat.push({ to: item.to, label: item.label, group: "General" });
      }
      if (item.children) {
        item.children.forEach((child) => {
          if (role && child.roles && isAdminOnly(child.roles)) {
            return;
          }
          flat.push({ to: child.to, label: child.label, group: item.label });
        });
      }
    });
    return flat;
  };

  // Helper untuk mengecek apakah user memiliki akses ke path rute tertentu
  // Mendukung sub-path: /akademik/siswa/tambah cocok dengan /akademik/siswa
  const hasRouteAccess = (toPath: string, userRole: string | null): boolean => {
    if (!userRole) return false;
    if (userRole === "admin") return true;

    const allowedMenus = getMyAllowedMenus();
    if (allowedMenus) {
      return allowedMenus.some(
        (allowedPath) =>
          toPath === allowedPath || toPath.startsWith(allowedPath + "/"),
      );
    }

    // Fallback static check
    let found = false;
    allMenuItems.value.forEach((item) => {
      if (item.to && (toPath === item.to || toPath.startsWith(item.to + "/"))) {
        if (item.roles.includes(userRole)) found = true;
      }
      if (item.children) {
        item.children.forEach((child) => {
          if (toPath === child.to || toPath.startsWith(child.to + "/")) {
            if (child.roles.includes(userRole)) found = true;
          }
        });
      }
    });
    return found;
  };

  return {
    menuItems,
    allMenuItems,
    getCurrentUserRole,
    getMyAllowedMenus,
    setAllowedMenus,
    filterMenuByRole,
    getMenuItemsWithChildren,
    getAllMenuLabels,
    getDropdownMenuLabels,
    addMenuItem,
    removeMenuItem,
    updateMenuItem,
    addChildToMenuItem,
    getAllMenuKeysFlat,
    hasRouteAccess,
  };
};
