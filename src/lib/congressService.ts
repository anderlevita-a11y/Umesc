/**
 * Service to manage Congresses, Agendas, Workshops, and Inscriptions
 * Using robust LocalStorage persistence with background Supabase synchronization and Realtime subscriptions
 */

import { supabase, isSupabaseConfigured } from "./supabase";


export interface Workshop {
  id: string;
  title: string;
  speaker: string;
  capacity: number;
  registeredCount: number;
  timeSlot: string; // e.g. "14:00 - 15:30"
}

export interface AgendaItem {
  id: string;
  day: string; // e.g. "Dia 1 (Sexta-feira)", "Dia 2 (Sábado)"
  time: string; // e.g. "19:05"
  title: string;
  description?: string;
}

export interface Congress {
  id: string;
  title: string;
  description: string;
  date: string; // e.g. "10 a 12 de Novembro de 2026"
  location: string; // e.g. "Centro de Eventos Governador Luiz Henrique da Silveira, Florianópolis - SC"
  price: number;
  pixKey: string;
  pixReceiverName: string;
  workshops: Workshop[];
  agenda: AgendaItem[];
  status: "open" | "closed";
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface CongressInscription {
  id: string; // INS-XXXXXX
  congressId: string;
  congressTitle: string;
  memberCpf: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  memberRank: string;
  selectedWorkshopIds: string[]; // list of workshops chosen
  paymentStatus: "pendente" | "em_analise" | "pago" | "recusado";
  paymentProofUrl?: string; // Base64 or mock indicator
  paymentProofName?: string;
  registrationDate: string;
  qrCodeToken: string; // Generated code e.g. "UMESC-35-CF39A-CONF"
  checkedIn: boolean;
  checkedInAt?: string;
  memberPhotoUrl?: string; // photo/avatar uploaded by the member
}

// Default workshops for the main grand congress
const INITIAL_WORKSHOPS: Workshop[] = [
  {
    id: "ws-1",
    title: "Capelania Militar e Saúde Mental das Tropas de Choque",
    speaker: "Major Capelão PM Roberto da Silva",
    capacity: 65,
    registeredCount: 42,
    timeSlot: "Sábado, das 14:00 às 15:30"
  },
  {
    id: "ws-2",
    title: "Atendimento Pré-Hospitalar Tático e Ética no Fardamento",
    speaker: "Capitão BM Diogo Fontes",
    capacity: 50,
    registeredCount: 31,
    timeSlot: "Sábado, das 14:00 às 15:30"
  },
  {
    id: "ws-3",
    title: "Práticas Exegéticas e Círculos de Oração em Batalhões",
    speaker: "Sargento PM Marcelo Neves",
    capacity: 40,
    registeredCount: 15,
    timeSlot: "Sábado, das 16:00 às 17:30"
  },
  {
    id: "ws-4",
    title: "Liderança de Alta Performance e Padrões de Honra Cristã",
    speaker: "Coronel PM Aurélio de Souza",
    capacity: 80,
    registeredCount: 78,
    timeSlot: "Sábado, das 16:00 às 17:30"
  }
];

// Default agenda for the congress
const INITIAL_AGENDA: AgendaItem[] = [
  {
    id: "ag-1",
    day: "13/11 (Sexta-feira)",
    time: "18:30",
    title: "Credenciamento e Entrega de Crachás Oficiais",
    description: "Recepção de oficiais e praças na portaria principal do auditório com validação de QR Code."
  },
  {
    id: "ag-2",
    day: "13/11 (Sexta-feira)",
    time: "19:30",
    title: "Solenidade de Abertura Oficial com Banda da PMSC",
    description: "Entrada das bandeiras, execução do Hino Nacional e palavra de boas-vindas do Comando Geral da UMESC."
  },
  {
    id: "ag-3",
    day: "13/11 (Sexta-feira)",
    time: "20:30",
    title: "Conferência Plenária de Abertura: Vocação Militar e Cristã",
    description: "Ministração principal versando sobre os desafios contemporâneos da ética fardada e fidelidade ao Evangelho."
  },
  {
    id: "ag-4",
    day: "14/11 (Sábado)",
    time: "08:30",
    title: "Círculo de Alvorada e Oração Coletiva de Oficiais",
    description: "Clamor por proteção e sabedoria em prol dos policiais militares, bombeiros e famílias do fardamento de Santa Catarina."
  },
  {
    id: "ag-5",
    day: "14/11 (Sábado)",
    time: "14:00",
    title: "Sessões de Workshops e Oficinas Temáticas",
    description: "Realização paralela de fóruns técnicos em ambientes integrados de capacitação ética."
  },
  {
    id: "ag-6",
    day: "15/11 (Domingo)",
    time: "09:00",
    title: "Devocional de Encerramento e Santa Ceia Integrada",
    description: "Culto de louvor e comunhão solene marcando o comissionamento do efetivo para as regiões catarinenses."
  }
];

// Initial Congress
const INITIAL_CONGRESSES: Congress[] = [];

// Pre-seeded system inscriptions for simulation purposes (useful for demo checking!)
const SEEDED_INSCRIPTIONS = (congresses: Congress[]): CongressInscription[] => {
  return [];
};

/**
 * Robust Background Supabase Sync System
 */
let isSyncInProgress = false;

export async function fetchAllFromSupabaseAndSync() {
  if (!isSupabaseConfigured || !supabase || isSyncInProgress) return;
  isSyncInProgress = true;
  try {
    // Fetch congresses
    const { data: dbCongresses, error: cErr } = await supabase
      .from("congresses")
      .select("*");
    
    // Fetch workshops
    const { data: dbWorkshops, error: wErr } = await supabase
      .from("workshops")
      .select("*");

    // Fetch agenda items
    const { data: dbAgenda, error: aErr } = await supabase
      .from("agenda_items")
      .select("*");

    // Fetch inscriptions
    const { data: dbInscriptions, error: iErr } = await supabase
      .from("inscriptions")
      .select("*");

    if (cErr || wErr || aErr || iErr) {
      console.warn("Erro ao buscar dados do Congresso no Supabase:", cErr || wErr || aErr || iErr);
      isSyncInProgress = false;
      return;
    }

    // Process and assemble Congresses
    const assembledCongresses: Congress[] = (dbCongresses || []).map((c: any) => {
      const filteredWorkshops = (dbWorkshops || [])
        .filter((w: any) => w.congress_id === c.id)
        .map((w: any) => ({
          id: w.id,
          title: w.title,
          speaker: w.speaker,
          capacity: Number(w.capacity),
          registeredCount: Number(w.registered_count || 0),
          timeSlot: w.time_slot
        }));

      const filteredAgenda = (dbAgenda || [])
        .filter((a: any) => a.congress_id === c.id)
        .map((a: any) => ({
          id: a.id,
          day: a.day,
          time: a.time,
          title: a.title,
          description: a.description || ""
        }));

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        date: c.date,
        location: c.location,
        price: Number(c.price || 0),
        pixKey: c.pix_key,
        pixReceiverName: c.pix_receiver_name,
        status: (c.status || "open") as "open" | "closed",
        isFeatured: !!c.is_featured,
        isActive: c.is_active !== false,
        workshops: filteredWorkshops,
        agenda: filteredAgenda
      };
    });

    // Process Inscriptions
    const assembledInscriptions: CongressInscription[] = (dbInscriptions || []).map((ins: any) => {
      let selectedWorkshopIds: string[] = [];
      try {
        if (typeof ins.selected_workshop_ids === "string") {
          selectedWorkshopIds = JSON.parse(ins.selected_workshop_ids);
        } else if (Array.isArray(ins.selected_workshop_ids)) {
          selectedWorkshopIds = ins.selected_workshop_ids;
        }
      } catch (e) {
        selectedWorkshopIds = [];
      }

      return {
        id: ins.id,
        congressId: ins.congress_id,
        congressTitle: ins.congress_title,
        memberCpf: ins.member_cpf,
        memberName: ins.member_name,
        memberEmail: ins.member_email,
        memberPhone: ins.member_phone,
        memberRank: ins.member_rank,
        selectedWorkshopIds,
        paymentStatus: ins.payment_status as any,
        paymentProofUrl: ins.payment_proof_url || "",
        paymentProofName: ins.payment_proof_name || "",
        registrationDate: ins.registration_date,
        qrCodeToken: ins.qr_code_token,
        checkedIn: !!ins.checked_in,
        checkedInAt: ins.checked_in_at || undefined,
        memberPhotoUrl: ins.member_photo_url || ins.payment_proof_url || ""
      };
    });

    // Save to LocalStorage and dispatch event
    localStorage.setItem("umesc_congress_list", JSON.stringify(assembledCongresses));
    localStorage.setItem("umesc_congress_inscriptions", JSON.stringify(assembledInscriptions));
    
    // Dispatch window event so components re-render immediately
    window.dispatchEvent(new Event("umesc-data-sync"));
  } catch (err) {
    console.warn("Exceção durante sincronização com Supabase:", err);
  } finally {
    isSyncInProgress = false;
  }
}

let isRealtimeSubscribed = false;

export function setupCongressRealtimeSubscription() {
  if (isRealtimeSubscribed || !isSupabaseConfigured || !supabase) return;
  isRealtimeSubscribed = true;

  const channel = supabase
    .channel("schema-congresses-db-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "congresses" },
      () => {
        fetchAllFromSupabaseAndSync();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "workshops" },
      () => {
        fetchAllFromSupabaseAndSync();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "agenda_items" },
      () => {
        fetchAllFromSupabaseAndSync();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "inscriptions" },
      () => {
        fetchAllFromSupabaseAndSync();
      }
    )
    .subscribe((status) => {
      console.log(`Canal de Realtime para congressos e inscrições: ${status}`);
    });
}

// Trigger initialization on load
if (isSupabaseConfigured && supabase) {
  fetchAllFromSupabaseAndSync();
  setupCongressRealtimeSubscription();
}


export const congressService = {
  getCongresses(): Congress[] {
    const list = localStorage.getItem("umesc_congress_list");
    if (!list) {
      localStorage.setItem("umesc_congress_list", JSON.stringify(INITIAL_CONGRESSES));
      return INITIAL_CONGRESSES;
    }
    try {
      return JSON.parse(list);
    } catch {
      return INITIAL_CONGRESSES;
    }
  },

  saveCongresses(congresses: Congress[]) {
    localStorage.setItem("umesc_congress_list", JSON.stringify(congresses));
  },

  getInscriptions(): CongressInscription[] {
    const list = localStorage.getItem("umesc_congress_inscriptions");
    if (!list) {
      const seeded = SEEDED_INSCRIPTIONS(this.getCongresses());
      localStorage.setItem("umesc_congress_inscriptions", JSON.stringify(seeded));
      return seeded;
    }
    try {
      return JSON.parse(list);
    } catch {
      const seeded = SEEDED_INSCRIPTIONS(this.getCongresses());
      return seeded;
    }
  },

  saveInscriptions(inscriptions: CongressInscription[]) {
    localStorage.setItem("umesc_congress_inscriptions", JSON.stringify(inscriptions));
  },

  addCongress(newCongress: Omit<Congress, "id" | "workshops" | "agenda">): Congress {
    const congresses = this.getCongresses();
    const id = "cong-" + Math.random().toString(36).substring(2, 9);
    const created: Congress = {
      ...newCongress,
      id,
      workshops: [],
      agenda: []
    };
    congresses.push(created);
    this.saveCongresses(congresses);

    // Write to Supabase in background
    if (isSupabaseConfigured && supabase) {
      supabase.from("congresses").insert({
        id,
        title: created.title,
        description: created.description,
        date: created.date,
        location: created.location,
        price: Number(created.price),
        pix_key: created.pixKey,
        pix_receiver_name: created.pixReceiverName,
        status: created.status,
        is_featured: !!created.isFeatured,
        is_active: created.isActive !== false
      }).then(({ error }) => {
        if (error) console.error("Erro ao criar congresso no Supabase:", error);
      });
    }

    return created;
  },

  updateCongress(updated: Congress) {
    const congresses = this.getCongresses();
    const index = congresses.findIndex(c => c.id === updated.id);
    if (index !== -1) {
      congresses[index] = updated;
      this.saveCongresses(congresses);
    }

    if (isSupabaseConfigured && supabase) {
      // Async full updates
      (async () => {
        try {
          const { error: cErr } = await supabase.from("congresses").update({
            title: updated.title,
            description: updated.description,
            date: updated.date,
            location: updated.location,
            price: Number(updated.price),
            pix_key: updated.pixKey,
            pix_receiver_name: updated.pixReceiverName,
            status: updated.status,
            is_featured: !!updated.isFeatured,
            is_active: updated.isActive !== false
          }).eq("id", updated.id);

          if (cErr) console.error("Erro ao atualizar congresso no Supabase:", cErr);

          // Sync workshops (delete and insert to mirror exact client state)
          await supabase.from("workshops").delete().eq("congress_id", updated.id);
          if (updated.workshops && updated.workshops.length > 0) {
            const { error: wErr } = await supabase.from("workshops").insert(updated.workshops.map(w => ({
              id: w.id,
              congress_id: updated.id,
              title: w.title,
              speaker: w.speaker,
              capacity: Number(w.capacity),
              registered_count: Number(w.registeredCount),
              time_slot: w.timeSlot
            })));
            if (wErr) console.error("Erro ao inserir oficinas no Supabase:", wErr);
          }

          // Sync agenda items
          await supabase.from("agenda_items").delete().eq("congress_id", updated.id);
          if (updated.agenda && updated.agenda.length > 0) {
            const { error: aErr } = await supabase.from("agenda_items").insert(updated.agenda.map(a => ({
              id: a.id,
              congress_id: updated.id,
              day: a.day,
              time: a.time,
              title: a.title,
              description: a.description || ""
            })));
            if (aErr) console.error("Erro ao inserir cronograma no Supabase:", aErr);
          }
        } catch (err) {
          console.error("Exceção na atualização do congresso no Supabase:", err);
        }
      })();
    }
  },

  setFeaturedCongress(congressId: string) {
    const congresses = this.getCongresses();
    const updated = congresses.map(c => ({
      ...c,
      isFeatured: c.id === congressId
    }));
    this.saveCongresses(updated);

    if (isSupabaseConfigured && supabase) {
      (async () => {
        try {
          await supabase.from("congresses").update({ is_featured: false }).neq("id", congressId);
          await supabase.from("congresses").update({ is_featured: true }).eq("id", congressId);
        } catch (e) {
          console.error("Erro ao definir congresso destacado no Supabase:", e);
        }
      })();
    }
  },

  deleteCongress(congressId: string) {
    const congresses = this.getCongresses();
    const filtered = congresses.filter(c => c.id !== congressId);
    this.saveCongresses(filtered);

    const inscriptions = this.getInscriptions();
    const filteredIns = inscriptions.filter(i => i.congressId !== congressId);
    this.saveInscriptions(filteredIns);

    if (isSupabaseConfigured && supabase) {
      supabase.from("congresses").delete().eq("id", congressId).then(({ error }) => {
        if (error) console.error("Erro ao deletar congresso no Supabase:", error);
      });
    }
  },

  addInscription(ins: Omit<CongressInscription, "id" | "registrationDate" | "qrCodeToken" | "checkedIn">): CongressInscription {
    const inscriptions = this.getInscriptions();
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const id = "INS-" + code;
    
    const created: CongressInscription = {
      ...ins,
      id,
      registrationDate: new Date().toISOString(),
      qrCodeToken: `UMESC-${ins.congressId.replace("cong-", "")}-${code}-${ins.paymentStatus}`,
      checkedIn: false
    };

    // Update workshop seats counts
    const congresses = this.getCongresses();
    const cong = congresses.find(c => c.id === ins.congressId);
    if (cong) {
      cong.workshops = cong.workshops.map(ws => {
        if (ins.selectedWorkshopIds.includes(ws.id)) {
          return { ...ws, registeredCount: ws.registeredCount + 1 };
        }
        return ws;
      });
      this.updateCongress(cong);
    }

    inscriptions.push(created);
    this.saveInscriptions(inscriptions);

    // Save to Supabase
    if (isSupabaseConfigured && supabase) {
      (async () => {
        try {
          const dbRecord = {
            id,
            congress_id: created.congressId,
            congress_title: created.congressTitle,
            member_cpf: created.memberCpf,
            member_name: created.memberName,
            member_email: created.memberEmail,
            member_phone: created.memberPhone,
            member_rank: created.memberRank,
            selected_workshop_ids: created.selectedWorkshopIds,
            payment_status: created.paymentStatus,
            payment_proof_url: created.paymentProofUrl || null,
            payment_proof_name: created.paymentProofName || null,
            registration_date: created.registrationDate,
            qr_code_token: created.qrCodeToken,
            checked_in: created.checkedIn,
            is_visitor: created.memberRank === "Visitante"
          };

          const { error } = await supabase.from("inscriptions").insert([dbRecord]);
          if (error) {
            console.error("Erro ao gravar inscrição no Supabase:", error.message);
          }
        } catch (e) {
          console.error("Exceção ao gravar inscrição no Supabase:", e);
        }
      })();
    }

    return created;
  },

  updateInscriptionStatus(id: string, status: CongressInscription["paymentStatus"], proofUrl?: string, proofName?: string): CongressInscription | null {
    const inscriptions = this.getInscriptions();
    const index = inscriptions.findIndex(i => i.id === id);
    if (index !== -1) {
      inscriptions[index].paymentStatus = status;
      if (proofUrl) {
        inscriptions[index].paymentProofUrl = proofUrl;
      }
      if (proofName) {
        inscriptions[index].paymentProofName = proofName;
      }
      
      const rawToken = inscriptions[index].qrCodeToken.split("-");
      if (rawToken.length >= 3) {
        rawToken[3] = status;
        inscriptions[index].qrCodeToken = rawToken.join("-");
      }

      this.saveInscriptions(inscriptions);

      if (isSupabaseConfigured && supabase) {
        const updateFields: any = {
          payment_status: status,
          qr_code_token: inscriptions[index].qrCodeToken
        };
        if (proofUrl) updateFields.payment_proof_url = proofUrl;
        if (proofName) updateFields.payment_proof_name = proofName;

        supabase.from("inscriptions").update(updateFields).eq("id", id).then(({ error }) => {
          if (error) console.error("Erro ao atualizar status do pagamento no Supabase:", error);
        });
      }

      return inscriptions[index];
    }
    return null;
  },

  toggleCheckIn(id: string): CongressInscription | null {
    const inscriptions = this.getInscriptions();
    const index = inscriptions.findIndex(i => i.id === id);
    if (index !== -1) {
      const alreadyChecked = inscriptions[index].checkedIn;
      const checkedInVal = !alreadyChecked;
      const checkedInAtVal = checkedInVal ? new Date().toISOString() : null;

      inscriptions[index].checkedIn = checkedInVal;
      inscriptions[index].checkedInAt = checkedInAtVal || undefined;
      this.saveInscriptions(inscriptions);

      if (isSupabaseConfigured && supabase) {
        supabase.from("inscriptions").update({
          checked_in: checkedInVal,
          checked_in_at: checkedInAtVal
        }).eq("id", id).then(({ error }) => {
          if (error) console.error("Erro ao registrar check-in no Supabase:", error);
        });
      }

      return inscriptions[index];
    }
    return null;
  }
};
