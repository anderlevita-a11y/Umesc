/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CORE_GOVERNANCE, COORDINATORS_DATA } from "../data";
import { Users, Scale, MapPin, Phone, Copy, Check, ShieldCheck, Mail, MessageCircle } from "lucide-react";
import { getCleanImageUrl } from "../lib/imageDriveHelper.ts";
import { coordinatorsService, settingsService } from "../lib/supabase.ts";
import { getWhatsAppLink } from "../lib/validation.ts";


export default function OrganizationalStructure() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("TODAS");
  const [board, setBoard] = useState<any[]>(() => {
    const saved = localStorage.getItem("umesc_diretoria");
    return saved ? JSON.parse(saved) : CORE_GOVERNANCE.board;
  });

  const [coordenadores, setCoordenadores] = useState<any[]>(() => {
    const saved = localStorage.getItem("umesc_coordenadores");
    return saved ? JSON.parse(saved) : COORDINATORS_DATA;
  });

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const data = await settingsService.getSetting("umesc_diretoria", CORE_GOVERNANCE.board);
        if (Array.isArray(data) && data.length > 0) {
          setBoard(data);
        } else {
          const saved = localStorage.getItem("umesc_diretoria");
          if (saved) setBoard(JSON.parse(saved));
          else setBoard(CORE_GOVERNANCE.board);
        }
      } catch {
        const saved = localStorage.getItem("umesc_diretoria");
        if (saved) setBoard(JSON.parse(saved));
        else setBoard(CORE_GOVERNANCE.board);
      }
    };
    const loadCoordenadores = () => {
      coordinatorsService.getCoordinators().then((data) => {
        setCoordenadores(data);
      }).catch((err) => {
        console.error("Error loading coordinators:", err);
        const saved = localStorage.getItem("umesc_coordenadores");
        if (saved) {
          setCoordenadores(JSON.parse(saved));
        } else {
          setCoordenadores(COORDINATORS_DATA);
        }
      });
    };
    loadBoard();
    loadCoordenadores();
    window.addEventListener("storage_content_change", loadBoard);
    window.addEventListener("storage_content_change", loadCoordenadores);
    window.addEventListener("umesc_content_updated", loadBoard);
    window.addEventListener("umesc_content_updated", loadCoordenadores);
    window.addEventListener("storage", loadBoard);
    window.addEventListener("storage", loadCoordenadores);
    return () => {
      window.removeEventListener("storage_content_change", loadBoard);
      window.removeEventListener("storage_content_change", loadCoordenadores);
      window.removeEventListener("umesc_content_updated", loadBoard);
      window.removeEventListener("umesc_content_updated", loadCoordenadores);
      window.removeEventListener("storage", loadBoard);
      window.removeEventListener("storage", loadCoordenadores);
    };
  }, []);

  const filterRegions = ["TODAS", "LITORAL", "VALE", "NORTE", "OESTE", "SUL", "SERRA"];

  const getFilteredCoordinators = () => {
    if (selectedRegionFilter === "TODAS") return coordenadores;
    return coordenadores.filter((coord) => {
      const regionLower = ((coord.region || "") + (coord.role || "")).toLowerCase();
      if (selectedRegionFilter === "LITORAL" && regionLower.includes("florianópolis")) return true;
      if (selectedRegionFilter === "VALE" && regionLower.includes("vale")) return true;
      if (selectedRegionFilter === "NORTE" && regionLower.includes("norte")) return true;
      if (selectedRegionFilter === "OESTE" && regionLower.includes("oeste")) return true;
      if (selectedRegionFilter === "SUL" && regionLower.includes("sul")) return true;
      if (selectedRegionFilter === "SERRA" && regionLower.includes("serrano")) return true;
      return false;
    });
  };

  const handleCopyContact = (contact: string, idx: number) => {
    navigator.clipboard.writeText(contact);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section id="structure" className="py-20 bg-white text-slate-900 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-2">Hierarquia & Base Jurídica</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 font-sans tracking-tight">
              Estrutura, Legislação e Coordenadores
            </h2>
          </div>
          <p className="text-slate-500 text-sm max-w-md leading-relaxed">
            Transparência estatutária e representação descentralizada em todo o território de Santa Catarina, apoiando fardados evangélicos com ordem e decência.
          </p>
        </div>

        {/* Outer Section: Split Board & Legislation Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Board of Directors Panel (Left) */}
          <div className="lg:col-span-7 bg-[#1a2a40] text-white rounded-xl p-6 sm:p-8 shadow-md border-b-4 border-amber-500">
            <h3 className="text-xl font-bold mb-1 text-white flex items-center gap-2 font-display">
              <Users className="w-5 h-5 text-amber-500" />
              Diretoria Executiva Estadual
            </h3>
            <p className="text-slate-300 text-xs mb-6 uppercase tracking-wider font-semibold opacity-85">BIÊNIO 2025/2026</p>
            
            <div className="space-y-3.5">
              {board.map((director, index) => (
                <div 
                  key={director.id || index} 
                  className="p-4 rounded-xl bg-[#182638] border border-white/5 hover:border-amber-400/25 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="flex items-center gap-3">
                    {director.photo ? (
                      <img
                        src={getCleanImageUrl(director.photo)}
                        alt={director.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/50 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#131f2e] border border-white/10 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0 font-display">
                        {director.name ? director.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    <div>
                      <span className="block text-amber-400 text-xs font-bold tracking-wider uppercase">{director.role}</span>
                      <span className="block font-bold text-white text-base mt-0.5">{director.name}</span>
                    </div>
                  </div>
                  {director.church && (
                    <span className="text-xs text-slate-300 bg-[#131f2e] border border-white/10 px-3 py-1.5 rounded font-bold uppercase tracking-wider">
                      {director.church}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legislation Panel (Right) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="text-xl font-bold text-[#1a2a40] mb-1 flex items-center gap-2 font-display">
                <Scale className="w-5 h-5 text-amber-600" />
                Legislação & Normatização
              </h3>
              <p className="text-slate-500 text-xs mb-6 uppercase tracking-wider font-semibold">Normas Jurídicas de Funcionamento</p>
              
              <div className="space-y-4">
                {CORE_GOVERNANCE.legislation.map((leg, index) => (
                  <div key={index} className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      {leg.title}
                    </h4>
                    <p className="text-xs text-slate-600 pl-3 leading-relaxed">
                      {leg.description}
                    </p>
                    <span className="block text-[10px] font-mono font-bold text-amber-700 pl-3 uppercase">
                      Base: {leg.lawReference}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200/60 bg-slate-50/60 p-4 rounded flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div className="text-[11px] text-slate-600 leading-normal font-semibold">
                Nossos estatutos e atas são devidamente registrados em cartórios civil e de títulos no estado de Santa Catarina.
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section: Coordinators List Grid */}
        <div className="bg-slate-100 rounded-xl border border-slate-200 p-6 sm:p-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-[#1a2a40] flex items-center gap-2 font-display">
                <MapPin className="w-5 h-5 text-amber-600" />
                Grupos e Coordenadores Regionais
              </h3>
              <p className="text-slate-500 text-xs font-semibold">Apoio local descentralizado para fardados em Santa Catarina</p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5">
              {filterRegions.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegionFilter(region)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    selectedRegionFilter === region
                      ? "bg-[#1a2a40] text-white shadow"
                      : "bg-white text-slate-700 border border-slate-250 hover:bg-slate-50"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredCoordinators().map((coord, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 hover:border-amber-500/40 rounded-xl p-5 shadow-sm hover:shadow transition-all relative overflow-hidden group flex flex-col justify-between"
              >
                
                {/* Visual Accent State Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    {coord.avatar ? (
                      <img 
                        src={getCleanImageUrl(coord.avatar)} 
                        alt={coord.name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 group-hover:border-amber-500 transition-colors shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold uppercase text-base shrink-0">
                        {coord.name ? coord.name.charAt(0) : "C"}
                      </div>
                    )}
                    <div>
                      <span className="block text-[11px] font-mono text-amber-700 font-bold uppercase">{coord.rank}</span>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{coord.name}</h4>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    <div className="text-xs text-slate-700 font-semibold bg-slate-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-650"></span>
                      <span>{coord.role}</span>
                    </div>
                    
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Região: {coord.region}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Actions Grid */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => handleCopyContact(coord.contact, idx)}
                    className="flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-700 transition-all cursor-pointer"
                    title="Copiar número de telefone"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{coord.contact}</span>
                    {copiedIndex === idx && (
                      <Check className="w-3 h-3 text-emerald-650 shrink-0" />
                    )}
                  </button>

                  <a
                    href={getWhatsAppLink(coord.contact)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-md"
                    title="Falar com o coordenador pelo WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>


              </div>
            ))}

            {getFilteredCoordinators().length === 0 && (
              <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-xl">
                <p className="text-slate-500 text-sm">Nenhum coordenador regional localizado para esta região de busca.</p>
                <button 
                  onClick={() => setSelectedRegionFilter("TODAS")}
                  className="mt-2 text-xs font-bold text-amber-600 underline"
                >
                  Limpar Filtros e Mostrar Todos
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
