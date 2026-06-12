import { supabase, isSupabaseConfigured } from "./supabase.ts";
import { Donation } from "../types";

export const donationsService = {
  async getDonations(): Promise<Donation[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("donations")
          .select("*")
          .order("registration_date", { ascending: false });

        if (error) {
          console.warn("Aviso (Contingência Ativa): Tabela 'donations' não foi encontrada ou não pôde ser lida no Supabase, usando localStorage. Detalhes:", error.message);
          throw error;
        }

        if (data) {
          return data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id || "avulsa",
            projectName: d.project_name || "Doação Avulsa",
            donorName: d.donor_name || "Anônimo",
            donorWhatsapp: d.donor_whatsapp || "Não Informado",
            amount: Number(d.amount),
            paymentStatus: (d.payment_status || "pendente") as any,
            paymentProofUrl: d.payment_proof_url || "",
            paymentProofName: d.payment_proof_name || "",
            registrationDate: d.registration_date || new Date().toISOString(),
          }));
        }
      } catch (err) {
        // Silently fall back to localStorage
      }
    }

    // Fallback: localStorage
    const saved = localStorage.getItem("umesc_donations");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  },

  async createDonation(donation: Omit<Donation, "registrationDate">): Promise<Donation> {
    const newDonation: Donation = {
      ...donation,
      registrationDate: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const dbRecord = {
          id: newDonation.id,
          project_id: newDonation.projectId,
          project_name: newDonation.projectName,
          donor_name: newDonation.donorName,
          donor_whatsapp: newDonation.donorWhatsapp,
          amount: newDonation.amount,
          payment_status: newDonation.paymentStatus,
          payment_proof_url: newDonation.paymentProofUrl || "",
          payment_proof_name: newDonation.paymentProofName || "",
          registration_date: newDonation.registrationDate,
        };

        const { error } = await supabase.from("donations").insert([dbRecord]);

        if (error) {
          console.warn("Aviso de criação (Contingência Ativa): Tabela 'donations' indisponível no Supabase, gravando localmente. Detalhes:", error.message);
          throw error;
        }
        return newDonation;
      } catch (err) {
        // Fallback recorded locally in outer step
      }
    }

    // Fallback Code
    const saved = await this.getDonations();
    const updated = [newDonation, ...saved];
    localStorage.setItem("umesc_donations", JSON.stringify(updated));
    return newDonation;
  },

  async updateDonationStatus(id: string, status: Donation["paymentStatus"]): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("donations")
          .update({ payment_status: status })
          .eq("id", id);

        if (error) {
          console.warn("Aviso de atualização (Contingência Ativa): Tabela 'donations' indisponível no Supabase, gravando localmente. Detalhes:", error.message);
          throw error;
        }
        return true;
      } catch (err) {
        // Fallback handled below
      }
    }

    // Fallback Code
    const saved = await this.getDonations();
    const updated = saved.map((d) => (d.id === id ? { ...d, paymentStatus: status } : d));
    localStorage.setItem("umesc_donations", JSON.stringify(updated));
    return true;
  },

  async deleteDonation(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("donations").delete().eq("id", id);
        if (error) {
          console.warn("Aviso de exclusão (Contingência Ativa): Tabela 'donations' indisponível no Supabase, removendo localmente. Detalhes:", error.message);
          throw error;
        }
        return true;
      } catch (err) {
        // Fallback handled below
      }
    }

    const saved = await this.getDonations();
    const updated = saved.filter((d) => d.id !== id);
    localStorage.setItem("umesc_donations", JSON.stringify(updated));
    return true;
  }
};
