import React, { useState, useEffect } from "react";
import { 
  Users, Search, Plus, Edit, Trash2, ShieldCheck, RefreshCw, X, Check, Filter, 
  MapPin, Hash, Phone, Calendar, Group, Briefcase, FileSpreadsheet, PlusCircle,
  ShieldAlert, AlertTriangle, Layers, Upload, Gift, Cake,
  Send, MessageSquare, CheckCircle2, Clock, Video, ExternalLink, Copy, CheckCheck, RotateCcw, Share2, Info, Sparkles
} from "lucide-react";
import { SecretariaMember } from "../types";
import { secretariaMembersService } from "../lib/supabase";

export interface SiteNoticeRecord {
  sent: boolean;
  sentAt?: string;
}

export interface SiteNoticeSettings {
  video1Url: string;
  video2Url: string;
  customHeader?: string;
}

const formatSentDate = (isoStr?: string) => {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month} ${hours}:${mins}`;
  } catch (e) {
    return "";
  }
};

// Helper functions for birthday filtering and card links
const parseBirthDate = (dateStr: string) => {
  if (!dateStr) return null;
  const dateOnly = dateStr.split("T")[0].trim();
  const parts = dateOnly.split(/[-/.\s]+/);
  if (parts.length < 2) return null;

  let yearIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].length === 4 && !isNaN(Number(parts[i]))) {
      yearIndex = i;
      break;
    }
  }

  let day = NaN;
  let month = NaN; // 0-indexed

  if (yearIndex === 0) {
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else if (yearIndex === 2 || (parts.length >= 3 && yearIndex === parts.length - 1)) {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
  } else {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    if (p0 > 12) {
      day = p0;
      month = p1 - 1;
    } else if (p1 > 12) {
      day = p1;
      month = p0 - 1;
    } else {
      day = p0;
      month = p1 - 1;
    }
  }

  if (isNaN(day) || isNaN(month) || month < 0 || month > 11 || day < 1 || day > 31) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        if (dateStr.includes("T") || dateStr.includes("Z")) {
          return { month: d.getUTCMonth(), day: d.getUTCDate() };
        } else {
          return { month: d.getMonth(), day: d.getDate() };
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  return { month, day };
};

const isBirthdayThisMonth = (birthDateStr: string | undefined) => {
  if (!birthDateStr) return false;
  const parsed = parseBirthDate(birthDateStr);
  if (!parsed) return false;
  const now = new Date();
  return parsed.month === now.getMonth();
};

const isBirthdayThisWeek = (birthDateStr: string | undefined) => {
  if (!birthDateStr) return false;
  const parsed = parseBirthDate(birthDateStr);
  if (!parsed) return false;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const bdayThisYear = new Date(currentYear, parsed.month, parsed.day);
  if (bdayThisYear >= startOfWeek && bdayThisYear <= endOfWeek) return true;
  
  const bdayPrevYear = new Date(currentYear - 1, parsed.month, parsed.day);
  if (bdayPrevYear >= startOfWeek && bdayPrevYear <= endOfWeek) return true;
  
  const bdayNextYear = new Date(currentYear + 1, parsed.month, parsed.day);
  if (bdayNextYear >= startOfWeek && bdayNextYear <= endOfWeek) return true;
  
  return false;
};

const formatBirthDate = (dateStr: string | undefined) => {
  if (!dateStr) return "Não cadastrado";
  const parsed = parseBirthDate(dateStr);
  if (!parsed) return dateStr;
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${parsed.day} de ${months[parsed.month]}`;
};

const getBirthdayWhatsAppLinkSec = (m: SecretariaMember) => {
  const cleanCod = m.cod ? m.cod.replace(/\D/g, "") : "";
  const cleanPhone = m.telefone ? m.telefone.replace(/\D/g, "") : "";
  if (!cleanPhone) return "";
  
  let fullNumber = `${cleanCod}${cleanPhone}`;
  if (!fullNumber.startsWith("55") && fullNumber.length >= 10) {
    fullNumber = `55${fullNumber}`;
  }
  
  const msg = `Olá, *${m.nome}*! 🎉\n\nA diretoria da *UMESC* (União de Militares Evangélicos de Santa Catarina) deseja a você um feliz aniversário! 🎂\n\nQue o Senhor Deus o abençoe ricamente, fortalecendo sua fé, sua família e sua honrada caminhada ministerial e militar. 🛡️✨\n\nReceba o nosso carinho e este cartão especial de felicitações:\nhttps://qndjkphfsejuqopmfgas.supabase.co/storage/v1/object/public/bennes%20convites%20e%20eventos/feliz%20aniversario%202026.jpeg`;
  
  return `https://api.whatsapp.com/send?phone=${fullNumber}&text=${encodeURIComponent(msg)}`;
};

// @ts-ignore
import rawOcrText from "../data/raw_ocr.txt?raw";

const getWhatsAppUrl = (cod: string, telefone: string) => {
  const cleanCod = cod.replace(/\D/g, "");
  const cleanPhone = telefone.replace(/\D/g, "");
  let fullNumber = `${cleanCod}${cleanPhone}`;
  if (!fullNumber.startsWith("55") && fullNumber.length >= 10) {
    fullNumber = `55${fullNumber}`;
  }
  return `https://wa.me/${fullNumber}`;
};

function parseOcrData(rawText: string): Omit<SecretariaMember, "id">[] {
  if (!rawText) return [];
  const lines = rawText.split("\n");
  const parsedList: Omit<SecretariaMember, "id">[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 8) continue;

    const grupo = tokens[tokens.length - 1];
    const opm = tokens[tokens.length - 2];
    const dataNascimento = tokens[tokens.length - 3];

    if (!dataNascimento.includes("/")) continue;

    const matricula = tokens[1];

    let phoneIndex = -1;
    let codIndex = -1;

    for (let i = 2; i < tokens.length - 3; i++) {
      const token = tokens[i];
      const isPhone = /^[0-9]{4,5}-?[0-9]{4}$|^[0-9]{8,11}$/.test(token);
      if (isPhone) {
        phoneIndex = i;
        if (i > 2 && /^[0-9]{1,3}$/.test(tokens[i - 1])) {
          codIndex = i - 1;
        }
        break;
      }
    }

    if (phoneIndex === -1) {
      for (let i = 2; i < tokens.length - 3; i++) {
        const token = tokens[i];
        if (/^[0-9-]{8,11}$/.test(token)) {
          phoneIndex = i;
          if (i > 2 && /^[0-9]{1,3}$/.test(tokens[i - 1])) {
            codIndex = i - 1;
          }
          break;
        }
      }
    }

    if (phoneIndex === -1 || codIndex === -1) {
      for (let i = 3; i < tokens.length - 4; i++) {
        if (/^\d{2,3}$/.test(tokens[i]) && /^\d{8,11}$/.test(tokens[i+1])) {
          codIndex = i;
          phoneIndex = i + 1;
          break;
        }
      }
    }

    if (codIndex === -1 || phoneIndex === -1) {
      codIndex = Math.min(4, tokens.length - 4);
      phoneIndex = codIndex + 1;
    }

    const nome = tokens.slice(2, codIndex).join(" ");
    const cod = tokens[codIndex];
    const telefone = tokens[phoneIndex];
    const cidade = tokens.slice(phoneIndex + 1, tokens.length - 3).join(" ");

    parsedList.push({
      matricula,
      nome,
      cod,
      telefone,
      cidade,
      dataNascimento,
      opm,
      grupo
    });
  }

  return parsedList;
}

function splitCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let currentToken = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === separator && !insideQuotes) {
      result.push(currentToken.trim());
      currentToken = "";
    } else {
      currentToken += char;
    }
  }
  result.push(currentToken.trim());

  return result.map(t => {
    let cleaned = t;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    return cleaned.replace(/""/g, '"').trim();
  });
}

function parseBatchText(text: string): Omit<SecretariaMember, "id">[] {
  if (!text) return [];
  const lines = text.split("\n");
  const parsedList: Omit<SecretariaMember, "id">[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect separator: tab, semicolon, vertical bar, or comma
    let separator = "\t";
    if (trimmed.includes(";")) {
      separator = ";";
    } else if (trimmed.includes("|")) {
      separator = "|";
    } else if (trimmed.includes(",")) {
      const commaCount = (trimmed.match(/,/g) || []).length;
      if (commaCount >= 5) {
        separator = ",";
      }
    }

    const tokens = splitCsvLine(trimmed, separator);
    if (tokens.length < 5) {
      // Fallback: split by multiple spaces if no clear separator
      const spaceTokens = trimmed.split(/\s{2,}/).map(t => t.trim());
      if (spaceTokens.length >= 6) {
        tokens.length = 0;
        tokens.push(...spaceTokens);
      } else {
        continue; // skip lines that have insufficient data
      }
    }

    // Sequence requested:
    // Matrícula | NOME | COD | TELEFONE | CIDADE | D.NASC. | OPM | GRUPO
    const matricula = tokens[0] || "";
    const nome = tokens[1] || "";
    const cod = tokens[2] || "";
    const telefone = tokens[3] || "";
    const cidade = tokens[4] || "";
    const dataNascimento = tokens[5] || "";
    let opm = tokens[6] || "PM";
    const grupo = tokens[7] || "";

    // Skip header lines
    if (matricula.toLowerCase().includes("matr") && nome.toLowerCase().includes("nome")) {
      continue;
    }

    // Clean OPM/Corporacao
    opm = opm.toUpperCase().trim();
    if (opm.includes("BOMBEIRO") || opm.includes("BM") || opm.includes("CBMSC")) {
      opm = "BM";
    } else if (opm.includes("PM") || opm.includes("MILITAR") || opm.includes("PMSC")) {
      opm = "PM";
    } else if (opm.includes("CIVIL") || opm.includes("CIV")) {
      opm = "Civil";
    } else if (opm.includes("PC")) {
      opm = "PC";
    } else {
      opm = "PM"; // Default fallback
    }

    if (matricula && nome) {
      parsedList.push({
        matricula,
        nome: nome.toUpperCase(),
        cod,
        telefone,
        cidade: cidade.toUpperCase(),
        dataNascimento,
        opm,
        grupo: grupo.toUpperCase()
      });
    }
  }

  return parsedList;
}

export default function SecretariaMembersSection() {
  const [members, setMembers] = useState<SecretariaMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [opmFilter, setOpmFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [bdayFilter, setBdayFilter] = useState<"all" | "bday_week" | "bday_month">("all");

  const [sentBdayCards, setSentBdayCards] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("umesc_sent_bday_cards_sec");
    return saved ? JSON.parse(saved) : {};
  });

  const toggleBdayCardSent = (matricula: string) => {
    const updated = { ...sentBdayCards, [matricula]: !sentBdayCards[matricula] };
    setSentBdayCards(updated);
    localStorage.setItem("umesc_sent_bday_cards_sec", JSON.stringify(updated));
  };

  // State for Site Migration & Congress notice tracking
  const [sentSiteNotices, setSentSiteNotices] = useState<Record<string, SiteNoticeRecord>>(() => {
    const saved = localStorage.getItem("umesc_sent_site_notices_sec");
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch (e) {
      return {};
    }
  });

  const [noticeFilter, setNoticeFilter] = useState<"all" | "pending" | "sent">("all");
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState<boolean>(false);
  const [noticeToast, setNoticeToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  // Settings for video links and custom message
  const [noticeSettings, setNoticeSettings] = useState<SiteNoticeSettings>(() => {
    const saved = localStorage.getItem("umesc_site_notice_settings_sec");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      video1Url: "https://umesc.social.br/#area-membro",
      video2Url: "https://umesc.social.br/#congresso"
    };
  });

  const saveNoticeSettings = (newSettings: SiteNoticeSettings) => {
    setNoticeSettings(newSettings);
    try {
      localStorage.setItem("umesc_site_notice_settings_sec", JSON.stringify(newSettings));
    } catch (e) {
      console.warn("Falha ao salvar configurações do aviso", e);
    }
  };

  const generateNoticeMessage = (m: Partial<SecretariaMember>) => {
    const nameSalutation = m.nome ? `, *${m.nome}*` : "";
    const v1 = noticeSettings.video1Url?.trim() ? `\n${noticeSettings.video1Url.trim()}` : "";
    const v2 = noticeSettings.video2Url?.trim() ? `\n${noticeSettings.video2Url.trim()}` : "";

    return `Olá${nameSalutation}! Sou o Anderson (suporte ao site)! 🙏\n\nInformamos que o site da UMESC mudou. Agora, para realizar seu cadastro de membro e sua inscrição no XVIII Congresso UMESC — em Balneário Camboriú, dias 12 e 13 de Dezembro — acesse:\nhttps://umesc.social.br/\n\nEssa mudança pode ser confirmada no site antigo (www.umesc.com.br), que exibe um aviso na parte superior indicando o novo endereço.\n\n📹 *Veja como fazer seu acesso de membro:*${v1}\n\n📹 *Veja também como se inscrever no congresso:*${v2}\n\nSecretaria UMESC`;
  };

  const getSiteNoticeWhatsAppUrl = (m: SecretariaMember) => {
    const cleanCod = m.cod ? m.cod.replace(/\D/g, "") : "";
    const cleanPhone = m.telefone ? m.telefone.replace(/\D/g, "") : "";
    if (!cleanPhone) return "";
    
    let fullNumber = `${cleanCod}${cleanPhone}`;
    if (!fullNumber.startsWith("55") && fullNumber.length >= 10) {
      fullNumber = `55${fullNumber}`;
    }

    const msg = generateNoticeMessage(m);
    return `https://api.whatsapp.com/send?phone=${fullNumber}&text=${encodeURIComponent(msg)}`;
  };

  const markSiteNoticeSent = (matricula: string, memberName?: string) => {
    setSentSiteNotices((prev) => {
      const updated = {
        ...prev,
        [matricula]: {
          sent: true,
          sentAt: new Date().toISOString()
        }
      };
      try {
        localStorage.setItem("umesc_sent_site_notices_sec", JSON.stringify(updated));
      } catch (e) {
        console.warn("Falha ao gravar aviso enviado", e);
      }
      return updated;
    });

    setNoticeToast({
      message: `Aviso enviado com sucesso para ${memberName || matricula}!`,
      type: "success"
    });
    setTimeout(() => setNoticeToast(null), 4000);
  };

  const toggleSiteNoticeSent = (matricula: string, memberName?: string) => {
    setSentSiteNotices((prev) => {
      const isCurrentlySent = !!prev[matricula]?.sent;
      const nextSent = !isCurrentlySent;
      const updated = {
        ...prev,
        [matricula]: {
          sent: nextSent,
          sentAt: nextSent ? new Date().toISOString() : undefined
        }
      };
      try {
        localStorage.setItem("umesc_sent_site_notices_sec", JSON.stringify(updated));
      } catch (e) {
        console.warn("Falha ao salvar aviso", e);
      }
      return updated;
    });

    const isNowSent = !sentSiteNotices[matricula]?.sent;
    setNoticeToast({
      message: isNowSent 
        ? `Aviso marcado como enviado para ${memberName || matricula}!`
        : `Aviso de ${memberName || matricula} marcado como pendente.`,
      type: isNowSent ? "success" : "info"
    });
    setTimeout(() => setNoticeToast(null), 3000);
  };

  const handleSendNotice = (member: SecretariaMember) => {
    const url = getSiteNoticeWhatsAppUrl(member);
    if (!url) {
      alert("Este membro não possui telefone/WhatsApp cadastrado ou válido.");
      return;
    }
    markSiteNoticeSent(member.matricula, member.nome);
    window.open(url, "_blank");
  };

  const handleCopyFullNotice = () => {
    const sampleMsg = generateNoticeMessage({
      id: 0,
      matricula: "00000",
      nome: "Irmão(ã)",
      cod: "48",
      telefone: "999999999",
      cidade: "FLORIANÓPOLIS",
      dataNascimento: "",
      opm: "PM",
      grupo: "CAPELANIA"
    });
    navigator.clipboard.writeText(sampleMsg);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };
  
  // Custom batch register & bulk delete states
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchInputText, setBatchInputText] = useState<string>("");
  const [isSavingBatch, setIsSavingBatch] = useState<boolean>(false);
  const [batchSaveProgress, setBatchSaveProgress] = useState<number>(0);
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Custom delete-all confirmation state
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);
  const [confirmInputText, setConfirmInputText] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      alert("Por favor, selecione apenas arquivos de texto (.txt) ou planilhas salvas em CSV (.csv).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setBatchInputText(text);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<SecretariaMember | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    matricula: "",
    nome: "",
    cod: "",
    telefone: "",
    cidade: "",
    dataNascimento: "",
    opm: "PM",
    grupo: ""
  });
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await secretariaMembersService.getMembers();
      setMembers(data);
    } catch (err) {
      console.error("Erro ao carregar membros secretaria:", err);
    } finally {
      setLoading(false);
    }
  };

  const [importStatus, setImportStatus] = useState<{
    total: number;
    parsed: number;
    importing: boolean;
    progress: number;
    error: string | null;
    success: boolean;
  }>({
    total: 783,
    parsed: 0,
    importing: false,
    progress: 0,
    error: null,
    success: false
  });

  const handleBulkImport = async () => {
    try {
      setImportStatus((prev) => ({
        ...prev,
        importing: true,
        error: null,
        success: false,
        progress: 0
      }));

      // Parse the OCR text
      const parsedMembers = parseOcrData(rawOcrText);
      if (parsedMembers.length === 0) {
        throw new Error("Nenhum cadastro pôde ser extraído do arquivo OCR.");
      }

      setImportStatus((prev) => ({
        ...prev,
        parsed: parsedMembers.length
      }));

      // To avoid duplicates, let's check existing matriculas
      const existingMatriculas = new Set(members.map(m => m.matricula.trim().toLowerCase()));
      const toImport = parsedMembers.filter(m => !existingMatriculas.has(m.matricula.trim().toLowerCase()));

      if (toImport.length === 0) {
        setImportStatus((prev) => ({
          ...prev,
          importing: false,
          success: true,
          progress: 100
        }));
        alert("Todos os membros do PDF já estão cadastrados na base de dados!");
        return;
      }

      // Bulk insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < toImport.length; i += batchSize) {
        const batch = toImport.slice(i, i + batchSize);
        // @ts-ignore
        await secretariaMembersService.createMembersBatch(batch);
        
        const progress = Math.min(100, Math.round(((i + batch.length) / toImport.length) * 100));
        setImportStatus((prev) => ({
          ...prev,
          progress
        }));
      }

      setImportStatus((prev) => ({
        ...prev,
        importing: false,
        success: true
      }));

      await fetchMembers();
    } catch (err: any) {
      console.error("Erro durante importação em lote:", err);
      setImportStatus((prev) => ({
        ...prev,
        importing: false,
        error: err?.message || "Ocorreu um erro desconhecido durante a importação."
      }));
    }
  };

  // States for duplicate checker modal
  const [isDupModalOpen, setIsDupModalOpen] = useState(false);
  const [dupTab, setDupTab] = useState<"overview" | "internal" | "missing" | "conflicts" | "hallucinations">("overview");
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [isCleaningHallucinations, setIsCleaningHallucinations] = useState(false);
  const [isImportingMissing, setIsImportingMissing] = useState(false);
  const [importMissingProgress, setImportMissingProgress] = useState(0);
  const [importMissingError, setImportMissingError] = useState<string | null>(null);

  // Parse raw OCR text to list
  const pdfList = parseOcrData(rawOcrText);

  const cleanMat = (m: string) => m ? m.replace(/\D/g, "").trim().toLowerCase() : "";

  // Group database members by clean matricula
  const dbMapAllByCleanMat = new Map<string, SecretariaMember[]>();
  const dbMapFirstByCleanMat = new Map<string, SecretariaMember>();

  members.forEach(m => {
    const cMat = cleanMat(m.matricula);
    if (cMat) {
      if (!dbMapAllByCleanMat.has(cMat)) {
        dbMapAllByCleanMat.set(cMat, []);
      }
      dbMapAllByCleanMat.get(cMat)!.push(m);
      if (!dbMapFirstByCleanMat.has(cMat)) {
        dbMapFirstByCleanMat.set(cMat, m);
      }
    }
  });

  // 1. Internal duplicates in DB
  const internalDuplicates: { matricula: string; members: SecretariaMember[] }[] = [];
  dbMapAllByCleanMat.forEach((mList, cMat) => {
    if (mList.length > 1) {
      internalDuplicates.push({
        matricula: mList[0].matricula,
        members: mList
      });
    }
  });

  // 2. Compare PDF with DB
  const matchedInDb: { pdf: Omit<SecretariaMember, "id">; db: SecretariaMember }[] = [];
  const missingFromDb: Omit<SecretariaMember, "id">[] = [];
  const conflicts: { pdf: Omit<SecretariaMember, "id">; db: SecretariaMember }[] = [];

  pdfList.forEach(pdfMember => {
    const cMat = cleanMat(pdfMember.matricula);
    const dbMember = dbMapFirstByCleanMat.get(cMat);
    
    if (dbMember) {
      const normPdfName = pdfMember.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normDbName = dbMember.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (normPdfName !== normDbName) {
        conflicts.push({ pdf: pdfMember, db: dbMember });
      } else {
        matchedInDb.push({ pdf: pdfMember, db: dbMember });
      }
    } else {
      missingFromDb.push(pdfMember);
    }
  });

  // 3. Hallucinations / Extra Entries Check (Present in DB but NOT in the PDF)
  const pdfMatriculaSet = new Set(pdfList.map(p => cleanMat(p.matricula)));
  const hallucinations = members.filter(dbMember => {
    const cMat = cleanMat(dbMember.matricula);
    // If the database member's matricula is not found in the PDF matriculas set, then it's a hallucination.
    return !pdfMatriculaSet.has(cMat);
  });

  const handleCleanHallucinations = async () => {
    if (window.confirm(`Deseja realmente remover TODOS os ${hallucinations.length} cadastros extras/alucinações da base? Estes nomes NÃO estão presentes na lista do PDF original.`)) {
      try {
        setIsCleaningHallucinations(true);
        const idsToDelete = hallucinations.map(m => m.id).filter((id): id is number => !!id);
        // @ts-ignore
        await secretariaMembersService.deleteMembersBatch(idsToDelete);
        alert(`Limpeza concluída! ${idsToDelete.length} cadastros extras/alucinações foram removidos.`);
        setIsCleaningHallucinations(false);
        await fetchMembers();
      } catch (err: any) {
        console.error(err);
        alert("Erro ao remover extras/alucinações: " + err.message);
        setIsCleaningHallucinations(false);
      }
    }
  };

  const handleAutoDeduplicate = async () => {
    if (window.confirm(`Deseja realmente remover automaticamente todas as duplicidades extras? Serão removidos os cadastros repetidos mantendo apenas um por matrícula.`)) {
      try {
        setIsCleaningDuplicates(true);
        const idsToDelete: number[] = [];
        
        for (const group of internalDuplicates) {
          // Keep group.members[0], delete the rest
          const toDelete = group.members.slice(1);
          for (const m of toDelete) {
            if (m.id) {
              idsToDelete.push(m.id);
            }
          }
        }
        
        // @ts-ignore
        await secretariaMembersService.deleteMembersBatch(idsToDelete);
        alert(`Limpeza concluída! ${idsToDelete.length} cadastros duplicados foram removidos da base.`);
        setIsCleaningDuplicates(false);
        await fetchMembers();
      } catch (err: any) {
        console.error(err);
        alert("Erro ao realizar limpeza automática: " + err.message);
        setIsCleaningDuplicates(false);
      }
    }
  };

  const handleImportMissing = async () => {
    try {
      setIsImportingMissing(true);
      setImportMissingProgress(0);
      setImportMissingError(null);

      const batchSize = 100;
      const toImport = [...missingFromDb];
      if (toImport.length === 0) {
        alert("Todos os membros do PDF já estão cadastrados!");
        setIsImportingMissing(false);
        return;
      }

      for (let i = 0; i < toImport.length; i += batchSize) {
        const batch = toImport.slice(i, i + batchSize);
        // @ts-ignore
        await secretariaMembersService.createMembersBatch(batch);
        const progress = Math.min(100, Math.round(((i + batch.length) / toImport.length) * 100));
        setImportMissingProgress(progress);
      }

      alert(`Sucesso! ${toImport.length} novos membros foram cadastrados.`);
      setIsImportingMissing(false);
      await fetchMembers();
    } catch (err: any) {
      console.error(err);
      setImportMissingError(err?.message || "Erro desconhecido na importação");
      setIsImportingMissing(false);
    }
  };

  const handleOpenModal = (member?: SecretariaMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        matricula: member.matricula || "",
        nome: member.nome || "",
        cod: member.cod || "",
        telefone: member.telefone || "",
        cidade: member.cidade || "",
        dataNascimento: member.dataNascimento || "",
        opm: member.opm || "PM",
        grupo: member.grupo || ""
      });
    } else {
      setEditingMember(null);
      setFormData({
        matricula: "",
        nome: "",
        cod: "47",
        telefone: "",
        cidade: "",
        dataNascimento: "",
        opm: "PM",
        grupo: ""
      });
    }
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.nome.trim()) {
      setFormError("O nome é obrigatório");
      return;
    }
    if (!formData.matricula.trim()) {
      setFormError("A matrícula é obrigatória");
      return;
    }

    try {
      if (editingMember && editingMember.id) {
        // Update
        const success = await secretariaMembersService.updateMember(editingMember.id, formData);
        if (success) {
          await fetchMembers();
          handleCloseModal();
        } else {
          setFormError("Falha ao atualizar cadastro.");
        }
      } else {
        // Create
        // Check duplicate matricula
        const isDuplicate = members.some(m => m.matricula.trim().toLowerCase() === formData.matricula.trim().toLowerCase());
        if (isDuplicate) {
          setFormError("Já existe um membro cadastrado com esta matrícula.");
          return;
        }

        await secretariaMembersService.createMember(formData);
        await fetchMembers();
        handleCloseModal();
      }
    } catch (err) {
      console.error("Erro ao salvar cadastro:", err);
      setFormError("Erro ao salvar cadastro. Tente novamente.");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Deseja realmente remover este membro da secretaria?")) {
      try {
        const success = await secretariaMembersService.deleteMember(id);
        if (success) {
          await fetchMembers();
        } else {
          alert("Erro ao remover cadastro.");
        }
      } catch (err) {
        console.error("Erro ao remover:", err);
      }
    }
  };

  const handleDeleteAll = () => {
    if (members.length === 0) {
      alert("Nenhum membro cadastrado para remover.");
      return;
    }
    setConfirmInputText("");
    setIsDeleteAllModalOpen(true);
  };

  const executeDeleteAll = async () => {
    if (confirmInputText.trim() !== "REMOVER") {
      alert("Por favor, digite exatamente a palavra REMOVER para prosseguir.");
      return;
    }

    try {
      setIsDeletingAll(true);
      await secretariaMembersService.deleteAllMembers();
      alert("Sucesso! Todos os registros foram removidos com sucesso.");
      setIsDeleteAllModalOpen(false);
      setConfirmInputText("");
      await fetchMembers();
    } catch (err: any) {
      console.error("Erro ao deletar toda a base:", err);
      alert("Erro ao remover todos os cadastros: " + (err.message || err));
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSaveBatch = async () => {
    const parsed = parseBatchText(batchInputText);
    if (parsed.length === 0) {
      alert("Nenhum registro válido foi encontrado no texto colado. Verifique o formato.");
      return;
    }

    try {
      setIsSavingBatch(true);
      setBatchSaveProgress(0);

      const existingMatriculas = new Set(members.map(m => m.matricula.trim().toLowerCase()));
      const toImport = parsed.filter(m => !existingMatriculas.has(m.matricula.trim().toLowerCase()));

      if (toImport.length === 0) {
        alert("Todos os membros informados já constam cadastrados na base de dados!");
        setIsSavingBatch(false);
        setIsBatchModalOpen(false);
        setBatchInputText("");
        return;
      }

      const batchSize = 100;
      for (let i = 0; i < toImport.length; i += batchSize) {
        const chunk = toImport.slice(i, i + batchSize);
        // @ts-ignore
        await secretariaMembersService.createMembersBatch(chunk);
        const progress = Math.min(100, Math.round(((i + chunk.length) / toImport.length) * 100));
        setBatchSaveProgress(progress);
      }

      alert(`Sucesso! ${toImport.length} novos membros foram cadastrados em lote.`);
      setBatchInputText("");
      setIsBatchModalOpen(false);
      await fetchMembers();
    } catch (err: any) {
      console.error("Erro ao cadastrar lote:", err);
      alert("Erro ao salvar cadastro em lote: " + (err.message || err));
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Get list of unique cities for filtering
  const uniqueCities = Array.from(new Set(members.map((m) => m.cidade))).filter(Boolean).sort();

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const searchString = `${m.nome} ${m.matricula} ${m.cidade} ${m.grupo} ${m.telefone} ${m.cod} ${m.opm} ${m.dataNascimento}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const matchesOpm = opmFilter === "all" || m.opm === opmFilter;
    const matchesCity = cityFilter === "all" || m.cidade === cityFilter;
    const matchesBday =
      bdayFilter === "all"
        ? true
        : bdayFilter === "bday_week"
          ? isBirthdayThisWeek(m.dataNascimento)
          : isBirthdayThisMonth(m.dataNascimento);

    const matchesNotice =
      noticeFilter === "all"
        ? true
        : noticeFilter === "sent"
          ? !!sentSiteNotices[m.matricula]?.sent
          : !sentSiteNotices[m.matricula]?.sent;

    return matchesSearch && matchesOpm && matchesCity && matchesBday && matchesNotice;
  });

  const membersWithPhoneCount = members.filter(m => m.telefone && m.telefone.replace(/\D/g, "").length >= 8).length;
  const sentNoticesCount = members.filter(m => sentSiteNotices[m.matricula]?.sent).length;
  const pendingNoticesCount = members.length - sentNoticesCount;

  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight font-display flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" /> Lista de Membros da Secretaria (UMESC)
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Visualização, edição e controle cadastral centralizado com sincronização em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Site Notice & Congress Modal Trigger */}
          <button
            onClick={() => setIsNoticeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 hover:text-blue-200 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border border-blue-500/30 shadow-md shadow-blue-500/10"
            title="Aviso do Novo Site & XVIII Congresso UMESC"
          >
            <Send className="w-4 h-4 text-blue-400" />
            <span>Aviso Novo Site & Congresso</span>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 text-[10px] font-mono font-bold">
              {sentNoticesCount}/{membersWithPhoneCount}
            </span>
          </button>

          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border border-indigo-500/20"
            title="Cadastrar múltiplos membros em lote"
          >
            <Layers className="w-4 h-4" />
            Cadastrar em Lote
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Membro
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-[#0b1220]/70 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total de Membros</span>
            <p className="text-xl font-bold text-white font-display mt-0.5">{members.length}</p>
          </div>
        </div>

        <div className="bg-[#0b1220]/70 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Polícia Militar (PM)</span>
            <p className="text-xl font-bold text-white font-display mt-0.5">
              {members.filter(m => m.opm === "PM").length}
            </p>
          </div>
        </div>

        <div className="bg-[#0b1220]/70 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Bombeiros (BM)</span>
            <p className="text-xl font-bold text-white font-display mt-0.5">
              {members.filter(m => m.opm === "BM").length}
            </p>
          </div>
        </div>

        <div className="bg-[#0b1220]/70 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cidades Atendidas</span>
            <p className="text-xl font-bold text-white font-display mt-0.5">{uniqueCities.length}</p>
          </div>
        </div>

        {/* Notice Stats Card */}
        <div 
          onClick={() => setNoticeFilter(noticeFilter === "sent" ? "all" : "sent")}
          className="bg-[#0b1220]/70 border border-blue-500/20 hover:border-blue-500/40 p-4 rounded-2xl flex items-center gap-3 transition-all cursor-pointer group"
          title="Clique para filtrar apenas os membros com aviso enviado"
        >
          <div className="p-3 bg-blue-500/15 group-hover:bg-blue-500/25 text-blue-400 rounded-xl transition-colors">
            <Send className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Avisos Novo Site</span>
            <p className="text-xl font-bold text-white font-display mt-0.5 flex items-baseline gap-1.5">
              <span className="text-emerald-400">{sentNoticesCount}</span>
              <span className="text-xs text-slate-500 font-sans font-normal">/ {members.length}</span>
            </p>
            <span className="text-[9px] text-blue-400/90 font-mono">
              {pendingNoticesCount} pendentes
            </span>
          </div>
        </div>
      </div>


      {/* Filtering and Search Header */}
      <div className="bg-[#0b1220]/40 border border-white/5 p-4 rounded-2xl space-y-3">
        {/* Notice Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/5">
          <span className="text-[10px] uppercase font-black tracking-wider text-blue-400 flex items-center gap-1.5 mr-1">
            <Send className="w-3.5 h-3.5" />
            Avisos Novo Site:
          </span>

          <button
            type="button"
            onClick={() => setNoticeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
              noticeFilter === "all"
                ? "bg-blue-600 text-white font-black shadow-md shadow-blue-500/20"
                : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            Todos ({members.length})
          </button>

          <button
            type="button"
            onClick={() => setNoticeFilter(noticeFilter === "pending" ? "all" : "pending")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
              noticeFilter === "pending"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-black shadow-md shadow-amber-500/10"
                : "bg-slate-900/60 text-amber-400 hover:bg-amber-500/10 border-white/5 hover:border-amber-500/30"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pendentes ({pendingNoticesCount})
          </button>

          <button
            type="button"
            onClick={() => setNoticeFilter(noticeFilter === "sent" ? "all" : "sent")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
              noticeFilter === "sent"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black shadow-md shadow-emerald-500/10"
                : "bg-slate-900/60 text-emerald-400 hover:bg-emerald-500/10 border-white/5 hover:border-emerald-500/30"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Enviados ({sentNoticesCount})
          </button>

          <button
            type="button"
            onClick={() => setIsNoticeModalOpen(true)}
            className="ml-auto px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-blue-950/40 hover:bg-blue-900/50 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ver Modelo & Tutorial</span>
          </button>
        </div>

        {/* Birthday Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-white/5">
          <button
            type="button"
            onClick={() => setBdayFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
              bdayFilter === "all"
                ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            Todos ({members.length})
          </button>

          <button
            type="button"
            onClick={() => setBdayFilter(bdayFilter === "bday_week" ? "all" : "bday_week")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
              bdayFilter === "bday_week"
                ? "bg-pink-500/20 text-pink-300 border-pink-500/40 font-black shadow-md shadow-pink-500/10"
                : "bg-slate-900/60 text-pink-400 hover:bg-pink-500/10 border-white/5 hover:border-pink-500/30"
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-pink-400" />
            Aniversariantes da Semana ({members.filter(m => isBirthdayThisWeek(m.dataNascimento)).length})
          </button>

          <button
            type="button"
            onClick={() => setBdayFilter(bdayFilter === "bday_month" ? "all" : "bday_month")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
              bdayFilter === "bday_month"
                ? "bg-pink-500/20 text-pink-300 border-pink-500/40 font-black shadow-md shadow-pink-500/10"
                : "bg-slate-900/60 text-pink-400 hover:bg-pink-500/10 border-white/5 hover:border-pink-500/30"
            }`}
          >
            <Cake className="w-3.5 h-3.5 text-pink-400" />
            Aniversariantes do Mês ({members.filter(m => isBirthdayThisMonth(m.dataNascimento)).length})
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 pt-1">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-450 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome, matrícula, cidade, grupo ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-xs text-white placeholder-slate-550 focus:outline-none focus:border-amber-500/40 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 shrink-0">
            {/* OPM */}
            <div className="flex items-center gap-1.5 bg-slate-900/40 border border-white/5 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Corporação:</span>
              <select
                value={opmFilter}
                onChange={(e) => setOpmFilter(e.target.value)}
                className="bg-transparent text-xs text-white border-none focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#0b1220] text-white">Todos</option>
                <option value="PM" className="bg-[#0b1220] text-white">PMSC (PM)</option>
                <option value="BM" className="bg-[#0b1220] text-white">CBMSC (BM)</option>
                <option value="Civil" className="bg-[#0b1220] text-white">Civil</option>
                <option value="PC" className="bg-[#0b1220] text-white">Polícia Civil</option>
              </select>
            </div>

            {/* City */}
            <div className="flex items-center gap-1.5 bg-slate-900/40 border border-white/5 rounded-xl px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Cidade:</span>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-transparent text-xs text-white border-none focus:ring-0 focus:outline-none cursor-pointer max-w-[150px]"
              >
                <option value="all" className="bg-[#0b1220] text-white">Todas</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city} className="bg-[#0b1220] text-white">
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Members Grid/Table Container */}
      <div className="bg-[#0b1220]/70 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-slate-400">Consultando base segura do Supabase...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold text-slate-300">Nenhum membro encontrado</p>
            <p className="text-xs text-slate-550 mt-1 max-w-md mx-auto">
              Nenhum registro corresponde aos filtros ou pesquisa informados. Modifique os termos ou adicione um novo cadastro.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#070c18]/30">
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Matrícula</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Nome do Associado</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Contato</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Cidade</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">D. Nascimento</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Corporação</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Grupo</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Aviso Novo Site & Congresso</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.map((member, idx) => (
                  <tr 
                    key={member.id || idx}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Matricula */}
                    <td className="px-4 py-3 text-xs font-mono font-bold text-amber-500 whitespace-nowrap">
                      {member.matricula}
                    </td>

                    {/* Nome */}
                    <td className="px-4 py-3 text-xs font-black text-white uppercase">
                      {member.nome}
                    </td>

                    {/* Contato (DDD + Telefone) */}
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 mr-1">({member.cod})</span>
                          {member.telefone}
                        </div>
                        {member.telefone && (
                          <a
                            href={getWhatsAppUrl(member.cod, member.telefone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-450 rounded-lg transition-all"
                            title="Conversar no WhatsApp"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.419 5.422.002 12.079.002c3.225.001 6.258 1.257 8.537 3.543 2.279 2.285 3.532 5.32 3.53 8.547-.004 6.657-5.424 12.075-12.081 12.075-2.002-.001-3.97-.5-5.719-1.455L0 24zm6.59-4.846c1.6.95 3.16 1.449 4.887 1.45 5.376.002 9.749-4.364 9.753-9.743.003-2.607-1.011-5.059-2.857-6.907-1.846-1.848-4.301-2.865-6.911-2.867-5.38 0-9.752 4.365-9.756 9.745-.002 1.83.491 3.618 1.427 5.175l-1.013 3.7.132-.033 3.843-.925zm11.144-7.466c-.3-.149-1.77-.874-2.046-.975-.276-.101-.476-.149-.676.149-.2.298-.775.975-.95 1.173-.175.198-.35.223-.65.074-1.206-.604-1.996-1.053-2.784-2.408-.208-.356.208-.33.595-1.107.075-.149.038-.276-.019-.387-.057-.111-.476-1.148-.65-1.568-.175-.41-.368-.35-.504-.35h-.431c-.15 0-.395.056-.601.282-.206.227-.788.77-1.788.77s-1.963-.943-2.181-1.24c-.218-.298-1.724-2.292-1.724-4.367 0-2.075 1.081-3.1 1.468-3.5.388-.4 1.113-.48 1.468-.48.356 0 .543.001.711.025.175.024.318.056.45.35.15.337.525 1.281.575 1.38.05.099.075.223.013.347-.063.124-.125.223-.25.372-.125.15-.262.33-.375.44-.125.111-.256.23-.111.48.145.25.644 1.06 1.381 1.716.95.845 1.744 1.108 1.994 1.233.25.124.394.1.543-.074.15-.173.644-.75.819-1.004.175-.254.35-.21.65-.099.3.111 1.906.899 2.231 1.062.325.162.543.243.619.373.075.13.075.753-.225 1.05z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Cidade */}
                    <td className="px-4 py-3 text-xs text-slate-300 font-semibold whitespace-nowrap">
                      {member.cidade}
                    </td>

                    {/* D. Nascimento */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-mono text-slate-300 font-bold">{member.dataNascimento || "Não informado"}</span>
                        {member.dataNascimento && (
                          <div className="flex items-center gap-1 text-[9.5px] font-mono text-slate-400 mt-0.5">
                            <Cake className="w-3 h-3 text-pink-400 shrink-0" />
                            <span className="text-pink-300 font-semibold">{formatBirthDate(member.dataNascimento)}</span>
                            {isBirthdayThisWeek(member.dataNascimento) && (
                              <span className="ml-1 inline-block px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[7px] font-bold uppercase tracking-tight animate-pulse font-sans">
                                Esta Semana! 🎉
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* OPM / Corporacao */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold leading-none ${
                        member.opm === "PM" 
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/10" 
                          : member.opm === "BM"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/10"
                          : "bg-slate-500/10 text-slate-300 border border-slate-500/10"
                      }`}>
                        {member.opm}
                      </span>
                    </td>

                    {/* Grupo */}
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-teal-400 whitespace-nowrap">
                      {member.grupo}
                    </td>

                    {/* Aviso Novo Site & Congresso */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-center">
                      {member.telefone ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {sentSiteNotices[member.matricula]?.sent ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleSiteNoticeSent(member.matricula, member.nome)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 shadow-sm shadow-emerald-500/10 cursor-pointer transition-all"
                                title={sentSiteNotices[member.matricula]?.sentAt 
                                  ? `Aviso enviado em ${new Date(sentSiteNotices[member.matricula]!.sentAt!).toLocaleString("pt-BR")}. Clique para marcar como pendente.` 
                                  : "Aviso enviado. Clique para alternar status."}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Enviado</span>
                                {sentSiteNotices[member.matricula]?.sentAt && (
                                  <span className="text-[8px] font-mono text-emerald-300/80 font-normal ml-0.5">
                                    ({formatSentDate(sentSiteNotices[member.matricula]?.sentAt)})
                                  </span>
                                )}
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleSendNotice(member)}
                                title={`Reenviar mensagem via WhatsApp para ${member.nome}`}
                                className="p-1 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg transition-all cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSendNotice(member)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer border border-blue-400/30"
                                title={`Enviar aviso do novo site e congresso para ${member.nome} via WhatsApp`}
                              >
                                <Send className="w-3 h-3 text-blue-200" />
                                <span>Enviar Aviso</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleSiteNoticeSent(member.matricula, member.nome)}
                                title="Marcar manualmente como enviado sem abrir WhatsApp"
                                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-emerald-500/30"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-550 italic">Sem WhatsApp</span>
                      )}
                    </td>

                    {/* Acoes */}
                    <td className="px-4 py-3 text-xs text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Birthday card tracking sent state checkbox */}
                        {member.dataNascimento && (
                          <label 
                            title={sentBdayCards[member.matricula] ? "Cartão de aniversário já enviado" : "Marcar cartão de aniversário como enviado"}
                            className={`p-1.5 rounded transition-all cursor-pointer flex items-center justify-center border gap-1 text-[9px] font-bold uppercase font-sans tracking-tight shrink-0 select-none ${
                              sentBdayCards[member.matricula]
                                ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30"
                                : "bg-slate-800 hover:bg-slate-700 text-pink-400 border-white/5 hover:border-pink-500/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!sentBdayCards[member.matricula]}
                              onChange={() => toggleBdayCardSent(member.matricula)}
                              className="accent-pink-500 w-3 h-3 cursor-pointer rounded bg-slate-950 border-white/10"
                            />
                            <span className="hidden xl:inline">
                              {sentBdayCards[member.matricula] ? "Enviado" : "Pendente"}
                            </span>
                          </label>
                        )}

                        {/* Send Happy Birthday Card WhatsApp Button */}
                        {member.dataNascimento && (isBirthdayThisWeek(member.dataNascimento) || isBirthdayThisMonth(member.dataNascimento)) && getBirthdayWhatsAppLinkSec(member) && (
                          <a
                            href={getBirthdayWhatsAppLinkSec(member)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Enviar Cartão de Aniversário WhatsApp para ${member.nome}`}
                            className="p-1.5 rounded bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 hover:text-pink-300 transition-colors cursor-pointer flex items-center justify-center border border-pink-500/30 gap-1 text-[9px] font-bold uppercase font-sans tracking-tight shrink-0"
                          >
                            <Gift className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                            <span className="hidden xl:inline">Cartão 🎉</span>
                          </a>
                        )}
                        {member.telefone && (
                          <a
                            href={getWhatsAppUrl(member.cod, member.telefone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all"
                            title="Conversar no WhatsApp"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.419 5.422.002 12.079.002c3.225.001 6.258 1.257 8.537 3.543 2.279 2.285 3.532 5.32 3.53 8.547-.004 6.657-5.424 12.075-12.081 12.075-2.002-.001-3.97-.5-5.719-1.455L0 24zm6.59-4.846c1.6.95 3.16 1.449 4.887 1.45 5.376.002 9.749-4.364 9.753-9.743.003-2.607-1.011-5.059-2.857-6.907-1.846-1.848-4.301-2.865-6.911-2.867-5.38 0-9.752 4.365-9.756 9.745-.002 1.83.491 3.618 1.427 5.175l-1.013 3.7.132-.033 3.843-.925zm11.144-7.466c-.3-.149-1.77-.874-2.046-.975-.276-.101-.476-.149-.676.149-.2.298-.775.975-.95 1.173-.175.198-.35.223-.65.074-1.206-.604-1.996-1.053-2.784-2.408-.208-.356.208-.33.595-1.107.075-.149.038-.276-.019-.387-.057-.111-.476-1.148-.65-1.568-.175-.41-.368-.35-.504-.35h-.431c-.15 0-.395.056-.601.282-.206.227-.788.77-1.788.77s-1.963-.943-2.181-1.24c-.218-.298-1.724-2.292-1.724-4.367 0-2.075 1.081-3.1 1.468-3.5.388-.4 1.113-.48 1.468-.48.356 0 .543.001.711.025.175.024.318.056.45.35.15.337.525 1.281.575 1.38.05.099.075.223.013.347-.063.124-.125.223-.25.372-.125.15-.262.33-.375.44-.125.111-.256.23-.111.48.145.25.644 1.06 1.381 1.716.95.845 1.744 1.108 1.994 1.233.25.124.394.1.543-.074.15-.173.644-.75.819-1.004.175-.254.35-.21.65-.099.3.111 1.906.899 2.231 1.062.325.162.543.243.619.373.075.13.075.753-.225 1.05z"/>
                            </svg>
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenModal(member)}
                          className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Editar Cadastro"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Remover Cadastro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-white/5 bg-[#070c18]/10 text-slate-400 text-[10px] flex justify-between items-center">
          <span>Mostrando {filteredMembers.length} de {members.length} membros cadastrados</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Banco de Dados Supabase Conectado
          </span>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0e1726] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#070c18]/40">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                {editingMember ? <Edit className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-emerald-500" />}
                {editingMember ? "Editar Cadastro de Secretaria" : "Cadastrar Novo Membro Secretaria"}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/10 text-rose-450 text-rose-400 rounded-xl text-xs flex items-start gap-2">
                  <span className="font-bold">Aviso:</span> {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Matricula */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matrícula</label>
                  <input
                    type="text"
                    name="matricula"
                    required
                    placeholder="Ex: 900796-2-1"
                    value={formData.matricula}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>

                {/* OPM */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Corporação</label>
                  <select
                    name="opm"
                    value={formData.opm}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all"
                  >
                    <option value="PM">Polícia Militar (PM)</option>
                    <option value="BM">Bombeiro Militar (BM)</option>
                    <option value="Civil">Civil</option>
                    <option value="PC">Polícia Civil (PC)</option>
                  </select>
                </div>
              </div>

              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome Completo</label>
                <input
                  type="text"
                  name="nome"
                  required
                  placeholder="Ex: ABEL DE OLIVEIRA"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all uppercase"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* COD / DDD */}
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DDD</label>
                  <input
                    type="text"
                    name="cod"
                    placeholder="Ex: 49"
                    value={formData.cod}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>

                {/* Telefone */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefone</label>
                  <input
                    type="text"
                    name="telefone"
                    placeholder="Ex: 999541741"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Cidade */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    placeholder="Ex: CHAPECO"
                    value={formData.cidade}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all uppercase"
                  />
                </div>

                {/* Data Nascimento */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data de Nascimento</label>
                  <input
                    type="text"
                    name="dataNascimento"
                    placeholder="Ex: 14/01/1958"
                    value={formData.dataNascimento}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Grupo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grupo Associativo / Setor</label>
                <input
                  type="text"
                  name="grupo"
                  placeholder="Ex: GRUMECH, UMESC, etc."
                  value={formData.grupo}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all uppercase"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-2 bg-[#070c18]/10 -mx-5 -mb-5 px-5 py-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-white/5 rounded-xl hover:bg-white/5 text-slate-300 text-xs uppercase font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs uppercase font-black rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  {editingMember ? "Atualizar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate and Integrity Analysis Modal */}
      {isDupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0e1726] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#070c18]/40">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                    Análise de Integridade e Importação (PDF)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Verificação de duplicidades e comparação em lote com o arquivo PDF consolidado.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDupModalOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-white/5 bg-[#0a101d]/60 px-6 overflow-x-auto">
              <button
                onClick={() => setDupTab("overview")}
                className={`py-3 px-4 text-xs font-bold uppercase border-b-2 transition-all whitespace-nowrap ${
                  dupTab === "overview" 
                    ? "border-amber-500 text-amber-500" 
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setDupTab("internal")}
                className={`py-3 px-4 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  dupTab === "internal" 
                    ? "border-amber-500 text-amber-500" 
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Duplicidades Internas ({internalDuplicates.length})
              </button>
              <button
                onClick={() => setDupTab("missing")}
                className={`py-3 px-4 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  dupTab === "missing" 
                    ? "border-amber-500 text-amber-500" 
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Membros Faltantes ({missingFromDb.length})
              </button>
              <button
                onClick={() => setDupTab("conflicts")}
                className={`py-3 px-4 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  dupTab === "conflicts" 
                    ? "border-amber-500 text-amber-500" 
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Divergências ({conflicts.length})
              </button>
              <button
                onClick={() => setDupTab("hallucinations")}
                className={`py-3 px-4 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  dupTab === "hallucinations" 
                    ? "border-amber-500 text-amber-500" 
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Extras / Alucinações ({hallucinations.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Tab 1: Overview */}
              {dupTab === "overview" && (
                <div className="space-y-6 text-left">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-[#0b1220]/50 border border-white/5 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Membros na Base</span>
                      <p className="text-2xl font-bold text-white mt-1">{members.length}</p>
                    </div>
                    <div className="bg-[#0b1220]/50 border border-white/5 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Membros no PDF</span>
                      <p className="text-2xl font-bold text-white mt-1">{pdfList.length}</p>
                    </div>
                    <div className="bg-[#0b1220]/50 border border-white/5 p-4 rounded-xl">
                      <span className="text-[10px] text-amber-400 uppercase font-semibold">Duplicados Base</span>
                      <p className="text-2xl font-bold text-amber-500 mt-1">{internalDuplicates.reduce((acc, g) => acc + g.members.length - 1, 0)}</p>
                    </div>
                    <div className="bg-[#0b1220]/50 border border-white/5 p-4 rounded-xl">
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold">Novos no PDF</span>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">{missingFromDb.length}</p>
                    </div>
                    <div className="bg-[#0b1220]/50 border border-white/5 p-4 rounded-xl">
                      <span className="text-[10px] text-rose-400 uppercase font-semibold">Extras / Alucinações</span>
                      <p className="text-2xl font-bold text-rose-450 text-rose-400 mt-1">{hallucinations.length}</p>
                    </div>
                  </div>

                  <div className="bg-[#0b1220]/30 border border-white/5 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Status do Diagnóstico</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Realizamos um cruzamento dinâmico entre o arquivo <strong className="text-amber-400">raw_ocr.txt</strong> (extraído do PDF) e a base de dados ativa do sistema. A análise indica que:
                    </p>
                    <ul className="text-xs text-slate-400 space-y-2 pl-4 list-disc">
                      <li>
                        Existem <strong className="text-amber-400">{internalDuplicates.length} matrículas</strong> com cadastros repetidos/duplicados na sua base ativa.
                      </li>
                      <li>
                        Existem <strong className="text-emerald-400">{missingFromDb.length} associados</strong> no PDF que ainda não estão registrados na sua base de dados.
                      </li>
                      <li>
                        Há <strong className="text-slate-200">{matchedInDb.length} cadastros</strong> em perfeita sincronia com o PDF.
                      </li>
                      <li>
                        Há <strong className="text-rose-400">{conflicts.length} associados</strong> com a mesma matrícula porém divergências cadastrais importantes (como nomes atualizados).
                      </li>
                      <li>
                        Há <strong className="text-rose-500 font-bold">{hallucinations.length} cadastros extras / alucinações</strong> na base de dados que não constam na lista do PDF original.
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {internalDuplicates.length > 0 && (
                      <button
                        onClick={handleAutoDeduplicate}
                        disabled={isCleaningDuplicates}
                        className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-550 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isCleaningDuplicates ? "Limpando Duplicados..." : "Limpar Duplicados Extras na Base"}
                      </button>
                    )}

                    {missingFromDb.length > 0 ? (
                      <button
                        onClick={handleImportMissing}
                        disabled={isImportingMissing}
                        className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-550 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        {isImportingMissing ? `Importando (${importMissingProgress}%)` : `Cadastrar ${missingFromDb.length} Faltantes do PDF`}
                      </button>
                    ) : (
                      <div className="flex-1 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Todos os membros do PDF estão cadastrados!
                      </div>
                    )}

                    {hallucinations.length > 0 && (
                      <button
                        onClick={handleCleanHallucinations}
                        disabled={isCleaningHallucinations}
                        className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 text-white disabled:text-slate-550 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isCleaningHallucinations ? "Limpando..." : `Remover ${hallucinations.length} Alucinações / Extras`}
                      </button>
                    )}
                  </div>

                  {isImportingMissing && (
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative border border-white/5">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${importMissingProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-slate-400 text-right">Cadastrando lote de associados em andamento... {importMissingProgress}%</p>
                    </div>
                  )}

                  {importMissingError && (
                    <p className="text-rose-400 text-xs font-bold">Erro na importação: {importMissingError}</p>
                  )}
                </div>
              )}

              {/* Tab 2: Internal Duplicates */}
              {dupTab === "internal" && (
                <div className="space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cadastros Duplicados na Base</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Membros diferentes na base que compartilham o mesmo número de matrícula.</p>
                    </div>
                    {internalDuplicates.length > 0 && (
                      <button
                        onClick={handleAutoDeduplicate}
                        disabled={isCleaningDuplicates}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/10"
                      >
                        Limpar Todos Automaticamente
                      </button>
                    )}
                  </div>

                  {internalDuplicates.length === 0 ? (
                    <div className="text-center py-10 bg-[#0b1220]/30 border border-white/5 rounded-xl">
                      <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-55" />
                      <p className="text-xs font-bold text-emerald-400">Excelente! Sem duplicidades de matrícula na base.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {internalDuplicates.map((group, gIdx) => (
                        <div key={gIdx} className="bg-[#0b1220]/40 border border-amber-500/10 p-4 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" /> Matrícula: {group.matricula} ({group.members.length} cadastros)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.members.map((member, mIdx) => (
                              <div key={member.id || mIdx} className="p-3 bg-slate-900/60 rounded-lg border border-white/5 flex items-start justify-between gap-2 text-xs">
                                <div className="space-y-1">
                                  <p className="font-bold text-white uppercase">{member.nome}</p>
                                  <p className="text-slate-400 text-[10px] flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {member.cidade} | <Briefcase className="w-3 h-3" /> {member.opm} - {member.grupo}
                                  </p>
                                  <p className="text-slate-400 text-[10px] flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> ({member.cod}) {member.telefone}
                                  </p>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`Excluir esta via duplicada do cadastro de ${member.nome}?`)) {
                                      if (member.id) {
                                        await secretariaMembersService.deleteMember(member.id);
                                        await fetchMembers();
                                      }
                                    }
                                  }}
                                  className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded transition-all cursor-pointer"
                                  title="Remover esta via"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Missing from DB */}
              {dupTab === "missing" && (
                <div className="space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Membros Presentes no PDF e Faltantes na Base</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Estes associados constam no documento original, mas não estão registrados no sistema.</p>
                    </div>
                    {missingFromDb.length > 0 && (
                      <button
                        onClick={handleImportMissing}
                        disabled={isImportingMissing}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-550 text-xs font-black uppercase rounded-lg transition-all cursor-pointer"
                      >
                        {isImportingMissing ? `Importando (${importMissingProgress}%)` : `Importar ${missingFromDb.length} Faltantes`}
                      </button>
                    )}
                  </div>

                  {missingFromDb.length === 0 ? (
                    <div className="text-center py-10 bg-[#0b1220]/30 border border-white/5 rounded-xl">
                      <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-55" />
                      <p className="text-xs font-bold text-emerald-400 font-display">Tudo Sincronizado!</p>
                      <p className="text-[10px] text-slate-400 mt-1">Todos os 783 membros do PDF estão ativos na sua base de dados.</p>
                    </div>
                  ) : (
                    <div className="border border-white/5 rounded-xl overflow-hidden">
                      <div className="max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-[#070c18]/40 sticky top-0">
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Matrícula</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Nome</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Contato</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Cidade</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Corporação</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Grupo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                            {missingFromDb.map((m, idx) => (
                              <tr key={idx} className="hover:bg-white/5">
                                <td className="px-4 py-2 font-mono text-slate-300 font-bold">{m.matricula}</td>
                                <td className="px-4 py-2 text-white font-bold uppercase">{m.nome}</td>
                                <td className="px-4 py-2">({m.cod}) {m.telefone}</td>
                                <td className="px-4 py-2 uppercase">{m.cidade}</td>
                                <td className="px-4 py-2">{m.opm}</td>
                                <td className="px-4 py-2 text-teal-400 font-mono font-bold">{m.grupo}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Conflicts */}
              {dupTab === "conflicts" && (
                <div className="space-y-4 text-left">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Divergências de Cadastro Encontradas</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Matrículas iguais que possuem nomes diferentes no PDF comparado com a sua Base.</p>
                  </div>

                  {conflicts.length === 0 ? (
                    <div className="text-center py-10 bg-[#0b1220]/30 border border-white/5 rounded-xl">
                      <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-55" />
                      <p className="text-xs font-bold text-emerald-400">Nenhuma divergência de nome encontrada!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conflicts.map((conflict, idx) => (
                        <div key={idx} className="bg-slate-900/60 border border-rose-500/10 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/10">Matrícula: {conflict.db.matricula}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                              <div>
                                <p className="text-[10px] font-bold text-slate-550 uppercase">Nome na Base de Dados</p>
                                <p className="font-bold text-white uppercase">{conflict.db.nome}</p>
                                <p className="text-[10px] text-slate-400">{conflict.db.cidade} | {conflict.db.opm} - {conflict.db.grupo}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-550 uppercase">Nome no PDF consolidado</p>
                                <p className="font-bold text-amber-500 uppercase">{conflict.pdf.nome}</p>
                                <p className="text-[10px] text-slate-400">{conflict.pdf.cidade} | {conflict.pdf.opm} - {conflict.pdf.grupo}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center">
                            <button
                              onClick={async () => {
                                if (window.confirm(`Deseja atualizar o nome na base para o nome correto do PDF: "${conflict.pdf.nome}"?`)) {
                                  if (conflict.db.id) {
                                    await secretariaMembersService.updateMember(conflict.db.id, { nome: conflict.pdf.nome });
                                    await fetchMembers();
                                  }
                                }
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer"
                            >
                              Usar Nome do PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Hallucinations / Extras */}
              {dupTab === "hallucinations" && (
                <div className="space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cadastros Extras / Alucinações</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Membros cadastrados no sistema que não constam na lista original de 783 nomes do PDF.</p>
                    </div>
                    {hallucinations.length > 0 && (
                      <button
                        onClick={handleCleanHallucinations}
                        disabled={isCleaningHallucinations}
                        className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer shadow-md shadow-rose-500/10"
                      >
                        Remover Todos os Extras
                      </button>
                    )}
                  </div>

                  {hallucinations.length === 0 ? (
                    <div className="text-center py-10 bg-[#0b1220]/30 border border-white/5 rounded-xl">
                      <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-55" />
                      <p className="text-xs font-bold text-emerald-400">Excelente! Nenhum cadastro estranho ou alucinado na base.</p>
                    </div>
                  ) : (
                    <div className="border border-white/5 rounded-xl overflow-hidden">
                      <div className="max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-[#070c18]/40 sticky top-0">
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Matrícula</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Nome</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Contato</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Cidade</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Corporação</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400">Grupo</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                            {hallucinations.map((m, idx) => (
                              <tr key={idx} className="hover:bg-white/5">
                                <td className="px-4 py-2 font-mono text-rose-400 font-bold">{m.matricula}</td>
                                <td className="px-4 py-2 text-white font-bold uppercase">{m.nome}</td>
                                <td className="px-4 py-2">({m.cod}) {m.telefone}</td>
                                <td className="px-4 py-2 uppercase">{m.cidade}</td>
                                <td className="px-4 py-2">{m.opm}</td>
                                <td className="px-4 py-2 text-teal-400 font-mono font-bold">{m.grupo}</td>
                                <td className="px-4 py-2 text-right">
                                  <button
                                    onClick={async () => {
                                      if (window.confirm(`Excluir o cadastro extra/alucinação de ${m.nome}?`)) {
                                        if (m.id) {
                                          await secretariaMembersService.deleteMember(m.id);
                                          await fetchMembers();
                                        }
                                      }
                                    }}
                                    className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded transition-all cursor-pointer"
                                    title="Remover Cadastro Extra"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end gap-2 bg-[#070c18]/30">
              <button
                onClick={() => setIsDupModalOpen(false)}
                className="px-5 py-2 border border-white/5 rounded-xl hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Custom Batch Import (Cadastrar em Lote) */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0b1220] border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <Layers className="w-5 h-5 text-indigo-400" /> Cadastro de Membros em Lote
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Cole múltiplos registros diretamente da sua planilha Excel, arquivo CSV ou bloco de notas.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsBatchModalOpen(false);
                  setBatchInputText("");
                }}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Format Guidelines Box */}
              <div className="bg-slate-900/60 border border-indigo-500/25 p-4 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Sequência de Colunas Solicitada
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  A sequência de campos por linha deve ser exatamente:
                </p>
                <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-white/5 font-mono text-xs text-amber-400 overflow-x-auto whitespace-nowrap">
                  Matrícula <span className="text-slate-600">|</span> NOME <span className="text-slate-600">|</span> COD <span className="text-slate-600">|</span> TELEFONE <span className="text-slate-600">|</span> CIDADE <span className="text-slate-600">|</span> D.NASC. <span className="text-slate-600">|</span> OPM <span className="text-slate-600">|</span> GRUPO
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  *Aceita tabulação (copiado do Excel), ponto-e-vírgula (;), barra vertical (|) ou vírgula (,) como separadores. Linhas em branco serão ignoradas.
                </p>
              </div>

              {/* Drag and Drop / File Input Section */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragging 
                    ? "border-indigo-400 bg-indigo-500/10 text-indigo-300 scale-[0.99]" 
                    : "border-white/10 hover:border-indigo-500/30 bg-slate-900/30 text-slate-400 hover:text-slate-300"
                }`}
                id="csv-dropzone"
              >
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label 
                  htmlFor="csv-file-input" 
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full"
                >
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15">
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-white">
                      Arraste e solte o arquivo CSV ou TXT aqui
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Ou <span className="text-indigo-400 font-bold underline hover:text-indigo-300">clique para procurar</span> no seu computador
                    </p>
                  </div>
                </label>
              </div>

              {/* Text Area Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ou Copie e Cole os Dados Manualmente Abaixo:
                </label>
                <textarea
                  value={batchInputText}
                  onChange={(e) => setBatchInputText(e.target.value)}
                  placeholder="Exemplo:&#10;900796-2-1	ABEL DE OLIVEIRA	49	999541741	CHAPECO	14/01/1958	PM	GRUMECH&#10;901842-1-2	BRENO ALVES	48	988451234	FLORIANOPOLIS	22/08/1975	BM	UMESC"
                  className="w-full h-44 px-4 py-3 bg-slate-900/80 border border-white/5 rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 font-mono transition-all resize-y"
                />
              </div>

              {/* Real-time Parsed Preview */}
              {batchInputText.trim() && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Pré-visualização do Lote ({parseBatchText(batchInputText).length} detectados)
                    </h4>
                    {parseBatchText(batchInputText).length > 0 && (
                      <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg font-bold">
                        Válidos para importação
                      </span>
                    )}
                  </div>

                  {parseBatchText(batchInputText).length === 0 ? (
                    <div className="text-center py-6 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                      <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-1.5 opacity-60" />
                      <p className="text-xs text-rose-400 font-bold">Nenhuma linha válida identificada.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Certifique-se de que os dados possuem pelo menos os campos de Matrícula e Nome.</p>
                    </div>
                  ) : (
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-900/30">
                      <div className="max-h-[220px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-[#070c18]/50 sticky top-0">
                              <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400">Matrícula</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400">Nome</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400">DDD + Fone</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400">Cidade</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400">Nascimento</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400">OPM</th>
                              <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400">Grupo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-[11px] text-slate-300">
                            {parseBatchText(batchInputText).slice(0, 15).map((m, idx) => (
                              <tr key={idx} className="hover:bg-white/5">
                                <td className="px-4 py-2 font-mono text-indigo-400 font-bold">{m.matricula}</td>
                                <td className="px-4 py-2 text-white font-bold uppercase">{m.nome}</td>
                                <td className="px-4 py-2">({m.cod}) {m.telefone}</td>
                                <td className="px-4 py-2 uppercase">{m.cidade}</td>
                                <td className="px-4 py-2">{m.dataNascimento}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    m.opm === "PM" ? "bg-blue-500/10 text-blue-400 border border-blue-500/10" : "bg-rose-500/10 text-rose-400 border border-rose-500/10"
                                  }`}>
                                    {m.opm}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-teal-400 font-mono font-bold uppercase">{m.grupo || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {parseBatchText(batchInputText).length > 15 && (
                          <div className="p-2.5 text-center bg-[#070c18]/30 text-[10px] text-slate-400 border-t border-white/5">
                            Exibindo as primeiras 15 linhas de pré-visualização...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar when saving */}
              {isSavingBatch && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-indigo-400 uppercase tracking-wide">
                    <span>Processando e Salvando Lote Securizado...</span>
                    <span>{batchSaveProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${batchSaveProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end gap-2 bg-[#070c18]/30 rounded-b-3xl">
              <button
                type="button"
                onClick={() => {
                  setIsBatchModalOpen(false);
                  setBatchInputText("");
                }}
                disabled={isSavingBatch}
                className="px-5 py-2 border border-white/5 rounded-xl hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBatch}
                disabled={isSavingBatch || parseBatchText(batchInputText).length === 0}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 text-white disabled:text-slate-550 text-xs uppercase font-black rounded-xl transition-all shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center gap-2"
              >
                {isSavingBatch ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Importar Lote ({parseBatchText(batchInputText).length} Membros)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete All (Remover Todos) */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="bg-[#0b1220] border border-rose-500/20 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            {/* Warning Banner */}
            <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-5 flex items-start gap-4">
              <div className="p-2.5 bg-rose-500/15 text-rose-400 rounded-2xl border border-rose-500/20 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-400 uppercase tracking-wide">
                  Atenção Crítica!
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Esta ação é irreversível e apagará toda a base.
                </p>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4">
              <p className="text-slate-300 text-xs leading-relaxed">
                Você está prestes a remover permanentemente todos os <strong className="text-white font-black">{members.length} membros</strong> cadastrados na base da secretaria da UMESC.
              </p>

              <div className="bg-slate-950/60 rounded-xl p-3 border border-white/5 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Para confirmar, digite <span className="text-rose-400 font-black">REMOVER</span> abaixo:
                </label>
                <input
                  type="text"
                  value={confirmInputText}
                  onChange={(e) => setConfirmInputText(e.target.value)}
                  placeholder="Digite REMOVER aqui"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-rose-500/40 font-mono text-center uppercase tracking-widest font-black transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end gap-2 bg-[#070c18]/30">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setConfirmInputText("");
                }}
                disabled={isDeletingAll}
                className="px-4 py-2 border border-white/5 rounded-xl hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all cursor-pointer disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteAll}
                disabled={isDeletingAll || confirmInputText.trim() !== "REMOVER"}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs uppercase font-black rounded-xl transition-all shadow-lg shadow-rose-650/10 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Apagar Tudo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Aviso Novo Site & XVIII Congresso UMESC */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#0b1220] border border-blue-500/30 rounded-3xl w-full max-w-4xl shadow-2xl shadow-blue-500/10 flex flex-col my-6 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-[#0b1220] to-[#0b1220]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-md shadow-blue-500/10">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide font-display">
                    Aviso da Secretaria — Novo Portal & Congresso
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Orientação do suporte (Anderson) sobre a migração de site e inscrições do XVIII Congresso.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNoticeModalOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Status and Progress Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/60 border border-white/5 p-3.5 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Com WhatsApp</span>
                  <span className="text-lg font-bold text-white font-mono">{membersWithPhoneCount} membros</span>
                </div>
                <div className="bg-slate-900/60 border border-emerald-500/20 p-3.5 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Avisos Enviados</span>
                  <span className="text-lg font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {sentNoticesCount} ({Math.round((sentNoticesCount / (members.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-amber-500/20 p-3.5 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Avisos Pendentes</span>
                  <span className="text-lg font-bold text-amber-300 font-mono flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    {pendingNoticesCount}
                  </span>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/40 border border-white/5 rounded-2xl">
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white">Ações em Lote:</span> Marque ou alterne rapidamente os registros da secretaria.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Deseja marcar os ${filteredMembers.length} membros filtrados como 'Aviso Enviado'?`)) return;
                      const updated = { ...sentSiteNotices };
                      const now = new Date().toISOString();
                      filteredMembers.forEach((m) => {
                        updated[m.matricula] = { sent: true, sentAt: now };
                      });
                      setSentSiteNotices(updated);
                      try {
                        localStorage.setItem("umesc_sent_site_notices_sec", JSON.stringify(updated));
                      } catch (e) {
                        console.warn(e);
                      }
                      setNoticeToast({
                        message: `${filteredMembers.length} membros marcados como 'Aviso Enviado'!`,
                        type: "success"
                      });
                      setTimeout(() => setNoticeToast(null), 4000);
                    }}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Marcar Filtrados como Enviados
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm("Deseja redefinir todos os envios de aviso para o status 'Pendente'?")) return;
                      setSentSiteNotices({});
                      try {
                        localStorage.removeItem("umesc_sent_site_notices_sec");
                      } catch (e) {
                        console.warn(e);
                      }
                      setNoticeToast({
                        message: "Todos os avisos foram redefinidos para pendente.",
                        type: "info"
                      });
                      setTimeout(() => setNoticeToast(null), 4000);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 text-[11px] font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Redefinir Tudo
                  </button>
                </div>
              </div>

              {/* WhatsApp Message Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    Texto Oficial do Aviso (Disparado via WhatsApp)
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyFullNotice}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer shadow-sm"
                  >
                    {copiedNotice ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                    {copiedNotice ? "Copiado!" : "Copiar Texto"}
                  </button>
                </div>

                <div className="bg-[#0e1726] border border-blue-500/20 rounded-2xl p-4 sm:p-5 relative">
                  <div className="max-w-xl bg-[#09221c] border border-emerald-500/20 text-emerald-50 rounded-2xl p-4 shadow-lg space-y-3 font-sans text-xs leading-relaxed">
                    <p className="font-semibold text-emerald-300">
                      Olá, <span className="underline italic">[Nome do Membro]</span>! Sou o Anderson (suporte ao site)! 🙏
                    </p>
                    <p>
                      Informamos que o site da UMESC mudou. Agora, para realizar seu cadastro de membro e sua inscrição no <strong>XVIII Congresso UMESC</strong> — em Balneário Camboriú, dias 12 e 13 de Dezembro — acesse:
                    </p>
                    <p className="bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30 text-emerald-200 font-mono text-[11px] break-all">
                      https://umesc.social.br/
                    </p>
                    <p className="text-emerald-100/90 text-[11px]">
                      Essa mudança pode ser confirmada no site antigo (<span className="text-emerald-300 underline">www.umesc.com.br</span>), que exibe um aviso na parte superior indicando o novo endereço.
                    </p>
                    <div className="pt-1 space-y-2 border-t border-emerald-500/20">
                      <div>
                        <p className="font-bold text-emerald-200 flex items-center gap-1">
                          📹 Veja como fazer seu acesso de membro:
                        </p>
                        <p className="text-blue-300 underline text-[11px] font-mono mt-0.5 break-all">
                          {noticeSettings.video1Url || "https://umesc.social.br/#area-membro"}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-200 flex items-center gap-1">
                          📹 Veja também como se inscrever no congresso:
                        </p>
                        <p className="text-blue-300 underline text-[11px] font-mono mt-0.5 break-all">
                          {noticeSettings.video2Url || "https://umesc.social.br/#congresso"}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-400 pt-1 text-[11px] uppercase tracking-wider">
                      Secretaria UMESC
                    </p>
                  </div>
                </div>
              </div>

              {/* Video URL Settings */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-amber-400" />
                    Configuração dos Links dos Vídeos Tutoriais
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      saveNoticeSettings({
                        video1Url: "https://umesc.social.br/#area-membro",
                        video2Url: "https://umesc.social.br/#congresso"
                      });
                      setNoticeToast({
                        message: "Links restaurados para os endereços oficiais!",
                        type: "info"
                      });
                      setTimeout(() => setNoticeToast(null), 3000);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white uppercase font-bold transition-colors cursor-pointer"
                  >
                    Restaurar Padrão
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Link do Vídeo 1 (Acesso de Membro):
                    </label>
                    <input
                      type="url"
                      value={noticeSettings.video1Url}
                      onChange={(e) => saveNoticeSettings({ ...noticeSettings, video1Url: e.target.value })}
                      placeholder="https://youtube.com/... ou https://umesc.social.br/#area-membro"
                      className="w-full px-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 font-mono transition-all"
                    />
                    <p className="text-[9.5px] text-slate-500">
                      Instruções para o membro realizar o primeiro acesso com CPF e E-mail.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Link do Vídeo 2 (Inscrição no XVIII Congresso):
                    </label>
                    <input
                      type="url"
                      value={noticeSettings.video2Url}
                      onChange={(e) => saveNoticeSettings({ ...noticeSettings, video2Url: e.target.value })}
                      placeholder="https://youtube.com/... ou https://umesc.social.br/#congresso"
                      className="w-full px-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 font-mono transition-all"
                    />
                    <p className="text-[9.5px] text-slate-500">
                      Instruções para filiados e visitantes garantirem sua vaga e crachá virtual.
                    </p>
                  </div>
                </div>
              </div>

              {/* Video Tutorials Step-by-Step Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-400" />
                  Roteiro Completo dos 2 Tutoriais em Vídeo
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tutorial 1 Card */}
                  <div className="bg-slate-900/40 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">1</span>
                        <h5 className="font-bold text-xs text-white uppercase">Acesso de Membro UMESC</h5>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase">Vídeo 1</span>
                    </div>
                    <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                      <li>
                        Acesse <strong className="text-white">umesc.social.br</strong> e clique em <strong className="text-indigo-300">"Área do Membro"</strong> no topo direito.
                      </li>
                      <li>
                        Se for a primeira vez no novo portal, selecione a aba <strong className="text-white">"Primeiro Acesso"</strong>.
                      </li>
                      <li>
                        Digite seu <strong className="text-white">CPF</strong>, <strong className="text-white">E-mail</strong> e defina sua <strong className="text-white">Senha de Acesso</strong>.
                      </li>
                      <li>
                        Clique no botão verde <strong className="text-emerald-400">"Registrar Nova Credencial"</strong>.
                      </li>
                      <li>
                        Retorne para a aba <strong className="text-white">"Logon Padrão"</strong>, insira sua senha e clique em <strong className="text-indigo-300">"Autenticar Assinatura"</strong>.
                      </li>
                      <li>
                        Revise e aceite os Termos de Uso e LGPD para liberar seu painel e carteirinha digital!
                      </li>
                    </ol>
                  </div>

                  {/* Tutorial 2 Card */}
                  <div className="bg-slate-900/40 border border-amber-500/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center">2</span>
                        <h5 className="font-bold text-xs text-white uppercase">Inscrição no XVIII Congresso</h5>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase">Vídeo 2</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-white/5 space-y-1">
                        <p className="font-bold text-amber-400 text-[11px] uppercase">
                          Opção A: Membros Filiados da UMESC
                        </p>
                        <p className="text-[11px] text-slate-300">
                          Faça login na <strong className="text-white">Área do Membro</strong>, acesse o card do <strong className="text-white">XVIII Congresso</strong> (12 e 13 de Dezembro em Balneário Camboriú) e clique em confirmar para emitir seu crachá virtual.
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-white/5 space-y-1">
                        <p className="font-bold text-blue-400 text-[11px] uppercase">
                          Opção B: Visitantes e Avulsos
                        </p>
                        <p className="text-[11px] text-slate-300">
                          Na página inicial, clique em <strong className="text-white">"Cadastro de Visitantes"</strong>, preencha Nome, CPF e WhatsApp. Acompanhe a qualquer hora em <strong className="text-white">"Consultar Status"</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-[#070c18]/30">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Clique em <strong>"Enviar Aviso"</strong> na tabela para disparar direto no WhatsApp de cada irmão.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNoticeFilter("pending");
                    setIsNoticeModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Filtrar Pendentes na Tabela
                </button>

                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {noticeToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 border border-emerald-500/40 text-white text-xs font-semibold rounded-2xl shadow-2xl shadow-emerald-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-xs leading-snug">{noticeToast.message}</p>
            <p className="text-[10px] text-slate-400">Status atualizado e salvo localmente no seu navegador.</p>
          </div>
          <button 
            type="button"
            onClick={() => setNoticeToast(null)}
            className="p-1 text-slate-500 hover:text-white rounded-lg transition-colors ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
