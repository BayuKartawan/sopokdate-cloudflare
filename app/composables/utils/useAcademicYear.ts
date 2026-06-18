import { computed } from "vue";

export function useAcademicYear() {
  const currentAcademicYear = computed((): string => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const startYear = currentMonth >= 7 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;

    return `${startYear}/${endYear}`;
  });

  const currentSemester = computed((): "Ganjil" | "Genap" => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    return currentMonth >= 7 ? "Ganjil" : "Genap";
  });

  return {
    currentAcademicYear,
    currentSemester,
  };
}
