/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Bell, BellRing, BellOff, Loader2 } from "lucide-react";
import {
  isPushSupported,
  getPushPermissionState,
  getActiveSubscription,
  subscribeToPush,
  unsubscribeFromPush,
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
    getActiveSubscription().then((sub) => {
      if (mounted) setSubscribed(!!sub);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!supported) return null;

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
