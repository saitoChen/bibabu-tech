export interface CellData {
  value: string | number | null;
  bold: boolean;
  color?: string;
  fontFamily?: string;
  htmlContent?: string;
}

export interface SheetData {
  headers: CellData[];
  rows: CellData[][];
}
