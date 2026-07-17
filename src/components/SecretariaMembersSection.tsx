import React, { useState, useEffect } from "react";
import { 
  Users, Search, Plus, Edit, Trash2, ShieldCheck, RefreshCw, X, Check, Filter, 
  MapPin, Hash, Phone, Calendar, Group, Briefcase, FileSpreadsheet, PlusCircle,
  ShieldAlert, AlertTriangle, Layers, Upload
} from "lucide-react";
import { SecretariaMember } from "../types";
import { secretariaMembersService } from "../lib/supabase";

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
    const searchString = `${m.nome} ${m.matricula} ${m.cidade} ${m.grupo} ${m.telefone}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const matchesOpm = opmFilter === "all" || m.opm === opmFilter;
    const matchesCity = cityFilter === "all" || m.cidade === cityFilter;

    return matchesSearch && matchesOpm && matchesCity;
  });

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
          <button
            onClick={fetchMembers}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border border-white/5"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
            Sincronizar
          </button>

          <button
            onClick={() => setIsDupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-500 hover:text-amber-400 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border border-amber-550/30"
            title="Verificar duplicidades e comparar com o PDF"
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Verificar Duplicidades
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
            onClick={handleDeleteAll}
            disabled={isDeletingAll || members.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-450 hover:text-rose-400 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border border-rose-550/20 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Remover permanentemente todos os registros da base de dados"
          >
            <Trash2 className="w-4 h-4" />
            Remover Todos
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>

      {/* Import / Sync OCR Data Box */}
      {members.length < 2000 && (
        <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-500" /> Carga de Dados Disponível (PDF de Cadastros)
            </h4>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Detectamos que a base de dados possui apenas {members.length} membros. O arquivo de cadastro consolidado possui <strong className="text-amber-400">783 membros</strong> prontos para serem importados e vinculados ao seu painel.
            </p>
            {importStatus.importing && (
              <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden relative border border-white/5">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${importStatus.progress}%` }}
                ></div>
              </div>
            )}
            {importStatus.success && (
              <p className="text-emerald-400 text-xs font-bold mt-2 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Importação de {importStatus.parsed || 783} membros realizada com sucesso!
              </p>
            )}
            {importStatus.error && (
              <p className="text-rose-400 text-xs font-bold mt-2">
                Erro ao importar: {importStatus.error}
              </p>
            )}
          </div>

          <button
            onClick={handleBulkImport}
            disabled={importStatus.importing}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              importStatus.importing
                ? "bg-slate-800 text-slate-500 border border-white/5"
                : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/10"
            }`}
          >
            {importStatus.importing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processando ({importStatus.progress}%)
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Importar 783 Cadastros do PDF
              </>
            )}
          </button>
        </div>
      )}

      {/* Filtering and Search Header */}
      <div className="bg-[#0b1220]/40 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-4">
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
                    <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                      {member.dataNascimento}
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

                    {/* Acoes */}
                    <td className="px-4 py-3 text-xs text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
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
    </div>
  );
}
