import React, { useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFService } from './services/pdfService';
import { offlineStorage } from './services/offlineStorage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { TOCItem, BookmarkItem, PDFDocumentMetadata, SearchMatch, StorageUsage } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PDFCanvasViewer } from './components/PDFCanvasViewer';
import { ViewerControls } from './components/ViewerControls';
import { SearchBar } from './components/SearchBar';
import { OfflineManagerModal } from './components/OfflineManagerModal';

export function App() {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentMeta, setCurrentMeta] = useState<PDFDocumentMetadata | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.15);
  const [rotation, setRotation] = useState<number>(0);
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [isGeneratingTOC, setIsGeneratingTOC] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'toc' | 'bookmarks' | 'thumbnails' | 'offline'>('toc');
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState<number>(0);
  const [isSearchExecuting, setIsSearchExecuting] = useState<boolean>(false);
  const [offlineDocs, setOfflineDocs] = useState<PDFDocumentMetadata[]>([]);
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(false);
  const [storageUsage, setStorageUsage] = useState<StorageUsage>({ usedBytes: 0, totalBytes: 0 });

  const { isOnline, isSimulatedOffline, toggleSimulatedOffline } = useOnlineStatus();

  // Refresh saved documents list and storage estimate
  const refreshOfflineDocs = useCallback(async () => {
    try {
      const docs = await offlineStorage.getAllDocuments();
      setOfflineDocs(docs);
      const usage = await offlineStorage.getStorageEstimate();
      setStorageUsage(usage);
    } catch (e) {
      console.warn('Error refreshing offline docs:', e);
    }
  }, []);

  useEffect(() => {
    refreshOfflineDocs();
  }, [refreshOfflineDocs]);

  // Load PDF Buffer into State
  const loadPDF = useCallback(
    async (
      buffer: ArrayBuffer,
      title?: string,
      fileName?: string,
      docId?: string,
      pageToOpen: number = 1
    ) => {
      setIsLoading(true);
      setLoadingError(null);
      setThumbnails({});

      try {
        const doc = await PDFService.loadDocument(buffer);
        const stableId =
          docId || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        // Extract TOC
        setIsGeneratingTOC(true);
        let extractedTOC: TOCItem[] = [];
        try {
          const cachedTOC = await offlineStorage.getTOC(stableId);
          if (cachedTOC && cachedTOC.length > 0) {
            extractedTOC = cachedTOC;
          } else {
            extractedTOC = await PDFService.getTableOfContents(doc);
            await offlineStorage.saveTOC(stableId, extractedTOC);
          }
        } catch (e) {
          console.warn('TOC extraction error:', e);
        } finally {
          setIsGeneratingTOC(false);
        }

        // Load Bookmarks and Offline Status
        const cachedBookmarks = await offlineStorage.getBookmarks(stableId);
        const isOffline = await offlineStorage.isDocumentOffline(stableId);

        const meta: PDFDocumentMetadata = {
          id: stableId,
          title: title || fileName || 'PDF Document',
          fileName: fileName || 'document.pdf',
          fileSize: buffer.byteLength,
          pageCount: doc.numPages,
          lastOpenedAt: Date.now(),
          isOfflineAvailable: isOffline,
          currentPage: pageToOpen,
          zoomScale: 1.15,
        };

        setPdfDoc(doc);
        setCurrentMeta(meta);
        setFileBuffer(buffer);
        setCurrentPage(Math.min(pageToOpen, doc.numPages));
        setToc(extractedTOC);
        setBookmarks(cachedBookmarks);
        setIsOfflineCached(isOffline);
        setRotation(0);

        // Pre-generate thumbnail for page 1
        try {
          const thumb = await PDFService.generateThumbnail(doc, 1, 140);
          setThumbnails((prev) => ({ ...prev, 1: thumb }));
        } catch {}

        // Lazy-generate first 30 page thumbnails in background
        const total = doc.numPages;
        setTimeout(async () => {
          for (let p = 2; p <= Math.min(total, 30); p++) {
            try {
              const thumb = await PDFService.generateThumbnail(doc, p, 140);
              setThumbnails((prev) => ({ ...prev, [p]: thumb }));
            } catch {
              break;
            }
          }
        }, 100);

        refreshOfflineDocs();
      } catch (err: any) {
        console.error('Failed to load PDF document:', err);
        setLoadingError(err?.message || 'PDFの解析に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    },
    [refreshOfflineDocs]
  );

  // Load Sample Guide PDF
  const loadSamplePDF = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/sample.pdf');
      if (!res.ok) throw new Error('サンプルPDFの取得に失敗しました');
      const buffer = await res.arrayBuffer();
      await loadPDF(buffer, 'PDFビューワー 機能解説書', 'sample.pdf', 'sample_guide_pdf', 1);
    } catch (err: any) {
      setLoadingError(err.message);
      setIsLoading(false);
    }
  }, [loadPDF]);

  // Initial Load: check if previously stored docs exist, else load sample
  useEffect(() => {
    async function init() {
      try {
        const docs = await offlineStorage.getAllDocuments();
        if (docs.length > 0) {
          const first = docs[0];
          const stored = await offlineStorage.getDocument(first.id);
          if (stored) {
            await loadPDF(
              stored.fileBuffer,
              stored.metadata.title,
              stored.metadata.fileName,
              stored.metadata.id,
              stored.metadata.currentPage || 1
            );
            return;
          }
        }
        loadSamplePDF();
      } catch (e) {
        console.warn('Initial load error:', e);
        loadSamplePDF();
      }
    }
    init();
  }, [loadPDF, loadSamplePDF]);

  // Open file from local input / drag-and-drop
  const handleOpenFile = useCallback(
    async (file: File) => {
      try {
        const buffer = await file.arrayBuffer();
        const docId = `file_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}_${buffer.byteLength}`;
        await loadPDF(buffer, file.name.replace(/\.pdf$/i, ''), file.name, docId, 1);
      } catch (e: any) {
        setLoadingError('ファイルの読み込みに失敗しました: ' + e.message);
      }
    },
    [loadPDF]
  );

  // Open document from offline storage
  const handleOpenOfflineDoc = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        const stored = await offlineStorage.getDocument(id);
        if (stored) {
          await loadPDF(
            stored.fileBuffer,
            stored.metadata.title,
            stored.metadata.fileName,
            stored.metadata.id,
            stored.metadata.currentPage || 1
          );
        }
      } catch (e) {
        console.error('Error opening offline doc:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [loadPDF]
  );

  // Toggle saving active PDF to offline library
  const toggleSaveOffline = useCallback(async () => {
    if (!currentMeta || !fileBuffer) return;
    if (isOfflineCached) {
      await offlineStorage.removeDocument(currentMeta.id);
      setIsOfflineCached(false);
      setCurrentMeta((prev) => (prev ? { ...prev, isOfflineAvailable: false } : null));
    } else {
      await offlineStorage.saveDocument(currentMeta, fileBuffer, bookmarks, toc);
      setIsOfflineCached(true);
      setCurrentMeta((prev) => (prev ? { ...prev, isOfflineAvailable: true } : null));
    }
    refreshOfflineDocs();
  }, [currentMeta, fileBuffer, isOfflineCached, bookmarks, toc, refreshOfflineDocs]);

  // Delete document from offline storage
  const handleRemoveOfflineDoc = useCallback(
    async (id: string) => {
      await offlineStorage.removeDocument(id);
      if (currentMeta?.id === id) {
        setIsOfflineCached(false);
      }
      refreshOfflineDocs();
    },
    [currentMeta, refreshOfflineDocs]
  );

  // Bookmark actions
  const handleAddBookmark = useCallback(
    async (pageNum: number, note?: string) => {
      if (!currentMeta) return;
      const newBookmark: BookmarkItem = {
        id: `bm_${Date.now()}_p${pageNum}`,
        documentId: currentMeta.id,
        pageNumber: pageNum,
        title: `P.${pageNum} のしおり`,
        note: note || '',
        createdAt: Date.now(),
      };
      const updated = [...bookmarks.filter((b) => b.pageNumber !== pageNum), newBookmark].sort(
        (a, b) => a.pageNumber - b.pageNumber
      );
      setBookmarks(updated);
      await offlineStorage.saveBookmarks(currentMeta.id, updated);
    },
    [currentMeta, bookmarks]
  );

  const handleRemoveBookmark = useCallback(
    async (id: string) => {
      if (!currentMeta) return;
      const updated = bookmarks.filter((b) => b.id !== id);
      setBookmarks(updated);
      await offlineStorage.saveBookmarks(currentMeta.id, updated);
    },
    [currentMeta, bookmarks]
  );

  const handleEditBookmark = useCallback(
    async (id: string, note: string) => {
      if (!currentMeta) return;
      const updated = bookmarks.map((b) => (b.id === id ? { ...b, note } : b));
      setBookmarks(updated);
      await offlineStorage.saveBookmarks(currentMeta.id, updated);
    },
    [currentMeta, bookmarks]
  );

  const toggleCurrentPageBookmark = useCallback(() => {
    const existing = bookmarks.find((b) => b.pageNumber === currentPage);
    if (existing) {
      handleRemoveBookmark(existing.id);
    } else {
      handleAddBookmark(currentPage);
    }
  }, [bookmarks, currentPage, handleRemoveBookmark, handleAddBookmark]);

  // Regenerate TOC manually
  const handleRegenerateTOC = useCallback(async () => {
    if (!pdfDoc || !currentMeta) return;
    setIsGeneratingTOC(true);
    try {
      const generated = await PDFService.autoGenerateTOC(pdfDoc);
      setToc(generated);
      await offlineStorage.saveTOC(currentMeta.id, generated);
    } catch (e) {
      console.warn('Failed to regenerate TOC:', e);
    } finally {
      setIsGeneratingTOC(false);
    }
  }, [pdfDoc, currentMeta]);

  // Page Change & reading position update
  const handlePageChange = useCallback(
    (page: number) => {
      if (!pdfDoc) return;
      const target = Math.max(1, Math.min(pdfDoc.numPages, page));
      setCurrentPage(target);
      if (currentMeta) {
        offlineStorage.updateReadingPosition(currentMeta.id, target, scale);
      }
    },
    [pdfDoc, currentMeta, scale]
  );

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(3.0, Math.round((s + 0.15) * 100) / 100));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, Math.round((s - 0.15) * 100) / 100));
  const handleZoomReset = () => setScale(1.0);
  const handleFitWidth = () => setScale(1.35);
  const handleFitPage = () => setScale(0.95);
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Search in Document
  const handleSearch = useCallback(
    async (query: string) => {
      if (!pdfDoc || !query || query.trim().length < 2) {
        setSearchMatches([]);
        setCurrentMatchIdx(0);
        return;
      }
      setIsSearchExecuting(true);
      try {
        const matches = await PDFService.searchDocument(pdfDoc, query);
        setSearchMatches(matches);
        setCurrentMatchIdx(0);
        if (matches.length > 0) {
          handlePageChange(matches[0].pageNumber);
        }
      } catch (e) {
        console.warn('Search error:', e);
      } finally {
        setIsSearchExecuting(false);
      }
    },
    [pdfDoc, handlePageChange]
  );

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % searchMatches.length;
    setCurrentMatchIdx(nextIdx);
    handlePageChange(searchMatches[nextIdx].pageNumber);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIdx(prevIdx);
    handlePageChange(searchMatches[prevIdx].pageNumber);
  };

  const isCurrentPageBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FDFBF7] text-[#4A3F35] font-sans antialiased">
      {/* Top Navigation Header */}
      <Header
        currentMeta={currentMeta}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenFile={handleOpenFile}
        onLoadSample={loadSamplePDF}
        isOfflineCached={isOfflineCached}
        onToggleSaveOffline={toggleSaveOffline}
        onOpenOfflineLibrary={() => setIsOfflineModalOpen(true)}
        offlineCount={offlineDocs.length}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={toggleSimulatedOffline}
        onToggleSearch={() => setIsSearching((prev) => !prev)}
        isSearching={isSearching}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isCurrentPageBookmarked={isCurrentPageBookmarked}
        onToggleBookmark={toggleCurrentPageBookmark}
      />

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          toc={toc}
          isGeneratingTOC={isGeneratingTOC}
          onRegenerateTOC={handleRegenerateTOC}
          currentPage={currentPage}
          onJumpToPage={handlePageChange}
          bookmarks={bookmarks}
          onAddBookmark={handleAddBookmark}
          onRemoveBookmark={handleRemoveBookmark}
          onEditBookmark={handleEditBookmark}
          pageCount={pdfDoc?.numPages || 0}
          thumbnails={thumbnails}
          offlineDocs={offlineDocs}
          onOpenOfflineDoc={handleOpenOfflineDoc}
          onRemoveOfflineDoc={handleRemoveOfflineDoc}
          storageUsage={storageUsage}
        />

        {/* Center PDF Viewport */}
        <PDFCanvasViewer
          pdfDoc={pdfDoc}
          currentPage={currentPage}
          scale={scale}
          rotation={rotation}
          isBookmarked={isCurrentPageBookmarked}
          onPageChange={handlePageChange}
          onOpenFile={handleOpenFile}
          onLoadSample={loadSamplePDF}
          isLoading={isLoading}
          loadingError={loadingError}
          onToggleBookmark={toggleCurrentPageBookmark}
          isOfflineCached={isOfflineCached}
        />

        {/* Search Bar Floating Overlay */}
        <SearchBar
          isOpen={isSearching}
          onClose={() => setIsSearching(false)}
          onSearch={handleSearch}
          matches={searchMatches}
          isSearching={isSearchExecuting}
          currentMatchIndex={currentMatchIdx}
          onNextMatch={handleNextMatch}
          onPrevMatch={handlePrevMatch}
        />

        {/* Bottom Floating Control Bar */}
        {pdfDoc && (
          <ViewerControls
            currentPage={currentPage}
            totalPages={pdfDoc.numPages}
            onPageChange={handlePageChange}
            scale={scale}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onFitWidth={handleFitWidth}
            onFitPage={handleFitPage}
            rotation={rotation}
            onRotate={handleRotate}
            isCurrentPageBookmarked={isCurrentPageBookmarked}
            onToggleBookmark={toggleCurrentPageBookmark}
          />
        )}
      </div>

      {/* Offline Storage Documents Modal */}
      <OfflineManagerModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        documents={offlineDocs}
        onOpenDocument={handleOpenOfflineDoc}
        onRemoveDocument={handleRemoveOfflineDoc}
        storageUsage={storageUsage}
      />
    </div>
  );
}
