/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UMESC_ABOUT } from "../data";
import { Landmark, Compass, Award, ShieldAlert, HeartHandshake, BookOpen } from "lucide-react";

export default function AboutMission() {
  const [activeTab, setActiveTab] = useState<"mission" | "values" | "legal">("mission");

  const amparoConstitucional = {
    title: "Amparo Constitucional e Liberdade Religiosa",
    details: "A assistência religiosa nas corporações militares de Santa Catarina é garantida pelo Artigo 5º, inciso VII da Constituição Federal do Brasil (Assegurada nos termos da lei, a prestação de assistência religiosa nas entidades civis e militares de internação coletiva). A UMESC atua de forma voluntária e pacífica, com respeito à hierarquia, à disciplina e à pluralidade interdenominacional dos participantes."
  };

  return (
    <section id="about" className="py-20 bg-slate-50 text-slate-900 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-[#c2410c] mb-2 flex items-center justify-center gap-1.5">
            <Landmark className="w-3.5 h-3.5" />
            <span>Fundada em 1989 • Santa Catarina</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 mb-4 font-sans">
            Quem Somos & O que Impulsiona a UMESC
          </h2>
          <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full mb-4"></div>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            Uma agência missionária catarinense interdenominacional sem fins de lucro, amparada constitucionalmente para levar acolhimento pessoal, força moral, e conselho espiritual às corporações fardadas.
          </p>
        </div>

        {/* Big Bento-style content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Interactive Nav Tabs & Details Box */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            
            <button
              onClick={() => setActiveTab("mission")}
              className={`flex items-center gap-3.5 p-4 rounded text-left border font-bold transition-all ${
                activeTab === "mission"
                  ? "bg-[#1a2a40] text-white border-transparent shadow-md"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Compass className={`w-5 h-5 ${activeTab === "mission" ? "text-amber-400" : "text-slate-400"}`} />
              <div>
                <span className="block text-sm">Missão e Visão</span>
                <span className="block text-[10px] font-normal text-slate-400 uppercase tracking-wide">Direção e Propósito</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("values")}
              className={`flex items-center gap-3.5 p-4 rounded text-left border font-bold transition-all ${
                activeTab === "values"
                  ? "bg-[#1a2a40] text-white border-transparent shadow-md"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Award className={`w-5 h-5 ${activeTab === "values" ? "text-amber-400" : "text-slate-400"}`} />
              <div>
                <span className="block text-sm">Valores Inegociáveis</span>
                <span className="block text-[10px] font-normal text-slate-400 uppercase tracking-wide">Pilares de Credibilidade</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("legal")}
              className={`flex items-center gap-3.5 p-4 rounded text-left border font-bold transition-all ${
                activeTab === "legal"
                  ? "bg-[#1a2a40] text-white border-transparent shadow-md"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <ShieldAlert className={`w-5 h-5 ${activeTab === "legal" ? "text-amber-400" : "text-slate-400"}`} />
              <div>
                <span className="block text-sm">Amparo Legal & Constituição</span>
                <span className="block text-[10px] font-normal text-slate-400 uppercase tracking-wide">Conformidade e Amparo</span>
              </div>
            </button>

            <div className="mt-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 mb-2">Atuação Estadual</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nossos representantes operam de forma capilarizada nas capitais, vales, serras e litorais de Santa Catarina com apoio das coordenadorias locais voluntárias.
              </p>
            </div>

          </div>

          {/* Right Column: Tab Output Card */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative">
            
            <div className="min-h-[260px]">
              
              {/* Output Tab Missão e Visão */}
              {activeTab === "mission" && (
                <div id="tab-content-mission" className="space-y-6">
                  <div>
                    <span className="inline-flex px-3 py-1 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-full uppercase tracking-wider mb-3">Nossa Missão</span>
                    <h3 className="text-lg sm:text-2xl font-bold text-slate-950 mb-2">Comunhão e Acolhimento Espiritual Continuado</h3>
                    <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                      {UMESC_ABOUT.mission}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <span className="inline-flex px-3 py-1 text-[10px] font-bold bg-blue-100 text-blue-900 rounded-full uppercase tracking-wider mb-3">Nossa Visão</span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-950 mb-2">Sustentabilidade e Expansão da Capelania</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {UMESC_ABOUT.vision}
                    </p>
                  </div>
                </div>
              )}

              {/* Output Tab Valores */}
              {activeTab === "values" && (
                <div id="tab-content-values" className="space-y-4">
                  <span className="inline-flex px-3 py-1 text-[10px] font-bold bg-[#fef3c7] text-[#92400e] rounded-full uppercase tracking-wider mb-1">Pilares Fundamentais</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-950 mb-4">O que define nossa Atuação Teológica e Cívica</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {UMESC_ABOUT.values.map((val, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="font-mono text-xs font-bold text-amber-600">0{idx + 1}.</span>
                        <span className="text-xs sm:text-sm text-slate-700 font-medium leading-tight">{val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-slate-400 pt-4 italic">
                    * Todos os valores são auditados e os regulamentos internos guiam a postura de farda dos membros evangélicos associados em eventos civis.
                  </div>
                </div>
              )}

              {/* Output Tab Amparo Legal */}
              {activeTab === "legal" && (
                <div id="tab-content-legal" className="space-y-4">
                  <span className="inline-flex px-3 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-900 rounded-full uppercase tracking-wider mb-2">Lei e Constituição</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-950 mb-3">{amparoConstitucional.title}</h3>
                  <p className="text-slate-650 leading-relaxed text-sm sm:text-base bg-slate-50 p-4 border-l-4 border-emerald-500 rounded-r-lg">
                    {amparoConstitucional.details}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="block font-bold text-slate-950 text-xs">Pessoa Jurídica</span>
                      <span className="text-slate-500 text-[11px] block mt-1">{UMESC_ABOUT.legalStatus}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="block font-bold text-slate-950 text-xs">Alinhamento LGPD Art. 7º</span>
                      <span className="text-slate-500 text-[11px] block mt-1">Tratamento de dados em conformidade com o consentimento explícito, protegendo a identificação pessoal do militar face a potenciais riscos ocupacionais.</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Simulated legal assurance foot badge */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 ">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                Interdenominacional: Filiados de diversas igrejas evangélicas locais em SC.
              </span>
              <span className="text-[10px] font-bold uppercase py-1 px-2.5 rounded bg-amber-500/25 text-amber-950 border border-amber-500/25">
                Utilidade Pública Consolidada
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
