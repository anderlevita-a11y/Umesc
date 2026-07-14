import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Megaphone, Calendar, Eye, Play, Pause } from "lucide-react";
import { getCleanImageUrl } from "../lib/imageDriveHelper.ts";

import convite1 from "../assets/images/umesc_convite_1_1779818301691.png";
import convite2 from "../assets/images/umesc_convite_2_1779818318346.png";
import convite3 from "../assets/images/umesc_convite_3_1779818368346.png";
import evento1 from "../assets/images/umesc_evento_1_1779818334743.png";
import evento2 from "../assets/images/umesc_evento_2_1779818351705.png";
import evento3 from "../assets/images/umesc_evento_3_1779818385804.png";

// Default Fallback Slide Data for UMESC Invitations
const INITIAL_CONVITES: any[] = [];

// Default Fallback Slide Data for UMESC Events & Social Actions
const INITIAL_EVENTOS: any[] = [];

export default function CarouselsSection() {
  // Load dynamic content
  const [convites, setConvites] = useState(() => {
    try {
      const saved = localStorage.getItem("umesc_carousel_convites");
      return saved ? JSON.parse(saved) : INITIAL_CONVITES;
    } catch {
      return INITIAL_CONVITES;
    }
  });

  const [eventos, setEventos] = useState(() => {
    try {
      const saved = localStorage.getItem("umesc_carousel_eventos");
      return saved ? JSON.parse(saved) : INITIAL_EVENTOS;
    } catch {
      return INITIAL_EVENTOS;
    }
  });

  // Carousel State for Convites
  const [convitesIndex, setConvitesIndex] = useState(0);
  const [convitesDirection, setConvitesDirection] = useState(0);
  const [convitesPlaying, setConvitesPlaying] = useState(true);

  // Carousel State for Eventos
  const [eventosIndex, setEventosIndex] = useState(0);
  const [eventosDirection, setEventosDirection] = useState(0);
  const [eventosPlaying, setEventosPlaying] = useState(true);

  // Lightbox for reviewing images in full screen
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Listen to admin additions/deletions/edits
  useEffect(() => {
    const handleReload = () => {
      try {
        const savedConvites = localStorage.getItem("umesc_carousel_convites");
        setConvites(savedConvites ? JSON.parse(savedConvites) : INITIAL_CONVITES);
        setConvitesIndex(0);
        
        const savedEventos = localStorage.getItem("umesc_carousel_eventos");
        setEventos(savedEventos ? JSON.parse(savedEventos) : INITIAL_EVENTOS);
        setEventosIndex(0);
      } catch (err) {
        console.error("Error reloading carousels:", err);
      }
    };
    window.addEventListener("umesc_content_updated", handleReload);
    return () => window.removeEventListener("umesc_content_updated", handleReload);
  }, []);

  // Safeguard index transitions when slide array size changes
  useEffect(() => {
    if (convitesIndex >= convites.length) {
      setConvitesIndex(0);
    }
  }, [convites, convitesIndex]);

  useEffect(() => {
    if (eventosIndex >= eventos.length) {
      setEventosIndex(0);
    }
  }, [eventos, eventosIndex]);

  // Auto Play Loops
  useEffect(() => {
    if (!convitesPlaying || convites.length <= 1) return;
    const interval = setInterval(() => {
      handleNextConvite();
    }, 4500);
    return () => clearInterval(interval);
  }, [convitesIndex, convitesPlaying, convites]);

  useEffect(() => {
    if (!eventosPlaying || eventos.length <= 1) return;
    const interval = setInterval(() => {
      handleNextEvento();
    }, 5000);
    return () => clearInterval(interval);
  }, [eventosIndex, eventosPlaying, eventos]);

  // Handlers for Convites Navigation
  const handlePrevConvite = () => {
    if (convites.length === 0) return;
    setConvitesDirection(-1);
    setConvitesIndex((prev) => (prev === 0 ? convites.length - 1 : prev - 1));
  };

  const handleNextConvite = () => {
    if (convites.length === 0) return;
    setConvitesDirection(1);
    setConvitesIndex((prev) => (prev === convites.length - 1 ? 0 : prev + 1));
  };

  const setConvitesSlideDirect = (index: number) => {
    setConvitesDirection(index > convitesIndex ? 1 : -1);
    setConvitesIndex(index);
  };

  // Handlers for Eventos Navigation
  const handlePrevEvento = () => {
    if (eventos.length === 0) return;
    setEventosDirection(-1);
    setEventosIndex((prev) => (prev === 0 ? eventos.length - 1 : prev - 1));
  };

  const handleNextEvento = () => {
    if (eventos.length === 0) return;
    setEventosDirection(1);
    setEventosIndex((prev) => (prev === eventos.length - 1 ? 0 : prev + 1));
  };

  const setEventosSlideDirect = (index: number) => {
    setEventosDirection(index > eventosIndex ? 1 : -1);
    setEventosIndex(index);
  };

  // Variants for slide transition inside limited boxes
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: { duration: 0.25 }
    })
  };

  const currentConvite = convites[convitesIndex];
  const currentEvento = eventos[eventosIndex];

  return (
    <section id="mural" className="py-16 bg-[#070c18] border-t border-white/5 relative">
      
      {/* Absolute top grid divider lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#1e293b/30,transparent_55%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Module Header */}
        <div className="max-w-3xl mx-auto mb-12">
          <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 font-mono">
            Mural Informativo Geral UMESC SC
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 uppercase tracking-tight font-display">
            Avisos de Uniforme e Socorros Regionais
          </h2>
          <p className="text-slate-400 text-xs mt-2 max-w-xl mx-auto leading-relaxed">
            Consulte nossos convites estaduais vigentes e o resumo em tempo real da agenda de assistência religiosa ativa em todas as regiões de Santa Catarina.
          </p>
        </div>

        {/* Dual Carousels Grid Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* CAROUSEL 1: CONVITES (INVITATIONS) */}
          <div className="bg-[#0b1220] rounded-2xl border border-white/5 p-4 sm:p-5 flex flex-col justify-between min-h-[420px] sm:h-[450px]">
            
            {/* Carousel title block */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 gap-2">
              <div className="flex items-center gap-2 text-amber-500 min-w-0 flex-1">
                <Megaphone className="w-5 h-5 shrink-0" />
                <span className="font-extrabold text-[10px] sm:text-xs uppercase text-white tracking-wider font-display break-words">
                  Convites Estaduais & Campanhas
                </span>
              </div>
              <button 
                onClick={() => setConvitesPlaying(!convitesPlaying)} 
                className="text-slate-400 hover:text-white transition-colors shrink-0 p-1 rounded hover:bg-white/5"
                title={convitesPlaying ? "Pausar Reprodução Automática" : "Iniciar Reprodução Automática"}
              >
                {convitesPlaying ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
              </button>
            </div>

            {/* Slider visual frame */}
            <div className="relative flex-1 rounded-xl overflow-hidden group bg-slate-950 border border-white/5 min-h-[250px] sm:min-h-[300px]">
              
              {convites.length > 0 && currentConvite ? (
                <AnimatePresence initial={false} custom={convitesDirection} mode="popLayout">
                  <motion.div
                    key={convitesIndex}
                    custom={convitesDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0 w-full h-full"
                  >
                    <img
                      src={getCleanImageUrl(currentConvite.image)}
                      alt={currentConvite.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600";
                      }}
                    />
                    
                    {/* Subtle dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/20" />

                    {/* Top-left design tag badge */}
                    <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-md font-mono">
                      {currentConvite.tag}
                    </span>

                    {/* Top-right zoom action button */}
                    <button
                      onClick={() => setLightboxImage(currentConvite.image)}
                      title="Visualizar Imagem Completa"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#070c18]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                    </button>

                    {/* Text Details absolute bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 text-left bg-gradient-to-t from-slate-950 to-transparent">
                      <span className="text-[10px] text-amber-400 font-mono font-bold block mb-1">
                        🔔 {currentConvite.date}
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-tight line-clamp-1">
                        {currentConvite.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed mt-1 line-clamp-2">
                        {currentConvite.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-550 border border-dashed border-white/10 rounded-lg p-6">
                  <Megaphone className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-xs font-mono uppercase">Nenhum Convite Cadastrado</p>
                  <p className="text-[10px] text-slate-500 mt-1">Alimente este carrossel pela Área Administrativa.</p>
                </div>
              )}

              {/* Navigation arrows overlay */}
              {convites.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevConvite}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/60 backdrop-blur-sm border border-white/5 hover:bg-slate-900 flex items-center justify-center text-slate-200 active:scale-95 transition-all z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleNextConvite}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/60 backdrop-blur-sm border border-white/5 hover:bg-slate-900 flex items-center justify-center text-slate-200 active:scale-95 transition-all z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Pagination elements */}
            {convites.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                  SLIDE {convitesIndex + 1} DE {convites.length}
                </span>
                
                <div className="flex gap-2">
                  {convites.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setConvitesSlideDirect(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        convitesIndex === i ? "w-6 bg-amber-500" : "w-2 bg-white/10 hover:bg-white/20"
                      }`}
                      title={`Ir para slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* CAROUSEL 2: EVENTOS (EVENTS) */}
          <div className="bg-[#0b1220] rounded-2xl border border-white/5 p-4 sm:p-5 flex flex-col justify-between min-h-[420px] sm:h-[450px]">
            
            {/* Carousel title block */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 gap-2">
              <div className="flex items-center gap-2 text-teal-400 min-w-0 flex-1">
                <Calendar className="w-5 h-5 shrink-0" />
                <span className="font-extrabold text-[10px] sm:text-xs uppercase text-white tracking-wider font-display break-words">Ações Sociais & Atividades</span>
              </div>
              <button 
                onClick={() => setEventosPlaying(!eventosPlaying)} 
                className="text-slate-400 hover:text-white transition-colors shrink-0 p-1 rounded hover:bg-white/5"
                title={eventosPlaying ? "Pausar Reprodução" : "Iniciar Reprodução"}
              >
                {eventosPlaying ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
              </button>
            </div>

            {/* Slider visual frame */}
            <div className="relative flex-1 rounded-xl overflow-hidden group bg-slate-950 border border-white/5 min-h-[250px] sm:min-h-[300px]">
              
              {eventos.length > 0 && currentEvento ? (
                <AnimatePresence initial={false} custom={eventosDirection} mode="popLayout">
                  <motion.div
                    key={eventosIndex}
                    custom={eventosDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0 w-full h-full"
                  >
                    <img
                      src={getCleanImageUrl(currentEvento.image)}
                      alt={currentEvento.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1461532252243-85f001ca588a?auto=format&fit=crop&q=80&w=600";
                      }}
                    />
                    
                    {/* Subtle dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/20" />

                    {/* Top-left design tag badge */}
                    <span className="absolute top-3 left-3 bg-teal-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-md font-mono">
                      {currentEvento.tag}
                    </span>

                    {/* Top-right zoom action button */}
                    <button
                      onClick={() => setLightboxImage(currentEvento.image)}
                      title="Visualizar Imagem Completa"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#070c18]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                    >
                      <Eye className="w-4 h-4 text-teal-400" />
                    </button>

                    {/* Text Details absolute bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 text-left bg-gradient-to-t from-slate-950 to-transparent">
                      <span className="text-[10px] text-teal-400 font-mono font-bold block mb-1">
                        📍 {currentEvento.place}
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-tight line-clamp-1">
                        {currentEvento.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed mt-1 line-clamp-2">
                        {currentEvento.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-550 border border-dashed border-white/10 rounded-lg p-6">
                  <Calendar className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-xs font-mono uppercase">Nenhuma Ação Cadastrada</p>
                  <p className="text-[10px] text-slate-500 mt-1">Alimente este carrossel pela Área Administrativa.</p>
                </div>
              )}

              {/* Navigation arrows overlay */}
              {eventos.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevEvento}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/60 backdrop-blur-sm border border-white/5 hover:bg-slate-900 flex items-center justify-center text-slate-200 active:scale-95 transition-all z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleNextEvento}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/60 backdrop-blur-sm border border-white/5 hover:bg-slate-900 flex items-center justify-center text-slate-200 active:scale-95 transition-all z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Pagination elements */}
            {eventos.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                  REGISTRO {eventosIndex + 1} DE {eventos.length}
                </span>
                
                <div className="flex gap-2">
                  {eventos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setEventosSlideDirect(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        eventosIndex === i ? "w-6 bg-teal-400" : "w-2 bg-white/10 hover:bg-white/20"
                      }`}
                      title={`Ir para slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* LIGHTBOX / FULL SCREEN MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 z-[999] cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-5xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt="Fullscreen View"
                className="max-w-full max-h-[85vh] object-contain rounded-lg border border-white/10 shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full px-4 py-1.5 text-xs font-mono font-bold active:scale-95 transition-all cursor-pointer"
              >
                FECHAR ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
