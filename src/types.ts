export interface TOCItem {
  id: string;
  title: string;
  pageNumber: number;
  level: number;
  source: 'outline' | 'auto-generated';
  children?: TOCItem[];
  order?: number;
  fontSize?: number;
}

export interface BookmarkItem {
  id: string;
  documentId: string;
  pageNumber: number;
  title: string;
  note?: string;
  createdAt: number;
}

export interface PDFDocumentMetadata {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  lastOpenedAt?: number;
  isOfflineAvailable?: boolean;
  offlineSavedAt?: number;
  currentPage?: number;
  zoomScale?: number;
}

export interface SearchMatch {
  pageNumber: number;
  matchIndex: number;
  textSnippet: string;
}

export interface StorageUsage {
  usedBytes: number;
  totalBytes: number;
}
