'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { DataTableRef } from '@/components/DataTable';
import { SheetData } from '@/types/excel';
import { useAuth } from '@/hooks/useAuth';

interface StoredData {
  data: SheetData;
  fileName: string;
  uploadedAt: string;
}

export default function DailyPage() {
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [searchDate, setSearchDate] = useState<string>('');
  const [searchError, setSearchError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const tableRef = useRef<DataTableRef>(null);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchStoredData();
    }
  }, [isAuthenticated]);

  const fetchStoredData = async () => {
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      if (result.data) {
        const stored: StoredData = result.data;
        setSheetData(stored.data);
        setFileName(stored.fileName);
      }
    } catch (err) {
      console.error('Failed to fetch stored data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = useCallback(() => {
    if (!searchDate || !tableRef.current) return;

    const formattedDate = searchDate.replace(/-/g, '/');
    const success = tableRef.current.scrollToDate(formattedDate);

    if (!success) {
      setSearchError('未找到该日期的数据');
      setTimeout(() => setSearchError(''), 3000);
    } else {
      setSearchError('');
    }
  }, [searchDate]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchDate(e.target.value);
    setSearchError('');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleReset = useCallback(() => {
    router.push('/');
  }, [router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!sheetData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">暂无数据，请先上传 Excel 文件</p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            去上传
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">日报</h1>
              <p className="text-xs text-gray-500">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={searchDate}
                  onChange={handleDateChange}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  placeholder="选择日期"
                />
                {searchError && (
                  <span className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap">
                    {searchError}
                  </span>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchDate}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                定位
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                重新上传
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-4">
        <DataTable ref={tableRef} data={sheetData} />
      </main>
    </div>
  );
}
