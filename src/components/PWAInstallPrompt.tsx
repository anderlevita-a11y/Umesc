import React, { useState, useEffect } from "react";
import { Download, WifiOff, X, CheckCircle, ShieldCheck } from "lucide-react";
import { promptPWAInstall, isPWAInstallAvailable, isRunningStandalone } from "../lib/pwa";

export default function PWAInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem("umesc_pwa_prompt_dismissed");
    if (dismissed) {
      setIsDismissed(true);
    }

    // Check standalone
    if (isRunningStandalone()) {
      setIsInstalled(true);
    }

    // Check initial install availability
    setCanInstall(isPWAInstallAvailable());

    // Listen for custom events
    const handleInstallReady = () => {
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 5000);
    };

    // Online / Offline listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("umesc_pwa_install_ready", handleInstallReady);
      window.addEventListener("umesc_pwa_installed", handleInstalled);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      window.removeEventListener("umesc_pwa_install_ready", handleInstallReady);
      window.removeEventListener("umesc_pwa_installed", handleInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    const success = await promptPWAInstall();
    if (success) {
      setCanInstall(false);
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 5000);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("umesc_pwa_prompt_dismissed", "true");
  };

  return (
    <>
      {/* Offline Status Warning Bar */}
      {isOffline && (
        <div 
          id="pwa-offline-banner"
          className="bg-amber-600/95 text-white px-4 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b border-amber-400/30 shadow-md transition-all sticky top-0 z-50 animate-fadeIn"
        >
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Você está no Modo Offline. Exibindo dados em cache do aplicativo UMESC.</span>
        </div>
      )}

      {/* Install Success Toast */}
      {installSuccess && (
        <div 
          id="pwa-install-success-toast"
          className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fadeIn"
        >
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-extrabold text-emerald-300">App UMESC Instalado!</p>
            <p className="text-slate-300">Agora você pode abrir o app diretamente pela tela de início.</p>
          </div>
        </div>
      )}

      {/* PWA Install Floating Banner (Shown only when install prompt is available & not yet dismissed/installed) */}
      {canInstall && !isInstalled && !isDismissed && (
        <div 
          id="pwa-install-card"
          className="fixed bottom-5 right-5 z-45 max-w-sm w-full bg-[#111e30]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl text-white animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#09121d] border border-amber-500/50 p-1 shrink-0 flex items-center justify-center shadow-inner">
                <img 
                  src="/favicon.png" 
                  alt="UMESC" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 font-display">
                  Instalar App UMESC
                </h4>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Adicione à sua tela inicial para acesso rápido e suporte offline.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> PWA Oficial
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDismiss}
                className="px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Depois
              </button>
              <button
                id="btn-install-pwa-action"
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
