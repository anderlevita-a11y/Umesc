/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import PublicCongressBanner from "./components/PublicCongressBanner";
import AboutMission from "./components/AboutMission";
import CarouselsSection from "./components/CarouselsSection";
import RevistasSection from "./components/RevistasSection";
import ProjectsList from "./components/ProjectsList";
import MemberDashboard from "./components/MemberDashboard";
import AdminPortal from "./components/AdminPortal";
import LgpdPolicyBanner from "./components/LgpdPolicyBanner";
import Footer from "./components/Footer";

import { ShieldCheck, Calendar, Users, Scale, UserPlus, Info, Compass, Star } from "lucide-react";

export default function App() {
  const [view, setView] = useState<"public" | "dashboard" | "admin">("public");
  const [memberDashboardInitialTab, setMemberDashboardInitialTab] = useState<"notices" | "agenda" | "structure" | "registration" | "congressos">("notices");
  const [activeTab, setActiveTab] = useState("about");
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  // Smooth scroll helper for public elements
  const handleScrollToSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleOpenDonateOverlay = () => {
    setIsDonateModalOpen(true);
  };

  const handleEnterMemberDashboard = (tab: "notices" | "agenda" | "structure" | "registration" | "congressos" = "notices") => {
    setMemberDashboardInitialTab(tab);
    setView("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollOrRedirectToDashboard = (elementId: string) => {
    if (elementId === "structure") {
      handleEnterMemberDashboard("structure");
    } else if (elementId === "resources") {
      handleEnterMemberDashboard("notices");
    } else if (elementId === "agenda") {
      handleEnterMemberDashboard("agenda");
    } else if (elementId === "register") {
      handleEnterMemberDashboard("registration");
    } else {
      handleScrollToSection(elementId);
    }
  };

  if (view === "dashboard") {
    return (
      <MemberDashboard 
        initialTab={memberDashboardInitialTab}
        onBackToHome={() => setView("public")}
        onEnterAdminMode={() => setView("admin")}
      />
    );
  }

  if (view === "admin") {
    return (
      <AdminPortal 
        onBackToHome={() => setView("public")}
      />
    );
  }

  return (
    <div id="portal-root" className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans antialiased text-sm">
      
      {/* 1. Sticky Navigation Header under PT-BR */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenDonateModal={handleOpenDonateOverlay}
        onScrollToSection={handleScrollOrRedirectToDashboard}
        onEnterAdminMode={() => setView("admin")}
      />

      <main className="flex-1">
        
        {/* 3. Hero Visual Section with quick CTAs */}
        <Hero 
          onScrollToSection={handleScrollOrRedirectToDashboard}
          onOpenDonateModal={handleOpenDonateOverlay}
          onEnterMemberDashboard={() => handleEnterMemberDashboard("notices")}
        />

        {/* Public Featured Congress Banner with Countdown built dynamically */}
        <PublicCongressBanner onEnterMemberDashboard={handleEnterMemberDashboard} />

        {/* Comemorative 37 Years Medal Honor Section */}
        <div id="selo-comemorativo-37-anos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#0c1626]/90 via-[#0a1221]/95 to-[#0c1626]/90 rounded-3xl p-6 sm:p-8 border border-amber-500/25 shadow-xl flex flex-col md:flex-row gap-8 items-center justify-between">
            {/* Ambient gold glow backdrops */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Visual element on left: Circular white and green badge containing SC map, cross, soldiers */}
            <div className="flex flex-col sm:flex-row items-center gap-6 z-10 w-full">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-amber-500/30 shadow-2xl shrink-0 group hover:scale-105 transition-transform duration-500 mx-auto sm:mx-0">
                <img
                  src="https://qndjkphfsejuqopmfgas.supabase.co/storage/v1/object/public/qr%20code%20pix%20entidade/SELO%202.jpg.jpeg"
                  alt="Selo Comemorativo de 37 Anos da UMESC"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="space-y-2 text-center sm:text-left flex-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest font-mono">
                  Selo Especial Comemorativo
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-display tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  37 Anos de História e Fé (1989 - 2026)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl font-medium">
                  Celebrando trinta e sete anos de capelania militar voluntária contínua, prestando amparo espiritual, ético-social e de ordem moral-psicológica aos policiais e bombeiros militares de Santa Catarina (PMSC & CBMSC) e suas respectivas famílias.
                </p>
              </div>
            </div>

            {/* Micro badge/metrics */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8 shrink-0 w-full md:w-auto z-10">
              <div className="text-center md:text-right">
                <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">1989</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">Fundado em SC</div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">37 Anos</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">De Capelania</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Bento mini-bar for direct user actions requested */}
        <div className="bg-[#0b1221] py-8 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center mb-6">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest block font-mono">Espaço Restrito do Militar e Associados</span>
              <h3 className="text-lg font-bold text-white mt-1 font-display uppercase tracking-tight">Canais Rápidos para Fardados de Santa Catarina</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-[#121c2d] p-5 rounded-lg border border-white/5 flex items-start gap-3.5 hover:border-white/10 transition-all">
                <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Leis e Estatutos</h4>
                  <p className="text-[11px] text-slate-300 mt-1">Veja os regimentos interdenominacionais em farda.</p>
                  <button 
                    onClick={() => handleEnterMemberDashboard("structure")}
                    className="text-[10px] text-amber-400 font-bold hover:text-amber-500 transition-colors mt-2 uppercase tracking-wider block text-left underline decoration-amber-400/40"
                  >
                    Acessar Estatutos →
                  </button>
                </div>
              </div>

              <div className="bg-[#121c2d] p-5 rounded-lg border border-white/5 flex items-start gap-3.5 hover:border-white/10 transition-all">
                <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Cadastro de Membros</h4>
                  <p className="text-[11px] text-slate-300 mt-1">Inscreva-se com toda a salvaguarda da lei LGPD.</p>
                  <button 
                    onClick={() => handleEnterMemberDashboard("registration")}
                    className="text-[10px] text-emerald-400 font-bold hover:text-emerald-500 transition-colors mt-2 uppercase tracking-wider block text-left underline decoration-emerald-400/40"
                  >
                    Abrir Inscrição →
                  </button>
                </div>
              </div>

              <div className="bg-[#121c2d] p-5 rounded-lg border border-white/5 flex items-start gap-3.5 hover:border-white/10 transition-all">
                <div className="w-8 h-8 rounded bg-rose-500/10 text-rose-405 flex items-center justify-center font-bold shrink-0">
                  <Info className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Avisos e Circulares</h4>
                  <p className="text-[11px] text-slate-300 mt-1">Fique sabendo de decretos administrativos de farda.</p>
                  <button 
                    onClick={() => handleEnterMemberDashboard("notices")}
                    className="text-[10px] text-rose-400 font-bold hover:text-rose-500 transition-colors mt-2 uppercase tracking-wider block text-left underline decoration-rose-500/40"
                  >
                    Quadro de Avisos →
                  </button>
                </div>
              </div>

              <div className="bg-[#121c2d] p-5 rounded-lg border border-white/5 flex items-start gap-3.5 hover:border-white/10 transition-all">
                <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Agenda de Atividades</h4>
                  <p className="text-[11px] text-slate-300 mt-1">Datas de devocionais regionais e cultos em SC.</p>
                  <button 
                    onClick={() => handleEnterMemberDashboard("agenda")}
                    className="text-[10px] text-amber-400 font-bold hover:text-amber-500 transition-colors mt-2 uppercase tracking-wider block text-left underline decoration-amber-400/40"
                  >
                    Consultar Agenda →
                  </button>
                </div>
              </div>

            </div>

            {/* Premium Relocated Capelania and Assistência Section */}
            <div className="mt-12 pt-8 border-t border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest block font-mono">Agência Oficial de Fé</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                    Capelania e Assistência Voluntária Especializada
                  </h4>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Selecione um serviço de assistência abaixo para acessar a área correspondente no Portal
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. Guarnição e Auxílio */}
                <button
                  onClick={() => handleEnterMemberDashboard("registration")}
                  className="bg-[#121c2d]/20 backdrop-blur-xl p-5 rounded-lg border border-white/5 hover:border-emerald-500/35 hover:bg-[#121c2d]/35 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-500/20 transition-all">
                      ✓
                    </div>
                    <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Guarnição e Auxílio</h5>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Acolhimento imediato a militares em face de estresse severo ou crises emocionais.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-3 uppercase tracking-wider group-hover:underline">
                    Fazer Inscrição / Solicitar Ajuda →
                  </span>
                </button>

                {/* 2. Literaturas de Uniforme */}
                <button
                  onClick={() => handleEnterMemberDashboard("notices")}
                  className="bg-[#121c2d]/20 backdrop-blur-xl p-5 rounded-lg border border-white/7 hover:border-amber-500/35 hover:bg-[#121c2d]/35 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs group-hover:bg-amber-500/20 transition-all">
                      📖
                    </div>
                    <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wider group-hover:text-amber-400 transition-colors">Literaturas de Uniforme</h5>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Entrega gratuita de Bíblias compactas de bolso para leitura em postos e patidas.
                  </p>
                  <span className="text-[10px] text-amber-400 font-bold block mt-3 uppercase tracking-wider group-hover:underline">
                    Quadro de Avisos / Livros →
                  </span>
                </button>

                {/* 3. Resgate e Ação Social */}
                <button
                  onClick={() => handleEnterMemberDashboard("agenda")}
                  className="bg-[#121c2d]/20 backdrop-blur-xl p-5 rounded-lg border border-white/5 hover:border-rose-500/35 hover:bg-[#121c2d]/35 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs group-hover:bg-rose-500/20 transition-all">
                      ♥
                    </div>
                    <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wider group-hover:text-rose-400 transition-colors">Resgate e Ação Social</h5>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Sopões e agasalhos na serra e planalto em parcerias voluntárias catarinenses.
                  </p>
                  <span className="text-[10px] text-rose-400 font-bold block mt-3 uppercase tracking-wider group-hover:underline">
                    Ver Eventos / Agenda de Cultos →
                  </span>
                </button>

              </div>
            </div>

          </div>
        </div>

        {/* Carousel containing Invitations and Events */}
        <CarouselsSection />

        {/* Dynamic magazines and bulletin catalogs layout */}
        <RevistasSection />

        {/* 4. About component details */}
        <div className="bg-[#0e1627] border-b border-white/5 py-12">
          <AboutMission />
        </div>

        {/* 5. Current Projects List */}
        <div className="bg-[#070c18] py-12">
          <ProjectsList 
            isDonateModalOpen={isDonateModalOpen}
            setIsDonateModalOpen={setIsDonateModalOpen}
          />
        </div>

      </main>

      {/* 6. Floating LGPD Notification Banner to allow fast user approval */}
      <LgpdPolicyBanner />

      {/* 7. Footer Section with full addresses and legal numbers */}
      <Footer 
        onScrollToSection={handleScrollOrRedirectToDashboard}
        onOpenDonateModal={handleOpenDonateOverlay}
        onEnterAdminMode={() => setView("admin")}
      />

    </div>
  );
}
