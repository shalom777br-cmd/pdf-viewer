import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Bookmark,
  Maximize2,
  Minimize2,
  Scan,
} from 'lucide-react';

interface ViewerControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  rotation: number;
  onRotate: () => void;
  isCurrentPageBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const ViewerControls: React.FC<ViewerControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  scale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitWidth,
  onFitPage,
  rotation,
  onRotate,
  isCurrentPageBookmarked,
  onToggleBookmark,
}) => {
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value, 10);
    if (!isNaN(page)) {
      onPageChange(page);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-[#E8E1D9] shadow-lg text-xs select-none">
      {/* Page Navigation Stepper */}
      <div className="flex items-center gap-1">
        <button
          id="prev-page-btn"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1 rounded text-[#6D5D50] hover:bg-[#F8F5F0] hover:text-[#2A241F] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="前へ (←)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <form onSubmit={handlePageSubmit} className="flex items-center">
          <input
            id="page-jump-input"
            type="text"
            inputMode="numeric"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={handlePageSubmit}
            className="w-8 text-center bg-[#F8F5F0] border border-[#E8E1D9] rounded px-1 py-0.5 text-xs font-semibold text-[#2A241F] focus:outline-hidden focus:border-[#BC8F8F]"
            title="ページ番号を入力してEnterで移動"
          />
          <span className="mx-1 text-[#A09080]">/</span>
          <span className="text-[#6D5D50] font-medium pr-1">{totalPages}</span>
        </form>

        <button
          id="next-page-btn"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1 rounded text-[#6D5D50] hover:bg-[#F8F5F0] hover:text-[#2A241F] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="次へ (→)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page Slider Scrubber (Desktop) */}
      <div className="hidden lg:flex items-center px-1">
        <input
          id="page-slider-scrubber"
          type="range"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={handleSliderChange}
          className="w-24 h-1 bg-[#E8E1D9] rounded-lg appearance-none cursor-pointer accent-[#BC8F8F]"
          title="ページスライダー"
        />
      </div>

      <div className="h-4 w-px bg-[#E8E1D9] mx-0.5" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          id="zoom-out-btn"
          onClick={onZoomOut}
          disabled={scale <= 0.5}
          className="p-1 rounded text-[#6D5D50] hover:bg-[#F8F5F0] hover:text-[#2A241F] disabled:opacity-30 transition-colors cursor-pointer"
          title="縮小 (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          id="zoom-reset-btn"
          onClick={onZoomReset}
          className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-[#6D5D50] hover:bg-[#F8F5F0] hover:text-[#2A241F] transition-colors cursor-pointer min-w-[42px] text-center"
          title="倍率を100%にリセット"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          id="zoom-in-btn"
          onClick={onZoomIn}
          disabled={scale >= 3.0}
          className="p-1 rounded text-[#6D5D50] hover:bg-[#F8F5F0] hover:text-[#2A241F] disabled:opacity-30 transition-colors cursor-pointer"
          title="拡大 (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          id="fit-width-btn"
          onClick={onFitWidth}
          className="hidden md:inline-flex p-1 rounded text-[#6D5D50] hover:bg-[#F8F5F0] hover:text-[#2A241F] transition-colors cursor-pointer"
          title="幅に合わせる"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          id="fit-page-btn"
          onClick={onFitPage}
          className="hidden md:inline-flex p-1 rounded text-[#6D5D50] hover:bg-[#F8F5F0] hover:text-[#2A241F] transition-colors cursor-pointer"
          title="ページ全体を表示"
        >
          <Scan className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-[#E8E1D9] mx-0.5" />

      {/* Rotate & Bookmark */}
      <div className="flex items-center gap-1">
        <button
          id="rotate-btn"
          onClick={onRotate}
          className="p-1 rounded text-[#6D5D50] hover:bg-[#F8F5F0] hover:text-[#2A241F] transition-colors cursor-pointer"
          title={`90°回転（現在: ${rotation}°）`}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          id="bookmark-toggle-btn"
          onClick={onToggleBookmark}
          className={`p-1 rounded transition-colors cursor-pointer ${
            isCurrentPageBookmarked
              ? 'text-[#BC8F8F] bg-[#BC8F8F]/15'
              : 'text-[#6D5D50] hover:bg-[#F8F5F0] hover:text-[#2A241F]'
          }`}
          title={isCurrentPageBookmarked ? 'このページのしおりを削除' : 'このページにしおりを挟む'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isCurrentPageBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
};
