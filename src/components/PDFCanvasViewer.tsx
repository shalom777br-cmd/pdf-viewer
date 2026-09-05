import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFService } from '../services/pdfService';
import { FileUp, Sparkles, Loader2, Bookmark, AlertCircle } from 'lucide-react';

interface PDFCanvasViewerProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  currentPage: number;
  scale: number;
  rotation: number;
  isBookmarked: boolean;
  onPageChange: (page: number) => void;
  onOpenFile: (file: File) => void;
  onLoadSample: () => void;
  isLoading: boolean;
  loadingError: string | null;
  onToggleBookmark: () => void;
  isOfflineCached: boolean;
}

export const PDFCanvasViewer: React.FC<PDFCanvasViewerProps> = ({
  pdfDoc,
  currentPage,
  scale,
  rotation,
  isBookmarked,
  onPageChange,
  onOpenFile,
  onLoadSample,
  isLoading,
  loadingError,
  onToggleBookmark,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Render active page onto canvas
  useEffect(() => {
    let isCancelled = false;

    async function render() {
      if (!pdfDoc || !canvasRef.current) return;
      setIsRendering(true);

      try {
        const dimensions = await PDFService.renderPage(
          pdfDoc,
          currentPage,
          canvasRef.current,
          scale,
          rotation
        );

        if (!isCancelled) {
          setPageSize(dimensions);
        }
      } catch (err: any) {
        if (!isCancelled && err?.name !== 'RenderingCancelledException') {
          console.error('Render error:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    }

    render();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale, rotation]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdfDoc) return;
      // Do not navigate if typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        onPageChange(Math.min(pdfDoc.numPages, currentPage + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        onPageChange(Math.max(1, currentPage - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        onPageChange(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        onPageChange(pdfDoc.numPages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfDoc, currentPage, onPageChange]);

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          onOpenFile(file);
        }
      }
    },
    [onOpenFile]
  );

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 relative overflow-auto bg-[#FDFBF7] flex flex-col items-center justify-start p-4 sm:p-6 min-h-0 select-text"
    >
      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-[#BC8F8F]/15 backdrop-blur-xs border-2 border-dashed border-[#BC8F8F] flex flex-col items-center justify-center p-6 transition">
          <div className="bg-white p-6 rounded-lg shadow-xl border border-[#E8E1D9] flex flex-col items-center max-w-sm text-center">
            <FileUp className="w-10 h-10 text-[#BC8F8F] mb-3 animate-bounce" />
            <p className="text-sm font-bold text-[#2A241F]">PDFファイルをここにドロップ</p>
            <p className="text-xs text-[#A09080] mt-1">すぐに読み込んでオフラインでも閲覧できます</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="my-auto flex flex-col items-center justify-center py-24 text-[#6D5D50] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#BC8F8F]" />
          <p className="text-xs font-semibold text-[#4A3F35]">PDFを読み込み中...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && loadingError && (
        <div className="my-auto max-w-md w-full p-6 rounded-lg bg-white border border-rose-200 shadow-xs text-center space-y-3">
          <div className="w-10 h-10 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#2A241F]">PDFの読み込みに失敗しました</h3>
          <p className="text-xs text-[#A09080]">{loadingError}</p>
          <button
            onClick={onLoadSample}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#BC8F8F] text-white text-xs font-medium hover:bg-[#AA7C7C] transition-colors cursor-pointer shadow-2xs"
          >
            サンプルPDFを開く
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !loadingError && !pdfDoc && (
        <div className="my-auto max-w-lg w-full bg-white rounded-lg p-6 sm:p-8 border border-[#E8E1D9] shadow-xs text-center space-y-5">
          <div className="w-12 h-12 rounded-md bg-[#BC8F8F]/15 text-[#BC8F8F] flex items-center justify-center mx-auto">
            <FileUp className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#2A241F] tracking-tight">
              PDFファイルを選択またはドロップ
            </h2>
            <p className="text-xs text-[#A09080] leading-relaxed max-w-sm mx-auto">
              目次自動生成、ページジャンプ、しおり機能、完全オフライン閲覧に対応したシンプルなビューワーです。
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <label
              htmlFor="empty-state-file-input"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#BC8F8F] hover:bg-[#AA7C7C] active:bg-[#966868] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>ファイルを選択</span>
            </label>
            <input
              id="empty-state-file-input"
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onOpenFile(file);
                e.target.value = '';
              }}
              className="hidden"
            />

            <button
              onClick={onLoadSample}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-[#E8E1D9] bg-[#F8F5F0] hover:bg-[#E8E1D9] text-[#4A3F35] text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#BC8F8F]" />
              <span>サンプルPDFを開く</span>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="pt-4 border-t border-[#E8E1D9] grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <div className="p-2 rounded-md bg-[#F8F5F0] border border-[#E8E1D9]">
              <div className="font-semibold text-xs text-[#2A241F]">目次自動生成</div>
              <div className="text-[10px] text-[#A09080] mt-0.5">見出し構造を自動解析</div>
            </div>
            <div className="p-2 rounded-md bg-[#F8F5F0] border border-[#E8E1D9]">
              <div className="font-semibold text-xs text-[#2A241F]">ページジャンプ</div>
              <div className="text-[10px] text-[#A09080] mt-0.5">指定ページへ即時移動</div>
            </div>
            <div className="p-2 rounded-md bg-[#F8F5F0] border border-[#E8E1D9]">
              <div className="font-semibold text-xs text-[#2A241F]">しおり機能</div>
              <div className="text-[10px] text-[#A09080] mt-0.5">重要ページを記録</div>
            </div>
            <div className="p-2 rounded-md bg-[#F8F5F0] border border-[#E8E1D9]">
              <div className="font-semibold text-xs text-[#2A241F]">オフライン閲覧</div>
              <div className="text-[10px] text-[#A09080] mt-0.5">通信不要で読める</div>
            </div>
          </div>
        </div>
      )}

      {/* Active PDF Page Sheet */}
      {pdfDoc && (
        <div className="relative mb-20 transition-transform duration-100 ease-out flex justify-center">
          {/* Main Paper Container */}
          <div
            className="relative bg-white shadow-md rounded-xs border border-[#E8E1D9] transition-shadow"
            style={{
              width: pageSize ? `${pageSize.width}px` : 'auto',
              minHeight: pageSize ? `${pageSize.height}px` : '400px',
            }}
          >
            {/* Bookmark Ribbon on Top Right */}
            {isBookmarked && (
              <button
                onClick={onToggleBookmark}
                className="absolute -top-1 right-6 z-20 transition transform hover:-translate-y-0.5 cursor-pointer"
                title="このページにはしおりが挟まれています（クリックで解除）"
              >
                <div className="relative flex flex-col items-center">
                  <div className="w-6 h-10 bg-[#BC8F8F] shadow-xs flex items-center justify-center text-white">
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </div>
                  {/* Ribbon V cut */}
                  <div className="w-0 h-0 border-l-[12px] border-l-[#BC8F8F] border-r-[12px] border-r-[#BC8F8F] border-b-[8px] border-b-transparent" />
                </div>
              </button>
            )}

            {/* Rendering Spinner Overlay */}
            {isRendering && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-2xs flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-[#BC8F8F]" />
              </div>
            )}

            {/* Canvas Element */}
            <canvas ref={canvasRef} className="block mx-auto max-w-full h-auto" />
          </div>
        </div>
      )}
    </div>
  );
};
