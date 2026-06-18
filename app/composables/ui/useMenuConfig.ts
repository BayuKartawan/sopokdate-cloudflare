import { ref, markRaw, computed } from "vue";
import {
  Building2,
  FileText,
  Home,
  Users,
  Banknote,
  GraduationCap,
  CalendarCheck,
} from "lucide-vue-next";

export interface MenuItemChild {
  to: string;
  label: string;
  roles: string[];
}

export interface MenuItem {
  to?: string;
  label: string;
  icon?: any;
  roles: string[];
  children?: MenuItemChild[];
}

export const useMenuConfig = () => {
  const allMenuItems = ref<MenuItem[]>([
    {
      to: "/",
      label: "Beranda",
      icon: markRaw(Home),
      roles: ["admin", "guru"],
    },
    {
      label: "Akun",
      icon: markRaw(Users),
      roles: ["admin", "guru"],
      children: [
        { to: "/akun/gtk/kelola", label: "Akun Sopokdate", roles: ["admin"] },
        { to: "/akun/gtk/emis", label: "EMIS 4.0", roles: ["admin", "guru"] },
        { to: "/akun/gtk/email", label: "Email Madrasah", roles: ["admin", "guru"] },
        { to: "/akun/gtk/rdm", label: "RDM", roles: ["admin", "guru"] },
        { to: "/akun/gtk/emis-gtk", label: "EMIS GTK", roles: ["admin", "guru"] },
        { to: "/akun/gtk/simpatika", label: "SIMPATIKA", roles: ["admin", "guru"] },
        { to: "/akun/madrasah", label: "Akun Madrasah", roles: ["admin"] },
      ],
    },
    {
      label: "Akademik",
      icon: markRaw(GraduationCap),
      roles: ["admin", "guru"],
      children: [
        { to: "/akademik/siswa", label: "Siswa", roles: ["admin", "guru"] },
        { to: "/akademik/gtk", label: "Guru Tendik", roles: ["admin"] },
        {
          to: "/akademik/kelas",
          label: "Rombel",
          roles: ["admin", "guru"],
        },
      ],
    },
    {
      label: "Absensi",
      icon: markRaw(CalendarCheck),
      roles: ["admin", "guru"],
      children: [
        { to: "/absensi/siswa", label: "Absensi Siswa", roles: ["admin", "guru"] },
        { to: "/absensi/rekap", label: "Rekap Absensi", roles: ["admin", "guru"] },
        { to: "/absensi/kalender", label: "Kalender Pendidikan", roles: ["admin", "guru"] },
      ],
    },
    {
      label: "Madrasah",
      icon: markRaw(Building2),
      roles: ["admin", "guru"],
      children: [
        {
          to: "/madrasah/data",
          label: "Data Madrasah",
          roles: ["admin", "guru"],
        },
        {
          to: "/madrasah/berkas",
          label: "Berkas Madrasah",
          roles: ["admin", "guru"],
        },
        {
          to: "/madrasah/aplikasi",
          label: "Aplikasi Madrasah",
          roles: ["admin", "guru"],
        },
      ],
    },
    {
      label: "Buat Dokumen",
      icon: markRaw(FileText),
      roles: ["admin", "guru"],
      children: [
        { to: "/dokumen/surat", label: "Surat", roles: ["admin", "guru"] },
        {
          to: "/dokumen/sertifikat",
          label: "Sertifikat",
          roles: ["admin", "guru"],
        },
        { to: "/dokumen/sampul", label: "Sampul", roles: ["admin", "guru"] },
        {
          to: "/dokumen/daftar-siswa",
          label: "Daftar Siswa",
          roles: ["admin", "guru"],
        },
        {
          to: "/dokumen/pas-foto",
          label: "Cetak Pas Foto",
          roles: ["admin", "guru"],
        },
      ],
    },
    {
      label: "Keuangan BOS",
      icon: markRaw(Banknote),
      roles: ["admin"],
      children: [
        {
          to: "/bos/penerimaan-honor",
          label: "Penerimaan Honor",
          roles: ["admin"],
        },
        { to: "/bos/kuitansi", label: "Kuitansi", roles: ["admin"] },
        { to: "/bos/nota", label: "Nota", roles: ["admin"] },
      ],
    },
  ]);

  const getCurrentUserRole = (): string | null => {
    return localStorage.getItem("user-role");
  };

  const filterMenuByRole = (userRole: string | null): MenuItem[] => {
    if (!userRole) return [];

    return allMenuItems.value
      .filter((item) => {
        if (!item.roles || !item.roles.includes(userRole)) {
          return false;
        }

        if (item.children) {
          const filteredChildren = item.children.filter(
            (child) => child.roles && child.roles.includes(userRole),
          );

          if (filteredChildren.length > 0) {
            return true;
          }

          return false;
        }

        return true;
      })
      .map((item) => {
        const clonedItem = { ...item };

        if (clonedItem.children) {
          clonedItem.children = clonedItem.children.filter(
            (child) => child.roles && child.roles.includes(userRole),
          );
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

  const updateMenuItem = (label: string, updatedItem: Partial<MenuItem>): void => {
    const index = allMenuItems.value.findIndex((item) => item.label === label);
    if (index > -1) {
      allMenuItems.value[index] = {
        ...allMenuItems.value[index],
        ...updatedItem,
      };
    }
  };

  const addChildToMenuItem = (parentLabel: string, childItem: MenuItemChild): void => {
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

  return {
    menuItems,
    allMenuItems,
    getCurrentUserRole,
    filterMenuByRole,
    getMenuItemsWithChildren,
    getAllMenuLabels,
    getDropdownMenuLabels,
    addMenuItem,
    removeMenuItem,
    updateMenuItem,
    addChildToMenuItem,
  };
};
