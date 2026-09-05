import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      {isInstallable && (
        <button
          id="pwa-install-btn"
          onClick={install}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#BC8F8F] px-2.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-[#AA7C7C] active:bg-[#966868] transition-colors cursor-pointer"
          title="アプリを端末にインストールして、より素早くオフライン起動できます"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">インストール</span>
        </button>
      )}

      {!isInstallable && isIOS && (
        <button
          id="pwa-ios-install-btn"
          onClick={() => setShowIOSPrompt(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#E8E1D9] bg-[#F8F5F0] px-2.5 py-1.5 text-xs font-medium text-[#4A3F35] hover:bg-[#E8E1D9] transition-colors cursor-pointer shadow-2xs"
          title="iOSホーム画面に追加"
        >
          <Share className="w-3.5 h-3.5 text-[#BC8F8F]" />
          <span className="hidden sm:inline">ホーム画面に追加</span>
        </button>
      )}

      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl border border-[#E8E1D9]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D9]">
              <h3 className="text-sm font-semibold text-[#2A241F]">iPhone / iPad に追加</h3>
              <button
                onClick={() => setShowIOSPrompt(false)}
                className="rounded p-1 text-[#A09080] hover:bg-[#E8E1D9] hover:text-[#2A241F] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#4A3F35]">
              1. Safari下部の<strong>共有ボタン（四角から上矢印）</strong>をタップします。<br />
              2. メニューを下にスクロールし、<strong>「ホーム画面に追加」</strong>を選択します。<br />
              3. 電波のない場所でも本PDFビューワーを直接開けるようになります。
            </p>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowIOSPrompt(false)}
                className="px-3.5 py-1.5 rounded-md bg-[#BC8F8F] text-white text-xs font-medium hover:bg-[#AA7C7C] transition-colors cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
