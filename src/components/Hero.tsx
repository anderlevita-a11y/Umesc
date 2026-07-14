/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldCheck, Heart, User, BookOpen, Star, ChevronRight, Compass } from "lucide-react";
import heroBg from "../assets/images/hero_banner_sgt_carvalho_clean_bible_1781071416408.png";

interface HeroProps {
  onScrollToSection: (elementId: string) => void;
  onEnterMemberDashboard?: () => void;
}

export default function Hero({ onScrollToSection, onEnterMemberDashboard }: HeroProps) {
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
          
          <div className="space-y-3">
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-300 block font-mono">
              Unindo Militares Evangélicos de Santa Catarina para evangelizar o mundo
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white font-display">
              Mãos que pegam em armas <br className="hidden sm:inline" />
              <span className="text-amber-400">
                também podem ganhar almas
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
              onClick={() => onScrollToSection("projects")}
              className="flex items-center justify-center gap-2 px-4 py-4 text-xs font-black text-slate-300 hover:text-amber-400 transition-colors uppercase tracking-widest cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Ver Projetos</span>
            </button>

          </div>

          {/* SC indicators */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-white/10 max-w-xl font-mono text-xs text-slate-400">
            <div className="flex gap-6 sm:gap-10">
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

            {/* Social Media Link Grid Next to 100% Interdenominacional */}
            <div className="flex items-center gap-4 bg-[#111e35]/40 border border-white/5 p-2.5 px-4 rounded-xl self-start sm:self-auto shadow-lg shadow-black/20">
              <a 
                href="https://www.instagram.com/umescsc/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-pink-500 hover:text-pink-400 hover:scale-115 transition-all duration-200"
                title="Instagram"
              >
                <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a 
                href="https://www.youtube.com/@umesc-uniaodemilitaresevan4597" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-red-500 hover:text-red-400 hover:scale-115 transition-all duration-200"
                title="YouTube"
              >
                <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.387.508 9.387.508s7.517 0 9.387-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a 
                href="https://www.tiktok.com/@escutaessacristao?_r=1&_t=ZS-97E5HqUJjBi" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-cyan-400 hover:text-cyan-300 hover:scale-115 transition-all duration-200"
                title="TikTok"
              >
                <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.03 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.14.98.98 2.37 1.5 3.77 1.58V9.6c-1.39-.03-2.77-.41-3.96-1.16-.27-.15-.52-.33-.76-.52-.08 2.82-.04 5.64-.06 8.46-.01 1.76-.5 3.54-1.57 4.93-1.63 2.12-4.43 3.02-7.01 2.4-2.07-.45-3.95-1.93-4.83-3.87-1.37-2.92-.47-6.84 2.18-8.73 1.48-1.09 3.37-1.53 5.19-1.25.01 1.41.01 2.81.01 4.22-.96-.28-2.01-.1-2.8.48-.73.53-1.12 1.45-1.02 2.36.08.97.7 1.83 1.58 2.18.91.38 1.99.17 2.69-.5.67-.62.91-1.58.89-2.47-.02-3.41-.01-6.82-.01-10.23z"/>
                </svg>
              </a>
              <a 
                href="https://open.spotify.com/show/1P5zeJnOtSBj51D3LTk0YE?si=wiXs6tsCTi-phUPW1TP7kw" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-emerald-400 hover:text-emerald-300 hover:scale-115 transition-all duration-200"
                title="Spotify"
              >
                <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.561-1.14-.418.12-.78-.18-.9-.6-.12-.42.18-.78.6-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.24-1.98-8.161-2.58-11.94-1.38-.479.12-.961-.18-1.141-.66-.12-.48.18-.96.66-1.14 4.38-1.32 9.78-.66 13.56 1.68.421.24.6.78.3 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.14-.18-1.32-.72-.18-.6.18-1.14.72-1.32 4.2-1.26 11.28-1.02 15.72 1.62.54.3.72.96.42 1.5-.3.54-.96.72-1.5.42z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
