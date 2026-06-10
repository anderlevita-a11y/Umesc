/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldCheck, Heart, User, BookOpen, Star, ChevronRight, Compass } from "lucide-react";
import heroBg from "../assets/images/hero_banner_sgt_carvalho_clean_bible_1781071416408.png";

interface HeroProps {
  onScrollToSection: (elementId: string) => void;
  onOpenDonateModal: () => void;
  onEnterMemberDashboard?: () => void;
}

export default function Hero({ onScrollToSection, onOpenDonateModal, onEnterMemberDashboard }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#070c18] text-white min-h-[85vh] flex items-center pt-28 lg:pt-32 pb-20 border-b border-white/10 z-10">
      
      {/* Background Image structure mapped directly from generated corporate farda asset */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <img
          src={heroBg}
          alt="Sgt Carvalho fardada segurando a oficial Bíblia do Militar - Capelania PMSC & CBMSC"
          className="w-full h-full object-cover object-[center_28%]"
          referrerPolicy="no-referrer"
        />
        {/* Sleek, deep dark military gradient mask: full charcoal on the left to show readable display texts, fading transparently on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070c18] via-[#070c18]/95 via-[#081223]/85 to-[#051125]/25" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070c18] to-transparent" />
      </div>

      {/* 1. Official Santa Catarina State Flag Accent Stripes Ribbon (Red, White, Green, Red) */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex z-30">
        <div className="flex-1 bg-gradient-to-r from-red-650 to-red-600"></div>
        <div className="w-12 bg-white"></div>
        <div className="flex-1 bg-emerald-700"></div>
        <div className="w-12 bg-white"></div>
        <div className="flex-1 bg-gradient-to-l from-red-650 to-red-600"></div>
      </div>

      {/* Futuristic military radar/grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,#112135,transparent_60%)] opacity-70 pointer-events-none" />
      
      {/* Soft tactical coordinate grids */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]"></div>      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 flex flex-col lg:flex-row gap-12 items-center">
        
        {/* Texts Column */}
        <div className="w-full lg:w-2/3 flex flex-col space-y-7">
          
          <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded bg-[#13233c] hover:bg-[#182c4b] border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider font-mono">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
            <span>Capelania Voluntária • PMSC & CBMSC Integrados</span>
          </div>

          <div className="space-y-3">
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-300 block font-mono">
              Unindo Militares Evangélicos de Santa Catarina para evangelizar o mundo
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white font-display">
              Agência <br className="hidden sm:inline" />
              <span className="text-amber-400">
                Missionária
              </span>
            </h1>
          </div>

          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
            A <strong>UMESC (União de Militares Evangélicos de Santa Catarina)</strong> atua desde 1989 como agência missionária de utilidade pública legal. Canalizamos amparo espiritual, ético e psicológico contínuo aos policiais, bombeiros de SC e suas famílias fardadas.
          </p>



          {/* Core Action buttons in PMSC tactial style */}
          <div className="flex flex-wrap gap-3.5 pt-2">
            
            <button
              id="hero-btn-dashboard-trigger"
              onClick={onEnterMemberDashboard}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded font-black bg-amber-500 hover:bg-amber-600 active:scale-95 text-[#0a1424] transition-all shadow-md text-xs uppercase tracking-wider cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Acessar Portal do Membro</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>

            <button
              id="hero-btn-donate-trigger"
              onClick={onOpenDonateModal}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded font-bold bg-[#142337] hover:bg-[#1a2d48] border border-white/10 active:scale-95 text-white transition-all shadow-xs text-xs uppercase tracking-wider cursor-pointer"
            >
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>Apoiar Projetos (PIX)</span>
            </button>

            <button
              onClick={() => onScrollToSection("projects")}
              className="flex items-center justify-center gap-2 px-4 py-4 text-xs font-black text-slate-300 hover:text-amber-400 transition-colors uppercase tracking-widest cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Ver Projetos</span>
            </button>

          </div>

          {/* SC indicators */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10 max-w-lg font-mono text-xs text-slate-400">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white font-display">1989</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Fundado em SC</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-500 font-display">6 +</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Regiões em Defesa</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-display">100%</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Interdenominacional</div>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
