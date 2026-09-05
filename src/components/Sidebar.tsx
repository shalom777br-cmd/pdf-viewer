import React, { useState } from 'react';
import {
  List,
  Bookmark,
  LayoutGrid,
  HardDrive,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { TOCItem, BookmarkItem, PDFDocumentMetadata, StorageUsage } from '../types';

interface SidebarProps {
  isOpen: boolean;
  activeTab: 'toc' | 'bookmarks' | 'thumbnails' | 'offline';
  onChangeTab: (tab: 'toc' | 'bookmarks' | 'thumbnails' | 'offline') => void;
  toc: TOCItem[];
  isGeneratingTOC: boolean;
  onRegenerateTOC: () => void;
  currentPage: number;
  onJumpToPage: (page: number) => void;
  bookmarks: BookmarkItem[];
  onAddBookmark: (page: number, note?: string) => void;
  onRemoveBookmark: (id: string) => void;
  onEditBookmark: (id: string, note: string) => void;
  pageCount: number;
  thumbnails: Record<number, string>;
  offlineDocs: PDFDocumentMetadata[];
  onOpenOfflineDoc: (id: string) => void;
  onRemoveOfflineDoc: (id: string) => void;
  storageUsage: StorageUsage;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeTab,
  onChangeTab,
  toc,
  isGeneratingTOC,
  onRegenerateTOC,
  currentPage,
  onJumpToPage,
  bookmarks,
  onAddBookmark,
  onRemoveBookmark,
  onEditBookmark,
  pageCount,
  thumbnails,
  offlineDocs,
  onOpenOfflineDoc,
  onRemoveOfflineDoc,
  storageUsage,
}) => {
  const [tocFilter, setTocFilter] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredTOC = toc.filter((item) =>
    item.title.toLowerCase().includes(tocFilter.toLowerCase())
  );

  const isCurrentPageBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  // Active TOC item highlight calculation
  const activeTocId = (() => {
    let closestId: string | null = null;
    let closestPage = -1;
    for (const item of toc) {
      if (item.pageNumber <= currentPage && item.pageNumber > closestPage) {
        closestPage = item.pageNumber;
        closestId = item.id;
      }
    }
    return closestId;
  })();

  const renderTOCList = (items: TOCItem[]) => {
    return items.map((item) => {
      const isActive = item.id === activeTocId;
      const isLevel1 = item.level === 1;
      const isLevel2 = item.level === 2;

      return (
        <button
          key={item.id}
          onClick={() => onJumpToPage(item.pageNumber)}
          className={`w-full text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
            isActive
              ? 'px-3 py-2 bg-white font-semibold text-[#BC8F8F] shadow-2xs rounded-md border border-[#E8E1D9]'
              : 'px-3 py-1.5 text-[#4A3F35] hover:bg-[#E8E1D9]/50 rounded'
          } ${isLevel1 ? 'pl-3' : isLevel2 ? 'pl-6 text-xs' : 'pl-9 text-[11px]'}`}
        >
          <span className="truncate flex-1 leading-snug">{item.title}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
              isActive ? 'bg-[#BC8F8F]/15 text-[#7A4E4E]' : 'text-[#A09080] bg-[#E8E1D9]/60'
            }`}
          >
            P.{item.pageNumber}
          </span>
        </button>
      );
    });
  };

  return (
    <aside className="w-72 sm:w-80 shrink-0 bg-[#F8F5F0] border-r border-[#E8E1D9] flex flex-col h-[calc(100vh-56px)] select-none shadow-inner">
      {/* Tab Switcher */}
      <div className="p-3 border-b border-[#E8E1D9] bg-[#F8F5F0]">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#A09080]">
          <button
            id="tab-toc-btn"
            onClick={() => onChangeTab('toc')}
            className={`cursor-pointer pb-1.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'toc'
                ? 'text-[#BC8F8F] border-b-2 border-[#BC8F8F]'
                : 'opacity-60 hover:opacity-100 border-b-2 border-transparent'
            }`}
            title="目次 (Contents)"
          >
            <List className="w-3.5 h-3.5" />
            <span>Contents</span>
            {toc.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-[#E8E1D9] text-[#6D5D50]">
                {toc.length}
              </span>
            )}
          </button>

          <button
            id="tab-bookmarks-btn"
            onClick={() => onChangeTab('bookmarks')}
            className={`cursor-pointer pb-1.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'bookmarks'
                ? 'text-[#BC8F8F] border-b-2 border-[#BC8F8F]'
                : 'opacity-60 hover:opacity-100 border-b-2 border-transparent'
            }`}
            title="しおり (Bookmarks)"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarks</span>
            {bookmarks.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-[#E8E1D9] text-[#6D5D50]">
                {bookmarks.length}
              </span>
            )}
          </button>

          <button
            id="tab-thumbnails-btn"
            onClick={() => onChangeTab('thumbnails')}
            className={`cursor-pointer pb-1.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'thumbnails'
                ? 'text-[#BC8F8F] border-b-2 border-[#BC8F8F]'
                : 'opacity-60 hover:opacity-100 border-b-2 border-transparent'
            }`}
            title="ページ一覧 (Pages)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Pages</span>
          </button>

          <button
            id="tab-offline-btn"
            onClick={() => onChangeTab('offline')}
            className={`cursor-pointer pb-1.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'offline'
                ? 'text-[#BC8F8F] border-b-2 border-[#BC8F8F]'
                : 'opacity-60 hover:opacity-100 border-b-2 border-transparent'
            }`}
            title="端末保存 (Offline)"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Offline</span>
            {offlineDocs.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-[#E8E1D9] text-[#6D5D50]">
                {offlineDocs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3 text-sm">
        {/* 1. TOC Tab */}
        {activeTab === 'toc' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#A09080]" />
                <input
                  type="text"
                  placeholder="目次を検索..."
                  value={tocFilter}
                  onChange={(e) => setTocFilter(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-md border border-[#E8E1D9] bg-white text-[#4A3F35] focus:outline-hidden focus:border-[#BC8F8F] shadow-2xs"
                />
              </div>

              <button
                id="regenerate-toc-btn"
                onClick={onRegenerateTOC}
                disabled={isGeneratingTOC}
                className="p-2 rounded-md border border-[#E8E1D9] bg-white text-[#6D5D50] hover:bg-[#E8E1D9] active:bg-[#DCD4CB] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                title="目次を自動再解析（文書内の見出しとフォント構造を再スキャン）"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingTOC ? 'animate-spin text-[#BC8F8F]' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#A09080] px-1">
              <span>
                {toc.length > 0
                  ? toc[0].source === 'outline'
                    ? '埋め込み目次を抽出'
                    : '見出し構造から自動生成'
                  : '目次なし'}
              </span>
              {isGeneratingTOC && (
                <span className="text-[#BC8F8F] font-semibold animate-pulse">解析中...</span>
              )}
            </div>

            {filteredTOC.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#A09080] bg-white rounded-md border border-dashed border-[#E8E1D9] p-4">
                <List className="w-6 h-6 mx-auto mb-2 text-[#BC8F8F]/60" />
                <p className="font-semibold text-[#4A3F35]">目次項目が見つかりません</p>
                <p className="mt-1 text-[11px] text-[#A09080] leading-relaxed">
                  「目次を自動再解析」ボタンを押すと、文書全体の見出しをスキャンして自動生成します。
                </p>
                <button
                  onClick={onRegenerateTOC}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#BC8F8F] text-white text-xs font-medium hover:bg-[#AA7C7C] transition-colors cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>目次を自動解析</span>
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">{renderTOCList(filteredTOC)}</div>
            )}
          </div>
        )}

        {/* 2. Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#4A3F35]">
                しおり一覧 ({bookmarks.length})
              </span>
              {!isCurrentPageBookmarked && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-[#BC8F8F] text-white hover:bg-[#AA7C7C] transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>P.{currentPage} に挟む</span>
                </button>
              )}
            </div>

            {showAddForm && !isCurrentPageBookmarked && (
              <div className="p-2.5 rounded-md bg-white border border-[#E8E1D9] space-y-2 shadow-2xs">
                <p className="text-xs font-semibold text-[#2A241F]">
                  P.{currentPage} にしおりを追加
                </p>
                <input
                  type="text"
                  placeholder="メモを入力（任意）"
                  value={newBookmarkNote}
                  onChange={(e) => setNewBookmarkNote(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-[#E8E1D9] bg-[#F8F5F0] text-[#4A3F35] outline-none focus:border-[#BC8F8F]"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-2 py-1 text-[11px] rounded text-[#A09080] hover:bg-[#E8E1D9] transition-colors cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => {
                      onAddBookmark(currentPage, newBookmarkNote);
                      setNewBookmarkNote('');
                      setShowAddForm(false);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded bg-[#BC8F8F] text-white hover:bg-[#AA7C7C] font-medium transition-colors cursor-pointer shadow-2xs"
                  >
                    保存
                  </button>
                </div>
              </div>
            )}

            {bookmarks.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#A09080] bg-white rounded-md border border-dashed border-[#E8E1D9] p-4">
                <Bookmark className="w-6 h-6 mx-auto mb-2 text-[#BC8F8F]/60" />
                <p className="font-semibold text-[#4A3F35]">しおりがまだありません</p>
                <p className="mt-1 text-[11px] text-[#A09080]">
                  右下のしおりボタン、または上部のボタンで現在のページを記録できます。
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className={`p-2 rounded-md border transition-all ${
                      bm.pageNumber === currentPage
                        ? 'bg-white border-[#BC8F8F] shadow-2xs'
                        : 'bg-white border-[#E8E1D9] hover:border-[#BC8F8F]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <button
                        onClick={() => onJumpToPage(bm.pageNumber)}
                        className="font-semibold text-xs text-[#2A241F] hover:text-[#BC8F8F] flex items-center gap-1.5 cursor-pointer text-left flex-1 truncate"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-[#BC8F8F] shrink-0 fill-current" />
                        <span className="truncate">{bm.title}</span>
                      </button>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditingBookmarkId(bm.id);
                            setEditNoteText(bm.note || '');
                          }}
                          className="p-1 text-[#A09080] hover:text-[#4A3F35] rounded transition-colors cursor-pointer"
                          title="メモを編集"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onRemoveBookmark(bm.id)}
                          className="p-1 text-[#A09080] hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="しおりを削除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {editingBookmarkId === bm.id ? (
                      <div className="mt-1.5 flex items-center gap-1">
                        <input
                          type="text"
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          className="flex-1 px-1.5 py-0.5 text-xs rounded border border-[#E8E1D9] bg-[#F8F5F0] text-[#4A3F35] outline-none focus:border-[#BC8F8F]"
                        />
                        <button
                          onClick={() => {
                            onEditBookmark(bm.id, editNoteText);
                            setEditingBookmarkId(null);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingBookmarkId(null)}
                          className="p-1 text-[#A09080] hover:bg-[#E8E1D9] rounded cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : bm.note ? (
                      <p className="mt-1 text-[11px] text-[#6D5D50] bg-[#F8F5F0] p-1.5 rounded">
                        {bm.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Thumbnails Tab */}
        {activeTab === 'thumbnails' && (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onJumpToPage(pageNum)}
                className={`group flex flex-col items-center p-1.5 rounded-md border transition-all cursor-pointer ${
                  pageNum === currentPage
                    ? 'bg-white border-[#BC8F8F] ring-2 ring-[#BC8F8F]/30 shadow-xs'
                    : 'bg-white border-[#E8E1D9] hover:border-[#BC8F8F]/50 hover:shadow-2xs'
                }`}
              >
                <div className="w-full aspect-[1/1.414] bg-[#F8F5F0] rounded overflow-hidden flex items-center justify-center border border-[#E8E1D9]">
                  {thumbnails[pageNum] ? (
                    <img
                      src={thumbnails[pageNum]}
                      alt={`Page ${pageNum}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-[#A09080]/50" />
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-medium ${
                    pageNum === currentPage ? 'text-[#BC8F8F] font-bold' : 'text-[#6D5D50]'
                  }`}
                >
                  {pageNum}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 4. Offline Docs Tab */}
        {activeTab === 'offline' && (
          <div className="space-y-3">
            <div className="p-2.5 bg-white rounded-md border border-[#E8E1D9] text-xs text-[#6D5D50] space-y-1 shadow-2xs">
              <div className="flex justify-between">
                <span>端末保存PDF:</span>
                <strong className="text-[#2A241F]">{offlineDocs.length} 件</strong>
              </div>
              <div className="flex justify-between">
                <span>合計使用容量:</span>
                <strong className="text-[#2A241F]">{formatBytes(storageUsage.usedBytes)}</strong>
              </div>
            </div>

            {offlineDocs.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#A09080] bg-white rounded-md border border-dashed border-[#E8E1D9] p-4">
                <HardDrive className="w-6 h-6 mx-auto mb-2 text-[#BC8F8F]/60" />
                <p className="font-semibold text-[#4A3F35]">保存済みPDFはありません</p>
                <p className="mt-1 text-[11px] text-[#A09080] leading-relaxed">
                  上部バーの「オフライン保存」ボタンを押すと、この端末にPDFが保存され、電波のない場所でも読めるようになります。
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {offlineDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-md bg-white border border-[#E8E1D9] hover:border-[#BC8F8F]/50 transition-colors shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-[#2A241F] truncate flex-1">
                        {doc.title || doc.fileName}
                      </h4>
                      <button
                        onClick={() => onRemoveOfflineDoc(doc.id)}
                        className="p-1 text-[#A09080] hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="削除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#A09080]">
                      <span>
                        {doc.pageCount}P • {formatBytes(doc.fileSize)}
                      </span>
                      <button
                        onClick={() => onOpenOfflineDoc(doc.id)}
                        className="inline-flex items-center gap-1 text-[#BC8F8F] hover:underline font-medium cursor-pointer"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>開く</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer caption: Table of contents automatically generated from document metadata */}
      <div className="p-2 border-t border-[#E8E1D9] bg-[#F8F5F0] text-[10px] text-[#A09080] text-center">
        Table of contents automatically generated from document metadata.
      </div>
    </aside>
  );
};
