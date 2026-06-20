/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShieldCheck, Menu, X, Landmark, Heart, FileText, UserPlus, Calendar, Compass } from "lucide-react";
import logoImg from "../assets/images/umesc_logo_official_1780591542921.png";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDonateModal: () => void;
  onScrollToSection: (elementId: string) => void;
  onEnterAdminMode?: () => void;
}

export default function Header({ activeTab, setActiveTab, onOpenDonateModal, onScrollToSection, onEnterAdminMode }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: "Quem Somos", id: "about", icon: Landmark },
    { label: "Estrutura & Leis", id: "structure", icon: ShieldCheck },
    { label: "Projetos", id: "projects", icon: Heart },
    { label: "Documentos & Avisos", id: "resources", icon: FileText },
    { label: "Pedidos de Oração", id: "prayer-requests", icon: Compass },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
    onScrollToSection(id);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1a2a40] border-b border-white/10 text-white shadow-md transition-all duration-300">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => handleNavClick("about")}
          >
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full overflow-hidden bg-[#132034] border-2 border-amber-500 group-hover:scale-105 transition-transform shrink-0 shadow-2xl self-start mt-4 mb-[-48px] z-55">
              <img 
                src={logoImg} 
                alt="Logo Oficial UMESC" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-amber-500">
                  UMESC
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                  LGPD SECURE
                </span>
              </div>
              
              {/* Social Media Link Grid Below Logo */}
              <div className="hidden sm:flex items-center gap-2 text-slate-400">
                <a 
                  href="https://www.instagram.com/umescsc/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-pink-400 transition-colors p-0.5 rounded hover:bg-white/5"
                  title="Instagram"
                >
                  <svg className="w-3.5 h-3.5 text-pink-450" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.youtube.com/@umesc-uniaodemilitaresevan4597" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-red-405 hover:text-red-400 transition-colors p-0.5 rounded hover:bg-white/5"
                  title="YouTube"
                >
                  <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.387.508 9.387.508s7.517 0 9.387-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.tiktok.com/@escutaessacristao?_r=1&_t=ZS-97E5HqUJjBi" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-cyan-400 transition-colors p-0.5 rounded hover:bg-white/5"
                  title="TikTok"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.03 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.14.98.98 2.37 1.5 3.77 1.58V9.6c-1.39-.03-2.77-.41-3.96-1.16-.27-.15-.52-.33-.76-.52-.08 2.82-.04 5.64-.06 8.46-.01 1.76-.5 3.54-1.57 4.93-1.63 2.12-4.43 3.02-7.01 2.4-2.07-.45-3.95-1.93-4.83-3.87-1.37-2.92-.47-6.84 2.18-8.73 1.48-1.09 3.37-1.53 5.19-1.25.01 1.41.01 2.81.01 4.22-.96-.28-2.01-.1-2.8.48-.73.53-1.12 1.45-1.02 2.36.08.97.7 1.83 1.58 2.18.91.38 1.99.17 2.69-.5.67-.62.91-1.58.89-2.47-.02-3.41-.01-6.82-.01-10.23z"/>
                  </svg>
                </a>
                <a 
                  href="https://open.spotify.com/show/1P5zeJnOtSBj51D3LTk0YE?si=wiXs6tsCTi-phUPW1TP7kw" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-emerald-400 transition-colors p-0.5 rounded hover:bg-white/5"
                  title="Spotify"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.561-1.14-.418.12-.78-.18-.9-.6-.12-.42.18-.78.6-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.24-1.98-8.161-2.58-11.94-1.38-.479.12-.961-.18-1.141-.66-.12-.48.18-.96.66-1.14 4.38-1.32 9.78-.66 13.56 1.68.421.24.6.78.3 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.14-.18-1.32-.72-.18-.6.18-1.14.72-1.32 4.2-1.26 11.28-1.02 15.72 1.62.54.3.72.96.42 1.5-.3.54-.96.72-1.5.42z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    isSelected
                      ? "bg-amber-500 text-[#1a2a40]"
                      : "text-slate-100 hover:text-amber-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTA Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">

            <button
              id="header-btn-register"
              onClick={() => handleNavClick("register")}
              className="border border-[#3a5885] bg-[#1e2f4a] hover:bg-[#253b5c]/80 px-4 py-2 rounded text-xs transition-colors cursor-pointer text-white font-semibold uppercase tracking-wider flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-500" />
              Área do Membro
            </button>

            {onEnterAdminMode && (
              <button
                onClick={onEnterAdminMode}
                className="border border-amber-500/40 hover:bg-amber-500/10 px-3.5 py-2 rounded text-xs transition-colors cursor-pointer text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5"
                title="Administração Geral UMESC"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                Painel Admin
              </button>
            )}
          </div>

          {/* Mobile Hamburguer Toggle */}
          <div className="flex items-center lg:hidden gap-2">
            <button
              onClick={onOpenDonateModal}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 rounded text-[#1a2a40] text-xs font-bold uppercase transition-colors"
            >
              Doar
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1 px-2.5 ml-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 space-y-1 bg-[#152233] border-t border-white/10 shadow-xl">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded text-xs uppercase tracking-wider font-bold transition-all text-left ${
                  isSelected
                    ? "bg-amber-500 text-[#1a2a40]"
                    : "text-slate-200 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 text-slate-300" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-3 py-2 rounded bg-[#101c2a] border border-white/5 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> LGPD CRIPTOGRAFIA
              </span>
              <span className="bg-emerald-950 text-[8px] px-1 py-0.5 text-emerald-300 rounded font-sans font-bold">Ativo</span>
            </div>
            
            <button
              onClick={() => handleNavClick("register")}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#1e2f4a] border border-[#3a5885] hover:bg-[#253b5c]/80 text-white rounded text-xs uppercase font-black"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              Área do Membro
            </button>

            {onEnterAdminMode && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onEnterAdminMode();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#1a2a40] rounded text-xs uppercase font-black"
              >
                <ShieldCheck className="w-4 h-4" />
                Painel Administrativo 🔒
              </button>
            )}

            {/* Social Grid for Mobile */}
            <div className="grid grid-cols-4 gap-2 pt-3.5 border-t border-white/10 mt-1">
              <a 
                href="https://www.instagram.com/umescsc/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex flex-col items-center justify-center py-2 rounded bg-white/5 hover:bg-white/10 text-pink-400 text-[9px] font-bold uppercase transition-colors"
              >
                <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span>Instagram</span>
              </a>
              <a 
                href="https://www.youtube.com/@umesc-uniaodemilitaresevan4597" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex flex-col items-center justify-center py-2 rounded bg-white/5 hover:bg-white/10 text-red-550 hover:text-red-400 text-[9px] font-bold uppercase transition-colors"
              >
                <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.387.508 9.387.508s7.517 0 9.387-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>YouTube</span>
              </a>
              <a 
                href="https://www.tiktok.com/@escutaessacristao?_r=1&_t=ZS-97E5HqUJjBi" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex flex-col items-center justify-center py-2 rounded bg-white/5 hover:bg-white/10 text-cyan-400 text-[9px] font-bold uppercase transition-colors"
              >
                <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.03 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.14.98.98 2.37 1.5 3.77 1.58V9.6c-1.39-.03-2.77-.41-3.96-1.16-.27-.15-.52-.33-.76-.52-.08 2.82-.04 5.64-.06 8.46-.01 1.76-.5 3.54-1.57 4.93-1.63 2.12-4.43 3.02-7.01 2.4-2.07-.45-3.95-1.93-4.83-3.87-1.37-2.92-.47-6.84 2.18-8.73 1.48-1.09 3.37-1.53 5.19-1.25.01 1.41.01 2.81.01 4.22-.96-.28-2.01-.1-2.8.48-.73.53-1.12 1.45-1.02 2.36.08.97.7 1.83 1.58 2.18.91.38 1.99.17 2.69-.5.67-.62.91-1.58.89-2.47-.02-3.41-.01-6.82-.01-10.23z"/>
                </svg>
                <span>TikTok</span>
              </a>
              <a 
                href="https://open.spotify.com/show/1P5zeJnOtSBj51D3LTk0YE?si=wiXs6tsCTi-phUPW1TP7kw" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex flex-col items-center justify-center py-2 rounded bg-white/5 hover:bg-white/10 text-emerald-400 text-[9px] font-bold uppercase transition-colors"
              >
                <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.561-1.14-.418.12-.78-.18-.9-.6-.12-.42.18-.78.6-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.24-1.98-8.161-2.58-11.94-1.38-.479.12-.961-.18-1.141-.66-.12-.48.18-.96.66-1.14 4.38-1.32 9.78-.66 13.56 1.68.421.24.6.78.3 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.14-.18-1.32-.72-.18-.6.18-1.14.72-1.32 4.2-1.26 11.28-1.02 15.72 1.62.54.3.72.96.42 1.5-.3.54-.96.72-1.5.42z"/>
                </svg>
                <span>Spotify</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
