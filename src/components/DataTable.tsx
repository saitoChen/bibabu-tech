'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
import { CellData, SheetData } from '@/types/excel';

interface DataTableProps {
  data: SheetData;
}

export interface DataTableRef {
  scrollToDate: (dateStr: string) => boolean;
}

function getCellStyle(cell: CellData): {
  fontWeight: string;
  color?: string;
  fontFamily?: string;
  whiteSpace?: string;
} {
  const style: { fontWeight: string; color?: string; fontFamily?: string; whiteSpace?: string } = {
    fontWeight: cell.bold ? 'bold' : 'normal',
    whiteSpace: 'pre-wrap'
  };

  if (cell.color === 'red') {
    style.color = 'rgb(239 68 68)';
  }

  if (cell.fontFamily) {
    style.fontFamily = cell.fontFamily;
  }

  return style;
}

function renderCellValue(value: string | number | null): React.ReactNode {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < value.split('\n').length - 1 && <br />}
      </span>
    ));
  }

  return String(value);
}

const DataTable = forwardRef<DataTableRef, DataTableProps>(function DataTable({ data }, ref) {
  const { headers, rows } = data;
  const tableRef = useRef<HTMLTableElement>(null);
  const headerRefs = useRef<(HTMLTableCellElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    scrollToDate: (dateStr: string) => {
      const normalizedDate = dateStr.replace(/-/g, '/');
      const index = headers.findIndex(h => {
        const headerValue = String(h.value || '');
        return headerValue === normalizedDate || headerValue === dateStr;
      });

      if (index === -1 || !tableRef.current) return false;

      const thElement = headerRefs.current[index];
      if (!thElement) return false;

      const container = tableRef.current.closest('.overflow-x-auto');
      if (!container) return false;

      const containerRect = container.getBoundingClientRect();
      const thRect = thElement.getBoundingClientRect();

      container.scrollTo({
        left: container.scrollLeft + thRect.left - containerRect.left - 20,
        behavior: 'smooth'
      });

      thElement.classList.add('bg-yellow-200');
      setTimeout(() => {
        thElement.classList.remove('bg-yellow-200');
      }, 2000);

      return true;
    }
  }));

  if (headers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        暂无数据
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <table ref={tableRef} className="w-full text-sm text-left min-w-[2000px]">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                ref={el => { headerRefs.current[index] = el; }}
                className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 min-w-[230px] max-w-[350px] transition-colors duration-300"
                style={getCellStyle(header)}
              >
                {renderCellValue(header.value)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-gray-50 transition-colors"
            >
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className="px-4 py-3 border-r border-gray-100 last:border-r-0 min-w-[230px] max-w-[350px]"
                  style={getCellStyle(cell)}
                >
                  {renderCellValue(cell.value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default DataTable;
