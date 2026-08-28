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
import PrayerRequestsSection from "./components/PrayerRequestsSection";
import LgpdPolicyBanner from "./components/LgpdPolicyBanner";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import Footer from "./components/Footer";

import { ShieldCheck, Calendar, Users, Scale, UserPlus, Info, Compass, Star, X } from "lucide-react";
import { DEFAULT_CAPELANIA_SERVICES } from "./data";
import { CapelaniaService, ApoioFemininoPost } from "./types";
import { getCleanImageUrl } from "./lib/imageDriveHelper";
import { apoioFemininoService, settingsService } from "./lib/supabase";
import { accessTrackerService } from "./lib/accessTracker";

export default function App() {
  const [view, setView] = useState<"public" | "dashboard" | "admin">("public");
  const [memberDashboardInitialTab, setMemberDashboardInitialTab] = useState<"notices" | "structure" | "registration" | "congressos">("notices");
  const [activeTab, setActiveTab ] = useState("about");

  // Dynamic capelania services editable in admin portal
  const [capelaniaServices, setCapelaniaServices] = useState<CapelaniaService[]>(() => {
    const saved = localStorage.getItem("umesc_capelania_services");
    return saved ? JSON.parse(saved) : DEFAULT_CAPELANIA_SERVICES;
  });

  React.useEffect(() => {
    // Record page access
    accessTrackerService.recordAccess().catch(err => {
      console.warn("Error recording page access:", err);
    });
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const loadCapServices = async () => {
      try {
        const list = await settingsService.getSetting<CapelaniaService[]>("umesc_capelania_services", DEFAULT_CAPELANIA_SERVICES);
        if (isMounted && Array.isArray(list)) {
          setCapelaniaServices(list);
        }
      } catch (err) {
        console.error("Error fetching capelania services in App:", err);
      }
    };

    loadCapServices();

    const handleUpdate = () => {
      loadCapServices();
    };

    window.addEventListener("umesc_content_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("umesc_content_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const [apoioFemininoPosts, setApoioFemininoPosts] = useState<ApoioFemininoPost[]>([]);
  const [selectedApoioPost, setSelectedApoioPost] = useState<ApoioFemininoPost | null>(null);

  React.useEffect(() => {
    if (view === "public") {
      apoioFemininoService.getPosts().then((posts) => {
        setApoioFemininoPosts(posts);
      }).catch(err => {
        console.error("Erro ao buscar publicações do Apoio Feminino:", err);
      });

      // Auto-scroll to congress section if deep linked via hash or search param
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash === "#public-featured-events-banner" || hash === "#congresso" || search.includes("congresso=")) {
        setTimeout(() => {
          const el = document.getElementById("public-featured-events-banner");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 500);
      }
    }
  }, [view]);

  // Smooth scroll helper for public elements
  const handleScrollToSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleEnterMemberDashboard = (tab: "notices" | "structure" | "registration" | "congressos" = "notices") => {
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
      handleEnterMemberDashboard("notices");
    } else if (elementId === "register") {
      handleEnterMemberDashboard("registration");
    } else {
      handleScrollToSection(elementId);
    }
  };

  if (view === "dashboard") {
    return (
      <>
        <PWAInstallPrompt />
        <MemberDashboard 
          initialTab={memberDashboardInitialTab}
          onBackToHome={() => setView("public")}
          onEnterAdminMode={() => setView("admin")}
        />
      </>
    );
  }

  if (view === "admin") {
    return (
      <>
        <PWAInstallPrompt />
        <AdminPortal 
          onBackToHome={() => setView("public")}
        />
      </>
    );
  }

  return (
    <div id="portal-root" className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans antialiased text-sm">
      
      {/* 1. Sticky Navigation Header under PT-BR */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onScrollToSection={handleScrollOrRedirectToDashboard}
        onEnterAdminMode={() => setView("admin")}
      />

      <main className="flex-1">
        
        {/* 3. Hero Visual Section with quick CTAs */}
        <Hero 
          onScrollToSection={handleScrollOrRedirectToDashboard}
          onEnterMemberDashboard={() => handleEnterMemberDashboard("notices")}
        />

        {/* Public Featured Congress Banner with Countdown built dynamically */}
        <PublicCongressBanner onEnterMemberDashboard={handleEnterMemberDashboard} />

        {/* Dynamic magazines and bulletin catalogs layout */}
        <RevistasSection />

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

        {/* Apoio Feminino Section */}
        <div id="apoio-feminino-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          <div className="relative overflow-hidden bg-[#0c1626]/90 rounded-3xl border border-pink-500/10 shadow-xl p-6 sm:p-8">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row gap-8 items-stretch">
              {/* Left Column: Information and the Special Commemorative Banner */}
              <div className="w-full lg:w-1/3 flex flex-col justify-between space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase tracking-widest font-mono">
                    Ministério da Família
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight mt-3">
                    Apoio Feminino da UMESC
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                    Um braço forte de comunhão, oração e suporte espiritual dedicado às mulheres militares, esposas de policiais e bombeiros militares, e apoiadoras da segurança pública em Santa Catarina.
                  </p>
                </div>

                {/* Main Logo/Banner Image */}
                <div className="relative rounded-2xl overflow-hidden border border-pink-500/20 shadow-2xl bg-black/40 group aspect-[4/3] max-w-sm mx-auto lg:mx-0 w-full flex items-center justify-center">
                  <img
                    src="https://qndjkphfsejuqopmfgas.supabase.co/storage/v1/object/public/qr%20code%20pix%20entidade/APOIO%20FEMENINO%20(2).png"
                    alt="Logo Oficial Apoio Feminino UMESC"
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Right Column: Dynamic Blog Feed */}
              <div className="w-full lg:w-2/3 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                    Blog & Novidades do Apoio Feminino
                  </h4>

                  {apoioFemininoPosts.length === 0 ? (
                    <div className="bg-[#111e35]/30 border border-white/5 rounded-2xl p-8 text-center text-slate-400 font-mono text-xs">
                      Nenhuma publicação cadastrada no momento. Novas mensagens de encorajamento e vídeos estarão disponíveis em breve!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                      {apoioFemininoPosts.map((post) => {
                        const youtubeMatch = post.mediaUrl ? post.mediaUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/) : null;
                        const embedCode = (youtubeMatch && youtubeMatch[2].length === 11) ? youtubeMatch[2] : null;

                        return (
                          <div 
                            key={post.id} 
                            onClick={() => setSelectedApoioPost(post)}
                            className="bg-[#111e35]/40 rounded-2xl border border-white/5 p-4 flex flex-col justify-between hover:border-pink-500/40 hover:bg-[#111e35]/60 hover:scale-[1.01] hover:shadow-lg hover:shadow-pink-500/5 transition-all shadow-md cursor-pointer group"
                          >
                            <div className="flex flex-col justify-between h-full w-full">
                              <div>
                                {post.mediaType === "video" && embedCode ? (
                                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black mb-3 relative">
                                    <img
                                      src={`https://img.youtube.com/vi/${embedCode}/mqdefault.jpg`}
                                      alt={post.title}
                                      className="w-full h-full object-cover brightness-90 group-hover:brightness-100 transition-all"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
                                        <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                                          <path d="M8 5v14l11-7z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                ) : post.mediaType === "image" && post.mediaUrl ? (
                                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/20 mb-3">
                                    <img
                                      src={post.mediaUrl}
                                      alt={post.title}
                                      className="w-full h-full object-cover group-hover:scale-102 transition-all"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                ) : null}

                                <span className="text-[9px] font-mono text-pink-400 font-semibold block">
                                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString("pt-BR") : "Recente"}
                                </span>
                                <h5 className="font-extrabold text-white text-sm mt-1 leading-snug line-clamp-2 group-hover:text-pink-300 transition-colors">
                                  {post.title}
                                </h5>
                                <p className="text-slate-300 text-xs mt-2 line-clamp-4 leading-relaxed whitespace-pre-line">
                                  {post.content}
                                </p>
                              </div>
                              <div className="mt-4 pt-2 border-t border-white/5 flex justify-end">
                                <span className="text-[10px] font-bold text-pink-400 group-hover:text-pink-300 transition-colors uppercase tracking-wider flex items-center gap-1">
                                  Ler na Íntegra →
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <span className="text-[10px] font-mono text-slate-500 italic">
                    Espaço atualizado pela Coordenação Estadual do Apoio Feminino
                  </span>
                </div>
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
                  <Star className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Congressos Estaduais</h4>
                  <p className="text-[11px] text-slate-300 mt-1">Inscrição em Simpósios e Encontros Oficiais.</p>
                  <button 
                    onClick={() => handleEnterMemberDashboard("congressos")}
                    className="text-[10px] text-amber-400 font-bold hover:text-amber-500 transition-colors mt-2 uppercase tracking-wider block text-left underline decoration-amber-400/40"
                  >
                    Ver Congressos →
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
                {capelaniaServices.map((srv, idx) => {
                  const borderHoverColors = [
                    "hover:border-emerald-500/35",
                    "hover:border-amber-500/35",
                    "hover:border-rose-500/35"
                  ];
                  const badgeColors = [
                    "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
                    "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20",
                    "bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20"
                  ];
                  const titleHoverColors = [
                    "group-hover:text-emerald-400",
                    "group-hover:text-amber-400",
                    "group-hover:text-rose-400"
                  ];
                  const btnTextColors = [
                    "text-emerald-400",
                    "text-amber-400",
                    "text-rose-400"
                  ];

                  const bColor = borderHoverColors[idx % borderHoverColors.length];
                  const bgCol = badgeColors[idx % badgeColors.length];
                  const tColor = titleHoverColors[idx % titleHoverColors.length];
                  const btnCol = btnTextColors[idx % btnTextColors.length];

                  return (
                    <button
                      key={srv.id}
                      onClick={() => handleEnterMemberDashboard(srv.tabLink)}
                      className={`bg-[#121c2d]/20 backdrop-blur-xl p-5 rounded-xl border border-white/5 ${bColor} hover:bg-[#121c2d]/35 text-left transition-all active:scale-[0.98] group cursor-pointer flex flex-col justify-between overflow-hidden h-full`}
                    >
                      <div>
                        {srv.imageUrl ? (
                          <div className="w-full h-32 rounded-lg overflow-hidden mb-3.5 border border-white/10 bg-slate-900/50">
                            <img
                              src={getCleanImageUrl(srv.imageUrl)}
                              alt={srv.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain group-hover:scale-[1.03] transition-all duration-300"
                            />
                          </div>
                        ) : null}
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs transition-all shrink-0 ${bgCol}`}>
                            {srv.emoji || "✦"}
                          </div>
                          <h5 className={`text-xs font-bold text-slate-100 uppercase tracking-wider ${tColor} transition-colors`}>
                            {srv.title}
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed min-h-[32px]">
                          {srv.description}
                        </p>
                      </div>
                      <span className={`text-[10px] ${btnCol} font-bold block mt-3 uppercase tracking-wider group-hover:underline`}>
                        {srv.buttonText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Carousel containing Invitations and Events */}
        <CarouselsSection />

        {/* Global Prayer Requests Platform */}
        <PrayerRequestsSection />

        {/* 4. About component details */}
        <div className="bg-[#0e1627] border-b border-white/5 py-12">
          <AboutMission />
        </div>

        {/* 5. Current Projects List */}
        <div className="bg-[#070c18] py-12">
          <ProjectsList />
        </div>

      </main>

      {/* 6. Floating LGPD Notification Banner to allow fast user approval */}
      <LgpdPolicyBanner />

      {/* PWA Offline & Install Prompt */}
      <PWAInstallPrompt />

      {/* 7. Footer Section with full addresses and legal numbers */}
      <Footer 
        onScrollToSection={handleScrollOrRedirectToDashboard}
        onEnterAdminMode={() => setView("admin")}
      />

      {/* Modal para leitura completa do Apoio Feminino */}
      {selectedApoioPost && (() => {
        const youtubeMatch = selectedApoioPost.mediaUrl ? selectedApoioPost.mediaUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/) : null;
        const embedCode = (youtubeMatch && youtubeMatch[2].length === 11) ? youtubeMatch[2] : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-3xl bg-[#0c1626] border border-pink-500/20 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
              {/* Top Banner Accent */}
              <div className="h-1.5 bg-gradient-to-r from-pink-500 via-indigo-500 to-pink-600 w-full" />
              
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-start gap-4">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[9px] font-bold uppercase tracking-widest font-mono">
                    Apoio Feminino • Reflexão
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-white font-display mt-2 leading-snug">
                    {selectedApoioPost.title}
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Publicado em {selectedApoioPost.createdAt ? new Date(selectedApoioPost.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' }) : "Recente"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApoioPost(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                {selectedApoioPost.mediaType === "video" && embedCode ? (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-white/5">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${embedCode}?autoplay=1`}
                      title={selectedApoioPost.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : selectedApoioPost.mediaType === "image" && selectedApoioPost.mediaUrl ? (
                  <div className="rounded-2xl overflow-hidden bg-black/20 shadow-lg border border-white/5 max-h-[350px] flex items-center justify-center">
                    <img
                      src={selectedApoioPost.mediaUrl}
                      alt={selectedApoioPost.title}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : null}

                <div className="space-y-4">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-sans selection:bg-pink-500/30">
                    {selectedApoioPost.content}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-black/20 border-t border-white/5 flex justify-between items-center gap-4">
                <span className="text-[10px] font-mono text-slate-500 italic">
                  UMESC - União de Militares Evangélicos de SC
                </span>
                <button
                  onClick={() => setSelectedApoioPost(null)}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-pink-600/10"
                >
                  Fechar Leitura
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
