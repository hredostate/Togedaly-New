
import { useEffect, useState } from 'react';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [shouldShowBanner, setShouldShowBanner] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Check if user previously dismissed the prompt
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        setShouldShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShouldShowBanner(false);
    } else {
      // User dismissed the native prompt, treat as dismissed for now
      localStorage.setItem('pwa_install_dismissed', 'true');
      setShouldShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem('pwa_install_dismissed', 'true');
    setShouldShowBanner(false);
  };

  return { isInstalled, shouldShowBanner, triggerInstall, dismiss };
}
