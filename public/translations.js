// Step 1: Create a translations.js file that will load the appropriate language file

// translations.js
class TranslationManager {
    constructor() {
      this.currentLanguage = 'en';
      this.translations = {};
      this.defaultLanguage = 'en';
    }
  
    async init(language = null) {
      // Set language based on parameter, localStorage, or browser preference
      this.currentLanguage = language || 
                            localStorage.getItem('preferredLanguage') || 
                            navigator.language.split('-')[0] || 
                            this.defaultLanguage;
      
      // Ensure we have a fallback if the requested language isn't available
      try {
        await this.loadLanguage(this.currentLanguage);
      } catch (error) {
        console.warn(`Failed to load language ${this.currentLanguage}, falling back to ${this.defaultLanguage}`);
        this.currentLanguage = this.defaultLanguage;
        await this.loadLanguage(this.defaultLanguage);
      }
      
      // Apply translations to the page
      this.translatePage();
      
      // Update language selector if it exists
      const languageSelector = document.getElementById('language-selector');
      if (languageSelector) {
        languageSelector.value = this.currentLanguage;
      }
    }
  
    async loadLanguage(langCode) {
      try {
        console.log(`Loading translations for ${langCode}...`);
        const response = await fetch(`/translations/${langCode}.json`);
        if (!response.ok) {
          throw new Error(`Language file not found: ${langCode}`);
        }
        this.translations = await response.json();
        console.log('Translations loaded:', this.translations);
        console.log('Railway translations available:', !!this.translations.railway);
        localStorage.setItem('preferredLanguage', langCode);
        return true;
      } catch (error) {
        console.error('Error loading language file:', error);
        throw error;
      }
    }
  
    async changeLanguage(langCode) {
      await this.loadLanguage(langCode);
      this.translatePage();
    }
  
    translatePage() {
      // Translate all elements with data-i18n attribute
      document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (this.translations[key]) {
          element.innerHTML = this.translations[key];
        }
      });
  
      // Translate attributes (like placeholder, title, etc.)
      document.querySelectorAll('[data-i18n-attr]').forEach(element => {
        const data = element.getAttribute('data-i18n-attr').split(',');
        data.forEach(item => {
          const [attr, key] = item.split(':');
          if (attr && key && this.translations[key]) {
            element.setAttribute(attr, this.translations[key]);
          }
        });
      });
    }
  
    // Helper to get a translation by key
    t(key) {
      return this.translations[key] || key;
    }
  
    getNestedTranslation(key) {
        // Split the key by dots and traverse the nested object
        const parts = key.split('.');
        let result = this.translations;
        
        for (const part of parts) {
            if (result && typeof result === 'object' && part in result) {
                result = result[part];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return null;  // Key not found
            }
        }
        
        return result;
    }
  }
  
  // Create a global instance
  const i18n = new TranslationManager();
  
  // Initialize when the DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
    
    // Set up language selector change event if it exists
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
      languageSelector.addEventListener('change', (e) => {
        i18n.changeLanguage(e.target.value);
      });
    }
  });