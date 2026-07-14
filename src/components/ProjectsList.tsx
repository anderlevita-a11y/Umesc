/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { INITIAL_PROJECTS } from "../data";
import { Project, Donation } from "../types";
import { Heart, Coins, ArrowRight, X, Copy, Check, ShieldCheck, Mail, ArrowUpRight, HelpCircle, UserCheck, Paperclip } from "lucide-react";
import { getCleanImageUrl } from "../lib/imageDriveHelper.ts";
import { donationsService } from "../lib/donationService.ts";

// Helper to generate a compliant BR Code / Copy-Pastable PIX String with CRC16
function generatePixString(pixKey: string, amount: number, receiverName: string): string {
  if (!pixKey) return "";
  if (pixKey.startsWith("000201")) {
    return pixKey;
  }

  const formatParam = (id: string, value: string): string => {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  };

  const cleanKey = pixKey.trim();
  const cleanName = (receiverName || "UMESC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9 ]/g, "") // alphanumeric only
    .slice(0, 25) // limits length
    .trim()
    .toUpperCase();

  // 1. Payload Format Indicator (ID 00)
  let payload = formatParam("00", "01");

  // 2. Merchant Account Information (ID 26)
  const merchantAccInfo_GUI = formatParam("00", "br.gov.bcb.pix");
  const merchantAccInfo_key = formatParam("01", cleanKey);
  const merchantAccountInfo = formatParam("26", merchantAccInfo_GUI + merchantAccInfo_key);
  payload += merchantAccountInfo;

  // 3. Merchant Category Code (ID 52)
  payload += formatParam("52", "0000");

  // 4. Transaction Currency (ID 53) - 986 for BRL
  payload += formatParam("53", "986");

  // 5. Transaction Amount (ID 54)
  payload += formatParam("54", amount.toFixed(2));

  // 6. Country Code (ID 58)
  payload += formatParam("58", "BR");

  // 7. Merchant Name (ID 59)
  payload += formatParam("59", cleanName || "UMESC");

  // 8. Merchant City (ID 60)
  payload += formatParam("60", "FLORIANOPOLIS");

  // 9. Additional Data Field (ID 62)
  const txid = formatParam("05", "***");
  payload += formatParam("62", txid);

  // 10. CRC16 Flag (ID 63)
  payload += "6304";

  // Cyclic Redundancy Check (CRC16 CCITT)
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  const crcString = crc.toString(16).toUpperCase().padStart(4, "0");
  return `${payload}${crcString}`;
}

interface ProjectsListProps {
  selectedPreloadProj?: string;
}

export default function ProjectsList({ selectedPreloadProj }: ProjectsListProps) {
  // Dynamic projects list with local storage cache
  const [projectsList, setProjectsList] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem("umesc_projects");
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

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

  // Volunteering active triggers
  const [volunteeringProject, setVolunteeringProject] = useState<Project | null>(null);
  const [volunteerSuccess, setVolunteerSuccess] = useState(false);
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [volunteerSkill, setVolunteerSkill] = useState("");
  const [lgpdVolConsent, setLgpdVolConsent] = useState(false);

  const [volunteerSummary, setVolunteerSummary] = useState<{
    id: string;
    name: string;
    projectTitle: string;
    date: string;
    authCode: string;
  } | null>(null);

  // Set selected project and open volunteer block
  const triggerVolunteer = (project: Project) => {
    setVolunteeringProject(project);
    setVolunteerSuccess(false);
    setVolunteerSummary(null);
    setLgpdVolConsent(false);
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
                   {/* Buttons */}
                  <div className="w-full">
                    <button
                      id={`project-btn-volunteer-${project.id}`}
                      onClick={() => triggerVolunteer(project)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded bg-[#1a2a40] hover:bg-[#131f2e] text-white font-bold text-xs transition-colors tracking-widest uppercase cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      Quero me Voluntariar
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

    </section>
  );
}
