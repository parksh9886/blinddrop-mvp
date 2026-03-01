import React, { createContext, useContext, useState, useEffect } from 'react';
import ko from '../locales/ko.json';
import en from '../locales/en.json';

type Language = 'ko' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string, vars?: Record<string, string | number>) => string;
}

const resources: Record<Language, any> = { ko, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Detect language on mount
        const storedLang = localStorage.getItem('language') as Language;
        if (storedLang && (storedLang === 'ko' || storedLang === 'en')) {
            setLanguageState(storedLang);
        } else {
            const browserLang = navigator.language.startsWith('ko') ? 'ko' : 'en';
            setLanguageState(browserLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (path: string, vars?: Record<string, string | number>): string => {
        const parts = path.split('.');
        let cur: any = resources[language] || resources['en'];
        for (const p of parts) {
            cur = cur?.[p];
            if (cur === undefined) return path;
        }
        let str = String(cur);
        if (vars) {
            for (const k of Object.keys(vars)) {
                str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
            }
        }
        return str;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
