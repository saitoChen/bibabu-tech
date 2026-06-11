'use client';

import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
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
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedColumns, setExpandedColumns] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleColumn = (colIndex: number) => {
    setExpandedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(colIndex)) {
        newSet.delete(colIndex);
      } else {
        newSet.add(colIndex);
      }
      return newSet;
    });
  };

  useImperativeHandle(ref, () => ({
    scrollToDate: (dateStr: string) => {
      const normalizedDate = dateStr.replace(/-/g, '/');
      const index = headers.findIndex(h => {
        const headerValue = String(h.value || '');
        return headerValue === normalizedDate || headerValue === dateStr;
      });

      if (index === -1) return false;

      // 移动端：纵向滚动到对应卡片
      if (isMobile) {
        const cardElement = cardRefs.current[index];
        if (!cardElement) return false;

        cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // 自动展开该卡片
        setExpandedColumns(prev => {
          const newSet = new Set(prev);
          newSet.add(index);
          return newSet;
        });

        // 高亮效果
        cardElement.classList.add('ring-2', 'ring-blue-400');
        setTimeout(() => {
          cardElement.classList.remove('ring-2', 'ring-blue-400');
        }, 2000);

        return true;
      }

      // PC端：横向滚动到对应列
      if (!tableRef.current) return false;

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

  // 移动端：按列展示，每列是一个卡片
  if (mounted && isMobile) {
    return (
      <div className="w-full space-y-4">
        {headers.map((header, colIndex) => {
          const isExpanded = expandedColumns.has(colIndex);
          // 找到红字行（前3行内）
          const redRowIndices: number[] = [];
          for (let i = 0; i < Math.min(3, rows.length); i++) {
            if (rows[i] && rows[i][colIndex] && rows[i][colIndex].color === 'red') {
              redRowIndices.push(i);
            }
          }

          return (
            <div
              key={colIndex}
              ref={el => { cardRefs.current[colIndex] = el; }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-300"
            >
              {/* 日期头部 */}
              <div
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 cursor-pointer flex items-center justify-between"
                onClick={() => toggleColumn(colIndex)}
              >
                <span style={getCellStyle(header)}>
                  {renderCellValue(header.value)}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* 红字卡片内容 */}
              <div className="px-4 py-3 space-y-2">
                {redRowIndices.map(rowIndex => (
                  <div key={rowIndex} style={getCellStyle(rows[rowIndex][colIndex])}>
                    {renderCellValue(rows[rowIndex][colIndex].value)}
                  </div>
                ))}
              </div>

              {/* 展开后的详细内容 */}
              {isExpanded && (
                <div className="px-4 py-3 border-t border-gray-100 space-y-3">
                  {rows.map((row, rowIndex) => {
                    // 跳过红字行（已显示）
                    if (redRowIndices.includes(rowIndex)) return null;
                    const cell = row[colIndex];
                    if (!cell.value) return null;
                    return (
                      <div key={rowIndex} className="text-sm text-gray-700" style={getCellStyle(cell)}>
                        {renderCellValue(cell.value)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // 桌面端：保持原有表格布局
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
