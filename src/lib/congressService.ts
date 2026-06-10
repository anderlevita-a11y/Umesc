/**
 * Service to manage Congresses, Agendas, Workshops, and Inscriptions
 * Using robust LocalStorage persistence to synchronize between Member and Admin views
 */

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
const INITIAL_CONGRESSES: Congress[] = [
  {
    id: "cong-35",
    title: "35° Congresso Estadual UMESC (Florianópolis)",
    description: "Grande celebração militar estadual com palestras ético-espirituais, simpósios e debates integrados sob o lema 'Valorização Humana, Fé e Resiliência Psicológica nas Forças de Segurança'.",
    date: "13 a 15 de Novembro de 2026",
    location: "Centro de Convenções de Florianópolis - CentroSul, Florianópolis - SC",
    price: 45.00,
    pixKey: "pix@umesc-sc.org.br",
    pixReceiverName: "União Divina dos Oficiais e Praças de Santa Catarina - UMESC",
    workshops: INITIAL_WORKSHOPS,
    agenda: INITIAL_AGENDA,
    status: "open",
    isFeatured: true
  },
  {
    id: "cong-recruta",
    title: "II Recruta Espiritual de Oficiais",
    description: "Retiro técnico-espiritual intensivo para líderes e sargentos, com dinâmicas de ética no comando fardado e fortalecimento de capelanias regionais.",
    date: "04 de Outubro de 2026",
    location: "Sede Recreativa da UMESC, Lages - SC",
    price: 30.00,
    pixKey: "financeiro@umesc-sc.org.br",
    pixReceiverName: "UMESC Regional Planalto",
    workshops: [
      {
        id: "ws-rec-1",
        title: "Treinamento de Capelães Voluntários",
        speaker: "Pastor Sgto PM Gerson",
        capacity: 40,
        registeredCount: 12,
        timeSlot: "Domingo, das 10:00 às 11:30"
      }
    ],
    agenda: [
      {
        id: "ag-rec-1",
        day: "Único",
        time: "08:00",
        title: "Café da manhã de recepção e credenciamento",
        description: "Alinhamento das guarnições metropolitanas."
      }
    ],
    status: "open"
  }
];

// Pre-seeded system inscriptions for simulation purposes (useful for demo checking!)
const SEEDED_INSCRIPTIONS = (congresses: Congress[]): CongressInscription[] => {
  return [
    {
      id: "INS-AZX87",
      congressId: "cong-35",
      congressTitle: "35° Congresso Estadual UMESC (Florianópolis)",
      memberCpf: "102.304.506-88",
      memberName: "Sargento Anderson Marcondes",
      memberEmail: "anderson.marcondes@pm.sc.gov.br",
      memberPhone: "(48) 98844-3232",
      memberRank: "Sargento PM",
      selectedWorkshopIds: ["ws-1", "ws-4"],
      paymentStatus: "pago",
      paymentProofUrl: "MOCK_RECEIPT_OK",
      paymentProofName: "comprovante_pix_anderson.png",
      registrationDate: "2026-06-01T15:20:00Z",
      qrCodeToken: "UMESC-35-AZX87-pago",
      checkedIn: true,
      checkedInAt: "2026-06-08T09:15:00Z",
      memberPhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300"
    },
    {
      id: "INS-UIP98",
      congressId: "cong-35",
      congressTitle: "35° Congresso Estadual UMESC (Florianópolis)",
      memberCpf: "223.334.445-55",
      memberName: "Cabo PM Ricardo Goulart",
      memberEmail: "ricardo.goulart@bombeiros.sc.gov.br",
      memberPhone: "(47) 99122-1144",
      memberRank: "Cabo BM",
      selectedWorkshopIds: ["ws-2"],
      paymentStatus: "em_analise",
      paymentProofUrl: "MOCK_RECEIPT_ANALYSIS",
      paymentProofName: "transfer_print_nubank_banco.jpg",
      registrationDate: "2026-06-05T10:45:12Z",
      qrCodeToken: "UMESC-35-UIP98-analise",
      checkedIn: false,
      memberPhotoUrl: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=300"
    },
    {
      id: "INS-HYP50",
      congressId: "cong-35",
      congressTitle: "35° Congresso Estadual UMESC (Florianópolis)",
      memberCpf: "445.556.667-11",
      memberName: "Soldado PM Júlia Kuster",
      memberEmail: "julia.kuster@pm.sc.gov.br",
      memberPhone: "(48) 99877-0101",
      memberRank: "Soldado PM",
      selectedWorkshopIds: ["ws-1", "ws-3"],
      paymentStatus: "pendente",
      registrationDate: "2026-06-07T18:12:00Z",
      qrCodeToken: "UMESC-35-HYP50-pendente",
      checkedIn: false,
      memberPhotoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300"
    }
  ];
};

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
    return created;
  },

  updateCongress(updated: Congress) {
    const congresses = this.getCongresses();
    const index = congresses.findIndex(c => c.id === updated.id);
    if (index !== -1) {
      congresses[index] = updated;
      this.saveCongresses(congresses);
    }
  },

  setFeaturedCongress(congressId: string) {
    const congresses = this.getCongresses();
    const updated = congresses.map(c => ({
      ...c,
      isFeatured: c.id === congressId
    }));
    this.saveCongresses(updated);
  },

  deleteCongress(congressId: string) {
    const congresses = this.getCongresses();
    const filtered = congresses.filter(c => c.id !== congressId);
    this.saveCongresses(filtered);

    // Filter corresponding inscriptions too
    const inscriptions = this.getInscriptions();
    const filteredIns = inscriptions.filter(i => i.congressId !== congressId);
    this.saveInscriptions(filteredIns);
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
      
      // Update token string to represent payment state
      const rawToken = inscriptions[index].qrCodeToken.split("-");
      if (rawToken.length >= 3) {
        rawToken[3] = status;
        inscriptions[index].qrCodeToken = rawToken.join("-");
      }

      this.saveInscriptions(inscriptions);
      return inscriptions[index];
    }
    return null;
  },

  toggleCheckIn(id: string): CongressInscription | null {
    const inscriptions = this.getInscriptions();
    const index = inscriptions.findIndex(i => i.id === id);
    if (index !== -1) {
      const alreadyChecked = inscriptions[index].checkedIn;
      inscriptions[index].checkedIn = !alreadyChecked;
      inscriptions[index].checkedInAt = !alreadyChecked ? new Date().toISOString() : undefined;
      this.saveInscriptions(inscriptions);
      return inscriptions[index];
    }
    return null;
  }
};
