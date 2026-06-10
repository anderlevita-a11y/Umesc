/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UMESC_ABOUT } from "../data";
import { ShieldCheck, Mail, MapPin, Phone, Landmark, ExternalLink, Bookmark } from "lucide-react";
import logoImg from "../assets/images/umesc_logo_official_1780591542921.png";

interface FooterProps {
  onScrollToSection: (elementId: string) => void;
  onOpenDonateModal: () => void;
  onEnterAdminMode?: () => void;
}

export default function Footer({ onScrollToSection, onOpenDonateModal, onEnterAdminMode }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900 pt-16 pb-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          
          {/* Logo Brand / Pitch Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-amber-500/30 shrink-0 shadow-md">
                <img 
                  src={logoImg} 
                  alt="Selo Oficial UMESC" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-extrabold text-base text-yellow-500 block leading-tight">UMESC</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Militares Evangélicos de SC</span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed pr-6">
              Agência missionária interdenominacional focada no apoio psicossocial, capelania hospitalar e militar, acolhimento de famílias fardadas e fomento de conduta ética cristã em Santa Catarina.
            </p>

            <div className="flex items-center gap-2 text-emerald-400 bg-slate-900 border border-slate-900 p-3 rounded-xl max-w-sm">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <p className="text-[11px] text-slate-350">
                <strong>LGPD Ativa:</strong> Proteção estrita de dados cadastrais de agentes públicos e cooperadores.
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider pb-1 border-b border-slate-900">Navegue no Portal</h4>
            <ul className="space-y-2.5">
              <li>
                <button 
                  onClick={() => onScrollToSection("about")} 
                  className="text-slate-400 hover:text-white hover:underline transition-all text-left"
                >
                  Nossa Missão & Valores
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onScrollToSection("structure")} 
                  className="text-slate-400 hover:text-white hover:underline transition-all text-left"
                >
                  Diretoria Executiva & Leis
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onScrollToSection("projects")} 
                  className="text-slate-400 hover:text-white hover:underline transition-all text-left"
                >
                  Projetos e Parcerias
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onScrollToSection("register")} 
                  className="text-slate-400 hover:text-white hover:underline transition-all text-left font-semibold text-amber-500"
                >
                  Fazer Minha Inscrição
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenDonateModal} 
                  className="text-slate-400 hover:text-white hover:underline transition-all text-left"
                >
                  Doar com PIX Rápido
                </button>
              </li>
              {onEnterAdminMode && (
                <li>
                  <button 
                    onClick={onEnterAdminMode} 
                    className="text-slate-400 hover:text-white hover:underline transition-all text-left font-bold text-amber-500/80 flex items-center gap-1.5 uppercase tracking-wider text-[10px]"
                  >
                    🔒 Área Administrativa
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Contacts Base SC */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider pb-1 border-b border-slate-900">Sede Administrativa e Contatos</h4>
            <ul className="space-y-3.5 text-slate-400 leading-normal">
              
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Sede UMESC:</strong><br />
                  Rua Concórdia nº 75, Bairro Petrópolis, Lages - SC, CEP 88505-334.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Secretaria:</strong> (49) 99913-2461<br />
                  <strong>Aux. Secretaria:</strong> (49) 99154-8742
                </span>
              </li>

              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-[#c2410c] shrink-0 mt-0.5" />
                <span className="break-all">
                  <strong>E-mail:</strong><br />
                  umesc@umesc.com.br<br />
                  antunes@umesc.com.br<br />
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">Webmaster: webmaster@umesc.com.br</span>
                </span>
              </li>

              <li className="flex items-center gap-1.5 pt-1.5 font-mono text-[10px] text-slate-500">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Utilidade Pública Estadual Lei nº 12.045/SC</span>
              </li>

            </ul>
          </div>

        </div>

        {/* Separator / Copyright info */}
        <div className="pt-8 mt-8 border-t border-slate-900 text-center text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
          <div>
            © {currentYear} UMESC - União de Militares Evangélicos de Santa Catarina.
          </div>
          
          <div className="flex flex-wrap gap-4 items-center justify-center text-slate-400">
            <span>Desenvolvido sob Prerrogativas de Fé e Lei Geral de Proteção de Dados (Lei 13.709/2018)</span>
            <span>•</span>
            <a 
              href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-amber-500 flex items-center gap-1"
            >
              Consultar Lei LGPD <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
