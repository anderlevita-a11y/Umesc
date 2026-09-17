/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Bell, BellRing, X, CheckCircle } from "lucide-react";
import { isPushSupported, getPushPermissionState, subscribeToPush } from "../lib/pushService.ts";

/**
 * Banner flutuante que convida o visitante a ativar as notificações Push da UMESC.
 * Segue o mesmo padrão visual do PWAInstallPrompt.
 */
export default function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;

    const dismissed = sessionStorage.getItem("umesc_push_prompt_dismissed");
    const alreadySubscribed = localStorage.getItem("umesc_push_subscribed") === "true";
    const permission = getPushPermissionState();

    if (!dismissed && !alreadySubscribed && permission === "default") {
      // Pequeno atraso para não competir com o prompt de instalação do PWA
      const timer = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsSubscribing(true);
    const result = await subscribeToPush();
    setIsSubscribing(false);

    if (result.ok) {
      setSubscribed(true);
      setTimeout(() => setVisible(false), 3000);
    } else {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("umesc_push_prompt_dismissed", "true");
  };

  if (!visible) return null;

  return (
    <div
      id="push-notification-prompt"
      className="fixed bottom-5 left-5 z-45 max-w-sm w-full bg-[#111e30]/95 backdrop-blur-md border border-teal-500/40 rounded-2xl p-4 shadow-2xl text-white animate-fadeIn"
    >
      {subscribed ? (
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-extrabold text-emerald-300">Notificações ativadas!</p>
            <p className="text-slate-300">Você receberá os avisos oficiais da UMESC em tempo real.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#09121d] border border-teal-500/50 shrink-0 flex items-center justify-center shadow-inner text-teal-400">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-400 font-display">
                  Ativar Notificações
                </h4>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Receba os avisos e comunicados oficiais da UMESC direto no seu dispositivo.
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
            <span className="text-[9px] font-mono text-teal-400 flex items-center gap-1">
              <Bell className="w-3 h-3" /> Grátis e a qualquer momento você pode desativar
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDismiss}
                className="px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Depois
              </button>
              <button
                id="btn-enable-push-action"
                onClick={handleEnable}
                disabled={isSubscribing}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Bell className="w-3.5 h-3.5" />
                {isSubscribing ? "Ativando..." : "Ativar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
