/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";
import { MemberRegistration, ApoioFemininoPost, FichaFiliacao, Coordinator, SecretariaMember } from "../types";
import { COORDINATORS_DATA } from "../data.ts";
import { INITIAL_SECRETARIA_MEMBERS } from "../data/secretariaMembersData.ts";

// Read environment variables for Supabase with user credentials as default fallback
const rawUrl = import.meta.env.VITE_SUPABASE_URL || "https://qndjkphfsejuqopmfgas.supabase.co";
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZGprcGhmc2VqdXFvcG1mZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzk3MTgsImV4cCI6MjA5NjE1NTcxOH0.eJY2qFjEmVK0jV56RRQsRpykvsl0d52jKrFHFt84Rnk";

// Sanitize and validate Supabase credentials
const cleanRawUrl = typeof rawUrl === "string" ? rawUrl.trim() : "";
let tempUrl = cleanRawUrl;
if (tempUrl.endsWith("/")) {
  tempUrl = tempUrl.replace(/\/+$/, "");
}
if (tempUrl.endsWith("/rest/v1")) {
  tempUrl = tempUrl.replace(/\/rest\/v1$/, "");
}
if (tempUrl.endsWith("/rest/v1/")) {
  tempUrl = tempUrl.replace(/\/rest\/v1\/$/, "");
}
const supabaseUrl = tempUrl;
const supabaseAnonKey = typeof rawKey === "string" ? rawKey.trim() : "";

// A valid Supabase URL must start with https://, contain a valid supabase domain, and not be a placeholder
const isUrlValid = 
  supabaseUrl.startsWith("https://") && 
  (supabaseUrl.includes(".supabase.co") || supabaseUrl.includes(".supabase.net") || supabaseUrl.includes(".supabase.in") || supabaseUrl.includes("localhost")) &&
  !supabaseUrl.toLowerCase().includes("placeholder") && 
  !supabaseUrl.toLowerCase().includes("your_") &&
  !supabaseUrl.toLowerCase().includes("your-") &&
  !supabaseUrl.toLowerCase().includes("project-id") &&
  !supabaseUrl.toLowerCase().includes("undefined") &&
  !supabaseUrl.toLowerCase().includes("null");

const isKeyValid = 
  supabaseAnonKey.length > 40 && 
  !supabaseAnonKey.toLowerCase().includes("placeholder") && 
  !supabaseAnonKey.toLowerCase().includes("your_") &&
  !supabaseAnonKey.toLowerCase().includes("your-") &&
  !supabaseAnonKey.toLowerCase().includes("undefined") &&
  !supabaseAnonKey.toLowerCase().includes("null");

// Initialize Supabase Client if credentials are valid
export const supabase = (isUrlValid && isKeyValid) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = !!supabase;

/**
 * Maps the internal application camelCase properties to Supabase database snake_case columns
 */
export interface SupabaseMember {
  id?: string;
  name: string;
  cpf: string;
  birth_date: string;
  military_force: string;
  rank: string;
  rg_militar: string;
  church: string;
  phone: string;
  email: string;
  city: string;
  lgpd_consent: boolean;
  marketing_consent: boolean;
  registration_date: string;
  security_hash: string;
  password?: string;
  approved?: boolean;
  paused?: boolean;
  archived?: boolean;
  photo_url?: string;
  is_director?: boolean;
}

// Convert from local model to DB model
function toSupabase(member: MemberRegistration): SupabaseMember {
  return {
    name: member.name,
    cpf: member.cpf,
    birth_date: member.birthDate,
    military_force: member.militaryForce,
    rank: member.rank,
    rg_militar: member.rgMilitar || "",
    church: member.church,
    phone: member.phone,
    email: member.email,
    city: member.city,
    lgpd_consent: member.lgpdConsent,
    marketing_consent: member.marketingConsent,
    registration_date: member.registrationDate,
    security_hash: member.securityHash,
    password: member.password || "",
    approved: member.approved ?? false,
    paused: member.paused ?? false,
    archived: member.archived ?? false,
    photo_url: member.photoUrl,
    is_director: member.isDirector ?? false
  };
}

// Convert from DB model to local model
function fromSupabase(dbMember: any): MemberRegistration {
  return {
    name: dbMember.name,
    cpf: dbMember.cpf,
    birthDate: dbMember.birth_date,
    militaryForce: dbMember.military_force as any,
    rank: dbMember.rank,
    rgMilitar: dbMember.rg_militar || "",
    church: dbMember.church,
    phone: dbMember.phone,
    email: dbMember.email,
    city: dbMember.city,
    lgpdConsent: dbMember.lgpd_consent,
    marketingConsent: dbMember.marketing_consent,
    registrationDate: dbMember.registration_date,
    securityHash: dbMember.security_hash,
    password: dbMember.password || "",
    approved: dbMember.approved ?? false,
    paused: dbMember.paused ?? false,
    archived: dbMember.archived ?? false,
    photoUrl: dbMember.photo_url || dbMember.photoUrl || "",
    isDirector: dbMember.is_director ?? false
  };
}

/**
 * Service to manage members in Supabase (or local fallback)
 */
export const membersService = {
  async getMembers(): Promise<MemberRegistration[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .order("registration_date", { ascending: false });

        if (error) {
          console.error("Erro ao buscar no Supabase:", error.message);
          throw error;
        }

        if (data) {
          return data.map(fromSupabase);
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase. Usando fallback de localStorage como contingência.", err);
      }
    }

    // Fallback: localStorage
    const saved = localStorage.getItem("umesc_sim_members");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Continue to seed
      }
    }

    // Retornar lista vazia em vez de simulação
    const emptyList: MemberRegistration[] = [];
    localStorage.setItem("umesc_sim_members", JSON.stringify(emptyList));
    return emptyList;
  },

  async createMember(member: MemberRegistration): Promise<MemberRegistration> {
    const memberWithDefaults = {
      ...member,
      approved: member.approved ?? false, // Default all new members to unapproved / locked
      paused: member.paused ?? false,
      archived: member.archived ?? false,
      isDirector: member.isDirector ?? false
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = toSupabase(memberWithDefaults);
        let { data, error } = await supabase
          .from("members")
          .insert([dbRecord])
          .select();

        if (error && (error.code === "PGRST204" || (error.message && (error.message.includes("is_director") || error.message.includes("paused") || error.message.includes("archived") || error.message.includes("photo_url"))))) {
          console.warn("Colunas específicas não encontradas no Supabase. Retentando inserção...");
          const cleanedRecord = { ...dbRecord };
          delete (cleanedRecord as any).paused;
          delete (cleanedRecord as any).archived;
          delete (cleanedRecord as any).photo_url;
          delete (cleanedRecord as any).is_director;
          const retryRes = await supabase
            .from("members")
            .insert([cleanedRecord])
            .select();
          data = retryRes.data;
          error = retryRes.error;
        }

        if (error) {
          console.error("Erro ao criar membro no Supabase:", error.message);
          if (error.code === "23505" || error.message?.includes("duplicate key") || error.message?.includes("unique constraint")) {
            if (error.message?.includes("members_cpf_key") || error.message?.includes("cpf")) {
              throw new Error("Este CPF já está cadastrado no sistema. Por favor, utilize outro CPF ou faça login.");
            }
            if (error.message?.includes("members_email_key") || error.message?.includes("email")) {
              throw new Error("Este E-mail já está cadastrado no sistema. Por favor, utilize outro e-mail ou faça login.");
            }
            throw new Error("Este CPF ou E-mail já está cadastrado no sistema. Por favor, verifique seus dados.");
          }
          throw error;
        }

        if (data && data.length > 0) {
          return fromSupabase(data[0]);
        }
      } catch (err: any) {
        console.warn("Falha de gravação no Supabase. Gravando localmente por contingência.", err);
        // Se for um erro amigável de validação (duplicidade), propaga para o componente tratar
        if (err?.message?.includes("já está cadastrado")) {
          throw err;
        }
      }
    }

    // Fallback Code
    const savedMembers = await this.getMembers();
    
    // Validar duplicidade de CPF no fallback local
    const hasDuplicateCpf = savedMembers.some(m => {
      const cleanStored = m.cpf.replace(/\D/g, "");
      const cleanNew = memberWithDefaults.cpf.replace(/\D/g, "");
      return (cleanStored === cleanNew && cleanNew !== "") || m.cpf === memberWithDefaults.cpf;
    });
    if (hasDuplicateCpf) {
      throw new Error("Este CPF já está cadastrado no sistema. Por favor, utilize outro CPF ou faça login.");
    }

    // Validar duplicidade de E-mail no fallback local
    const hasDuplicateEmail = savedMembers.some(m => m.email.toLowerCase().trim() === memberWithDefaults.email.toLowerCase().trim());
    if (hasDuplicateEmail) {
      throw new Error("Este E-mail já está cadastrado no sistema. Por favor, utilize outro e-mail ou faça login.");
    }

    const updated = [memberWithDefaults, ...savedMembers];
    localStorage.setItem("umesc_sim_members", JSON.stringify(updated));
    return memberWithDefaults;
  },

  async deleteMember(securityHash: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("members")
          .delete()
          .eq("security_hash", securityHash);

        if (error) {
          console.error("Erro ao deletar membro no Supabase:", error.message);
          throw error;
        }
        return true;
      } catch (err) {
        console.warn("Falha de deleção no Supabase. Deletando localmente por contingência.", err);
      }
    }

    // Fallback Code
    const savedMembers = await this.getMembers();
    const filtered = savedMembers.filter((m) => m.securityHash !== securityHash);
    localStorage.setItem("umesc_sim_members", JSON.stringify(filtered));
    return true;
  },

  async updatePassword(email: string, cpfInput: string, newPassword: string): Promise<boolean> {
    const list = await this.getMembers();
    const cleanInputCpf = cpfInput.replace(/\D/g, "");

    // Meet with matching email & CPF
    const found = list.find((m) => {
      const emailMatches = m.email.toLowerCase().trim() === email.toLowerCase().trim();
      
      const cleanStoredOnlyDigits = m.cpf.replace(/\D/g, ""); // "12345" if "123.***.***-45"
      const cleanInputOnlyDigits = cleanInputCpf;
      let cpfMatches = false;

      // 1. Cleaned match
      if (cleanStoredOnlyDigits === cleanInputOnlyDigits && cleanInputOnlyDigits !== "") {
        cpfMatches = true;
      }
      // 2. Exact match raw
      else if (m.cpf.trim() === cpfInput.trim()) {
        cpfMatches = true;
      }
      // 3. Match first-3 and last-2 digits (extremely resilient for masked/partially masked CPFs)
      else {
        const inputFirst3 = cleanInputOnlyDigits.substring(0, 3);
        const inputLast2 = cleanInputOnlyDigits.substring(cleanInputOnlyDigits.length - 2);

        const storedDigits = m.cpf.replace(/[^0-9]/g, ""); // e.g. "12345" from "123.***.***-45"
        if (storedDigits.length >= 5) {
          const storedFirst3 = storedDigits.substring(0, 3);
          const storedLast2 = storedDigits.substring(storedDigits.length - 2);
          
          if (inputFirst3 === storedFirst3 && inputLast2 === storedLast2 && inputFirst3 !== "" && inputLast2 !== "") {
            cpfMatches = true;
          }
        }
      }

      return emailMatches && cpfMatches;
    });

    if (!found) {
      // Dynamically register new member if not exists
      const compiledHash = `SEC-${Math.floor(Math.random() * 9000000 + 1000000)}`;
      const newMember: MemberRegistration = {
        name: email.split("@")[0].toUpperCase() || "NOVO ASSOCIADO",
        cpf: cpfInput.trim(),
        birthDate: "1985-01-01",
        militaryForce: "PM",
        rank: "Membro",
        rgMilitar: "",
        church: "Não Informado",
        phone: "Não Informado",
        email: email.trim(),
        city: "Florianópolis",
        lgpdConsent: true,
        marketingConsent: true,
        registrationDate: new Date().toISOString().split("T")[0],
        securityHash: compiledHash,
        password: newPassword,
        approved: false // Pending approval/homologation, allows login under rectifying profile mode
      };

      await this.createMember(newMember);
      return true;
    }

    found.password = newPassword;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("members")
          .update({ password: newPassword })
          .eq("security_hash", found.securityHash);

        if (error) {
          console.error("Erro ao atualizar senha no Supabase:", error.message);
          throw error;
        }
        return true;
      } catch (err) {
        console.warn("Falha de gravação no Supabase, gravando localmente por contingência.", err);
      }
    }

    // Local state fallback
    const updatedList = list.map((m) => 
      m.securityHash === found.securityHash ? { ...m, password: newPassword } : m
    );
    localStorage.setItem("umesc_sim_members", JSON.stringify(updatedList));
    return true;
  },

  async updateMember(securityHash: string, updatedFields: Partial<MemberRegistration>): Promise<boolean> {
    const list = await this.getMembers();
    const found = list.find((m) => m.securityHash === securityHash);
    if (!found) return false;

    // Apply updates
    const updatedUser = { ...found, ...updatedFields };

    if (isSupabaseConfigured && supabase) {
      try {
        const dbFields: any = {};
        if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
        if (updatedFields.email !== undefined) dbFields.email = updatedFields.email;
        if (updatedFields.phone !== undefined) dbFields.phone = updatedFields.phone;
        if (updatedFields.city !== undefined) dbFields.city = updatedFields.city;
        if (updatedFields.rank !== undefined) dbFields.rank = updatedFields.rank;
        if (updatedFields.militaryForce !== undefined) dbFields.military_force = updatedFields.militaryForce;
        if (updatedFields.church !== undefined) dbFields.church = updatedFields.church;
        if (updatedFields.password !== undefined) dbFields.password = updatedFields.password;
        if (updatedFields.approved !== undefined) dbFields.approved = updatedFields.approved;
        if (updatedFields.rgMilitar !== undefined) dbFields.rg_militar = updatedFields.rgMilitar;
        if (updatedFields.paused !== undefined) dbFields.paused = updatedFields.paused;
        if (updatedFields.archived !== undefined) dbFields.archived = updatedFields.archived;
        if (updatedFields.photoUrl !== undefined) dbFields.photo_url = updatedFields.photoUrl;
        if (updatedFields.isDirector !== undefined) dbFields.is_director = updatedFields.isDirector;
        if (updatedFields.birthDate !== undefined) dbFields.birth_date = updatedFields.birthDate;
        if (updatedFields.cpf !== undefined) dbFields.cpf = updatedFields.cpf;
        if (updatedFields.lgpdConsent !== undefined) dbFields.lgpd_consent = updatedFields.lgpdConsent;
        if (updatedFields.marketingConsent !== undefined) dbFields.marketing_consent = updatedFields.marketingConsent;

        let { error } = await supabase
          .from("members")
          .update(dbFields)
          .eq("security_hash", securityHash);

        if (error && (error.code === "PGRST204" || (error.message && (error.message.includes("is_director") || error.message.includes("paused") || error.message.includes("archived") || error.message.includes("photo_url"))))) {
          console.warn("Colunas específicas não encontradas no Supabase. Retentando atualização...");
          const cleanedDbFields = { ...dbFields };
          delete cleanedDbFields.paused;
          delete cleanedDbFields.archived;
          delete cleanedDbFields.photo_url;
          delete cleanedDbFields.is_director;
          
          const retryRes = await supabase
            .from("members")
            .update(cleanedDbFields)
            .eq("security_hash", securityHash);
          error = retryRes.error;
        }

        if (error) {
          console.error("Erro ao atualizar membro no Supabase:", error.message);
          throw error;
        }
      } catch (err) {
        console.warn("Falha de gravação no Supabase, gravando localmente por contingência.", err);
      }
    }

    // Local state fallback
    const updatedList = list.map((m) => 
      m.securityHash === securityHash ? updatedUser : m
    );
    localStorage.setItem("umesc_sim_members", JSON.stringify(updatedList));
    return true;
  }
};

/**
 * Service to manage Admin verification and connection health-checks
 */
export const adminService = {
  /**
   * Performs authentication against Supabase 'admins' table
   * or falls back to standard credentials if Supabase is offline/unconfigured.
   */
  async authenticate(email: string, passwordPlain: string): Promise<boolean> {
    const cleanMail = email.toLowerCase().trim();
    
    // 1. Sempre permitir o acesso com a credencial mestre para garantir resiliência absoluta (recarrega de imediato)
    if (cleanMail === "admin@umesc.org.br" && passwordPlain === "adminUMESC2026") {
      return true;
    }
    
    if (isSupabaseConfigured && supabase) {
      try {
        // A. Primeiro tentar login de Administrador
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("email", cleanMail)
          .eq("password", passwordPlain)
          .limit(1);

        if (!adminError && adminData && adminData.length > 0) {
          return true;
        }

        // B. Segundo tentar login de Membros com nível de diretoria e devidamente aprovados
        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("*")
          .eq("email", cleanMail)
          .eq("password", passwordPlain)
          .eq("is_director", true)
          .eq("approved", true)
          .eq("paused", false)
          .limit(1);

        if (!memberError && memberData && memberData.length > 0) {
          return true;
        }
      } catch (err) {
        console.warn("Falha de autenticação contra o Supabase. Verificando contingência...", err);
      }
    }

    // C. Contingência de backup local para o login mestre e membros locais promovidos
    const saved = localStorage.getItem("umesc_sim_members");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed)) {
          const matched = parsed.find((m) => 
            m.email.toLowerCase().trim() === cleanMail && 
            m.password === passwordPlain && 
            m.isDirector === true && 
            m.approved === true &&
            !m.paused
          );
          if (matched) {
            return true;
          }
        }
      } catch {
        // ignore
      }
    }

    return cleanMail === "admin@umesc.org.br" && passwordPlain === "adminUMESC2026";
  },

  /**
   * Tests connection to Supabase and assesses if relation tables ('members' and 'admins') exist.
   */
  async testConnection(): Promise<{ active: boolean; details: string; tablesExist: boolean }> {
    if (!isSupabaseConfigured || !supabase) {
      return { 
        active: false, 
        details: "As variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configuradas ou são inválidas.", 
        tablesExist: false 
      };
    }

    try {
      // 1. Check schema for members
      const { error: membersError } = await supabase.from("members").select("id").limit(1);
      
      if (membersError) {
        // PGRST116 means row not found (good), relation doesn't exist is usually 42P01 or similar message
        const dberr = membersError.message.toLowerCase();
        if (membersError.code === "PGRST116" || dberr.includes("relation") && dberr.includes("does not exist") || membersError.message.includes("não existe")) {
          return {
            active: true,
            details: "Conectado ao Supabase com sucesso! No entanto, a tabela 'members' não foi encontrada. Por favor, execute o script 'schema.sql' no seu painel Supabase.",
            tablesExist: false
          };
        }
        return {
          active: false,
          details: `Conectou ao Host, mas a consulta falhou: ${membersError.message} (Código: ${membersError.code})`,
          tablesExist: false
        };
      }

      // 2. Check schema for admins
      const { error: adminsError } = await supabase.from("admins").select("id").limit(1);
      if (adminsError) {
        const dberr = adminsError.message.toLowerCase();
        if (adminsError.code === "PGRST116" || dberr.includes("relation") && dberr.includes("does not exist") || dberr.includes("não existe")) {
          return {
            active: true,
            details: "Conectado com sucesso! A tabela 'members' está ativa, mas a tabela 'admins' está ausente. Execute o script 'schema.sql' completo.",
            tablesExist: false
          };
        }
      }

      // 3. Check schema for donations
      const { error: donationsError } = await supabase.from("donations").select("id").limit(1);
      if (donationsError) {
        const dberr = donationsError.message.toLowerCase();
        if (donationsError.code === "PGRST116" || dberr.includes("relation") && dberr.includes("does not exist") || dberr.includes("não existe")) {
          return {
            active: true,
            details: "Conectado com sucesso! As tabelas de membros estão ativas, mas a tabela 'donations' está ausente no seu banco de dados Supabase.",
            tablesExist: false
          };
        }
      }

      // 4. Check schema for fichas_filiacao
      const { error: fichasError } = await supabase.from("fichas_filiacao").select("id").limit(1);
      if (fichasError) {
        const dberr = fichasError.message.toLowerCase();
        if (fichasError.code === "PGRST116" || dberr.includes("relation") && dberr.includes("does not exist") || dberr.includes("não existe")) {
          return {
            active: true,
            details: "Conectado com sucesso! As tabelas de membros e doações estão ativas, mas a tabela 'fichas_filiacao' está ausente no seu banco de dados Supabase. Execute o script 'schema.sql' no seu painel.",
            tablesExist: false
          };
        }
      }

      // 5. Check schema for coordinators
      const { error: coordsError } = await supabase.from("coordinators").select("id").limit(1);
      if (coordsError) {
        const dberr = coordsError.message.toLowerCase();
        if (coordsError.code === "PGRST116" || dberr.includes("relation") && dberr.includes("does not exist") || dberr.includes("não existe")) {
          return {
            active: true,
            details: "Conectado com sucesso! As tabelas essenciais estão ativas, mas a tabela 'coordinators' está ausente no seu banco de dados Supabase. Execute o script SQL no seu painel.",
            tablesExist: false
          };
        }
      }

      return { 
        active: true, 
        details: "Conexão estabelecida com sucesso! Todas as tabelas ('members', 'admins', 'donations', 'fichas_filiacao' e 'coordinators') estão operando plenamente no Supabase.", 
        tablesExist: true 
      };
    } catch (err: any) {
      return { 
        active: false, 
        details: `Erro de rede ou CORS ao conectar ao Supabase: ${err?.message || err}`, 
        tablesExist: false 
      };
    }
  }
};

export interface CapelaniaVolunteer {
  id?: string;
  name: string;
  whatsapp: string;
  city: string;
  serviceTitle?: string;
  createdAt?: string;
}

export const capelaniaVolunteersService = {
  async getVolunteers(): Promise<CapelaniaVolunteer[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("capelania_volunteers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao carregar voluntários do Supabase:", error.message);
          throw error;
        }

        if (data) {
          return data.map((v: any) => ({
            id: v.id?.toString(),
            name: v.name,
            whatsapp: v.whatsapp,
            city: v.city,
            serviceTitle: v.service_title || v.serviceTitle,
            createdAt: v.created_at || v.createdAt
          }));
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para voluntários da capelania. Usando localStorage de contingência.", err);
      }
    }

    const saved = localStorage.getItem("umesc_capelania_volunteers");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  async createVolunteer(volunteer: CapelaniaVolunteer): Promise<CapelaniaVolunteer> {
    const newVol = {
      ...volunteer,
      id: volunteer.id || `VOL-${Math.floor(Math.random() * 900000 + 100000)}`,
      createdAt: volunteer.createdAt || new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          name: newVol.name,
          whatsapp: newVol.whatsapp,
          city: newVol.city,
          service_title: newVol.serviceTitle,
          created_at: newVol.createdAt
        };

        const { data, error } = await supabase
          .from("capelania_volunteers")
          .insert([dbRecord])
          .select();

        if (error) {
          console.error("Erro ao criar voluntário no Supabase:", error.message);
          throw error;
        }

        if (data && data.length > 0) {
          return {
            id: data[0].id?.toString(),
            name: data[0].name,
            whatsapp: data[0].whatsapp,
            city: data[0].city,
            serviceTitle: data[0].service_title,
            createdAt: data[0].created_at
          };
        }
      } catch (err) {
        console.warn("Falha de gravação no Supabase para voluntário. Gravando localmente por contingência.", err);
      }
    }

    const list = await this.getVolunteers();
    const updated = [newVol, ...list];
    localStorage.setItem("umesc_capelania_volunteers", JSON.stringify(updated));
    return newVol;
  },

  async deleteVolunteer(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("capelania_volunteers")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Erro ao deletar voluntário no Supabase:", error.message);
          throw error;
        }
        return true;
      } catch (err) {
        console.warn("Falha de deleção no Supabase para voluntário. Deletando localmente por contingência.", err);
      }
    }

    const list = await this.getVolunteers();
    const filtered = list.filter((v) => v.id !== id && v.id?.toString() !== id);
    localStorage.setItem("umesc_capelania_volunteers", JSON.stringify(filtered));
    return true;
  }
};

/**
 * Service to manage prayer requests (Pedidos de Oração) in Supabase (or local fallback)
 */
export const prayerRequestsService = {
  async getRequests(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("prayer_requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao carregar pedidos de oração do Supabase:", error.message);
          throw error;
        }

        if (data) {
          return data.map((pr: any) => ({
            id: pr.id?.toString(),
            name: pr.name,
            whatsapp: pr.whatsapp,
            request: pr.request,
            status: pr.status || "pending",
            createdAt: pr.created_at || pr.createdAt
          }));
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para pedidos de oração. Usando localStorage de contingência.", err);
      }
    }

    const saved = localStorage.getItem("umesc_prayer_requests");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  async createRequest(req: { name: string; whatsapp: string; request: string; status?: "pending" | "prayed" }): Promise<any> {
    const newReq = {
      id: "pr_" + Math.random().toString(36).substring(2, 9),
      name: req.name,
      whatsapp: req.whatsapp,
      request: req.request,
      status: req.status || "pending",
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          name: newReq.name,
          whatsapp: newReq.whatsapp,
          request: newReq.request,
          status: newReq.status,
          created_at: newReq.createdAt
        };

        const { data, error } = await supabase
          .from("prayer_requests")
          .insert([dbRecord])
          .select();

        if (error) {
          console.error("Erro ao criar pedido de oração no Supabase:", error.message);
          throw error;
        }

        if (data && data.length > 0) {
          return {
            id: data[0].id?.toString(),
            name: data[0].name,
            whatsapp: data[0].whatsapp,
            request: data[0].request,
            status: data[0].status || "pending",
            createdAt: data[0].created_at
          };
        }
      } catch (err) {
        console.warn("Falha de gravação no Supabase para pedido de oração. Gravando localmente por contingência.", err);
      }
    }

    const list = await this.getRequests();
    const updated = [newReq, ...list];
    localStorage.setItem("umesc_prayer_requests", JSON.stringify(updated));
    return newReq;
  },

  async updateRequestStatus(id: string, status: "pending" | "prayed"): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const numericId = parseInt(id, 10);
        const queryId = isNaN(numericId) ? id : numericId;

        const { error } = await supabase
          .from("prayer_requests")
          .update({ status })
          .eq("id", queryId);

        if (error) {
          console.error("Erro ao atualizar status do pedido no Supabase:", error.message);
          throw error;
        }
      } catch (err) {
        console.warn("Falha de atualização no Supabase para pedido de oração. Atualizando localmente por contingência.", err);
      }
    }

    const list = await this.getRequests();
    const updated = list.map((r) => r.id === id ? { ...r, status } : r);
    localStorage.setItem("umesc_prayer_requests", JSON.stringify(updated));
    return true;
  },

  async deleteRequest(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const numericId = parseInt(id, 10);
        const queryId = isNaN(numericId) ? id : numericId;

        const { error } = await supabase
          .from("prayer_requests")
          .delete()
          .eq("id", queryId);

        if (error) {
          console.error("Erro ao deletar pedido no Supabase:", error.message);
          throw error;
        }
        return true;
      } catch (err) {
        console.warn("Falha de deleção no Supabase para pedido de oração. Deletando localmente por contingência.", err);
      }
    }

    const list = await this.getRequests();
    const filtered = list.filter((r) => r.id !== id && r.id?.toString() !== id);
    localStorage.setItem("umesc_prayer_requests", JSON.stringify(filtered));
    return true;
  }
};

/**
 * Service to manage Secretaria members (membros secretaria)
 */
export const secretariaMembersService = {
  async getMembers(): Promise<SecretariaMember[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let allData: any[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from("secretaria_members")
            .select("*")
            .order("nome", { ascending: true })
            .range(from, from + limit - 1);

          if (error) {
            console.error("Erro ao buscar membros secretaria no Supabase:", error.message);
            throw error;
          }

          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += limit;
            if (data.length < limit) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        const mapped = allData.map((item: any) => ({
          id: item.id,
          matricula: item.matricula || "",
          nome: item.nome || "",
          cod: item.cod || "",
          telefone: item.telefone || "",
          cidade: item.cidade || "",
          dataNascimento: item.data_nascimento || "",
          opm: item.opm || "",
          grupo: item.grupo || "",
          createdAt: item.created_at
        }));
        localStorage.setItem("umesc_secretaria_members", JSON.stringify(mapped));
        return mapped;
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para buscar membros secretaria. Usando cache local por contingência.", err);
      }
    }

    const local = localStorage.getItem("umesc_secretaria_members");
    if (local) {
      return JSON.parse(local);
    } else {
      localStorage.setItem("umesc_secretaria_members", JSON.stringify(INITIAL_SECRETARIA_MEMBERS));
      return INITIAL_SECRETARIA_MEMBERS;
    }
  },

  async createMember(member: Omit<SecretariaMember, "id">): Promise<SecretariaMember> {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = {
          matricula: member.matricula,
          nome: member.nome,
          cod: member.cod,
          telefone: member.telefone,
          cidade: member.cidade,
          data_nascimento: member.dataNascimento,
          opm: member.opm,
          grupo: member.grupo
        };

        const { data, error } = await supabase
          .from("secretaria_members")
          .upsert([dbPayload], { onConflict: "matricula" })
          .select();

        if (error) {
          console.error("Erro ao inserir membro secretaria no Supabase:", error.message);
          throw error;
        }

        if (data && data[0]) {
          const item = data[0];
          return {
            id: item.id,
            matricula: item.matricula || "",
            nome: item.nome || "",
            cod: item.cod || "",
            telefone: item.telefone || "",
            cidade: item.cidade || "",
            dataNascimento: item.data_nascimento || "",
            opm: item.opm || "",
            grupo: item.grupo || "",
            createdAt: item.created_at
          };
        }
      } catch (err) {
        console.warn("Falha de inserção no Supabase para membro secretaria. Salvando localmente por contingência.", err);
      }
    }

    const list = await this.getMembers();
    const maxId = list.reduce((max, m) => ((m.id || 0) > max ? (m.id || 0) : max), 0);
    const newMember: SecretariaMember = {
      ...member,
      id: maxId + 1,
      createdAt: new Date().toISOString()
    };
    const updated = [...list, newMember];
    localStorage.setItem("umesc_secretaria_members", JSON.stringify(updated));
    return newMember;
  },

  async createMembersBatch(membersList: Omit<SecretariaMember, "id">[]): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayloads = membersList.map((m) => ({
          matricula: m.matricula,
          nome: m.nome,
          cod: m.cod,
          telefone: m.telefone,
          cidade: m.cidade,
          data_nascimento: m.dataNascimento,
          opm: m.opm,
          grupo: m.grupo
        }));

        // Deduplicate payloads by matricula so PostgreSQL ON CONFLICT DO UPDATE doesn't throw:
        // "ON CONFLICT DO UPDATE command cannot affect row a second time"
        const uniquePayloadsMap = new Map<string, typeof dbPayloads[0]>();
        const payloadsNoMatricula: typeof dbPayloads = [];

        for (const p of dbPayloads) {
          const matKey = (p.matricula || "").trim().toLowerCase();
          if (matKey) {
            uniquePayloadsMap.set(matKey, p);
          } else {
            payloadsNoMatricula.push(p);
          }
        }

        const uniquePayloads = [...Array.from(uniquePayloadsMap.values()), ...payloadsNoMatricula];

        if (uniquePayloads.length > 0) {
          const { error } = await supabase
            .from("secretaria_members")
            .upsert(uniquePayloads, { onConflict: "matricula" });

          if (error) {
            console.error("Erro ao inserir lote de membros secretaria no Supabase:", error.message);
            throw error;
          }
        }
        return true;
      } catch (err) {
        console.warn("Falha de inserção em lote no Supabase.", err);
        throw err;
      }
    }

    const list = await this.getMembers();
    let maxId = list.reduce((max, m) => ((m.id || 0) > max ? (m.id || 0) : max), 0);
    const newMembers = membersList.map((m) => {
      maxId += 1;
      return {
        ...m,
        id: maxId,
        createdAt: new Date().toISOString()
      };
    });
    const updated = [...list, ...newMembers];
    localStorage.setItem("umesc_secretaria_members", JSON.stringify(updated));
    return true;
  },

  async updateMember(id: number, member: Partial<SecretariaMember>): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload: any = {};
        if (member.matricula !== undefined) dbPayload.matricula = member.matricula;
        if (member.nome !== undefined) dbPayload.nome = member.nome;
        if (member.cod !== undefined) dbPayload.cod = member.cod;
        if (member.telefone !== undefined) dbPayload.telefone = member.telefone;
        if (member.cidade !== undefined) dbPayload.cidade = member.cidade;
        if (member.dataNascimento !== undefined) dbPayload.data_nascimento = member.dataNascimento;
        if (member.opm !== undefined) dbPayload.opm = member.opm;
        if (member.grupo !== undefined) dbPayload.grupo = member.grupo;

        const { error } = await supabase
          .from("secretaria_members")
          .update(dbPayload)
          .eq("id", id);

        if (error) {
          console.error("Erro ao atualizar membro secretaria no Supabase:", error.message);
          throw error;
        }
        return true;
      } catch (err) {
        console.warn("Falha de atualização no Supabase para membro secretaria. Atualizando localmente por contingência.", err);
      }
    }

    const list = await this.getMembers();
    const updated = list.map((m) => (m.id === id ? { ...m, ...member } : m));
    localStorage.setItem("umesc_secretaria_members", JSON.stringify(updated));
    return true;
  },

  async deleteMember(id: number): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("secretaria_members")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Erro ao deletar membro secretaria no Supabase:", error.message);
          throw error;
        }
        return true;
      } catch (err) {
        console.warn("Falha de deleção no Supabase para membro secretaria. Deletando localmente por contingência.", err);
      }
    }

    const list = await this.getMembers();
    const filtered = list.filter((m) => m.id !== id);
    localStorage.setItem("umesc_secretaria_members", JSON.stringify(filtered));
    return true;
  },

  async deleteMembersBatch(ids: number[]): Promise<boolean> {
    if (ids.length === 0) return true;
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("secretaria_members")
          .delete()
          .in("id", ids);

        if (error) {
          console.error("Erro ao deletar lote de membros secretaria no Supabase:", error.message);
          throw error;
        }
        return true;
      } catch (err) {
        console.warn("Falha de deleção no Supabase para lote. Deletando localmente.", err);
      }
    }

    const list = await this.getMembers();
    const idSet = new Set(ids);
    const filtered = list.filter((m) => !idSet.has(m.id || 0));
    localStorage.setItem("umesc_secretaria_members", JSON.stringify(filtered));
    return true;
  },

  async deleteAllMembers(): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("secretaria_members")
          .delete()
          .neq("id", 0);

        if (error) {
          console.error("Erro ao limpar todos os membros secretaria no Supabase:", error.message);
          throw error;
        }
      } catch (err) {
        console.error("Falha ao remover todos os membros do Supabase:", err);
        throw err;
      }
    }

    localStorage.setItem("umesc_secretaria_members", JSON.stringify([]));
    return true;
  }
};

/**
 * Service to manage Apoio Feminino posts (blog/conteúdos)
 */
export const apoioFemininoService = {
  async getPosts(): Promise<ApoioFemininoPost[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("apoio_feminino")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao carregar posts do Apoio Feminino do Supabase:", error.message);
          throw error;
        }

        if (data) {
          return data.map((item: any) => ({
            id: item.id?.toString(),
            title: item.title,
            content: item.content,
            mediaType: item.media_type || "none",
            mediaUrl: item.media_url || "",
            createdAt: item.created_at || item.createdAt
          }));
        }
      } catch (err) {
        console.warn("Falha ao conectar no Supabase para Apoio Feminino. Usando localStorage de contingência.", err);
      }
    }

    const saved = localStorage.getItem("umesc_apoio_feminino_posts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    
    // Seed initial demo content if empty and local storage is empty
    const seed: ApoioFemininoPost[] = [];
    localStorage.setItem("umesc_apoio_feminino_posts", JSON.stringify(seed));
    return seed;
  },

  async createPost(post: ApoioFemininoPost): Promise<ApoioFemininoPost> {
    const newPost = {
      ...post,
      id: post.id || `POST-${Math.floor(Math.random() * 900000 + 100000)}`,
      createdAt: post.createdAt || new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          title: newPost.title,
          content: newPost.content,
          media_type: newPost.mediaType,
          media_url: newPost.mediaUrl,
          created_at: newPost.createdAt
        };

        const { data, error } = await supabase
          .from("apoio_feminino")
          .insert([dbRecord])
          .select();

        if (error) {
          console.error("Erro ao criar post de Apoio Feminino no Supabase:", error.message);
          throw error;
        }

        if (data && data.length > 0) {
          return {
            id: data[0].id?.toString(),
            title: data[0].title,
            content: data[0].content,
            mediaType: data[0].media_type,
            mediaUrl: data[0].media_url,
            createdAt: data[0].created_at
          };
        }
      } catch (err) {
        console.warn("Falha de gravação no Supabase para Apoio Feminino. Gravando localmente por contingência.", err);
      }
    }

    const list = await this.getPosts();
    const updated = [newPost, ...list];
    localStorage.setItem("umesc_apoio_feminino_posts", JSON.stringify(updated));
    return newPost;
  },

  async updatePost(id: string, updatedFields: Partial<ApoioFemininoPost>): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const numericId = parseInt(id, 10);
        const queryId = isNaN(numericId) ? id : numericId;

        const dbRecord: any = {};
        if (updatedFields.title !== undefined) dbRecord.title = updatedFields.title;
        if (updatedFields.content !== undefined) dbRecord.content = updatedFields.content;
        if (updatedFields.mediaType !== undefined) dbRecord.media_type = updatedFields.mediaType;
        if (updatedFields.mediaUrl !== undefined) dbRecord.media_url = updatedFields.mediaUrl;

        const { error } = await supabase
          .from("apoio_feminino")
          .update(dbRecord)
          .eq("id", queryId);

        if (error) {
          console.error("Erro ao atualizar post no Supabase:", error.message);
          throw error;
        }
      } catch (err) {
        console.warn("Falha de atualização no Supabase para Apoio Feminino. Atualizando localmente por contingência.", err);
      }
    }

    const list = await this.getPosts();
    const updated = list.map((item) => 
      (item.id === id || item.id?.toString() === id) ? { ...item, ...updatedFields } : item
    );
    localStorage.setItem("umesc_apoio_feminino_posts", JSON.stringify(updated));
    return true;
  },

  async deletePost(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const numericId = parseInt(id, 10);
        const queryId = isNaN(numericId) ? id : numericId;

        const { error } = await supabase
          .from("apoio_feminino")
          .delete()
          .eq("id", queryId);

        if (error) {
          console.error("Erro ao deletar post de Apoio Feminino no Supabase:", error.message);
          throw error;
        }
        return true;
      } catch (err) {
        console.warn("Falha de deleção no Supabase para Apoio Feminino. Deletando localmente por contingência.", err);
      }
    }

    const list = await this.getPosts();
    const filtered = list.filter((item) => item.id !== id && item.id?.toString() !== id);
    localStorage.setItem("umesc_apoio_feminino_posts", JSON.stringify(filtered));
    return true;
  }
};


/**
 * Maps the internal FichaFiliacao model to Supabase database columns
 */
export interface SupabaseFicha {
  id: string;
  member_cpf: string;
  member_name: string;
  organ: string;
  organ_other?: string;
  lotacao_municipio: string;
  categoria: string;
  matricula: string;
  vinculo: string;
  birth_date: string;
  genero: string;
  address_rua: string;
  address_bairro: string;
  address_cep: string;
  address_cidade: string;
  contact_cidade: string;
  contact_fones: string;
  contact_email: string;
  opcao_autorizacao: number;
  percentual_desconto?: number;
  percentual_anterior?: number;
  percentual_novo?: number;
  data_inscricao: string;
  assinatura_nome: string;
  assinatura_desenho?: string;
  signature_date: string;
  ip_address: string;
  security_seal: string;
}

function toSupabaseFicha(ficha: FichaFiliacao): SupabaseFicha {
  const cpfToUse = (ficha.memberCpf || (ficha as any).rawCpf || "").trim() || "00000000000";
  return {
    id: ficha.id,
    member_cpf: cpfToUse,
    member_name: ficha.memberName || "Associado UMESC",
    organ: ficha.organ || "OUTRO",
    organ_other: ficha.organOther || "",
    lotacao_municipio: ficha.lotacaoMunicipio || "",
    categoria: ficha.categoria || "ATIVO",
    matricula: ficha.matricula || "",
    vinculo: ficha.vinculo || "EFETIVO",
    birth_date: ficha.birthDate || "",
    genero: ficha.genero || "M",
    address_rua: ficha.addressRua || "",
    address_bairro: ficha.addressBairro || "",
    address_cep: ficha.addressCep || "",
    address_cidade: ficha.addressCidade || "",
    contact_cidade: ficha.contactCidade || "",
    contact_fones: ficha.contactFones || "",
    contact_email: ficha.contactEmail || "",
    opcao_autorizacao: ficha.opcaoAutorizacao || 1,
    percentual_desconto: ficha.percentualDesconto || 1.0,
    percentual_anterior: ficha.percentualAnterior || 0,
    percentual_novo: ficha.percentualNovo || 0,
    data_inscricao: ficha.dataInscricao || new Date().toISOString(),
    assinatura_nome: ficha.assinaturaNome || ficha.memberName || "",
    assinatura_desenho: ficha.assinaturaDesenho || "",
    signature_date: ficha.signatureDate || new Date().toISOString(),
    ip_address: ficha.ipAddress || "127.0.0.1",
    security_seal: ficha.securitySeal || "SEAL-000"
  };
}

function fromSupabaseFicha(db: any): FichaFiliacao {
  return {
    id: db.id,
    memberCpf: db.member_cpf,
    memberName: db.member_name,
    organ: db.organ as any,
    organOther: db.organ_other || "",
    lotacaoMunicipio: db.lotacao_municipio,
    categoria: db.categoria as any,
    matricula: db.matricula,
    vinculo: db.vinculo,
    birthDate: db.birth_date,
    genero: db.genero as any,
    addressRua: db.address_rua,
    addressBairro: db.address_bairro,
    addressCep: db.address_cep,
    addressCidade: db.address_cidade,
    contactCidade: db.contact_cidade,
    contactFones: db.contact_fones,
    contactEmail: db.contact_email,
    opcaoAutorizacao: db.opcao_autorizacao as any,
    percentualDesconto: db.percentual_desconto !== null && db.percentual_desconto !== undefined ? Number(db.percentual_desconto) as any : undefined,
    percentualAnterior: db.percentual_anterior !== null && db.percentual_anterior !== undefined ? Number(db.percentual_anterior) as any : undefined,
    percentualNovo: db.percentual_novo !== null && db.percentual_novo !== undefined ? Number(db.percentual_novo) as any : undefined,
    dataInscricao: db.data_inscricao,
    assinaturaNome: db.assinatura_nome,
    assinaturaDesenho: db.assinatura_desenho || "",
    signatureDate: db.signature_date,
    ipAddress: db.ip_address,
    securitySeal: db.security_seal
  };
}

/**
 * Service to manage Fichas de Filiação in Supabase
 */
export const fichasFiliacaoService = {
  async getFichas(): Promise<FichaFiliacao[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("fichas_filiacao")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Informação: Tabela fichas_filiacao ausente ou indisponível no Supabase:", error.message);
          throw error;
        }

        if (data) {
          const dbFichas = data.map(fromSupabaseFicha);
          const saved = localStorage.getItem("umesc_fichas_filiacao");
          let localFichas: FichaFiliacao[] = [];
          if (saved) {
            try {
              localFichas = JSON.parse(saved);
            } catch (e) {
              localFichas = [];
            }
          }
          const merged = [...dbFichas];
          for (const lf of localFichas) {
            if (!merged.some(m => m.memberCpf === lf.memberCpf || m.id === lf.id)) {
              merged.push(lf);
            }
          }
          localStorage.setItem("umesc_fichas_filiacao", JSON.stringify(merged));
          return merged;
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para Fichas de Filiação. Usando localStorage como contingência.", err);
      }
    }

    const saved = localStorage.getItem("umesc_fichas_filiacao");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  async submitFicha(ficha: FichaFiliacao): Promise<FichaFiliacao> {
    let savedFicha = ficha;
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = toSupabaseFicha(ficha);
        
        const { data, error } = await supabase
          .from("fichas_filiacao")
          .upsert([dbRecord], { onConflict: "member_cpf" })
          .select();

        if (error) {
          console.warn("Informação: Falha ao salvar no Supabase:", error.message);
          throw error;
        }

        if (data && data.length > 0) {
          savedFicha = fromSupabaseFicha(data[0]);
        }
      } catch (err) {
        console.warn("Falha de gravação no Supabase para Ficha de Filiação. Gravando localmente por contingência.", err);
      }
    }

    // Always mirror in localStorage so local views / AdminPortal get immediate data
    const saved = localStorage.getItem("umesc_fichas_filiacao");
    let list: FichaFiliacao[] = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (e) {
        list = [];
      }
    }
    const filtered = list.filter(f => f.memberCpf !== savedFicha.memberCpf);
    const updated = [savedFicha, ...filtered];
    localStorage.setItem("umesc_fichas_filiacao", JSON.stringify(updated));

    // Dispatch global real-time synchronization events
    window.dispatchEvent(new Event("umesc-data-sync"));
    window.dispatchEvent(new CustomEvent("umesc_content_updated"));

    return savedFicha;
  },

  async deleteFicha(memberCpf: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("fichas_filiacao")
          .delete()
          .eq("member_cpf", memberCpf);

        if (error) {
          console.warn("Informação: Falha ao deletar no Supabase:", error.message);
          throw error;
        }
      } catch (err) {
        console.warn("Falha de exclusão no Supabase para Ficha de Filiação. Excluindo localmente por contingência.", err);
      }
    }

    const saved = localStorage.getItem("umesc_fichas_filiacao");
    let list: FichaFiliacao[] = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (e) {
        list = [];
      }
    }
    const filtered = list.filter(f => f.memberCpf !== memberCpf);
    localStorage.setItem("umesc_fichas_filiacao", JSON.stringify(filtered));

    window.dispatchEvent(new Event("umesc-data-sync"));
    window.dispatchEvent(new CustomEvent("umesc_content_updated"));

    return true;
  }
};


/**
 * Service to manage Coordinators in Supabase
 */
export const coordinatorsService = {
  async getCoordinators(): Promise<Coordinator[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("coordinators")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          console.warn("Informação: Tabela coordinators ausente ou indisponível no Supabase:", error.message);
          throw error;
        }

        if (data && data.length > 0) {
          const list = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            rank: item.rank,
            role: item.role,
            region: item.region,
            contact: item.contact,
            avatar: item.avatar || ""
          }));
          localStorage.setItem("umesc_coordenadores", JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para Coordenadores. Usando localStorage como contingência.", err);
      }
    }

    const saved = localStorage.getItem("umesc_coordenadores");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return COORDINATORS_DATA;
      }
    }
    return COORDINATORS_DATA;
  },

  async saveCoordinator(coord: Coordinator): Promise<Coordinator> {
    const prepared: Coordinator = {
      ...coord,
      id: coord.id || `coord_${Date.now()}`,
      avatar: coord.avatar || ""
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          id: prepared.id,
          name: prepared.name,
          rank: prepared.rank,
          role: prepared.role,
          region: prepared.region,
          contact: prepared.contact,
          avatar: prepared.avatar
        };

        const { data, error } = await supabase
          .from("coordinators")
          .upsert([dbRecord], { onConflict: "id" })
          .select();

        if (error) {
          console.warn("Informação: Falha ao salvar coordenador no Supabase:", error.message);
          throw error;
        }

        if (data && data.length > 0) {
          const savedCoord = {
            id: data[0].id,
            name: data[0].name,
            rank: data[0].rank,
            role: data[0].role,
            region: data[0].region,
            contact: data[0].contact,
            avatar: data[0].avatar || ""
          };
          const list = await this.getCoordinators();
          const filtered = list.filter(c => c.id !== savedCoord.id);
          const updated = [...filtered, savedCoord];
          localStorage.setItem("umesc_coordenadores", JSON.stringify(updated));
          return savedCoord;
        }
      } catch (err) {
        console.warn("Falha de gravação no Supabase para Coordenadores. Gravando localmente por contingência.", err);
      }
    }

    const list = await this.getCoordinators();
    const filtered = list.filter(c => c.id !== prepared.id);
    const updated = [...filtered, prepared];
    localStorage.setItem("umesc_coordenadores", JSON.stringify(updated));
    return prepared;
  },

  async deleteCoordinator(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("coordinators")
          .delete()
          .eq("id", id);

        if (error) {
          console.warn("Informação: Falha ao deletar coordenador no Supabase:", error.message);
          throw error;
        }
        
        const list = await this.getCoordinators();
        const filtered = list.filter(c => c.id !== id);
        localStorage.setItem("umesc_coordenadores", JSON.stringify(filtered));
        return true;
      } catch (err) {
        console.warn("Falha de exclusão no Supabase para Coordenador. Excluindo localmente por contingência.", err);
      }
    }

    const list = await this.getCoordinators();
    const filtered = list.filter(c => c.id !== id);
    localStorage.setItem("umesc_coordenadores", JSON.stringify(filtered));
    return true;
  }
};

/**
 * Service to manage missionary projects (Projetos Missionários) in Supabase (or local fallback)
 */
export const projectsService = {
  async getProjects(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("title", { ascending: true });

        if (!error && data) {
          const list = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            description: item.description,
            detailedNeeds: item.detailed_needs || "",
            location: item.location || "",
            image: item.image || "",
            raisedPercent: Number(item.raised_percent || 0),
            targetAmount: Number(item.target_amount || 0),
            currentAmount: Number(item.current_amount || 0),
          }));
          localStorage.setItem("umesc_projects", JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para Projetos. Usando local.", err);
      }
    }
    const saved = localStorage.getItem("umesc_projects");
    return saved ? JSON.parse(saved) : [];
  },

  async saveProject(proj: any): Promise<any> {
    const prepared = {
      ...proj,
      id: proj.id || `proj_${Date.now()}`,
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          id: prepared.id,
          title: prepared.title,
          category: prepared.category,
          description: prepared.description,
          detailed_needs: prepared.detailedNeeds || "",
          location: prepared.location || "",
          image: prepared.image || "",
          raised_percent: prepared.raisedPercent || 0,
          target_amount: prepared.targetAmount || 0,
          current_amount: prepared.currentAmount || 0,
        };
        const { error } = await supabase
          .from("projects")
          .upsert([dbRecord], { onConflict: "id" });
        if (!error) {
          const list = await this.getProjects();
          const filtered = list.filter((p) => p.id !== prepared.id);
          const updated = [...filtered, prepared];
          localStorage.setItem("umesc_projects", JSON.stringify(updated));
          return prepared;
        }
      } catch (err) {
        console.warn("Falha ao salvar no Supabase para Projetos.", err);
      }
    }
    const list = await this.getProjects();
    const filtered = list.filter((p) => p.id !== prepared.id);
    const updated = [...filtered, prepared];
    localStorage.setItem("umesc_projects", JSON.stringify(updated));
    return prepared;
  },

  async deleteProject(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("projects").delete().eq("id", id);
        if (!error) {
          const list = await this.getProjects();
          const filtered = list.filter((p) => p.id !== id);
          localStorage.setItem("umesc_projects", JSON.stringify(filtered));
          return true;
        }
      } catch (err) {
        console.warn("Falha ao deletar no Supabase para Projetos.", err);
      }
    }
    const list = await this.getProjects();
    const filtered = list.filter((p) => p.id !== id);
    localStorage.setItem("umesc_projects", JSON.stringify(filtered));
    return true;
  }
};

/**
 * Service to manage mural announcements (Avisos do Mural) in Supabase (or local fallback)
 */
export const announcementsService = {
  async getAnnouncements(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .order("date", { ascending: false });

        if (!error && data) {
          const list = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            content: item.content,
            date: item.date,
            isImportant: item.is_important ?? false,
          }));
          localStorage.setItem("umesc_announcements", JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para Avisos. Usando local.", err);
      }
    }
    const saved = localStorage.getItem("umesc_announcements");
    return saved ? JSON.parse(saved) : [];
  },

  async saveAnnouncement(ann: any): Promise<any> {
    const prepared = {
      ...ann,
      id: ann.id || `ann_${Date.now()}`,
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          id: prepared.id,
          title: prepared.title,
          category: prepared.category,
          content: prepared.content,
          date: prepared.date,
          is_important: prepared.isImportant ?? false,
        };
        const { error } = await supabase
          .from("announcements")
          .upsert([dbRecord], { onConflict: "id" });
        if (!error) {
          const list = await this.getAnnouncements();
          const filtered = list.filter((a) => a.id !== prepared.id);
          const updated = [...filtered, prepared];
          localStorage.setItem("umesc_announcements", JSON.stringify(updated));
          return prepared;
        }
      } catch (err) {
        console.warn("Falha ao salvar no Supabase para Avisos.", err);
      }
    }
    const list = await this.getAnnouncements();
    const filtered = list.filter((a) => a.id !== prepared.id);
    const updated = [...filtered, prepared];
    localStorage.setItem("umesc_announcements", JSON.stringify(updated));
    return prepared;
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("announcements").delete().eq("id", id);
        if (!error) {
          const list = await this.getAnnouncements();
          const filtered = list.filter((a) => a.id !== id);
          localStorage.setItem("umesc_announcements", JSON.stringify(filtered));
          return true;
        }
      } catch (err) {
        console.warn("Falha ao deletar no Supabase para Avisos.", err);
      }
    }
    const list = await this.getAnnouncements();
    const filtered = list.filter((a) => a.id !== id);
    localStorage.setItem("umesc_announcements", JSON.stringify(filtered));
    return true;
  }
};

/**
 * Service to manage documents repository (Ficheiros & Arquivos) in Supabase (or local fallback)
 */
export const documentsService = {
  async getDocuments(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .order("published_date", { ascending: false });

        if (!error && data) {
          const list = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            fileSize: item.file_size || "",
            publishedDate: item.published_date || "",
            downloadCount: Number(item.download_count || 0),
            url: item.url,
          }));
          localStorage.setItem("umesc_documents", JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para Documentos. Usando local.", err);
      }
    }
    const saved = localStorage.getItem("umesc_documents");
    return saved ? JSON.parse(saved) : [];
  },

  async saveDocument(doc: any): Promise<any> {
    const prepared = {
      ...doc,
      id: doc.id || `doc_${Date.now()}`,
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          id: prepared.id,
          title: prepared.title,
          category: prepared.category,
          file_size: prepared.fileSize || "",
          published_date: prepared.publishedDate || "",
          download_count: prepared.downloadCount || 0,
          url: prepared.url,
        };
        const { error } = await supabase
          .from("documents")
          .upsert([dbRecord], { onConflict: "id" });
        if (!error) {
          const list = await this.getDocuments();
          const filtered = list.filter((d) => d.id !== prepared.id);
          const updated = [...filtered, prepared];
          localStorage.setItem("umesc_documents", JSON.stringify(updated));
          return prepared;
        }
      } catch (err) {
        console.warn("Falha ao salvar no Supabase para Documentos.", err);
      }
    }
    const list = await this.getDocuments();
    const filtered = list.filter((d) => d.id !== prepared.id);
    const updated = [...filtered, prepared];
    localStorage.setItem("umesc_documents", JSON.stringify(updated));
    return prepared;
  },

  async deleteDocument(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("documents").delete().eq("id", id);
        if (!error) {
          const list = await this.getDocuments();
          const filtered = list.filter((d) => d.id !== id);
          localStorage.setItem("umesc_documents", JSON.stringify(filtered));
          return true;
        }
      } catch (err) {
        console.warn("Falha ao deletar no Supabase para Documentos.", err);
      }
    }
    const list = await this.getDocuments();
    const filtered = list.filter((d) => d.id !== id);
    localStorage.setItem("umesc_documents", JSON.stringify(filtered));
    return true;
  }
};

/**
 * Service to manage Magazines and Bulletins (Revistas e Boletins) in Supabase (or local fallback)
 */
export const revistasService = {
  async getRevistas(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("revistas")
          .select("*")
          .order("published_date", { ascending: false });

        if (!error && data) {
          const list = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            volume: item.volume,
            publishedDate: item.published_date || "",
            description: item.description || "",
            coverImage: item.cover_image || "",
            downloadUrl: item.download_url || "",
            downloads: Number(item.downloads || 0),
            googleDriveUrl: item.google_drive_url || "",
          }));
          localStorage.setItem("umesc_revistas", JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para Revistas. Usando local.", err);
      }
    }
    const saved = localStorage.getItem("umesc_revistas");
    return saved ? JSON.parse(saved) : [];
  },

  async saveRevista(rev: any): Promise<any> {
    const prepared = {
      ...rev,
      id: rev.id || `rev_${Date.now()}`,
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          id: prepared.id,
          title: prepared.title,
          volume: prepared.volume,
          published_date: prepared.publishedDate || "",
          description: prepared.description || "",
          cover_image: prepared.coverImage || "",
          download_url: prepared.downloadUrl || "",
          downloads: prepared.downloads || 0,
          google_drive_url: prepared.googleDriveUrl || "",
        };
        const { error } = await supabase
          .from("revistas")
          .upsert([dbRecord], { onConflict: "id" });
        if (!error) {
          const list = await this.getRevistas();
          const filtered = list.filter((r) => r.id !== prepared.id);
          const updated = [...filtered, prepared];
          localStorage.setItem("umesc_revistas", JSON.stringify(updated));
          return prepared;
        }
      } catch (err) {
        console.warn("Falha ao salvar no Supabase para Revistas.", err);
      }
    }
    const list = await this.getRevistas();
    const filtered = list.filter((r) => r.id !== prepared.id);
    const updated = [...filtered, prepared];
    localStorage.setItem("umesc_revistas", JSON.stringify(updated));
    return prepared;
  },

  async deleteRevista(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("revistas").delete().eq("id", id);
        if (!error) {
          const list = await this.getRevistas();
          const filtered = list.filter((r) => r.id !== id);
          localStorage.setItem("umesc_revistas", JSON.stringify(filtered));
          return true;
        }
      } catch (err) {
        console.warn("Falha ao deletar no Supabase para Revistas.", err);
      }
    }
    const list = await this.getRevistas();
    const filtered = list.filter((r) => r.id !== id);
    localStorage.setItem("umesc_revistas", JSON.stringify(filtered));
    return true;
  }
};

/**
 * Generic Settings / Governance Key-Value Service in Supabase with Real-Time & LocalStorage fallback
 */
export const settingsService = {
  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("value")
          .eq("key", key)
          .maybeSingle();

        if (!error && data && data.value) {
          try {
            const parsed = JSON.parse(data.value);
            localStorage.setItem(key, data.value);
            return parsed;
          } catch {
            return defaultValue;
          }
        }
      } catch (err) {
        console.warn(`Falha de conexão no Supabase para setting '${key}'. Usando local.`, err);
      }
    }
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    try {
      return JSON.parse(saved);
    } catch {
      return defaultValue;
    }
  },

  async saveSetting<T>(key: string, value: T): Promise<boolean> {
    const jsonStr = JSON.stringify(value);
    localStorage.setItem(key, jsonStr);

    // Notify current tab and other tabs via BroadcastChannel
    window.dispatchEvent(new CustomEvent("umesc_content_updated"));
    try {
      const bc = new BroadcastChannel("umesc_realtime_sync");
      bc.postMessage({ key, action: "update" });
      bc.close();
    } catch {
      // BroadcastChannel optional fallback
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("settings")
          .upsert([{ key, value: jsonStr, updated_at: new Date().toISOString() }], { onConflict: "key" });
        if (!error) return true;
      } catch (err) {
        console.warn(`Falha ao salvar setting '${key}' no Supabase.`, err);
      }
    }
    return false;
  }
};

/**
 * Service to manage Carousel Convites in Supabase
 */
export const carouselConvitesService = {
  async getConvites(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("carousel_convites")
          .select("*")
          .order("created_at", { ascending: true });

        if (!error && data) {
          const list = data.map((item: any) => ({
            id: item.id,
            image: item.image,
            tag: item.tag,
            title: item.title,
            description: item.description,
            date: item.date
          }));
          localStorage.setItem("umesc_carousel_convites", JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para Carousel Convites. Usando fallback.", err);
      }
    }
    return settingsService.getSetting<any[]>("umesc_carousel_convites", []);
  },

  async saveConvite(item: any): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          id: String(item.id || `conv_${Date.now()}`),
          image: item.image || "",
          tag: item.tag || "",
          title: item.title || "",
          description: item.description || "",
          date: item.date || ""
        };
        const { error } = await supabase
          .from("carousel_convites")
          .upsert([dbRecord], { onConflict: "id" });
        if (!error) {
          await settingsService.saveSetting("umesc_carousel_convites", await this.getConvites());
          return true;
        }
      } catch (err) {
        console.warn("Falha ao salvar no Supabase para Carousel Convites.", err);
      }
    }
    return false;
  },

  async saveAllConvites(list: any[]): Promise<boolean> {
    await settingsService.saveSetting("umesc_carousel_convites", list);
    if (isSupabaseConfigured && supabase) {
      try {
        if (list.length > 0) {
          const dbRecords = list.map((item) => ({
            id: String(item.id),
            image: item.image || "",
            tag: item.tag || "",
            title: item.title || "",
            description: item.description || "",
            date: item.date || ""
          }));
          await supabase.from("carousel_convites").upsert(dbRecords, { onConflict: "id" });
        }
      } catch (err) {
        console.warn("Falha ao sincronizar lista de Convites no Supabase.", err);
      }
    }
    return true;
  },

  async deleteConvite(id: any): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("carousel_convites").delete().eq("id", String(id));
      } catch (err) {
        console.warn("Falha ao deletar no Supabase para Carousel Convites.", err);
      }
    }
    return true;
  }
};

/**
 * Service to manage Carousel Eventos in Supabase
 */
export const carouselEventosService = {
  async getEventos(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("carousel_eventos")
          .select("*")
          .order("created_at", { ascending: true });

        if (!error && data) {
          const list = data.map((item: any) => ({
            id: item.id,
            image: item.image,
            tag: item.tag,
            title: item.title,
            description: item.description,
            place: item.place
          }));
          localStorage.setItem("umesc_carousel_eventos", JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn("Falha de conexão com o Supabase para Carousel Eventos. Usando fallback.", err);
      }
    }
    return settingsService.getSetting<any[]>("umesc_carousel_eventos", []);
  },

  async saveEvento(item: any): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          id: String(item.id || `eve_${Date.now()}`),
          image: item.image || "",
          tag: item.tag || "",
          title: item.title || "",
          description: item.description || "",
          place: item.place || ""
        };
        const { error } = await supabase
          .from("carousel_eventos")
          .upsert([dbRecord], { onConflict: "id" });
        if (!error) {
          await settingsService.saveSetting("umesc_carousel_eventos", await this.getEventos());
          return true;
        }
      } catch (err) {
        console.warn("Falha ao salvar no Supabase para Carousel Eventos.", err);
      }
    }
    return false;
  },

  async saveAllEventos(list: any[]): Promise<boolean> {
    await settingsService.saveSetting("umesc_carousel_eventos", list);
    if (isSupabaseConfigured && supabase) {
      try {
        if (list.length > 0) {
          const dbRecords = list.map((item) => ({
            id: String(item.id),
            image: item.image || "",
            tag: item.tag || "",
            title: item.title || "",
            description: item.description || "",
            place: item.place || ""
          }));
          await supabase.from("carousel_eventos").upsert(dbRecords, { onConflict: "id" });
        }
      } catch (err) {
        console.warn("Falha ao sincronizar lista de Eventos no Supabase.", err);
      }
    }
    return true;
  },

  async deleteEvento(id: any): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("carousel_eventos").delete().eq("id", String(id));
      } catch (err) {
        console.warn("Falha ao deletar no Supabase para Carousel Eventos.", err);
      }
    }
    return true;
  }
};

// Setup BroadcastChannel listener for instant cross-tab real-time updates
if (typeof window !== "undefined") {
  try {
    const bc = new BroadcastChannel("umesc_realtime_sync");
    bc.onmessage = () => {
      window.dispatchEvent(new CustomEvent("umesc_content_updated"));
    };
  } catch {
    // BroadcastChannel unsupported fallback
  }
}

// Real-time subscriptions to sync all major entities in real-time across users
if (isSupabaseConfigured && supabase) {
  const tablesToSync = [
    "coordinators",
    "projects",
    "announcements",
    "documents",
    "revistas",
    "settings",
    "fichas_filiacao",
    "apoio_feminino",
    "prayer_requests",
    "members",
    "capelania_volunteers",
    "secretaria_members",
    "carousel_convites",
    "carousel_eventos"
  ];

  tablesToSync.forEach((tableName) => {
    supabase
      .channel(`${tableName}-realtime-sync`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => {
          // Emit internal app update event to trigger live refresh
          window.dispatchEvent(new CustomEvent("umesc_content_updated"));
        }
      )
      .subscribe();
  });
}



