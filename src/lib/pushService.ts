/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Serviço de Web Push Notifications - UMESC
 * Mesmo padrão utilizado no aplicativo MEVAM: inscrições salvas na tabela
 * `push_subscriptions` e disparos processados pela Edge Function
 * `process-push-queue` (envio direto ou via fila `push_queue`).
 */

import { supabase, isSupabaseConfigured, supabaseProjectUrl, supabaseProjectAnonKey } from "./supabase.ts";

// Chave pública VAPID (par gerado exclusivamente para o projeto Supabase da UMESC).
// Pode ser sobrescrita via variável de ambiente VITE_VAPID_PUBLIC_KEY.
const VAPID_PUBLIC_KEY =
  (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY ||
  "BJf8FwXxWPJE3t33U-xI79we8AypfGVi-e--bCDfKSmV7Hm9OFV_bD0HObsRuYHsDh6klgOHPVIOmAmgFwMReaY";

const FUNCTIONS_BASE_URL = `${supabaseProjectUrl}/functions/v1`;

export interface PushDispatchResult {
  success: boolean;
  mode?: "direct_payload" | "queue_processed";
  sentCount?: number;
  totalSent?: number;
  totalCleaned?: number;
  totalTargeted?: number;
  error?: string;
}

export interface PushQueueItem {
  id: string;
  title: string;
  body: string;
  url: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  total_sent: number;
  total_cleaned: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushDeviceRow {
  id: string;
  endpoint: string;
  device_name: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushDeliveryLogRow {
  id: string;
  queue_id: string | null;
  subscription_id: string | null;
  endpoint_host: string | null;
  device_name: string | null;
  status: "sent" | "failed" | "expired";
  status_code: number | null;
  message: string | null;
  created_at: string;
  push_queue?: { title: string } | null;
}

export interface PushHygieneStats {
  totalDevices: number;
  totalSent: number;
  totalFailed: number;
  totalExpired: number;
  totalCleanedHistorico: number;
  lastDeliveryAt: string | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Verifica se o navegador atual suporta Web Push (Service Worker + Push API).
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Estado atual da permissão de notificações no navegador.
 */
export function getPushPermissionState(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Verifica se o dispositivo atual já possui uma inscrição de push ativa.
 */
export async function getActiveSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn("[Push] Erro ao verificar inscrição ativa:", err);
    return null;
  }
}

/**
 * Solicita permissão ao visitante e cria/atualiza a inscrição de Web Push,
 * salvando o endpoint e as chaves criptográficas na tabela `push_subscriptions`.
 */
export async function subscribeToPush(deviceName?: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "denied" };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: "invalid_subscription" };
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          endpoint: json.endpoint,
          keys: json.keys,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          user_agent: navigator.userAgent,
          device_name: deviceName || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );

      if (error) {
        console.error("[Push] Erro ao salvar inscrição no Supabase:", error);
        return { ok: false, reason: "save_failed" };
      }
    }

    localStorage.setItem("umesc_push_subscribed", "true");
    return { ok: true };
  } catch (err) {
    console.error("[Push] Erro ao inscrever para notificações:", err);
    return { ok: false, reason: "exception" };
  }
}

/**
 * Cancela a inscrição de Web Push do dispositivo atual (remove do navegador e do Supabase).
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      if (isSupabaseConfigured && supabase) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      }
    }
    localStorage.removeItem("umesc_push_subscribed");
    return true;
  } catch (err) {
    console.error("[Push] Erro ao cancelar inscrição:", err);
    return false;
  }
}

/**
 * Retorna o total de inscrições de Web Push ativas (usado no Painel de Governança).
 */
export async function getPushSubscriberCount(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  try {
    const { count, error } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true });
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Busca o histórico de disparos de notificações Push (mais recentes primeiro).
 */
export async function getPushHistory(limit = 20): Promise<PushQueueItem[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from("push_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as PushQueueItem[];
  } catch {
    return [];
  }
}

/**
 * Dispara imediatamente uma notificação Push para todos os inscritos.
 * Usa o Modo B (baseado em fila) da Edge Function `process-push-queue`: o registro
 * é criado primeiro em `push_queue` e o `queue_id` é repassado à função, que assume
 * a atualização de status/contadores e o registro detalhado em `push_delivery_log`
 * (necessário para o painel de "Log de Entrega / Higienização" mostrar cada disparo
 * corretamente vinculado ao aviso que o originou).
 * Usado pelo botão "Disparar Web Push" no Painel de Governança UMESC.
 */
export async function dispatchPushNotificationToAll(
  title: string,
  body: string,
  url: string = "/",
): Promise<PushDispatchResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase não configurado" };
  }

  try {
    // 1. Registra o disparo no histórico (push_queue) para exibição no painel.
    const { data: queueRow, error: insertError } = await supabase
      .from("push_queue")
      .insert({ title, body, url, status: "pending" })
      .select()
      .single();

    if (insertError || !queueRow?.id) {
      return { success: false, error: insertError?.message || "Não foi possível registrar o disparo" };
    }

    // 2. Aciona a Edge Function em modo fila — ela lê o registro, envia para todas as
    //    inscrições, grava o log de entrega detalhado e atualiza o próprio `push_queue`.
    const response = await fetch(`${FUNCTIONS_BASE_URL}/process-push-queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseProjectAnonKey}`,
        apikey: supabaseProjectAnonKey,
      },
      body: JSON.stringify({ queue_id: queueRow.id }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "Falha ao disparar notificações" };
    }

    return {
      success: true,
      mode: result.mode,
      sentCount: result.sentCount,
      totalSent: result.totalSent ?? result.sentCount,
      totalCleaned: result.totalCleaned,
      totalTargeted: result.totalTargeted,
    };
  } catch (err) {
    console.error("[Push] Erro ao disparar notificações:", err);
    return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

/**
 * Lista os aparelhos (inscrições Web Push) atualmente cadastrados, mais recentes primeiro.
 */
export async function getRegisteredDevices(limit = 200): Promise<PushDeviceRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, device_name, user_agent, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as PushDeviceRow[];
  } catch {
    return [];
  }
}

/**
 * Remove manualmente um aparelho cadastrado (higienização manual pelo administrador).
 */
export async function removeRegisteredDevice(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from("push_subscriptions").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Busca o log de entrega detalhado (por aparelho/disparo), com o título do aviso
 * associado quando disponível, mais recentes primeiro.
 */
export async function getDeliveryLog(limit = 100): Promise<PushDeliveryLogRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from("push_delivery_log")
      .select("*, push_queue(title)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as unknown as PushDeliveryLogRow[];
  } catch {
    return [];
  }
}

/**
 * Calcula um resumo de higienização: total de aparelhos cadastrados, totais de
 * entregas por status (enviados/falhos/expirados) e o total histórico de tokens
 * expirados já limpos automaticamente pela Edge Function (soma de `total_cleaned`
 * em `push_queue`).
 */
export async function getPushHygieneStats(): Promise<PushHygieneStats> {
  const empty: PushHygieneStats = {
    totalDevices: 0,
    totalSent: 0,
    totalFailed: 0,
    totalExpired: 0,
    totalCleanedHistorico: 0,
    lastDeliveryAt: null,
  };
  if (!isSupabaseConfigured || !supabase) return empty;

  try {
    const [devicesCountRes, sentCountRes, failedCountRes, expiredCountRes, lastLogRes, queueRes] =
      await Promise.all([
        supabase.from("push_subscriptions").select("*", { count: "exact", head: true }),
        supabase.from("push_delivery_log").select("*", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("push_delivery_log").select("*", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("push_delivery_log").select("*", { count: "exact", head: true }).eq("status", "expired"),
        supabase.from("push_delivery_log").select("created_at").order("created_at", { ascending: false }).limit(1),
        supabase.from("push_queue").select("total_cleaned"),
      ]);

    const totalCleanedHistorico = (queueRes.data || []).reduce(
      (acc: number, row: { total_cleaned: number | null }) => acc + (row.total_cleaned || 0),
      0,
    );

    return {
      totalDevices: devicesCountRes.count || 0,
      totalSent: sentCountRes.count || 0,
      totalFailed: failedCountRes.count || 0,
      totalExpired: expiredCountRes.count || 0,
      totalCleanedHistorico,
      lastDeliveryAt: lastLogRes.data?.[0]?.created_at || null,
    };
  } catch {
    return empty;
  }
}
