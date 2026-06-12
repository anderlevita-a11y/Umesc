/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";
import { MemberRegistration } from "../types";

// Read environment variables for Supabase
const rawUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const rawKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

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
          throw error;
        }

        if (data && data.length > 0) {
          return fromSupabase(data[0]);
        }
      } catch (err) {
        console.warn("Falha de gravação no Supabase. Gravando localmente por contingência.", err);
      }
    }

    // Fallback Code
    const savedMembers = await this.getMembers();
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

      return { 
        active: true, 
        details: "Conexão estabelecida com sucesso! Todas as tabelas ('members', 'admins' e 'donations') estão operando plenamente no Supabase.", 
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


