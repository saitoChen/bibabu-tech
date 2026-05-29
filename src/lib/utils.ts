import { CellData } from '@/types/excel';

export function isCellEmpty(cell: CellData | undefined): boolean {
  if (!cell) return true;
  return cell.value === null || cell.value === undefined || cell.value === '';
}

export function processRowAlignment(rows: CellData[][], recentDays: number = 7): CellData[][] {
  if (rows.length === 0) return rows;
  
  const colsToCheck = Math.min(recentDays, rows[0]?.length || 0);
  
  const rowsWithFirstColData: CellData[][] = [];
  const rowsWithRecentData: CellData[][] = [];
  const rowsEmpty: CellData[][] = [];
  
  rows.forEach(row => {
    const firstColHasData = !isCellEmpty(row[0]);
    let hasRecentContent = false;
    
    for (let col = 0; col < colsToCheck; col++) {
      if (!isCellEmpty(row[col])) {
        hasRecentContent = true;
        break;
      }
    }
    
    if (firstColHasData) {
      rowsWithFirstColData.push(row);
    } else if (hasRecentContent) {
      rowsWithRecentData.push(row);
    } else {
      rowsEmpty.push(row);
    }
  });
  
  return [...rowsWithFirstColData, ...rowsWithRecentData, ...rowsEmpty];
}
