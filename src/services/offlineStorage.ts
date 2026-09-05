import { PDFDocumentMetadata, BookmarkItem, TOCItem, StorageUsage } from '../types';

const DB_NAME = 'pdf_viewer_offline_db';
const DB_VERSION = 1;

export interface StoredDocumentRecord {
  metadata: PDFDocumentMetadata;
  fileBuffer: ArrayBuffer;
  savedAt: number;
}

export class OfflineStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'metadata.id' });
        }
        if (!db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: 'documentId' });
        }
        if (!db.objectStoreNames.contains('toc_cache')) {
          db.createObjectStore('toc_cache', { keyPath: 'documentId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    });

    return this.dbPromise;
  }

  async saveDocument(
    metadata: PDFDocumentMetadata,
    fileBuffer: ArrayBuffer,
    bookmarks?: BookmarkItem[],
    toc?: TOCItem[]
  ): Promise<void> {
    const db = await this.getDB();
    const docRecord: StoredDocumentRecord = {
      metadata: {
        ...metadata,
        isOfflineAvailable: true,
        offlineSavedAt: Date.now(),
      },
      fileBuffer,
      savedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['documents', 'bookmarks', 'toc_cache'], 'readwrite');
      tx.objectStore('documents').put(docRecord);
      if (bookmarks) {
        tx.objectStore('bookmarks').put({ documentId: metadata.id, items: bookmarks });
      }
      if (toc) {
        tx.objectStore('toc_cache').put({ documentId: metadata.id, items: toc });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async isDocumentOffline(id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('documents', 'readonly');
        const req = tx.objectStore('documents').get(id);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async getDocument(id: string): Promise<{ metadata: PDFDocumentMetadata; fileBuffer: ArrayBuffer } | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readonly');
      const req = tx.objectStore('documents').get(id);
      req.onsuccess = () => {
        if (req.result) {
          resolve({
            metadata: req.result.metadata,
            fileBuffer: req.result.fileBuffer,
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getAllDocuments(): Promise<PDFDocumentMetadata[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readonly');
      const req = tx.objectStore('documents').getAll();
      req.onsuccess = () => {
        const docs = ((req.result as StoredDocumentRecord[]) || []).map((item) => item.metadata);
        docs.sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
        resolve(docs);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async removeDocument(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['documents', 'bookmarks', 'toc_cache'], 'readwrite');
      tx.objectStore('documents').delete(id);
      tx.objectStore('bookmarks').delete(id);
      tx.objectStore('toc_cache').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async saveBookmarks(documentId: string, bookmarks: BookmarkItem[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bookmarks', 'readwrite');
      tx.objectStore('bookmarks').put({ documentId, items: bookmarks });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getBookmarks(documentId: string): Promise<BookmarkItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('bookmarks', 'readonly');
        const req = tx.objectStore('bookmarks').get(documentId);
        req.onsuccess = () => resolve(req.result ? req.result.items : []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async saveTOC(documentId: string, toc: TOCItem[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('toc_cache', 'readwrite');
      tx.objectStore('toc_cache').put({ documentId, items: toc });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getTOC(documentId: string): Promise<TOCItem[] | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('toc_cache', 'readonly');
        const req = tx.objectStore('toc_cache').get(documentId);
        req.onsuccess = () => resolve(req.result ? req.result.items : null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async updateReadingPosition(id: string, currentPage: number, zoomScale: number): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          const record = req.result as StoredDocumentRecord;
          record.metadata.currentPage = currentPage;
          record.metadata.zoomScale = zoomScale;
          record.metadata.lastOpenedAt = Date.now();
          store.put(record);
        }
      };
    } catch (e) {
      console.warn('Failed to update reading position', e);
    }
  }

  async getStorageEstimate(): Promise<StorageUsage> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usedBytes: estimate.usage || 0,
          totalBytes: estimate.quota || 0,
        };
      } catch {
        // Fallback
      }
    }
    return { usedBytes: 0, totalBytes: 0 };
  }
}

export const offlineStorage = new OfflineStorageService();
