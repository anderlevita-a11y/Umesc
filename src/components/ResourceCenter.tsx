/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { INITIAL_ANNOUNCEMENTS, INITIAL_EVENTS, INITIAL_DOCUMENTS } from "../data";
import { ScheduleEvent, DocumentFile } from "../types";
import { ListCollapse, Calendar, Download, HelpCircle, Bell, Clock, FileCheck, CheckCircle2, ChevronRight, LayoutList } from "lucide-react";

export default function ResourceCenter() {
  const [activeEventFilter, setActiveEventFilter] = useState<string>("TODOS");
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [downloadedDocId, setDownloadedDocId] = useState<string | null>(null);

  const eventFilters = ["TODOS", "Estadual", "Regional", "Oração", "Reunião"];

  const getFilteredEvents = () => {
    if (activeEventFilter === "TODOS") return INITIAL_EVENTS;
    return INITIAL_EVENTS.filter((ev) => ev.type === activeEventFilter);
  };

  const handleSimulateDownload = (docId: string, docTitle: string) => {
    // Increase download counter in local memory state
    setDocuments((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === docId ? { ...doc, downloadCount: doc.downloadCount + 1 } : doc
      )
    );

    // Set interactive visual success badge
    setDownloadedDocId(docId);
    setTimeout(() => setDownloadedDocId(null), 3000);
  };

  return (
    <section id="resources" className="py-20 bg-slate-50 text-slate-900 scroll-mt-20 border-t border-slate-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Resource Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3">Informativos & Transparência</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a2a40] font-sans font-display">
            Agenda de Atividades, Avisos e Documentos
          </h2>
          <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full mb-4"></div>
          <p className="text-slate-650 text-xs sm:text-sm font-semibold max-w-2xl mx-auto">
            Fique por dentro das datas de comunhão em Santa Catarina, acesse circulares administrativas de farda e baixe relatórios fiscais em conformidade e transparência.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Notices & Download Docs */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Notices Board (Avisos) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
                <Bell className="w-5 h-5 text-red-650" />
                <h3 className="text-[15px] font-black text-[#1a2a40] uppercase tracking-wider font-display">Quadro Oficial de Avisos</h3>
              </div>

              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div 
                    key={ann.id} 
                    className={`p-4 rounded border transition-all ${
                      ann.isImportant 
                        ? "bg-red-50/70 border-red-200 hover:border-red-300"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {ann.isImportant && (
                          <span className="px-2 py-0.5 rounded text-[8px] font-black bg-red-700 text-white uppercase tracking-wider animate-pulse">
                            Importante
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[9px] bg-slate-250 text-slate-800 border border-slate-300/40 font-bold uppercase tracking-wider">
                          {ann.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">{new Date(ann.date).toLocaleDateString("pt-BR")}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug mb-1 font-display">{ann.title}</h4>
                    <p className="text-xs text-slate-650 leading-relaxed pr-2 font-medium">{ann.content}</p>

                  </div>
                ))}
              </div>
            </div>

            {/* 2. Downloadable Documents (Documentos para Baixar) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-105">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-[15px] font-black text-[#1a2a40] uppercase tracking-wider font-display">Central de Downloads Certificados</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Documentos estatutários, relatórios financeiros e apostilas de farda</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="p-4 rounded bg-slate-50 border border-slate-200 hover:border-amber-500/40 hover:bg-white transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                  >
                    <div>
                      <span className="inline-block text-[8px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded uppercase font-mono tracking-widest mb-1.5 border border-slate-300/35">
                        {doc.category}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight mb-1 font-display">{doc.title}</h4>
                      
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                        <span>Tamanho: {doc.fileSize}</span>
                        <span>•</span>
                        <span>Publicado: {doc.publishedDate}</span>
                        <span>•</span>
                        <span>Baixado: <strong className="text-slate-800">{doc.downloadCount} vezes</strong></span>
                      </div>
                    </div>

                    {/* Direct clickable TXT simulator to mock PDF files */}
                    <a
                      href={`data:text/plain;charset=utf-8,${encodeURIComponent(`DOCUMENTO OFICIAL DA AGENCIA MISSIONARIA UMESC (SC)\n=========================================\n\nTitulo do Documento: ${doc.title}\nCategoria: ${doc.category}\nData de Publicacao: ${doc.publishedDate}\n\n[SIMULACAO] Este arquivo representa o download oficial direto do seletor da UMESC de Santa Catarina. Todo o processamento e download e auditado sob a LGPD brasileira, garantindo privacidade de dados do portador de acesso.`)}`}
                      download={`${doc.url}`}
                      onClick={() => handleSimulateDownload(doc.id, doc.title)}
                      className={`px-4 py-3 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transform active:scale-95 transition-all text-center cursor-pointer ${
                        downloadedDocId === doc.id
                          ? "bg-emerald-600 text-white"
                          : "bg-[#1a2a40] hover:bg-[#131f2e] text-amber-400"
                      }`}
                    >
                      {downloadedDocId === doc.id ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 animate-scale" />
                          <span>Pronto</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Baixar Ficheiro</span>
                        </>
                      )}
                    </a>

                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* Right Column: Schedule Calendars (Agenda) */}
          <div id="agenda" className="lg:col-span-5 bg-[#1a2a40] text-white rounded-xl p-6 sm:p-8 scroll-mt-24 shadow-md border-b-4 border-amber-500">
            
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider font-display">Agenda de Eventos Estaduais</h3>
              </div>
            </div>

            {/* Filter Pill List */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {eventFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveEventFilter(filter)}
                  className={`px-2.5 py-1 rounded text-[9px] font-black tracking-widest uppercase transition-all cursor-pointer ${
                    activeEventFilter === filter
                      ? "bg-amber-500 text-[#1a2a40] font-black shadow-sm"
                      : "bg-[#182638] text-slate-300 border border-white/5 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Schedule Events Loop */}
            <div className="space-y-4">
              {getFilteredEvents().map((ev) => (
                <div 
                  key={ev.id} 
                  className="p-4 rounded bg-[#182638] border border-white/5 hover:border-amber-500/30 transition-all space-y-3"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded-full uppercase font-mono tracking-wider">
                      {ev.type}
                    </span>
                    
                    <span className="text-slate-300 font-bold flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(ev.date).toLocaleDateString("pt-BR")} às {ev.time}h
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white leading-tight font-display">{ev.title}</h4>
                    <p className="text-[11px] text-slate-300 font-medium leading-normal mt-1">{ev.description}</p>
                  </div>

                  <div className="text-[10px] bg-[#131f2e] border border-white/5 px-2.5 py-1.5 rounded text-slate-300 flex items-center gap-1 font-mono font-bold">
                    <span>📍 Local: <strong>{ev.location}</strong></span>
                  </div>

                </div>
              ))}

              {getFilteredEvents().length === 0 && (
                <div className="py-12 text-center bg-[#182638] border border-white/5 rounded">
                  <p className="text-xs text-slate-400 font-mono">Nenhum culto ou reunião programado para a categoria selecionada.</p>
                </div>
              )}
            </div>

            <div className="p-4 rounded bg-[#131f2e] border border-white/5 mt-6 text-xs text-slate-300 font-semibold flex items-start gap-2.5">
              <span className="text-amber-400 font-bold mt-0.5">ℹ</span>
              <p className="leading-relaxed font-semibold">
                Interessados em receber a agenda impressa de oração via Correios devem confirmar o consentimento de envio opcional no momento do cadastro geral à esquerda.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
