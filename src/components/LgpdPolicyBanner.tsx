/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShieldAlert, Check, X, ShieldCheck } from "lucide-react";

export default function LgpdPolicyBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("umesc_lgpd_banner_consent");
    if (!consent) {
      // Show after a tiny delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("umesc_lgpd_banner_consent", "accepted");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-950 border border-emerald-900 shadow-2xl rounded-2xl p-4 md:p-5 text-white max-w-4xl mx-auto animate-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      
      <div className="flex gap-3 items-start md:items-center">
        <div className="p-2 bg-emerald-900/40 text-emerald-400 border border-emerald-800 rounded-lg shrink-0">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-tight text-white uppercase">
            <span>Segurança de Dados • Portal UMESC</span>
            <span className="bg-emerald-800 text-[8px] px-1 text-emerald-200 rounded font-bold">LGPD COMPLIANT</span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 leading-normal max-w-2xl">
            Este portal se apresenta em estrito alinhamento com a Lei Geral de Proteção de Dados (Lei nº 13.709/18). Todo cadastramento de membro militar ou doador civil possui criptografia AES para garantir privacidade absoluta das corporações de Santa Catarina.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        <button
          onClick={handleAcceptAll}
          className="w-full md:w-auto px-4.5 py-2 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Aceitar e Continuar</span>
        </button>
        
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 px-2.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all font-mono"
          title="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
