import React, { useRef, useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarClose,
  FolderOpen,
  Sparkles,
  Search,
  HardDrive,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  HardDriveDownload,
} from 'lucide-react';
import { PDFDocumentMetadata } from '../types';
import { OfflineIndicator } from './OfflineIndicator';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentMeta: PDFDocumentMetadata | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenFile: (file: File) => void;
  onLoadSample: () => void;
  isOfflineCached: boolean;
  onToggleSaveOffline: () => void;
  onOpenOfflineLibrary: () => void;
  offlineCount: number;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  onToggleSearch: () => void;
  isSearching: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  isCurrentPageBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMeta,
  isSidebarOpen,
  onToggleSidebar,
  onOpenFile,
  onLoadSample,
  isOfflineCached,
  onToggleSaveOffline,
  onOpenOfflineLibrary,
  offlineCount,
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  onToggleSearch,
  isSearching,
  currentPage = 1,
  onPageChange,
  isCurrentPageBookmarked,
  onToggleBookmark,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
    e.target.value = '';
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMeta || !onPageChange) return;
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= currentMeta.pageCount) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  return (
    <nav className="h-14 border-b border-[#E8E1D9] flex items-center justify-between px-3 sm:px-6 bg-[#F8F5F0] select-none shrink-0 z-40">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      {/* Left: Sidebar toggle + App Logo & Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
            isSidebarOpen
              ? 'bg-[#BC8F8F]/15 border-[#BC8F8F]/40 text-[#7A4E4E]'
              : 'bg-white border-[#E8E1D9] text-[#6D5D50] hover:bg-[#E8E1D9]'
          }`}
          title={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
        >
          {isSidebarOpen ? <SidebarClose className="w-4 h-4" /> : <Sidebar className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-[#BC8F8F] rounded-md flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-2xs">
            P
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-base sm:text-lg text-[#2A241F] tracking-tight truncate">
              {currentMeta ? currentMeta.title || currentMeta.fileName : 'PDF Viewer'}
            </h1>
          </div>
        </div>
      </div>

      {/* Middle: Compact Header Page Stepper (Desktop) */}
      {currentMeta && onPageChange && (
        <div className="hidden md:flex items-center gap-2">
          <form
            onSubmit={handlePageSubmit}
            className="flex items-center bg-white border border-[#E8E1D9] rounded-md px-2 py-1 shadow-2xs"
          >
            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageSubmit}
              className="w-10 text-center bg-transparent border-none outline-none font-medium text-xs text-[#2A241F]"
              title="ページ番号を入力してEnter"
            />
            <span className="text-[#A09080] mx-1 text-xs">/</span>
            <span className="text-[#A09080] pr-1 text-xs font-medium">{currentMeta.pageCount}</span>
          </form>

          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 text-[#6D5D50] hover:bg-[#E8E1D9] disabled:opacity-30 rounded-md transition-colors cursor-pointer border border-transparent hover:border-[#E8E1D9]"
              title="前へ (←)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(currentMeta.pageCount, currentPage + 1))}
              disabled={currentPage >= currentMeta.pageCount}
              className="p-1.5 text-[#6D5D50] hover:bg-[#E8E1D9] disabled:opacity-30 rounded-md transition-colors cursor-pointer border border-transparent hover:border-[#E8E1D9]"
              title="次へ (→)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Right Action Cluster */}
      <div className="flex items-center gap-2 sm:gap-3">
        {currentMeta && (
          <button
            id="header-search-btn"
            onClick={onToggleSearch}
            className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
              isSearching
                ? 'bg-[#BC8F8F] text-white border-[#BC8F8F]'
                : 'bg-white border-[#E8E1D9] text-[#6D5D50] hover:bg-[#E8E1D9]'
            }`}
            title="文書内を検索 (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {currentMeta && (
          <button
            id="save-offline-btn"
            onClick={onToggleSaveOffline}
            className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              isOfflineCached
                ? 'bg-[#BC8F8F]/15 border-[#BC8F8F]/50 text-[#7A4E4E] hover:bg-[#BC8F8F]/25'
                : 'bg-white border-[#E8E1D9] text-[#6D5D50] hover:bg-[#E8E1D9]'
            }`}
            title={
              isOfflineCached
                ? '端末のオフライン保存から削除'
                : 'このPDFを端末に保存（通信なしで閲覧可能にします）'
            }
          >
            <HardDriveDownload className={`w-3.5 h-3.5 ${isOfflineCached ? 'text-[#BC8F8F]' : 'text-[#8C8077]'}`} />
            <span>{isOfflineCached ? '保存済み' : 'オフライン保存'}</span>
          </button>
        )}

        <button
          id="offline-library-btn"
          onClick={onOpenOfflineLibrary}
          className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E8E1D9] bg-white text-xs font-medium text-[#4A3F35] hover:bg-[#E8E1D9] transition-colors cursor-pointer shadow-2xs"
          title="端末に保存されているPDF一覧を開く"
        >
          <HardDrive className="w-3.5 h-3.5 text-[#A09080]" />
          <span className="hidden xl:inline">ライブラリ</span>
          {offlineCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#BC8F8F] text-white">
              {offlineCount}
            </span>
          )}
        </button>

        <button
          id="open-sample-btn"
          onClick={onLoadSample}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E8E1D9] bg-white text-xs font-medium text-[#4A3F35] hover:bg-[#E8E1D9] transition-colors cursor-pointer"
          title="解説付きのサンプルPDFを開いて機能を試す"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#BC8F8F]" />
          <span>サンプル</span>
        </button>

        <button
          id="open-pdf-file-btn"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E8E1D9] bg-white hover:bg-[#E8E1D9] text-[#4A3F35] text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          title="ローカルのPDFファイルを開く"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#A09080]" />
          <span className="hidden xs:inline">開く</span>
        </button>

        <div className="pl-1 sm:pl-2 border-l border-[#E8E1D9]">
          <OfflineIndicator
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            onToggleSimulatedOffline={onToggleSimulatedOffline}
            isDocumentOfflineCached={isOfflineCached}
          />
        </div>

        {onToggleBookmark && (
          <button
            id="header-bookmark-current-btn"
            onClick={onToggleBookmark}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium shadow-2xs active:scale-95 transition-all cursor-pointer ${
              isCurrentPageBookmarked
                ? 'bg-[#8F6A6A] text-white'
                : 'bg-[#BC8F8F] hover:bg-[#AA7C7C] text-white'
            }`}
            title={isCurrentPageBookmarked ? 'このページのしおりを解除' : 'このページにしおりを挟む'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isCurrentPageBookmarked ? 'fill-current' : ''}`} />
            <span className="hidden md:inline">
              {isCurrentPageBookmarked ? 'Bookmarked' : 'Bookmark Current'}
            </span>
          </button>
        )}

        <PWAInstallButton />
      </div>
    </nav>
  );
};
