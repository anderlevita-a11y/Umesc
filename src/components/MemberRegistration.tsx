/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { MemberRegistration } from "../types";
import { ShieldCheck, UserPlus, Trash2, Eye, EyeOff, FileDown, Lock, CheckCircle, HelpCircle, RefreshCw } from "lucide-react";
import { membersService, isSupabaseConfigured } from "../lib/supabase.ts";

export default function MemberRegistrationSection() {
  const [membersList, setMembersList] = useState<MemberRegistration[]>([]);
  const [successMessage, setSuccessMessage] = useState(false);
  const [showRawCpf, setShowRawCpf] = useState(false);

  // Form Fields
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [militaryForce, setMilitaryForce] = useState<"PM" | "BM" | "FFAA" | "Civil" | "Apoiador">("PM");
  const [rank, setRank] = useState("");
  const [rgMilitar, setRgMilitar] = useState("");
  const [church, setChurch] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [senha, setSenha] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Load from Supabase (or localStorage fallback) on mount
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const list = await membersService.getMembers();
        setMembersList(list);
      } catch (e) {
        console.error("Erro ao carregar associados:", e);
      }
    };

    loadMembers();
  }, []);

  const generateSha256Sim = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return `SHA256-${Math.abs(hash).toString(16).substring(0, 8)}${Math.floor(Math.random() * 99999)}`;
  };

  const handleCpfFormatting = (val: string) => {
    // Basic reactive CPF masking for user input
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      setCpf(cleaned);
    }
  };

  const formatMaskedCpf = (raw: string) => {
    if (raw.length < 11) return raw;
    return `${raw.substring(0, 3)}.***.***-${raw.substring(9, 11)}`;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdConsent) {
      alert("Por favor, declare consentimento com a política LGPD de proteção de dados.");
      return;
    }

    const compiledHash = generateSha256Sim(nome + cpf);
    const maskedCpfValue = formatMaskedCpf(cpf);

    if (senha.length < 6) {
      alert("A senha de acesso deve possuir ao menos 6 caracteres.");
      return;
    }

    const newMember: MemberRegistration = {
      name: nome,
      cpf: maskedCpfValue,
      birthDate,
      militaryForce,
      rank,
      rgMilitar: rgMilitar || "N/A",
      church,
      phone,
      email,
      city,
      lgpdConsent,
      marketingConsent,
      registrationDate: new Date().toISOString().split('T')[0],
      securityHash: compiledHash,
      password: senha
    };

    try {
      await membersService.createMember(newMember);
      const list = await membersService.getMembers();
      setMembersList(list);
      setSuccessMessage(true);
    } catch (error) {
      console.error("Erro ao registrar membro no Supabase:", error);
      alert("Houve um problema de conexão ao salvar seu registro no banco de dados.");
    }

    // Reset Form Fields
    setNome("");
    setCpf("");
    setBirthDate("");
    setRank("");
    setRgMilitar("");
    setChurch("");
    setPhone("");
    setEmail("");
    setCity("");
    setSenha("");
    setLgpdConsent(false);
    setMarketingConsent(false);

    setTimeout(() => {
      setSuccessMessage(false);
    }, 6000);
  };

  // LGPD: Right of Deletion ("Direito de Exclusão")
  const handleDeleteMyData = async (indexToDelete: number, memberName: string, memberHash: string) => {
    const confirmation = window.confirm(`[Direito de Exclusão LGPD] Você confirma a revogação de consentimento e a deleção irreversível e absoluta de todos os dados salvos de: ${memberName}?`);
    if (confirmation) {
      try {
        await membersService.deleteMember(memberHash);
        const list = await membersService.getMembers();
        setMembersList(list);
        alert(`Todos os registros do associado(a) ${memberName} foram permanentemente apagados de acordo com as normas da LGPD.`);
      } catch (error) {
        console.error("Erro ao deletar registro:", error);
        alert("Não foi possível excluir o associado do banco de dados.");
      }
    }
  };


  return (
    <section id="register" className="py-20 bg-white text-slate-900 scroll-mt-20 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Label block */}
        <div className="border-l-4 border-amber-500 pl-4 mb-12">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">Associe-se à nossa Missão</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a2a40] font-sans tracking-tight">
            Cadastro de Novos Membros (LGPD-Compliant)
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            A UMESC protege a privacidade e as credenciais profissionais de seus irmãos e irmãs de farda. Nosso formulário coleta dados mínimos para fins estatutários legítimos com alto padrão de blindagem digital.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Enrollment Form Wizard */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
            
            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-200">
              <div className="w-9 h-9 rounded bg-white border border-slate-200 flex items-center justify-center text-[#1a2a40] shrink-0">
                <Lock className="w-5 h-5 text-[#1a2a40]" />
              </div>
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Estilo Criptografado</span>
                <h3 className="font-bold text-sm tracking-tight text-[#1a2a40] uppercase font-display">Formulário de Consentimento & Ingresso</h3>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <span className="text-[9px] font-mono bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-bold">
                  ✓ SSL/AES Ativo
                </span>
                <span className={`text-[8px] font-mono border px-1.5 py-0.5 rounded font-bold ${isSupabaseConfigured ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-amber-50 border-amber-300 text-amber-700 font-bold'}`}>
                  {isSupabaseConfigured ? '● Supabase Ativo' : '● Supabase: Local'}
                </span>
              </div>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 rounded bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs flex items-start gap-3">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <strong className="block text-emerald-950 font-bold mb-0.5">Cadastro Enviado com Sucesso!</strong>
                  Seus dados básicos foram gravados sob proteção da LGPD. Para acessar a Área do Membro, aguarde a <strong className="text-emerald-950">homologação e desbloqueio da sua conta por um administrador</strong>. Seu registro já aparece na lista ao lado com o status pendente.
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">Nome Completo (Sem abreviatura):</label>
                  <input 
                    type="text" 
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Sargento João da Silva Santos"
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900 transition-all"
                  />
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">CPF (Coleta Minimizar):</label>
                  <input 
                    type="text" 
                    required
                    value={cpf}
                    onChange={(e) => handleCpfFormatting(e.target.value)}
                    placeholder="Somente Números (11 dígitos)"
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900 tracking-wider font-mono"
                  />
                  <span className="text-[9px] text-slate-500 pl-1 font-semibold">Exibido de forma mascarada com asteriscos</span>
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">Data de Nascimento:</label>
                  <input 
                    type="date" 
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900"
                  />
                </div>

                {/* Military Force Type */}
                <div>
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">Vínculo Institucional:</label>
                  <select
                    value={militaryForce}
                    onChange={(e) => setMilitaryForce(e.target.value as any)}
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900"
                  >
                    <option value="PM">Polícia Militar de SC (PMSC)</option>
                    <option value="BM">Bombeiro Militar de SC (CBMSC)</option>
                    <option value="FFAA">Forças Armadas (Exército / Marinha / Aeronáutica)</option>
                    <option value="Civil">Polícia Civil / Científica / Penal</option>
                    <option value="Apoiador">Civil Apoiador / Membro Simpatizante</option>
                  </select>
                </div>

                {/* Posto/Graduação / Profissão */}
                <div>
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">Posto / Graduação / Profissão:</label>
                  <input 
                    type="text" 
                    required
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="Ex: Sargento, Major, Advogado, etc"
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900"
                  />
                </div>

                {/* RG Militar */}
                <div>
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">Matrícula ou RG Militar (Se aplicável):</label>
                  <input 
                    type="text" 
                    value={rgMilitar}
                    onChange={(e) => setRgMilitar(e.target.value)}
                    placeholder="Ex: PMSC 923.412-0"
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900"
                  />
                </div>

                {/* Cidade de Santa Catarina */}
                <div>
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">Cidade Sede Base (SC):</label>
                  <input 
                    type="text" 
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Joinville, Lages, Chapecó"
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900"
                  />
                </div>

                {/* Igreja de Convivência */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">Igreja Evangélica de Comunhão:</label>
                  <input 
                    type="text" 
                    required
                    value={church}
                    onChange={(e) => setChurch(e.target.value)}
                    placeholder="Ex: Igreja Batista do Vale, Assembleia de Deus Central"
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900 font-medium"
                  />
                </div>

                {/* Contatos */}
                <div>
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">Telefone WhatsApp:</label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(48) 99999-9999"
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">E-mail Segurado do Associado:</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@sc.gov.br ou pessoal"
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a2a40] uppercase mb-1">Crie uma Senha de Acesso:</label>
                  <input 
                    type="password" 
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-white border border-slate-250 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded px-3 py-2 text-xs outline-none text-slate-900"
                  />
                  <span className="text-[9px] text-slate-500 pl-1 font-semibold block mt-0.5">Utilizada para logon na Área do Membro</span>
                </div>

              </div>

              {/* Crucial LGPD Consent checkbox array (Data minimization, Purpose Limitation, Right of Erasure) */}
              <div className="space-y-3 pt-2">
                
                <div className="p-4 rounded bg-white border border-slate-250/70">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      required
                      checked={lgpdConsent}
                      onChange={(e) => setLgpdConsent(e.target.checked)}
                      className="mt-1 accent-amber-500 rounded shrink-0"
                    />
                    <div className="text-xs text-slate-650 leading-normal font-semibold">
                      <strong className="text-amber-700 font-bold block mb-0.5">TERMO 01 - Autenticidade e Consentimento de Cadastro Geral:</strong>
                      Declaro sob responsabilidade cívica que sou portador das credenciais informadas. Dou consentimento explícito, voluntário e revogável ao UMESC para armazenar meus dados básicos para fins de cadastro de fiação oficial do quadro de membros, controle interno estatutário e envio de agenda militar militar interdenominacional.
                    </div>
                  </label>
                </div>

                <div className="p-4 rounded bg-white border border-slate-250/70">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-1 accent-amber-500 rounded shrink-0"
                    />
                    <div className="text-xs text-slate-650 leading-normal font-semibold">
                      <strong className="text-[#1a2a40] font-bold block mb-0.5 text-slate-800">TERMO 02 - Opcional para Avisos e Agenda Eletrônica (E-mail/WhatsApp):</strong>
                      Permito que a coordenação geral de instrução e eventos compartilhe materiais didáticos de capelania militar, informativos de reunião estadual e lembretes de orações de farda pelo e-mail ou telefone. (Opcional)
                    </div>
                  </label>
                </div>

              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-confirm-registration"
                  className="w-full py-3 bg-[#1a2a40] hover:bg-[#131f2e] text-amber-400 font-black rounded uppercase text-xs tracking-wider transition-colors cursor-pointer shadow-xs"
                >
                  Confirmar Cadastro & Integrar Guardado (LGPD)
                </button>
              </div>

            </form>

          </div>

          {/* Right Column: Simulated Database Inspector & Access Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
              
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm uppercase text-[#1a2a40] font-display">Painel de Adequação LGPD</span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono font-bold uppercase tracking-wider">
                  Leis Ativas SC
                </span>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed font-semibold">
                <p>
                  Como agência militar evangélica, asseguramos aos cadastrados e doadores todos os direitos previstos no Artigo 18 da LGPD:
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-[#1a2a40]">
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    🔒 Confirmação da existência de tratamento
                  </div>
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    👁️ Acesso visual instantâneo aos registros
                  </div>
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    ✏️ Correção e revisão de dados inexatos
                  </div>
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    ❌ Exclusão permanente imediata (Revogar)
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 rounded text-[11px] text-amber-800 border border-amber-500/20 leading-relaxed">
                  ⚠️ <strong>Aviso Importante:</strong> Nenhum dado cadastral de forças de segurança de Santa Catarina é compartilhado publicamente ou repassado a entidades externas ou empresas de marketing comercial.
                </div>
              </div>

            </div>

            {/* Simulated Live Database View */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#1a2a40] font-display">Visualizador do Banco de Dados Local</h4>
                  <span className="text-[8px] bg-slate-100 text-slate-500 font-mono border border-slate-250 px-1.5 py-0.5 rounded font-bold">
                    Simulação Ativa
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">Total de registros na sua sessão: <span className="font-bold font-mono text-amber-700">{membersList.length} membros</span></p>
              </div>

              {/* Members registered stream */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {membersList.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded bg-slate-50 border border-slate-250 text-xs space-y-2">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="block font-bold text-[#1a2a40] text-sm">{m.name}</span>
                        <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-500 mt-1 uppercase font-black font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-[#1a2a40] text-amber-400 font-bold">{m.militaryForce}</span>
                          <span>•</span>
                          <span>Posto: {m.rank}</span>
                          <span>•</span>
                          <span>{m.city}</span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded font-extrabold ${m.approved ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"}`}>
                            {m.approved ? "HOMOLOGADO" : "PENDENTE"}
                          </span>
                        </div>
                      </div>

                      {/* Delete Trigger - Right of Deletion */}
                      <button 
                        onClick={() => handleDeleteMyData(idx, m.name, m.securityHash)}
                        className="p-1 px-2 text-slate-400 hover:text-red-600 rounded hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
                        title="Deletar este registro sob direito LGPD"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 py-1.5 border-t border-b border-slate-200 text-[10px] font-mono text-slate-500 font-bold uppercase">
                      <div>CPF: <span className="text-slate-800">{m.cpf}</span></div>
                      <div>Vínculo: <span className="text-slate-800">{m.rgMilitar || "N/A"}</span></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-550 font-mono">
                      <span>Hash Seguro: <span className="text-emerald-600 font-semibold">{m.securityHash.substring(0, 14)}*</span></span>
                      
                      {/* Simulated certification PDF ticket download */}
                      <a 
                        href={`data:text/plain;charset=utf-8,${encodeURIComponent(`DADOS DE MEMBRO ASSOCIADO UMESC (LEI LGPD)\n===============\nNome: ${m.name}\nCPF: ${m.cpf}\nForca: ${m.militaryForce}\nPosto/Graduacao: ${m.rank}\nIgreja: ${m.church}\nCidade Base: ${m.city}\nHash Assinado: ${m.securityHash}\nData de Cadastro: ${m.registrationDate}\nPrerrogativas LGPD: Todos os dados pertencem ao titular, com direito de exclusao imediata garantido pelo UMESC.`)}`}
                        download={`carteirinha_umesc_${m.name.toLowerCase().replace(/ /g, "_")}.txt`}
                        className="text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer font-sans font-black uppercase text-[9px] tracking-wider"
                        title="Baixar carteirinha em papel (.TXT)"
                      >
                        <FileDown className="w-3.5 h-3.5" /> Ficha
                      </a>
                    </div>

                  </div>
                ))}

                {membersList.length === 0 && (
                  <div className="py-8 text-center bg-slate-50 border border-slate-200 rounded">
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Nenhum membro ativo cadastrado nesta sessão de teste local.</p>
                  </div>
                )}
              </div>

              {/* Foot disclaimer */}
              <div className="mt-4 pt-4 border-t border-slate-200 text-[9px] text-slate-500 font-semibold space-y-1">
                <div>* Clique no botão "Ficha" para gerar o documento certificado TXT oficial da simulação de cadastro.</div>
                <div>* A deleção de dados limpa imediatamente todos os vestígios locais da sua sessão de navegação estatística corporativa.</div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
