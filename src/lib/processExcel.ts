import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { CellData, SheetData } from '@/types/excel';
import { processRowAlignment } from './utils';

function isCellEmpty(cell: CellData): boolean {
  return cell.value === null || cell.value === undefined || cell.value === '';
}

function isExcelDate(value: unknown): boolean {
  if (typeof value !== 'number') return false;
  return value >= 1 && value <= 73050;
}

function convertExcelDate(serial: number): string {
  try {
    const date = new Date(Date.UTC(1899, 11, 30 + serial));
    return format(date, 'yyyy/MM/dd');
  } catch {
    return String(serial);
  }
}

function isRedColor(rgb: number[] | undefined): boolean {
  if (!rgb || rgb.length < 3) return false;
  const [r, g, b] = rgb;
  const rRatio = r / 255;
  const gRatio = g / 255;
  const bRatio = b / 255;
  return rRatio > gRatio * 1.5 && rRatio > bRatio * 1.5;
}

export async function parseExcelFile(file: File): Promise<SheetData> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found');
  }

  const allCells: CellData[][] = [];
  let maxCols = 0;

  worksheet.eachRow((row, rowNumber) => {
    const rowCells: CellData[] = [];
    let currentCol = 1;

    row.eachCell((cell, colNumber) => {
      while (currentCol < colNumber) {
        rowCells.push({ value: null, bold: false });
        currentCol++;
      }

      let value: string | number | null = null;
      let bold = false;
      let color: string | undefined = undefined;
      let fontFamily: string | undefined = undefined;

      const excelCell = worksheet.getCell(rowNumber, colNumber);

      if (excelCell.value !== null && excelCell.value !== undefined) {
        if (excelCell.type === ExcelJS.ValueType.Date) {
          value = format(excelCell.value as Date, 'yyyy/MM/dd');
        } else if (excelCell.type === ExcelJS.ValueType.Number && isExcelDate(excelCell.value)) {
          value = convertExcelDate(excelCell.value as number);
        } else if (Array.isArray(excelCell.value)) {
          excelCell.value.forEach((part: { text?: string; font?: { bold?: boolean; color?: { argb?: string; rgb?: string; theme?: number; indexed?: number } } }) => {
            if (part.font) {
              if (part.font.bold) {
                bold = true;
              }
              if (part.font.color) {
                if (part.font.color.argb) {
                  const argb = part.font.color.argb;
                  const r = parseInt(argb.slice(2, 4), 16);
                  const g = parseInt(argb.slice(4, 6), 16);
                  const b = parseInt(argb.slice(6, 8), 16);
                  if (isRedColor([r, g, b])) {
                    color = 'red';
                  }
                } else if (part.font.color.rgb) {
                  const rgb = part.font.color.rgb;
                  const r = parseInt(rgb.slice(0, 2), 16);
                  const g = parseInt(rgb.slice(2, 4), 16);
                  const b = parseInt(rgb.slice(4, 6), 16);
                  if (isRedColor([r, g, b])) {
                    color = 'red';
                  }
                } else if (part.font.color.theme === 5) {
                  color = 'red';
                }
              }
            }
          });
          value = excelCell.value.map((p: { text?: string }) => p.text || '').join('');
        } else if (typeof excelCell.value === 'object') {
          if ('richText' in excelCell.value && Array.isArray((excelCell.value as { richText: unknown[] }).richText)) {
            const richTextData = (excelCell.value as { richText: { text?: string; font?: { bold?: boolean; color?: { argb?: string; rgb?: string; theme?: number; indexed?: number } } }[] }).richText;
            richTextData.forEach((part) => {
              if (part.font) {
                if (part.font.bold) {
                  bold = true;
                }
                if (part.font.color) {
                  if (part.font.color.argb) {
                    const argb = part.font.color.argb;
                    const r = parseInt(argb.slice(2, 4), 16);
                    const g = parseInt(argb.slice(4, 6), 16);
                    const b = parseInt(argb.slice(6, 8), 16);
                    if (isRedColor([r, g, b])) {
                      color = 'red';
                    }
                  } else if (part.font.color.rgb) {
                    const rgb = part.font.color.rgb;
                    const r = parseInt(rgb.slice(0, 2), 16);
                    const g = parseInt(rgb.slice(2, 4), 16);
                    const b = parseInt(rgb.slice(4, 6), 16);
                    if (isRedColor([r, g, b])) {
                      color = 'red';
                    }
                  } else if (part.font.color.theme === 5) {
                    color = 'red';
                  }
                }
              }
            });
            value = richTextData.map(p => p.text || '').join('');
          } else {
            value = JSON.stringify(excelCell.value);
          }
        } else {
          value = String(excelCell.value);
        }
      }

      const font = excelCell.font;

      if (font) {
        if (!bold && font.bold) {
          bold = true;
        }
        if (!color && font.color) {
          if (font.color.argb) {
            const argb = font.color.argb;
            const r = parseInt(argb.slice(2, 4), 16);
            const g = parseInt(argb.slice(4, 6), 16);
            const b = parseInt(argb.slice(6, 8), 16);
            if (isRedColor([r, g, b])) {
              color = 'red';
            }
          } else if (font.color.rgb) {
            const rgb = font.color.rgb;
            const r = parseInt(rgb.slice(0, 2), 16);
            const g = parseInt(rgb.slice(2, 4), 16);
            const b = parseInt(rgb.slice(4, 6), 16);
            if (isRedColor([r, g, b])) {
              color = 'red';
            }
          } else if (font.color.theme) {
            if (font.color.theme === 5) {
              color = 'red';
            }
          } else if (font.color.indexed) {
            const indexedColors = [
              'black', 'white', 'red', 'green', 'blue', 'yellow', 'magenta', 'cyan'
            ];
            if (font.color.indexed >= 2 && font.color.indexed <= 6) {
              color = indexedColors[font.color.indexed];
            }
          }
        }
        if (!fontFamily && font.name) {
          fontFamily = font.name;
        }
      }

      if (!color && excelCell.style && excelCell.style.font) {
        const styleFont = excelCell.style.font;
        if (styleFont.color) {
          if (styleFont.color.rgb) {
            const rgb = styleFont.color.rgb;
            const r = parseInt(rgb.slice(0, 2), 16);
            const g = parseInt(rgb.slice(2, 4), 16);
            const b = parseInt(rgb.slice(4, 6), 16);
            if (isRedColor([r, g, b])) {
              color = 'red';
            }
          } else if (styleFont.color.theme === 5) {
            color = 'red';
          }
        }
      }

      if (!color && workbook.theme) {
        const colorScheme = workbook.theme.colorScheme;
        if (colorScheme && colorScheme.accent1) {
          if (isRedColor([colorScheme.accent1.r, colorScheme.accent1.g, colorScheme.accent1.b])) {
            color = 'red';
          }
        }
      }

      if (!color && excelCell.style && excelCell.style.font) {
        const styleFont = excelCell.style.font;
        if (styleFont.color) {
          if (styleFont.color.rgb) {
            const rgb = styleFont.color.rgb;
            const r = parseInt(rgb.slice(0, 2), 16);
            const g = parseInt(rgb.slice(2, 4), 16);
            const b = parseInt(rgb.slice(4, 6), 16);
            if (isRedColor([r, g, b])) {
              color = 'red';
            }
          } else if (styleFont.color.theme === 5) {
            color = 'red';
          }
        }
      }

      rowCells.push({ value, bold, color, fontFamily });
      currentCol++;
    });

    if (rowCells.length > maxCols) {
      maxCols = rowCells.length;
    }
    allCells.push(rowCells);
  });

  for (let i = 0; i < allCells.length; i++) {
    while (allCells[i].length < maxCols) {
      allCells[i].push({ value: null, bold: false });
    }
  }

  return processSheetData({
    headers: allCells[0] || [],
    rows: allCells.slice(1)
  });
}

export function processSheetData(sheetData: SheetData): SheetData {
  let { headers, rows } = sheetData;

  rows = rows.filter(row => {
    return !row.every(cell => isCellEmpty(cell));
  });

  const nonEmptyColIndices: number[] = [];
  for (let col = 0; col < headers.length; col++) {
    const hasData = !isCellEmpty(headers[col]) ||
                    rows.some(row => !isCellEmpty(row[col]));
    if (hasData) {
      nonEmptyColIndices.push(col);
    }
  }

  headers = nonEmptyColIndices.map(col => headers[col]);
  rows = rows.map(row => nonEmptyColIndices.map(col => row[col]));

  if (headers.length > 1) {
    const colIndices = headers.map((_, i) => i);
    colIndices.sort((a, b) => {
      const dateA = String(headers[a]?.value || '');
      const dateB = String(headers[b]?.value || '');
      return dateB.localeCompare(dateA);
    });

    headers = colIndices.map(i => headers[i]);
    rows = rows.map(row => colIndices.map(i => row[i]));
  }

  rows = processRowAlignment(rows, 7);

  return { headers, rows };
}
