import { ref, markRaw, computed } from "vue";
import {
  Building2,
  FileText,
  Home,
  Users,
  Banknote,
  GraduationCap,
  KeyRound,
} from "lucide-vue-next";

export const useMenuConfig = () => {
  const allMenuItems = ref([
    {
      to: "/",
      label: "Beranda",
      icon: markRaw(Home),
      roles: ["admin", "guru"],
    },
    {
      label: "Akun",
      icon: markRaw(Users),
      roles: ["admin"],
      children: [
        { to: "/akun/gtk/kelola", label: "Kelola Akun Guru", icon: markRaw(KeyRound), roles: ["admin"] },
        { to: "/akun/gtk/emis", label: "EMIS 4.0", roles: ["admin"] },
        { to: "/akun/gtk/email", label: "Email Madrasah", roles: ["admin"] },
        { to: "/akun/gtk/rdm", label: "RDM", roles: ["admin"] },
        { to: "/akun/gtk/emis-gtk", label: "EMIS GTK", roles: ["admin"] },
        { to: "/akun/gtk/simpatika", label: "SIMPATIKA", roles: ["admin"] },
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

  const getCurrentUserRole = () => {
    return localStorage.getItem("user-role");
  };

  const filterMenuByRole = (userRole) => {
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

  const menuItems = computed(() => {
    const userRole = getCurrentUserRole();
    return filterMenuByRole(userRole);
  });

  const getMenuItemsWithChildren = () => {
    return menuItems.value.filter((item) => item.children);
  };

  const getAllMenuLabels = () => {
    return menuItems.value.map((item) => item.label);
  };

  const getDropdownMenuLabels = () => {
    return getMenuItemsWithChildren().map((item) => item.label);
  };

  const addMenuItem = (newItem) => {
    if (!newItem.roles) {
      newItem.roles = ["admin"];
    }
    allMenuItems.value.push(newItem);
  };

  const removeMenuItem = (label) => {
    const index = allMenuItems.value.findIndex((item) => item.label === label);
    if (index > -1) {
      allMenuItems.value.splice(index, 1);
    }
  };

  const updateMenuItem = (label, updatedItem) => {
    const index = allMenuItems.value.findIndex((item) => item.label === label);
    if (index > -1) {
      allMenuItems.value[index] = {
        ...allMenuItems.value[index],
        ...updatedItem,
      };
    }
  };

  const addChildToMenuItem = (parentLabel, childItem) => {
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
      allMenuItems.value[parentIndex].children.push(childItem);
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
