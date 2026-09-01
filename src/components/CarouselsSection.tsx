import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Megaphone, Calendar, Eye, Play, Pause } from "lucide-react";
import { getCleanImageUrl } from "../lib/imageDriveHelper.ts";
import { getStoredConvites, getStoredEventos, fetchConvitesAsync, fetchEventosAsync, ConviteSlide, EventoSlide } from "../data/carouselData.ts";

export default function CarouselsSection() {
  // Load dynamic content with fallback to default official UMESC slides
  const [convites, setConvites] = useState<ConviteSlide[]>(getStoredConvites);
  const [eventos, setEventos] = useState<EventoSlide[]>(getStoredEventos);

  // Carousel State for Convites
  const [convitesIndex, setConvitesIndex] = useState(0);
  const [convitesPlaying, setConvitesPlaying] = useState(true);

  // Carousel State for Eventos
  const [eventosIndex, setEventosIndex] = useState(0);
  const [eventosPlaying, setEventosPlaying] = useState(true);

  // Lightbox for reviewing images in full screen
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Listen to admin additions/deletions/edits & Supabase real-time sync
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [cList, eList] = await Promise.all([
          fetchConvitesAsync(),
          fetchEventosAsync()
        ]);
        if (isMounted) {
          setConvites(cList);
          setEventos(eList);
        }
      } catch (err) {
        console.error("Error loading carousels async:", err);
      }
    };

    loadData();

    const handleReload = () => {
      loadData();
    };

    window.addEventListener("umesc_content_updated", handleReload);
    window.addEventListener("storage", handleReload);
    return () => {
      isMounted = false;
      window.removeEventListener("umesc_content_updated", handleReload);
      window.removeEventListener("storage", handleReload);
    };
  }, []);

  // Safeguard index transitions when slide array size changes
  useEffect(() => {
    if (convitesIndex >= convites.length && convites.length > 0) {
      setConvitesIndex(0);
    }
  }, [convites.length, convitesIndex]);

  useEffect(() => {
    if (eventosIndex >= eventos.length && eventos.length > 0) {
      setEventosIndex(0);
    }
  }, [eventos.length, eventosIndex]);

  // Handlers for Convites Navigation
  const handlePrevConvite = () => {
    if (convites.length === 0) return;
    setConvitesIndex((prev) => (prev === 0 ? convites.length - 1 : prev - 1));
  };

  const handleNextConvite = () => {
    if (convites.length === 0) return;
    setConvitesIndex((prev) => (prev === convites.length - 1 ? 0 : prev + 1));
  };

  const setConvitesSlideDirect = (index: number) => {
    setConvitesIndex(index);
  };

  // Handlers for Eventos Navigation
  const handlePrevEvento = () => {
    if (eventos.length === 0) return;
    setEventosIndex((prev) => (prev === 0 ? eventos.length - 1 : prev - 1));
  };

  const handleNextEvento = () => {
    if (eventos.length === 0) return;
    setEventosIndex((prev) => (prev === eventos.length - 1 ? 0 : prev + 1));
  };

  const setEventosSlideDirect = (index: number) => {
    setEventosIndex(index);
  };

  // Auto Play Loops
  useEffect(() => {
    if (!convitesPlaying || convites.length <= 1) return;
    const interval = setInterval(() => {
      setConvitesIndex((prev) => (prev === convites.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [convitesPlaying, convites.length]);

  useEffect(() => {
    if (!eventosPlaying || eventos.length <= 1) return;
    const interval = setInterval(() => {
      setEventosIndex((prev) => (prev === eventos.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [eventosPlaying, eventos.length]);

  const currentConvite = convites[convitesIndex];
  const currentEvento = eventos[eventosIndex];

  return (
    <section id="mural" className="py-12 sm:py-16 bg-[#070c18] border-t border-white/5 relative">
      
      {/* Absolute top grid divider lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#1e293b/30,transparent_55%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Module Header */}
        <div className="max-w-3xl mx-auto mb-8 sm:mb-12">
          <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 font-mono">
            Mural Informativo Geral UMESC SC
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white mt-1 uppercase tracking-tight font-display">
            Avisos de Uniforme e Socorros Regionais
          </h2>
          <p className="text-slate-400 text-xs mt-2 max-w-xl mx-auto leading-relaxed">
            Consulte nossos convites estaduais vigentes e o resumo em tempo real da agenda de assistência religiosa ativa em todas as regiões de Santa Catarina.
          </p>
        </div>

        {/* Dual Carousels Grid Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          
          {/* CAROUSEL 1: CONVITES (INVITATIONS) */}
          <div className="bg-[#0b1220] rounded-2xl border border-white/5 p-4 sm:p-5 flex flex-col justify-between min-h-[380px] sm:min-h-[440px]">
            
            {/* Carousel title block */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2 text-amber-500 min-w-0 flex-1">
                <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="font-extrabold text-xs sm:text-xs uppercase text-white tracking-wider font-display break-words text-left">
                  Convites Estaduais & Campanhas
                </span>
              </div>
              <button 
                onClick={() => setConvitesPlaying(!convitesPlaying)} 
                className="text-slate-400 hover:text-white transition-colors shrink-0 p-1.5 rounded hover:bg-white/5 cursor-pointer"
                title={convitesPlaying ? "Pausar Reprodução Automática" : "Iniciar Reprodução Automática"}
              >
                {convitesPlaying ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
              </button>
            </div>

            {/* Slider visual frame */}
            <div className="relative flex-1 rounded-xl overflow-hidden group bg-slate-950 border border-white/5 min-h-[260px] sm:min-h-[300px]">
              
              {convites.length > 0 && currentConvite ? (
                <div
                  key={convitesIndex}
                  className="absolute inset-0 w-full h-full transition-opacity duration-300"
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
                  
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-black/30" />

                  {/* Top-left design tag badge */}
                  <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-md font-mono z-10">
                    {currentConvite.tag}
                  </span>

                  {/* Top-right zoom action button - ALWAYS visible on mobile for touch accessibility */}
                  <button
                    onClick={() => setLightboxImage(getCleanImageUrl(currentConvite.image))}
                    title="Visualizar Imagem Completa"
                    className="absolute top-3 right-3 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#070c18]/85 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity active:scale-90 z-10 cursor-pointer shadow-lg"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                  </button>

                  {/* Text Details absolute bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-5 text-left bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
                    <span className="text-[10px] text-amber-400 font-mono font-bold block mb-1">
                      🔔 {currentConvite.date}
                    </span>
                    <h4 className="text-xs sm:text-base font-extrabold text-white uppercase tracking-tight line-clamp-1">
                      {currentConvite.title}
                    </h4>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-300 leading-snug mt-1 line-clamp-2">
                      {currentConvite.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 border border-dashed border-white/10 rounded-lg p-6">
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
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-950/75 backdrop-blur-sm border border-white/10 hover:bg-slate-900 flex items-center justify-center text-slate-200 active:scale-95 transition-all z-20 cursor-pointer shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    onClick={handleNextConvite}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-950/75 backdrop-blur-sm border border-white/10 hover:bg-slate-900 flex items-center justify-center text-slate-200 active:scale-95 transition-all z-20 cursor-pointer shadow-md"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Pagination elements */}
            {convites.length > 0 && (
              <div className="flex items-center justify-between mt-3 sm:mt-4">
                <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                  SLIDE {convitesIndex + 1} DE {convites.length}
                </span>
                
                <div className="flex gap-1.5 sm:gap-2">
                  {convites.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setConvitesSlideDirect(i)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
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
          <div className="bg-[#0b1220] rounded-2xl border border-white/5 p-4 sm:p-5 flex flex-col justify-between min-h-[380px] sm:min-h-[440px]">
            
            {/* Carousel title block */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2 text-teal-400 min-w-0 flex-1">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="font-extrabold text-xs sm:text-xs uppercase text-white tracking-wider font-display break-words text-left">
                  Ações Sociais & Atividades
                </span>
              </div>
              <button 
                onClick={() => setEventosPlaying(!eventosPlaying)} 
                className="text-slate-400 hover:text-white transition-colors shrink-0 p-1.5 rounded hover:bg-white/5 cursor-pointer"
                title={eventosPlaying ? "Pausar Reprodução" : "Iniciar Reprodução"}
              >
                {eventosPlaying ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
              </button>
            </div>

            {/* Slider visual frame */}
            <div className="relative flex-1 rounded-xl overflow-hidden group bg-slate-950 border border-white/5 min-h-[260px] sm:min-h-[300px]">
              
              {eventos.length > 0 && currentEvento ? (
                <div
                  key={eventosIndex}
                  className="absolute inset-0 w-full h-full transition-opacity duration-300"
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
                  
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-black/30" />

                  {/* Top-left design tag badge */}
                  <span className="absolute top-3 left-3 bg-teal-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-md font-mono z-10">
                    {currentEvento.tag}
                  </span>

                  {/* Top-right zoom action button - ALWAYS visible on mobile */}
                  <button
                    onClick={() => setLightboxImage(getCleanImageUrl(currentEvento.image))}
                    title="Visualizar Imagem Completa"
                    className="absolute top-3 right-3 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#070c18]/85 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity active:scale-90 z-10 cursor-pointer shadow-lg"
                  >
                    <Eye className="w-4 h-4 text-teal-400" />
                  </button>

                  {/* Text Details absolute bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-5 text-left bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
                    <span className="text-[10px] text-teal-400 font-mono font-bold block mb-1">
                      📍 {currentEvento.place}
                    </span>
                    <h4 className="text-xs sm:text-base font-extrabold text-white uppercase tracking-tight line-clamp-1">
                      {currentEvento.title}
                    </h4>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-300 leading-snug mt-1 line-clamp-2">
                      {currentEvento.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 border border-dashed border-white/10 rounded-lg p-6">
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
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-950/75 backdrop-blur-sm border border-white/10 hover:bg-slate-900 flex items-center justify-center text-slate-200 active:scale-95 transition-all z-20 cursor-pointer shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    onClick={handleNextEvento}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-950/75 backdrop-blur-sm border border-white/10 hover:bg-slate-900 flex items-center justify-center text-slate-200 active:scale-95 transition-all z-20 cursor-pointer shadow-md"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Pagination elements */}
            {eventos.length > 0 && (
              <div className="flex items-center justify-between mt-3 sm:mt-4">
                <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                  REGISTRO {eventosIndex + 1} DE {eventos.length}
                </span>
                
                <div className="flex gap-1.5 sm:gap-2">
                  {eventos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setEventosSlideDirect(i)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
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
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 z-[999] cursor-zoom-out"
        >
          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Fullscreen View"
              className="max-w-full max-h-[80vh] sm:max-h-[85vh] object-contain rounded-lg border border-white/10 shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full px-4 py-1.5 text-xs font-mono font-bold active:scale-95 transition-all cursor-pointer"
            >
              FECHAR ✕
            </button>
          </div>
        </div>
      )}

    </section>
  );
}
