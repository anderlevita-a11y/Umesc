import convite1 from "../assets/images/umesc_convite_1_1779818301691.png";
import convite2 from "../assets/images/umesc_convite_2_1779818318346.png";
import convite3 from "../assets/images/umesc_convite_3_1779818368346.png";
import evento1 from "../assets/images/umesc_evento_1_1779818334743.png";
import evento2 from "../assets/images/umesc_evento_2_1779818351705.png";
import evento3 from "../assets/images/umesc_evento_3_1779818385804.png";

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

export const DEFAULT_CONVITES: ConviteSlide[] = [
  {
    id: 1,
    image: convite1,
    tag: "CONVITE ESTADUAL",
    title: "Congresso Estadual de Militares Evangélicos de SC",
    description: "Convocação geral para todos os militares evangélicos de Santa Catarina, familiares e vocacionados. Edificação espiritual e unidade militar.",
    date: "Anual - Edição Vigente"
  },
  {
    id: 2,
    image: convite2,
    tag: "ENCONTRO REGIONAL",
    title: "Culto de Gratidão e Posse de Coordenadores",
    description: "Reunião de alinhamento e fortalecimento espiritual para militares estaduais e federais em todas as regiões de Santa Catarina.",
    date: "Acontece nas Regionais UMESC"
  },
  {
    id: 3,
    image: convite3,
    tag: "APOIO FEMININO",
    title: "Encontro de Esposas de Militares - AF-UMESC",
    description: "Espaço dedicado ao fortalecimento das famílias militares, edificação mútua e apoio emocional e espiritual às esposas de agentes públicos.",
    date: "Encontro Mensal"
  }
];

export const DEFAULT_EVENTOS: EventoSlide[] = [
  {
    id: 1,
    image: evento1,
    tag: "AÇÃO SOCIAL",
    title: "Capelania Voluntária nos Batalhões e Unidades",
    description: "Visitas de assistência espiritual, aconselhamento ético e doação de Bíblias e devocionais nos quartéis da PMSC e CBMSC.",
    place: "Quartéis e Batalhões de SC"
  },
  {
    id: 2,
    image: evento2,
    tag: "ASSISTÊNCIA ESPIRITUAL",
    title: "Atendimento Psicoespiritual a Servidores e Famílias",
    description: "Rede de apoio ético-cristão dedicada à saúde mental, prevenções e socorro às famílias de policiais e bombeiros militares.",
    place: "Rede Estadual UMESC"
  },
  {
    id: 3,
    image: evento3,
    tag: "CAMPANHA ESTADUAL",
    title: "Projeto Bíblias e Devocionais para a Tropa",
    description: "Distribuição gratuita do Novo Testamento das Forças de Segurança aos novos recrutas e veteranos em todo o Estado.",
    place: "Academias e Centros de Formação"
  }
];

export function getStoredConvites(): ConviteSlide[] {
  try {
    const saved = localStorage.getItem("umesc_carousel_convites");
    if (!saved) return DEFAULT_CONVITES;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_CONVITES;
  } catch {
    return DEFAULT_CONVITES;
  }
}

export function getStoredEventos(): EventoSlide[] {
  try {
    const saved = localStorage.getItem("umesc_carousel_eventos");
    if (!saved) return DEFAULT_EVENTOS;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_EVENTOS;
  } catch {
    return DEFAULT_EVENTOS;
  }
}
