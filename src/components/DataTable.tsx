'use client';

import { CellData, SheetData } from '@/types/excel';

interface DataTableProps {
  data: SheetData;
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

export default function DataTable({ data }: DataTableProps) {
  const { headers, rows } = data;

  if (headers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        暂无数据
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <table className="w-full text-sm text-left min-w-[2000px]">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 min-w-[230px] max-w-[350px]"
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
}
