import { apiRequest, tokenStorage } from './api';

export interface CookieConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

class CookieService {
  private consentKey = 'lms_cookie_preferences';

  setConsent(prefs: CookieConsentPreferences | boolean) {
    const value = typeof prefs === 'boolean' 
      ? { necessary: true, analytics: prefs, marketing: prefs }
      : { ...prefs, therapeutic: true }; // and other specific rules
    
    // Ensure necessary is always true
    value.necessary = true;
    
    localStorage.setItem(this.consentKey, JSON.stringify(value));
    
    if (value.analytics || value.marketing) {
      this.logActivity('cookie_consent_updated', undefined, value);
    }
  }

  getPreferences(): CookieConsentPreferences {
    const stored = localStorage.getItem(this.consentKey);
    if (!stored) return { necessary: true, analytics: false, marketing: false };
    try {
      return JSON.parse(stored);
    } catch {
      return { necessary: true, analytics: false, marketing: false };
    }
  }

  isUndecided(): boolean {
    return localStorage.getItem(this.consentKey) === null;
  }

  async logActivity(action: string, page?: string, metadata?: any) {
    // Only log if analytics consent is granted, OR it's a necessary system log
    const prefs = this.getPreferences();
    if (!prefs.analytics && action !== 'cookie_consent_updated' && action !== 'page_view') {
      return;
    }

    try {
      await apiRequest('tracking/log', {
        method: 'POST',
        body: JSON.stringify({
          action,
          page: page || window.location.pathname,
          referrer: document.referrer,
          deviceType: this.getDeviceType(),
          metadata: {
            ...metadata,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
          }
        }),
        auth: !!tokenStorage.get()
      });
    } catch (error) {
      // Silent fail for tracking
      console.warn('Tracking failed');
    }
  }

  private getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }
}

export const cookieService = new CookieService();
