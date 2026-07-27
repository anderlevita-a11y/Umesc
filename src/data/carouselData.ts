import { settingsService, carouselConvitesService, carouselEventosService } from "../lib/supabase.ts";

export interface ConviteSlide {
  id: string | number;
  image: string;
  tag: string;
  title: string;
  description: string;
  date: string;
}

export interface EventoSlide {
  id: string | number;
  image: string;
  tag: string;
  title: string;
  description: string;
  place: string;
}

export const DEFAULT_CONVITES: ConviteSlide[] = [];
export const DEFAULT_EVENTOS: EventoSlide[] = [];

export function getStoredConvites(): ConviteSlide[] {
  try {
    const saved = localStorage.getItem("umesc_carousel_convites");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getStoredEventos(): EventoSlide[] {
  try {
    const saved = localStorage.getItem("umesc_carousel_eventos");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function fetchConvitesAsync(): Promise<ConviteSlide[]> {
  try {
    const list = await carouselConvitesService.getConvites();
    if (Array.isArray(list)) return list;
  } catch (err) {
    console.warn("Erro ao buscar convites no Supabase:", err);
  }
  const result = await settingsService.getSetting<ConviteSlide[]>("umesc_carousel_convites", []);
  return Array.isArray(result) ? result : [];
}

export async function saveConvitesAsync(list: ConviteSlide[]): Promise<boolean> {
  await carouselConvitesService.saveAllConvites(list);
  return await settingsService.saveSetting("umesc_carousel_convites", list);
}

export async function fetchEventosAsync(): Promise<EventoSlide[]> {
  try {
    const list = await carouselEventosService.getEventos();
    if (Array.isArray(list)) return list;
  } catch (err) {
    console.warn("Erro ao buscar eventos no Supabase:", err);
  }
  const result = await settingsService.getSetting<EventoSlide[]>("umesc_carousel_eventos", []);
  return Array.isArray(result) ? result : [];
}

export async function saveEventosAsync(list: EventoSlide[]): Promise<boolean> {
  await carouselEventosService.saveAllEventos(list);
  return await settingsService.saveSetting("umesc_carousel_eventos", list);
}
