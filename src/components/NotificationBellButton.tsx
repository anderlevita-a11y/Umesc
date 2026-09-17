/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Bell, BellRing, BellOff, Loader2 } from "lucide-react";
import {
  isPushSupported,
  getPushPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  ensurePushSubscriptionSynced,
  onPushStatusChange,
} from "../lib/pushService.ts";

interface NotificationBellButtonProps {
  variant?: "desktop" | "mobile";
}

/**
 * Botão de notificações Push exibido no cabeçalho do site.
 * Permite ativar/desativar os avisos oficiais da UMESC a qualquer momento,
 * refletindo o estado real da inscrição do navegador atual.
 */
export default function NotificationBellButton({ variant = "desktop" }: NotificationBellButtonProps) {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false);
      return;
    }

    let mounted = true;

    // Ao montar, além de checar o estado, repara automaticamente qualquer inscrição que
    // já exista no navegador (permissão concedida) mas não esteja salva no Supabase —
    // corrige o "falso positivo" sem exigir um segundo clique do visitante.
    ensurePushSubscriptionSynced().then((status) => {
      if (mounted) setSubscribed(status === "subscribed");
    });

    // Mantém o Sino sincronizado com o Banner (e vice-versa): assim que qualquer um dos
    // dois efetivamente ativa/desativa, todos os botões refletem o novo estado na hora.
    const unsubscribe = onPushStatusChange((status) => {
      if (mounted && status !== "unknown") setSubscribed(status === "subscribed");
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const isIosSafariUnsupported = !supported && /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (!supported) {
    // Em vez de simplesmente sumir (o que parecia um botão "quebrado" na versão mobile),
    // explica por que o recurso não está disponível neste navegador — no iPhone/iPad,
    // Web Push só funciona depois de adicionar o site à Tela de Início.
    const message = isIosSafariUnsupported
      ? "No iPhone/iPad, adicione a UMESC à Tela de Início (Compartilhar → Adicionar à Tela de Início) para poder ativar notificações."
      : "Seu navegador não é compatível com notificações push.";

    if (variant === "mobile") {
      return (
        <div
          className="w-full flex items-center justify-center gap-2 py-2 rounded text-[10px] text-center leading-tight border border-dashed border-[#3a5885] text-slate-400 px-2"
          title={message}
        >
          <BellOff className="w-4 h-4 shrink-0" />
          {message}
        </div>
      );
    }

    return (
      <button
        type="button"
        disabled
        title={message}
        className="border border-dashed border-[#3a5885] px-2.5 py-2 rounded text-xs text-slate-400 flex items-center gap-1.5 cursor-help"
      >
        <BellOff className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Indisponível</span>
      </button>
    );
  }

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        const result = await subscribeToPush();
        if (result.ok) {
          setSubscribed(true);
        } else if (result.reason === "denied") {
          alert("As notificações estão bloqueadas nas configurações do seu navegador. Habilite-as para receber os avisos da UMESC.");
        } else {
          // Antes, uma falha aqui (ex.: instabilidade de rede) ficava totalmente
          // silenciosa e o botão simplesmente voltava ao estado "não ativado" sem
          // explicação — dando a impressão de que nada aconteceu.
          alert("Não foi possível ativar as notificações agora. Verifique sua conexão e tente novamente em instantes.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const permission = getPushPermissionState();
  const isBlocked = permission === "denied";

  const Icon = isLoading ? Loader2 : subscribed ? BellRing : isBlocked ? BellOff : Bell;

  if (variant === "mobile") {
    return (
      <button
        type="button"
        id="header-btn-toggle-push-mobile"
        onClick={handleToggle}
        disabled={isLoading}
        title={subscribed ? "Desativar notificações" : "Ativar notificações da UMESC"}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs uppercase font-black border transition-colors ${
          subscribed
            ? "bg-teal-500/10 border-teal-500/40 text-teal-300 hover:bg-teal-500/20"
            : "bg-[#1e2f4a] border-[#3a5885] text-white hover:bg-[#253b5c]/80"
        }`}
      >
        <Icon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""} ${subscribed ? "text-teal-400" : "text-amber-400"}`} />
        {subscribed ? "Notificações Ativadas" : "Ativar Notificações"}
      </button>
    );
  }

  return (
    <button
      type="button"
      id="header-btn-toggle-push"
      onClick={handleToggle}
      disabled={isLoading}
      title={subscribed ? "Notificações ativadas — clique para desativar" : "Ativar notificações da UMESC"}
      className={`border px-2.5 py-2 rounded text-xs transition-colors cursor-pointer font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
        subscribed
          ? "border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300"
          : "border-[#3a5885] bg-[#1e2f4a] hover:bg-[#253b5c]/80 text-white"
      }`}
    >
      <Icon className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""} ${subscribed ? "text-teal-400" : "text-amber-500"}`} />
      <span className="hidden xl:inline">{subscribed ? "Notificações" : "Ativar Avisos"}</span>
    </button>
  );
}
