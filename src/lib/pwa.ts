/**
 * PWA Service Worker Registration & Installation Prompt Handler
 * UMESC - União de Militares Evangélicos de Santa Catarina
 */

export interface PWAInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: PWAInstallPromptEvent | null = null;

/**
 * Register the Service Worker in supporting browser environments
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // In development mode or preview domains, unregister existing service workers and clear cache storage
    // to prevent caching Vite module chunks which causes duplicate React instances and invalid hook calls.
    if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('ais-dev')) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado com sucesso no escopo:', reg.scope);

          // Handle automatic updates when a new version is available
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[PWA] Nova versão da UMESC disponível. O cache foi atualizado.');
                  } else {
                    console.log('[PWA] Conteúdo em cache para navegação offline.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('[PWA] Falha no registro do Service Worker:', error);
        });
    });

    // Capture the beforeinstallprompt event for custom install banner/button
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e as PWAInstallPromptEvent;
      window.dispatchEvent(new CustomEvent('umesc_pwa_install_ready'));
    });

    // Handle when app is successfully installed
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      console.log('[PWA] Aplicativo UMESC instalado com sucesso no dispositivo!');
      window.dispatchEvent(new CustomEvent('umesc_pwa_installed'));
    });
  }
}

/**
 * Trigger the native PWA installation prompt
 */
export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return choiceResult.outcome === 'accepted';
  } catch (err) {
    console.error('[PWA] Erro ao disparar prompt de instalação:', err);
    return false;
  }
}

/**
 * Check if the PWA is currently installable
 */
export function isPWAInstallAvailable(): boolean {
  return deferredPrompt !== null;
}

/**
 * Check if the application is currently running in standalone PWA mode
 */
export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}
