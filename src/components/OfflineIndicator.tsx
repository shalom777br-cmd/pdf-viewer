import React from 'react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  isDocumentOfflineCached?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  isDocumentOfflineCached,
}) => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        id="offline-status-indicator"
        onClick={onToggleSimulatedOffline}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
          isSimulatedOffline
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-800'
            : isOnline
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
            : 'bg-amber-500/10 border-amber-500/40 text-amber-800'
        }`}
        title={
          isSimulatedOffline
            ? 'オフラインシミュレーション中（クリックで解除）'
            : isOnline
            ? 'オンライン接続中（クリックでオフライン動作をテスト）'
            : 'オフライン状態です（保存済みキャッシュで動作中）'
        }
      >
        {isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
            <span className="hidden sm:inline">ONLINE READY</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)] animate-pulse" />
            <span>OFFLINE ACTIVE</span>
          </>
        )}
      </button>

      {isDocumentOfflineCached && (
        <span
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#BC8F8F]/15 text-[#7A4E4E] border border-[#BC8F8F]/30"
          title="このPDFは端末のローカルストレージに保存されているため、通信環境がなくても閲覧可能です"
        >
          <span className="text-[#BC8F8F]">●</span>
          <span>CACHED LOCAL</span>
        </span>
      )}
    </div>
  );
};
