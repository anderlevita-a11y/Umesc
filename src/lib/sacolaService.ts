/**
 * Service for managing Acerto de Sacola (Bag Reconciliation / Inventory & Sales Settlement)
 * UMESC - União de Militares Evangélicos de Santa Catarina
 */

import { AcertoSacola, ItemSacola } from "../types";
import { settingsService } from "./supabase";
import { biometricsService } from "./biometrics";

const SACOLAS_SETTINGS_KEY = "umesc_acertos_sacola_list";

export const DEFAULT_ITENS_SACOLA_TEMPLATE: Omit<ItemSacola, "id">[] = [
  {
    descricao: "Revista UMESC Edição Especial (Fé & Farda)",
    precoUnitario: 15.00,
    qtdRecebida: 20,
    qtdDistribuida: 15,
    qtdDevolvida: 5,
    valorTotalItem: 225.00,
  },
  {
    descricao: "Bíblia Militar Camuflada com Brasão UMESC",
    precoUnitario: 45.00,
    qtdRecebida: 10,
    qtdDistribuida: 8,
    qtdDevolvida: 2,
    valorTotalItem: 360.00,
  },
  {
    descricao: "Devocional 'Pão Diário Segurança Pública'",
    precoUnitario: 20.00,
    qtdRecebida: 15,
    qtdDistribuida: 12,
    qtdDevolvida: 3,
    valorTotalItem: 240.00,
  },
  {
    descricao: "Distintivo / Pin Esmaltado de Lapela UMESC",
    precoUnitario: 25.00,
    qtdRecebida: 10,
    qtdDistribuida: 6,
    qtdDevolvida: 4,
    valorTotalItem: 150.00,
  },
  {
    descricao: "Camiseta Institucional 'Militares de Cristo'",
    precoUnitario: 50.00,
    qtdRecebida: 8,
    qtdDistribuida: 5,
    qtdDevolvida: 3,
    valorTotalItem: 250.00,
  }
];

export const INITIAL_ACERTOS_SACOLA: AcertoSacola[] = [
  {
    id: "sac-2026-001",
    numeroSacola: "SAC-2026-088",
    responsavelNome: "1º Ten PM Everton Costa",
    responsavelCpf: "999.888.777-66",
    responsavelRgMilitar: "923412-0",
    regional: "1º BPM / Grande Florianópolis",
    dataRetirada: "2026-08-01",
    dataAcerto: "2026-08-15",
    status: "homologado",
    itens: [
      {
        id: "item-1",
        descricao: "Revista UMESC Edição Especial (Fé & Farda)",
        precoUnitario: 15.00,
        qtdRecebida: 20,
        qtdDistribuida: 18,
        qtdDevolvida: 2,
        valorTotalItem: 270.00,
      },
      {
        id: "item-2",
        descricao: "Bíblia Militar Camuflada com Brasão UMESC",
        precoUnitario: 45.00,
        qtdRecebida: 10,
        qtdDistribuida: 10,
        qtdDevolvida: 0,
        valorTotalItem: 450.00,
      },
      {
        id: "item-3",
        descricao: "Distintivo / Pin Esmaltado de Lapela UMESC",
        precoUnitario: 25.00,
        qtdRecebida: 10,
        qtdDistribuida: 7,
        qtdDevolvida: 3,
        valorTotalItem: 175.00,
      }
    ],
    valorTotalArrecadado: 895.00,
    valorPix: 600.00,
    valorDinheiro: 295.00,
    valorCartao: 0.00,
    observacoes: "Acerto de sacola realizado referente ao encontro de oficiais no 1º BPM. Recursos depositados na conta da UMESC.",
    biometricAuthenticated: true,
    biometricTimestamp: "2026-08-15T14:32:10Z",
    biometricCredentialId: "BIO-CRED-8891-FLN",
    biometricSignatureHash: "WEBAUTHN-SIG-9F8A7B6C-VERIFIED-HARDWARE",
    biometricDeviceType: "Touch ID / Apple Biometrics",
    createdAt: "2026-08-15T14:30:00Z",
  },
  {
    id: "sac-2026-002",
    numeroSacola: "SAC-2026-092",
    responsavelNome: "Sgt BM Marcos Andrade",
    responsavelCpf: "111.222.333-44",
    responsavelRgMilitar: "945120-1",
    regional: "3º BBM / Blumenau & Vale do Itajaí",
    dataRetirada: "2026-08-05",
    dataAcerto: "2026-08-20",
    status: "pendente",
    itens: [
      {
        id: "item-4",
        descricao: "Devocional 'Pão Diário Segurança Pública'",
        precoUnitario: 20.00,
        qtdRecebida: 25,
        qtdDistribuida: 20,
        qtdDevolvida: 5,
        valorTotalItem: 400.00,
      },
      {
        id: "item-5",
        descricao: "Camiseta Institucional 'Militares de Cristo'",
        precoUnitario: 50.00,
        qtdRecebida: 10,
        qtdDistribuida: 8,
        qtdDevolvida: 2,
        valorTotalItem: 400.00,
      }
    ],
    valorTotalArrecadado: 800.00,
    valorPix: 800.00,
    valorDinheiro: 0.00,
    valorCartao: 0.00,
    observacoes: "Distribuição realizada durante o culto no quartel do 3º BBM.",
    biometricAuthenticated: true,
    biometricTimestamp: "2026-08-20T11:15:00Z",
    biometricCredentialId: "BIO-CRED-4421-BLU",
    biometricSignatureHash: "WEBAUTHN-SIG-2C4E6A8B-WINDOWS-HELLO",
    biometricDeviceType: "Windows Hello (Biometria / PIN)",
    createdAt: "2026-08-20T11:10:00Z",
  }
];

export const sacolaService = {
  async getAcertos(): Promise<AcertoSacola[]> {
    try {
      const data = await settingsService.getSetting<AcertoSacola[]>(
        SACOLAS_SETTINGS_KEY,
        INITIAL_ACERTOS_SACOLA
      );
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return INITIAL_ACERTOS_SACOLA;
    } catch {
      return INITIAL_ACERTOS_SACOLA;
    }
  },

  async saveAcerto(acerto: AcertoSacola): Promise<boolean> {
    try {
      const currentList = await this.getAcertos();
      const index = currentList.findIndex((item) => item.id === acerto.id);
      
      let updatedList: AcertoSacola[];
      if (index >= 0) {
        updatedList = [...currentList];
        updatedList[index] = acerto;
      } else {
        updatedList = [acerto, ...currentList];
      }

      await settingsService.saveSetting(SACOLAS_SETTINGS_KEY, updatedList);
      window.dispatchEvent(new CustomEvent("umesc_content_updated"));
      return true;
    } catch (err) {
      console.error("Error saving acerto de sacola:", err);
      return false;
    }
  },

  async deleteAcerto(id: string): Promise<boolean> {
    try {
      const currentList = await this.getAcertos();
      const updatedList = currentList.filter((item) => item.id !== id);
      await settingsService.saveSetting(SACOLAS_SETTINGS_KEY, updatedList);
      window.dispatchEvent(new CustomEvent("umesc_content_updated"));
      return true;
    } catch (err) {
      console.error("Error deleting acerto de sacola:", err);
      return false;
    }
  },

  async homologarAcerto(id: string): Promise<boolean> {
    try {
      const currentList = await this.getAcertos();
      const target = currentList.find((item) => item.id === id);
      if (!target) return false;

      target.status = "homologado";
      return await this.saveAcerto(target);
    } catch (err) {
      console.error("Error homologating acerto de sacola:", err);
      return false;
    }
  },

  /**
   * Finalize and sign a Bag Settlement with biometric WebAuthn security
   */
  async signAndSubmitAcerto(
    acerto: AcertoSacola,
    user: { id: string; name: string; email: string },
    useBiometrics: boolean = true
  ): Promise<{ success: boolean; acerto?: AcertoSacola; error?: string }> {
    try {
      let bioResult: any = { success: true };

      if (useBiometrics && biometricsService.isWebAuthnSupported()) {
        const payloadSummary = `Acerto Sacola ${acerto.numeroSacola} - Total: R$ ${acerto.valorTotalArrecadado.toFixed(2)}`;
        bioResult = await biometricsService.signActionWithBiometrics(
          "Acerto de Sacola UMESC",
          payloadSummary,
          user.email || user.id
        );

        if (!bioResult.success) {
          return {
            success: false,
            error: bioResult.error || "A validação biométrica do acerto não pôde ser concluída.",
          };
        }
      }

      const finalAcerto: AcertoSacola = {
        ...acerto,
        biometricAuthenticated: bioResult.success && !!bioResult.signatureHash,
        biometricTimestamp: bioResult.timestamp || new Date().toISOString(),
        biometricCredentialId: bioResult.credentialId || `MANUAL-${Date.now()}`,
        biometricSignatureHash: bioResult.signatureHash || `SIG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        biometricDeviceType: bioResult.deviceType || (useBiometrics ? "Biometria WebAuthn" : "Assinatura Eletrônica Padrão"),
        createdAt: acerto.createdAt || new Date().toISOString(),
      };

      const saved = await this.saveAcerto(finalAcerto);
      if (!saved) {
        return { success: false, error: "Falha ao persistir os dados no banco de dados." };
      }

      return { success: true, acerto: finalAcerto };
    } catch (err: any) {
      return { success: false, error: err.message || "Erro ao processar acerto de sacola." };
    }
  }
};
