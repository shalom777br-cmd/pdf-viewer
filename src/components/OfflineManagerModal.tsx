import React from 'react';
import { HardDrive, X, ShieldCheck, Trash2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { PDFDocumentMetadata, StorageUsage } from '../types';

interface OfflineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: PDFDocumentMetadata[];
  onOpenDocument: (id: string) => void;
  onRemoveDocument: (id: string) => void;
  storageUsage: StorageUsage;
}

export const OfflineManagerModal: React.FC<OfflineManagerModalProps> = ({
  isOpen,
  onClose,
  documents,
  onOpenDocument,
  onRemoveDocument,
  storageUsage,
}) => {
  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl border border-[#E8E1D9] space-y-4 max-h-[88vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D9]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#BC8F8F]/15 text-[#BC8F8F] flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-[#BC8F8F]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#2A241F]">端末保存済みPDFライブラリ</h3>
              <p className="text-[11px] text-[#A09080]">
                ブラウザのローカルストレージに保存されたドキュメント
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#A09080] hover:bg-[#E8E1D9] hover:text-[#2A241F] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Offline notice info */}
        <div className="p-3 bg-[#F8F5F0] rounded-md border border-[#E8E1D9] flex items-start gap-2.5 text-xs text-[#4A3F35]">
          <ShieldCheck className="w-4 h-4 text-[#BC8F8F] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#2A241F]">通信なしでどこでも閲覧可能</p>
            <p className="text-[11px] text-[#A09080] mt-0.5 leading-relaxed">
              保存されたPDFは端末内部（IndexedDB）に安全に保存されており、機内モードや地下などの電波が届かない場所でもいつでも開くことができます。
            </p>
          </div>
        </div>

        {/* Storage status */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-[#6D5D50]">
            保存ファイル数: <strong className="text-[#2A241F]">{documents.length}</strong> 件
          </span>
          <span className="text-[#6D5D50]">
            使用容量: <strong className="text-[#2A241F]">{formatBytes(storageUsage.usedBytes)}</strong>
          </span>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-[360px]">
          {documents.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#A09080]">
              保存されているPDFはありません。
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-md border border-[#E8E1D9] bg-white hover:border-[#BC8F8F]/50 transition-colors flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <h4 className="text-xs font-bold text-[#2A241F] truncate">
                      {doc.title || doc.fileName}
                    </h4>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[#A09080]">
                    <span>{doc.pageCount} ページ</span>
                    <span>•</span>
                    <span>{formatBytes(doc.fileSize)}</span>
                    <span>•</span>
                    <span>保存: {formatDate(doc.offlineSavedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      onOpenDocument(doc.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#BC8F8F] hover:bg-[#AA7C7C] text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>開く</span>
                  </button>

                  <button
                    onClick={() => onRemoveDocument(doc.id)}
                    className="p-1.5 rounded text-[#A09080] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                    title="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-[#E8E1D9] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-[#F8F5F0] border border-[#E8E1D9] text-xs font-medium text-[#4A3F35] hover:bg-[#E8E1D9] hover:text-[#2A241F] transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
