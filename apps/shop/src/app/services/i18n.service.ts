import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type SupportedLocale = 'en' | 'hi' | 'mr';

export interface Locale {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly STORAGE_KEY = 'chalak_locale';
  private readonly DEFAULT_LOCALE: SupportedLocale = 'en';
  
  private currentLocaleSubject = new BehaviorSubject<SupportedLocale>(this.DEFAULT_LOCALE);
  public currentLocale$: Observable<SupportedLocale> = this.currentLocaleSubject.asObservable();
  
  private translations: { [key in SupportedLocale]: any } = {
    en: {},
    hi: {},
    mr: {}
  };
  
  private initialized = false;
  
  public readonly supportedLocales: Locale[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧'
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      flag: '🇮🇳'
    },
    {
      code: 'mr',
      name: 'Marathi',
      nativeName: 'मराठी',
      flag: '🇮🇳'
    }
  ];
  
  constructor() {
    this.initializeLocale();
  }
  
  private async initializeLocale(): Promise<void> {
    // Get stored locale or detect from browser
    const storedLocale = this.getStoredLocale();
    const browserLocale = this.detectBrowserLocale();
    const initialLocale = storedLocale || browserLocale || this.DEFAULT_LOCALE;
    
    try {
      await this.loadTranslations(initialLocale);
      this.setLocale(initialLocale);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize locale:', error);
      // Fallback to English if initial locale fails
      if (initialLocale !== 'en') {
        await this.loadTranslations('en');
        this.setLocale('en');
        this.initialized = true;
      }
    }
  }
  
  private getStoredLocale(): SupportedLocale | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? (stored as SupportedLocale) : null;
    } catch {
      return null;
    }
  }
  
  private detectBrowserLocale(): SupportedLocale | null {
    const browserLang = navigator.language.toLowerCase();
    
    if (browserLang.startsWith('hi')) return 'hi';
    if (browserLang.startsWith('mr')) return 'mr';
    if (browserLang.startsWith('en')) return 'en';
    
    return null;
  }
  
  private async loadTranslations(locale: SupportedLocale): Promise<void> {
    try {
      const response = await fetch(`/assets/i18n/${locale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${locale}`);
      }
      this.translations[locale] = await response.json();
    } catch (error) {
      console.error(`Error loading translations for ${locale}:`, error);
      // Fallback to English if available
      if (locale !== 'en') {
        await this.loadTranslations('en');
      }
    }
  }
  
  public async setLocale(locale: SupportedLocale): Promise<void> {
    if (!this.supportedLocales.find(l => l.code === locale)) {
      console.warn(`Unsupported locale: ${locale}`);
      return;
    }
    
    // Load translations if not already loaded
    if (!this.translations[locale] || Object.keys(this.translations[locale]).length === 0) {
      await this.loadTranslations(locale);
    }
    
    // Update current locale
    this.currentLocaleSubject.next(locale);
    
    // Store in localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, locale);
    } catch (error) {
      console.warn('Failed to store locale preference:', error);
    }
    
    // Update HTML lang attribute (only in browser)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      
      // Update RTL/LTR if needed (for future languages)
      document.documentElement.dir = this.getDirection(locale);
    }
  }
  
  private getDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
    // All current languages are LTR, but this can be extended for RTL languages
    return 'ltr';
  }
  
  public getCurrentLocale(): SupportedLocale {
    return this.currentLocaleSubject.value;
  }
  
  public translate(key: string, params?: { [key: string]: any }): string {
    // If not initialized yet, return the key
    if (!this.initialized) {
      return key;
    }
    
    const currentLocale = this.getCurrentLocale();
    const translation = this.getNestedTranslation(this.translations[currentLocale], key);
    
    if (!translation) {
      // Fallback to English if translation not found
      const fallback = this.getNestedTranslation(this.translations['en'], key);
      if (fallback) {
        return this.interpolate(fallback, params);
      }
      
      // Return key if no translation found
      console.warn(`Translation not found for key: ${key} in locale: ${currentLocale}`);
      return key;
    }
    
    return this.interpolate(translation, params);
  }
  
  private getNestedTranslation(obj: any, key: string): string {
    return key.split('.').reduce((o, k) => o && o[k] !== undefined ? o[k] : undefined, obj);
  }
  
  private interpolate(text: string, params?: { [key: string]: any }): string {
    if (!params) return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }
  
  public getLocaleInfo(locale: SupportedLocale): Locale | undefined {
    return this.supportedLocales.find(l => l.code === locale);
  }
  
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  public async refreshTranslations(): Promise<void> {
    const currentLocale = this.getCurrentLocale();
    await this.loadTranslations(currentLocale);
  }
}
