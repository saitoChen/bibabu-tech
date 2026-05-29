'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { parseExcelFile } from '@/lib/processExcel';
import { SheetData } from '@/types/excel';

interface StoredData {
  data: SheetData;
  fileName: string;
  uploadedAt: string;
}

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const saveData = async (data: SheetData, name: string) => {
    try {
      const storedData: StoredData = {
        data,
        fileName: name,
        uploadedAt: new Date().toISOString()
      };
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storedData)
      });
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('请上传 .xlsx 或 .xls 格式的 Excel 文件');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(file);
      await saveData(data, file.name);
      router.push('/daily');
    } catch (err) {
      setError('解析 Excel 文件失败，请检查文件格式是否正确');
      console.error('Error parsing Excel:', err);
      setIsLoading(false);
    }
  }, [router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">日报</h1>
          <p className="text-gray-500">上传 Excel </p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="text-center">
            <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDragging ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <svg className={`w-6 h-6 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            {isLoading ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">正在解析文件...</p>
                <div className="w-32 h-1.5 mx-auto bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-pulse rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {isDragging ? '松开以上传文件' : '拖拽 Excel 文件到此处'}
                </p>
                <p className="text-xs text-gray-500">
                  或点击选择文件
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  支持 .xlsx 和 .xls 格式
                </p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
