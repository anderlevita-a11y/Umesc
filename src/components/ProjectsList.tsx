/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { INITIAL_PROJECTS } from "../data";
import { Project } from "../types";
import { Heart, Coins, ArrowRight, X, Copy, Check, ShieldCheck, Mail, ArrowUpRight, HelpCircle, UserCheck } from "lucide-react";
import { getCleanImageUrl } from "../lib/imageDriveHelper.ts";

interface ProjectsListProps {
  isDonateModalOpen: boolean;
  setIsDonateModalOpen: (open: boolean) => void;
  selectedPreloadProj?: string;
}

export default function ProjectsList({ isDonateModalOpen, setIsDonateModalOpen, selectedPreloadProj }: ProjectsListProps) {
  // Dynamic projects list with local storage cache
  const [projectsList, setProjectsList] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem("umesc_projects");
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  // Donation active triggers
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    if (projectsList.length > 0 && !activeProject) {
      setActiveProject(projectsList[0]);
    }
  }, [projectsList, activeProject]);

  useEffect(() => {
    const handleReload = () => {
      try {
        const saved = localStorage.getItem("umesc_projects");
        setProjectsList(saved ? JSON.parse(saved) : INITIAL_PROJECTS);
      } catch (err) {
        console.error("Error reloading projects:", err);
      }
    };
    window.addEventListener("umesc_content_updated", handleReload);
    return () => window.removeEventListener("umesc_content_updated", handleReload);
  }, []);
  const [copiedKey, setCopiedKey] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [anonymousDonation, setAnonymousDonation] = useState(false);
  const [donateAmount, setDonateAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donorName, setDonorName] = useState<string>("");
  const [donorEmail, setDonorEmail] = useState<string>("");
  const [lgpdDonateConsent, setLgpdDonateConsent] = useState(false);

  // Volunteering active triggers
  const [volunteeringProject, setVolunteeringProject] = useState<Project | null>(null);
  const [volunteerSuccess, setVolunteerSuccess] = useState(false);
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [volunteerSkill, setVolunteerSkill] = useState("");
  const [lgpdVolConsent, setLgpdVolConsent] = useState(false);

  // Simulated temporary databases
  const [simulationSummary, setSimulationSummary] = useState<{
    id: string;
    amount: number;
    projectTitle: string;
    date: string;
    authCode: string;
  } | null>(null);

  const [volunteerSummary, setVolunteerSummary] = useState<{
    id: string;
    name: string;
    projectTitle: string;
    date: string;
    authCode: string;
  } | null>(null);

  // Set selected project and open donation modal
  const triggerDonate = (project: Project) => {
    setActiveProject(project);
    setDonationSuccess(false);
    setSimulationSummary(null);
    setLgpdDonateConsent(false);
    setIsDonateModalOpen(true);
  };

  // Set selected project and open volunteer block
  const triggerVolunteer = (project: Project) => {
    setVolunteeringProject(project);
    setVolunteerSuccess(false);
    setVolunteerSummary(null);
    setLgpdVolConsent(false);
  };

  const handleCopyPixString = () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : donateAmount;
    const pixString = `00020126580014BR.GOV.BCB.PIX0114umesc@corpmil.org5204000053039865405${finalAmount.toFixed(2)}5802BR5905UMESC6009FLORIANO62070503***`;
    navigator.clipboard.writeText(pixString);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleConfirmDonate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdDonateConsent) return;

    const finalAmount = customAmount ? parseFloat(customAmount) : donateAmount;
    if (!finalAmount || finalAmount <= 0) return;

    // Simulate record encryption
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const mockRefId = `DOA-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    setSimulationSummary({
      id: mockRefId,
      amount: finalAmount,
      projectTitle: activeProject?.title || "Missão Geral",
      date: new Date().toLocaleDateString("pt-BR"),
      authCode: `SHA256-${code}`
    });
    setDonationSuccess(true);
  };

  const handleConfirmVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdVolConsent || !volunteerName || !volunteerEmail) return;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const mockRefId = `VOL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    setVolunteerSummary({
      id: mockRefId,
      name: volunteerName,
      projectTitle: volunteeringProject?.title || "Projetos UMESC",
      date: new Date().toLocaleDateString("pt-BR"),
      authCode: `SHA256-V-${code}`
    });
    setVolunteerSuccess(true);
  };

  return (
    <section id="projects" className="py-20 bg-slate-100 text-slate-900 scroll-mt-20 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3">Suporte & Cooperação</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a2a40] mb-4 font-display">
            Projetos Atuais e Ações Missionárias
          </h2>
          <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full mb-4"></div>
          <p className="text-slate-650 text-xs sm:text-sm font-semibold max-w-2xl mx-auto">
            O alcance prático da UMESC avança na proporção do voluntariado e das semeaduras altruístas. Veja abaixo nossas frentes de socorro emergencial e capelania e apoie de forma rastreável.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {projectsList.map((project) => (
            <div 
              key={project.id}
              className="bg-white border border-slate-200 hover:border-slate-350 rounded-xl overflow-hidden shadow-sm hover:shadow transition-all flex flex-col justify-between h-full"
            >
              
              {/* Image banner */}
              <div className="relative h-48 sm:h-56">
                <img 
                  src={getCleanImageUrl(project.image) || "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600"} 
                  alt={project.title} 
                  className="w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
                
                {/* Badge layout */}
                <span className="absolute top-4 left-4 inline-flex px-3 py-1 rounded text-[9px] font-bold bg-[#1a2a40] text-amber-400 border border-white/10 uppercase tracking-widest">
                  {project.category === "mission" && "Capelania & Fé"}
                  {project.category === "social" && "Ação Comunitária"}
                  {project.category === "educative" && "Formação & Educação"}
                </span>

                <span className="absolute bottom-4 right-4 text-[10px] font-mono font-bold text-[#1a2a40] bg-white/95 px-2.5 py-1 rounded border border-slate-200 uppercase tracking-wider">
                  📍 {project.location}
                </span>
              </div>

              {/* Content block */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#1a2a40] mb-2 leading-snug font-display">{project.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 font-medium">{project.description}</p>
                  
                  <div className="p-3.5 rounded bg-slate-50 border border-slate-250/60 text-xs mb-5">
                    <span className="block font-black text-amber-700 uppercase tracking-widest text-[9px] mb-1">Necessidade Primária:</span>
                    <span className="text-slate-600 font-semibold">{project.detailedNeeds}</span>
                  </div>
                </div>

                {/* Progress bar info */}
                <div>
                  <div className="flex justify-between items-end mb-1 text-xs text-slate-500 font-semibold">
                    <span>Meta Financeira: R$ {project.targetAmount.toLocaleString("pt-BR")}</span>
                    <span className="font-mono text-amber-700 font-bold">{project.raisedPercent}% alcançado</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-5">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" 
                      style={{ width: `${project.raisedPercent}%` }}
                    ></div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    <button
                      id={`project-btn-donate-${project.id}`}
                      onClick={() => triggerDonate(project)}
                      className="flex items-center justify-center gap-1.5 py-3 rounded bg-[#1a2a40] hover:bg-[#131f2e] text-amber-400 font-black text-xs transition-colors tracking-widest uppercase cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Apoiar com PIX
                    </button>
                    
                    <button
                      id={`project-btn-volunteer-${project.id}`}
                      onClick={() => triggerVolunteer(project)}
                      className="flex items-center justify-center gap-1.5 py-3 rounded bg-slate-100 hover:bg-slate-200 border border-slate-250 text-[#1a2a40] font-bold text-xs transition-colors tracking-widest uppercase cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Voluntariar
                    </button>

                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>

        {/* Inline Active Volunteering Module wizard (only visible when a project is chosen) */}
        {volunteeringProject && (
          <div id="volunteer-form-container" className="mt-12 bg-slate-950 border border-amber-500/20 rounded-2xl p-6 sm:p-8 relative scroll-mt-24">
            
            <button 
              onClick={() => setVolunteeringProject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            {!volunteerSuccess ? (
              <form onSubmit={handleConfirmVolunteer} className="space-y-6 max-w-3xl">
                <div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950 uppercase tracking-widest">
                    Inscrição Rápida Voluntariado
                  </span>
                  <h3 className="text-xl font-bold mt-2">Quero Apoiar como Voluntário:</h3>
                  <p className="text-sm text-amber-400 font-semibold">{volunteeringProject.title}</p>
                  <p className="text-xs text-slate-400 mt-1">Inscreva-se informando dados básicos de contato. Alinhado estritamente com a LGPD, seus dados serão guardados de forma segura exclusiva para este contato.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo (Conforme RG):</label>
                    <input 
                      type="text" 
                      required 
                      value={volunteerName}
                      onChange={(e) => setVolunteerName(e.target.value)}
                      placeholder="Ex: Sargento Anderson Alves" 
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">E-mail de Contato Seguro:</label>
                    <input 
                      type="email" 
                      required 
                      value={volunteerEmail}
                      onChange={(e) => setVolunteerEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com" 
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder-slate-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Como você deseja ajudar nesse projeto? (Selecione):</label>
                    <select 
                      required
                      value={volunteerSkill}
                      onChange={(e) => setVolunteerSkill(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm outline-none text-white"
                    >
                      <option value="">-- Selecione uma opção --</option>
                      <option value="capelania">Capelania e Assistência Religiosa Presencial</option>
                      <option value="logistica">Transporte de Materiais / Logística de Doação</option>
                      <option value="cozinha">Arrecadação e Preparo dos Alimentos / Cobertores</option>
                      <option value="comunicacao">Divulgação de Avisos e Comunicação de Suporte</option>
                      <option value="outros">Outros apoios de acordo com a necessidade</option>
                    </select>
                  </div>
                </div>

                {/* LGPD Consent box */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      required
                      checked={lgpdVolConsent}
                      onChange={(e) => setLgpdVolConsent(e.target.checked)}
                      className="mt-1 accent-amber-500 rounded"
                    />
                    <span className="text-xs text-slate-400 leading-normal">
                      <strong>Termo de Consentimento Voluntário (LGPD):</strong> Autorizo expressamente o tratamento e uso limitado dos meus dados básicos para fins de intermediação, contato e alocação em escala voluntária do UMESC, sabendo que posso solicitar a exclusão de tais registros a qualquer tempo.
                    </span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-amber-400 cursor-pointer"
                  >
                    Confirmar Voluntariado
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setVolunteeringProject(null)}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl mx-auto shadow-md">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-white">Inscrição de Voluntário Concluída!</h3>
                <p className="text-sm text-slate-350 leading-relaxed">
                  Obrigado, <strong>{volunteerSummary?.name}</strong>! Seus dados foram salvos com criptografia ponta-a-ponta na listagem de contato do projeto <strong>{volunteerSummary?.projectTitle}</strong>.
                </p>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-850 font-mono text-xs text-left text-slate-300 space-y-1.5 max-w-md mx-auto">
                  <div className="text-[10px] text-amber-500 font-bold uppercase pb-1 border-b border-slate-800">Criptografia de Segurança (LGPD)</div>
                  <div>ID Voluntário: {volunteerSummary?.id}</div>
                  <div>Data Registro: {volunteerSummary?.date}</div>
                  <div className="truncate">Chave de Integridade: {volunteerSummary?.authCode}</div>
                  <div className="text-[10px] text-emerald-400 mt-1 uppercase">✓ Confidencialidade Protegida</div>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={() => {
                      setVolunteeringProject(null);
                      setVolunteerSuccess(false);
                    }}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase cursor-pointer"
                  >
                    Voltar para Projetos
                  </button>
                  <a 
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(`DADOS DE VOLUNTARIO UMESC\nID: ${volunteerSummary?.id}\nNome: ${volunteerName}\nProjeto: ${volunteerSummary?.projectTitle}\nHash LGPD: ${volunteerSummary?.authCode}\nData: ${volunteerSummary?.date}`)}`} 
                    download={`comprovante_voluntariado_${volunteerSummary?.id}.txt`}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-lg text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    Baixar Comprovante
                  </a>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Renders Donation Modal Popup */}
      {isDonateModalOpen && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm shadow-2xl overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-white my-8">
            
            {/* Modal header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-850 mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Apoio Missionário</span>
                <h3 className="text-xl font-bold">Semeadura no Reino</h3>
              </div>
              <button 
                onClick={() => setIsDonateModalOpen(false)}
                className="p-1 px-2.5 text-xs font-bold rounded-md bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-all hover:bg-slate-800"
              >
                fechar X
              </button>
            </div>

            {!donationSuccess ? (
              <form onSubmit={handleConfirmDonate} className="space-y-5">
                
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-black mb-1">Destinação Escolhida:</label>
                  <p className="font-bold text-sm text-amber-400">{activeProject.title}</p>
                  <p className="text-[11px] text-slate-400">{activeProject.location}</p>
                </div>

                {/* Amount checklist */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-black mb-1.5">Escolha o valor de Doação (R$):</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[20, 50, 100, 200].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setDonateAmount(val);
                          setCustomAmount("");
                        }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          donateAmount === val && !customAmount
                            ? "bg-amber-500 text-slate-950"
                            : "bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-300"
                        }`}
                      >
                        R$ {val}
                      </button>
                    ))}
                  </div>

                  <input 
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setDonateAmount(0);
                    }}
                    placeholder="Outro Valor em R$:" 
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-sm outline-none placeholder-slate-600 font-mono"
                  />
                </div>

                {/* User Info */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Seu Nome (Opcional):</label>
                    <input 
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Identificar Doação" 
                      disabled={anonymousDonation}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Seu E-mail:</label>
                    <input 
                      type="email"
                      required
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="Para confirmação e recibo" 
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input 
                      type="checkbox" 
                      checked={anonymousDonation}
                      onChange={(e) => {
                        setAnonymousDonation(e.target.checked);
                        if (e.target.checked) setDonorName("Anônimo");
                        else setDonorName("");
                      }}
                      className="accent-amber-500"
                    />
                    <span className="text-xs text-slate-400">Desejo doar de forma 100% Anônima para o público</span>
                  </label>
                </div>

                {/* Simulated PIX Box */}
                <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl">
                  
                  <div className="flex gap-4 items-center mb-3">
                    {/* QR Code de Doação oficial via Supabase */}
                    <div className="w-16 h-16 bg-white rounded border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <img 
                        src="https://qndjkphfsejuqopmfgas.supabase.co/storage/v1/object/public/qr%20code%20pix%20entidade/PIX_UMESC_2023.jpeg" 
                        alt="QR Code PIX UMESC" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[11px] text-slate-400 font-semibold leading-relaxed">Escanei o QR Code ao lado ou utilize a chave PIX abaixo no seu banco corporativo para concluir:</span>
                      <span className="block text-[10px] text-amber-500 font-mono font-bold">CNPJ PIX: 18.232.091/0001-90</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPixString}
                    className="w-full flex items-center justify-between px-3 py-2 rounded bg-slate-905 border border-slate-800 text-xs font-mono text-slate-350 hover:bg-slate-800 cursor-pointer"
                  >
                    <span className="truncate max-w-[300px]">copiar_chave_copia_e_cola_pix_umesc_sc_projeto</span>
                    {copiedKey ? (
                      <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1"><Check className="w-3 h-3" /> Copiado!</span>
                    ) : (
                      <span className="text-amber-500 text-[10px] font-bold"><Copy className="w-3 h-3 inline mr-1" /> Copiar</span>
                    )}
                  </button>

                </div>

                {/* Crucial LGPD Privacy Consent box for Donor */}
                <div className="bg-slate-950 p-3.5 border border-rose-900/30 rounded-lg">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      required
                      checked={lgpdDonateConsent}
                      onChange={(e) => setLgpdDonateConsent(e.target.checked)}
                      className="mt-1 accent-amber-500 rounded"
                    />
                    <span className="text-[11px] text-slate-400 leading-normal">
                      <strong>Termo do Doador (LGPD):</strong> Dou consentimento livre e inequívoco para tratamento e guarda estritamente confidencial dos dados de e-mail e identificação unicamente para conferência de caixa missionária externa, em total conformidade estatutária e conforme a LGPD brasileira.
                    </span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsDonateModalOpen(false)}
                      className="w-full sm:w-1/3 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-[#0b1220] hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer text-center flex items-center justify-center"
                    >
                      Voltar
                    </button>
                    <button 
                      type="submit"
                      id="submit-modal-btn-donate"
                      disabled={!lgpdDonateConsent}
                      className="w-full sm:w-2/3 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer text-center"
                    >
                      Simular Confirmação de Transferência / PIX
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-505 text-center font-mono">Simulador protegido com blindagem criptográfica</p>
                </div>

              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-550/30 flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xl font-black">Obrigado por sua Semente!</h4>
                  <p className="text-xs text-slate-400">Sua contribuição simulação foi guardada com conformidade e segurança fiscal.</p>
                </div>

                {/* Printable receipt */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs text-left text-slate-350 space-y-2 max-w-sm mx-auto">
                  <div className="text-[9px] text-amber-500 font-bold uppercase pb-1 border-b border-slate-800 flex justify-between">
                    <span>DOC. COMERCIAL INTERNO</span>
                    <span className="text-emerald-400">PROTEÇÃO LGPD ATIVA</span>
                  </div>
                  <div>ID Transação: {simulationSummary?.id}</div>
                  <div>Destinação: {simulationSummary?.projectTitle}</div>
                  <div>Doador: {donorName || "Anônimo"}</div>
                  <div>Valor Semado: R$ {simulationSummary?.amount.toFixed(2)}</div>
                  <div>Data Registro: {simulationSummary?.date}</div>
                  <div className="truncate">Integridade: {simulationSummary?.authCode}</div>
                  <div className="text-[10px] text-slate-500 mt-2 italic text-center text-slate-400 uppercase">Agradecemos de coração a sua parceria missionária!</div>
                </div>

                <div className="flex gap-3 justify-center pt-4">
                  <button
                    onClick={() => {
                      setIsDonateModalOpen(false);
                      setDonationSuccess(false);
                    }}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase cursor-pointer"
                  >
                    Voltar aos Projetos
                  </button>
                  <a 
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(`RECIBO DE SIMULACAO DOACAO UMESC\nID: ${simulationSummary?.id}\nProjeto: ${simulationSummary?.projectTitle}\nDoador: ${donorName || "Anonimo"}\nValor: R$ ${simulationSummary?.amount.toFixed(2)}\nIntegridade LGPD: ${simulationSummary?.authCode}\nData: ${simulationSummary?.date}`)}`} 
                    download={`recibo_umesc_doacao_${simulationSummary?.id}.txt`}
                    className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold rounded-lg text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    Baixar Recibo (.TXT)
                  </a>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </section>
  );
}
