/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShieldCheck, Menu, X, Landmark, Heart, FileText, UserPlus, Calendar } from "lucide-react";
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
    { label: "Agenda", id: "agenda", icon: Calendar },
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
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-amber-500">
                  UMESC
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                  LGPD SECURE
                </span>
              </div>
              <span className="text-[9px] text-slate-300 font-semibold tracking-wider max-w-[260px] truncate hidden md:block uppercase opacity-90">
                União de Militares Evangélicos de SC
              </span>
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
            {/* Safe Data Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 border border-white/15 text-slate-100 text-[10px] font-mono font-bold leading-normal">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>DADOS SEGUROS</span>
            </div>

            <button
              id="header-btn-donate"
              onClick={onOpenDonateModal}
              className="px-4 py-2 text-xs font-bold uppercase bg-amber-500 hover:bg-amber-600 rounded text-[#1a2a40] transition-colors cursor-pointer"
            >
              DOAR AGORA
            </button>

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
          </div>
        </div>
      )}
    </header>
  );
}
