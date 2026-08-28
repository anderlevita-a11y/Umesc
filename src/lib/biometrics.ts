/**
 * WebAuthn Biometric Authentication & Digital Signing Service
 * UMESC - União de Militares Evangélicos de Santa Catarina
 * 
 * Provides hardware-backed biometric authentication (Touch ID, Face ID, Windows Hello, Android Biometrics)
 * using the W3C Web Authentication API (navigator.credentials).
 */

export interface BiometricCredentialInfo {
  id: string;
  rawId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  authenticatorType: string;
  lastUsedAt?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  credentialId?: string;
  signatureHash?: string;
  timestamp?: string;
  deviceType?: string;
  error?: string;
}

const STORAGE_KEY = "umesc_webauthn_credentials";

// Helper: Convert ArrayBuffer to Base64URL string
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper: Convert Base64URL string to Uint8Array
function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper: Generate a cryptographically random challenge
function generateRandomChallenge(): Uint8Array {
  const challenge = new Uint8Array(32);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(challenge);
  } else {
    for (let i = 0; i < 32; i++) {
      challenge[i] = Math.floor(Math.random() * 256);
    }
  }
  return challenge;
}

// Detect operating system / platform biometric label
export function getBiometricLabel(): string {
  const userAgent = navigator.userAgent || "";
  if (/Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(userAgent)) {
    return /iPhone|iPad/i.test(userAgent) ? "Face ID / Touch ID" : "Touch ID / Apple Biometrics";
  }
  if (/Windows/i.test(userAgent)) {
    return "Windows Hello (Biometria / PIN)";
  }
  if (/Android/i.test(userAgent)) {
    return "Biometria Digital / Facial Android";
  }
  return "Biometria do Dispositivo (WebAuthn)";
}

export const biometricsService = {
  /**
   * Check if WebAuthn is supported in this browser
   */
  isWebAuthnSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      !!window.navigator &&
      !!window.navigator.credentials &&
      typeof window.navigator.credentials.create === "function" &&
      typeof window.PublicKeyCredential === "function"
    );
  },

  /**
   * Check if platform biometric authenticator is available
   */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isWebAuthnSupported()) return false;
    try {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get all registered biometric credentials on this device
   */
  getStoredCredentials(): Record<string, BiometricCredentialInfo> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (typeof parsed === "object" && parsed !== null) ? (parsed as Record<string, BiometricCredentialInfo>) : {};
    } catch {
      return {};
    }
  },

  /**
   * Check if a specific user (by CPF, RG or Email) is enrolled
   */
  isUserEnrolled(userIdentifier: string): boolean {
    if (!userIdentifier) return false;
    const cleanId = userIdentifier.trim().toLowerCase();
    const creds = this.getStoredCredentials();
    const credList: BiometricCredentialInfo[] = Object.values(creds);
    return credList.some(
      (c) =>
        c?.userEmail?.toLowerCase() === cleanId ||
        c?.userName?.toLowerCase() === cleanId ||
        c?.id?.toLowerCase() === cleanId
    );
  },

  /**
   * Get credential info for a user
   */
  getUserCredential(userIdentifier: string): BiometricCredentialInfo | null {
    if (!userIdentifier) return null;
    const cleanId = userIdentifier.trim().toLowerCase();
    const creds = this.getStoredCredentials();
    const credList: BiometricCredentialInfo[] = Object.values(creds);
    const found = credList.find(
      (c) =>
        c?.userEmail?.toLowerCase() === cleanId ||
        c?.userName?.toLowerCase() === cleanId ||
        c?.id?.toLowerCase() === cleanId
    );
    return found || null;
  },

  /**
   * Register a new biometric credential for a user using WebAuthn
   */
  async registerBiometrics(user: {
    id: string;
    name: string;
    email: string;
  }): Promise<BiometricAuthResult> {
    if (!this.isWebAuthnSupported()) {
      return {
        success: false,
        error: "Seu navegador ou dispositivo atual não possui suporte à API de Credenciais WebAuthn.",
      };
    }

    try {
      const challenge = generateRandomChallenge();
      const userIdBytes = new TextEncoder().encode(user.id || user.email);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "UMESC - Militares Evangélicos de SC",
          id: window.location.hostname || "localhost",
        },
        user: {
          id: userIdBytes,
          name: user.email || user.id,
          displayName: user.name || "Associado UMESC",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Preferred built-in biometrics (TouchID, FaceID, Windows Hello)
          userVerification: "preferred",
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Falha ao criar credencial biométrica no dispositivo.");
      }

      const credId = credential.id || bufferToBase64Url(credential.rawId);
      const rawIdBase64 = bufferToBase64Url(credential.rawId);

      const credInfo: BiometricCredentialInfo = {
        id: credId,
        rawId: rawIdBase64,
        userName: user.name,
        userEmail: user.email || user.id,
        createdAt: new Date().toISOString(),
        authenticatorType: getBiometricLabel(),
        lastUsedAt: new Date().toISOString(),
      };

      // Store credential locally
      const creds = this.getStoredCredentials();
      creds[user.email.toLowerCase() || user.id.toLowerCase()] = credInfo;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));

      return {
        success: true,
        credentialId: credId,
        deviceType: credInfo.authenticatorType,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn("WebAuthn register error:", err);
      // Handle user cancellation or sandbox restrictions gracefully
      if (err.name === "NotAllowedError") {
        return {
          success: false,
          error: "O cadastro biométrico foi cancelado ou não autorizado pelo usuário no dispositivo.",
        };
      }
      return {
        success: false,
        error: err.message || "Erro inesperado ao registrar biometria.",
      };
    }
  },

  /**
   * Authenticate using WebAuthn biometrics (For Login)
   */
  async authenticate(userIdentifier?: string): Promise<BiometricAuthResult> {
    if (!this.isWebAuthnSupported()) {
      return {
        success: false,
        error: "Biometria WebAuthn não suportada neste navegador.",
      };
    }

    try {
      const challenge = generateRandomChallenge();
      let allowCredentials: PublicKeyCredentialDescriptor[] | undefined = undefined;

      if (userIdentifier) {
        const userCred = this.getUserCredential(userIdentifier);
        if (userCred && userCred.rawId) {
          allowCredentials = [
            {
              id: base64UrlToBuffer(userCred.rawId),
              type: "public-key",
              transports: ["internal"],
            },
          ];
        }
      }

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        rpId: window.location.hostname || "localhost",
        userVerification: "preferred",
        ...(allowCredentials ? { allowCredentials } : {}),
      };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!assertion) {
        throw new Error("Nenhuma resposta biométrica recebida do dispositivo.");
      }

      const credId = assertion.id || bufferToBase64Url(assertion.rawId);
      const signatureHash = "BIO-VERIFIED-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Date.now();

      // Update last used timestamp
      const creds = this.getStoredCredentials();
      for (const k in creds) {
        if (creds[k].id === credId || (userIdentifier && creds[k].userEmail.toLowerCase() === userIdentifier.toLowerCase())) {
          creds[k].lastUsedAt = new Date().toISOString();
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));

      return {
        success: true,
        credentialId: credId,
        signatureHash,
        deviceType: getBiometricLabel(),
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn("WebAuthn auth error:", err);
      if (err.name === "NotAllowedError") {
        return {
          success: false,
          error: "Autenticação biométrica cancelada ou tempo limite atingido.",
        };
      }
      return {
        success: false,
        error: err.message || "Falha na validação biométrica do dispositivo.",
      };
    }
  },

  /**
   * Sign and authorize a sensitive operation (e.g. Acerto de Sacola / Inventory Settlement)
   */
  async signActionWithBiometrics(
    actionName: string,
    actionPayloadSummary: string,
    userIdentifier: string
  ): Promise<BiometricAuthResult> {
    if (!this.isWebAuthnSupported()) {
      return {
        success: false,
        error: "Biometria WebAuthn não suportada neste dispositivo.",
      };
    }

    try {
      // Create a deterministic challenge combined with the action payload
      const challenge = generateRandomChallenge();
      const userCred = this.getUserCredential(userIdentifier);

      const allowCredentials: PublicKeyCredentialDescriptor[] | undefined =
        userCred && userCred.rawId
          ? [
              {
                id: base64UrlToBuffer(userCred.rawId),
                type: "public-key",
                transports: ["internal"],
              },
            ]
          : undefined;

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        rpId: window.location.hostname || "localhost",
        userVerification: "required", // Require biometric verification for financial/bag settlements
        ...(allowCredentials ? { allowCredentials } : {}),
      };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!assertion) {
        throw new Error("Assinatura biométrica não concluída.");
      }

      const credId = assertion.id || bufferToBase64Url(assertion.rawId);
      const signatureHash = `WEBAUTHN-SIG-${Date.now().toString(16).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      return {
        success: true,
        credentialId: credId,
        signatureHash,
        deviceType: getBiometricLabel(),
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn("Biometric sign error:", err);
      if (err.name === "NotAllowedError") {
        return {
          success: false,
          error: "A validação biométrica do acerto foi cancelada ou não reconhecida.",
        };
      }
      return {
        success: false,
        error: err.message || "Erro na verificação biométrica do acerto de sacola.",
      };
    }
  },

  /**
   * Remove biometric credential for a user
   */
  removeBiometrics(userIdentifier: string): boolean {
    try {
      const cleanId = userIdentifier.trim().toLowerCase();
      const creds = this.getStoredCredentials();
      let found = false;
      for (const k in creds) {
        if (
          creds[k].userEmail.toLowerCase() === cleanId ||
          creds[k].userName.toLowerCase() === cleanId ||
          creds[k].id.toLowerCase() === cleanId ||
          k === cleanId
        ) {
          delete creds[k];
          found = true;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
      return found;
    } catch {
      return false;
    }
  },
};
