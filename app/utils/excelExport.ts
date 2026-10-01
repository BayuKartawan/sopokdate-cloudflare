import * as XLSX from "xlsx";

export interface ExcelExportColumn {
  wch: number;
}

export interface ExcelExportOptions<T = Record<string, any>> {
  data: T[];
  sheetName: string;
  filename: string;
  cols?: ExcelExportColumn[];
  headerKeys?: string[];
  headerBgColor?: string;
  headerTextColor?: string;
}

export function exportStyledExcel<T = Record<string, any>>({
  data,
  sheetName,
  filename,
  cols,
  headerKeys,
  headerBgColor = "059669",
  headerTextColor = "FFFFFF",
}: ExcelExportOptions<T>): void {
  if (!data || data.length === 0) return;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  if (cols && cols.length > 0) {
    ws["!cols"] = cols;
  }

  const keysToStyle =
    headerKeys && headerKeys.length > 0
      ? headerKeys
      : Object.keys(data[0] || {}).map((_, i) => String.fromCharCode(65 + i) + "1");

  keysToStyle.forEach((cellKey) => {
    if (ws[cellKey]) {
      (ws[cellKey] as any).s = {
        font: { bold: true, color: { rgb: headerTextColor } },
        fill: { fgColor: { rgb: headerBgColor } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
