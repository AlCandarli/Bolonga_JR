"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, TranslationKeys } from "@/lib/translations";

interface LanguageContextProps {
    language: Language;
    dir: "ltr" | "rtl";
    t: (key: TranslationKeys) => string;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>("en");

    useEffect(() => {
        // Init on load
        const storedLang = localStorage.getItem("app_lang") as Language;
        if (storedLang === "en" || storedLang === "ar") {
            setLanguage(storedLang);
            document.documentElement.dir = storedLang === "ar" ? "rtl" : "ltr";
            document.documentElement.lang = storedLang;
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === "en" ? "ar" : "en";
        setLanguage(newLang);
        localStorage.setItem("app_lang", newLang);
        document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = newLang;
    };

    const t = (key: TranslationKeys): string => {
        return translations[language][key] || key;
    };

    const dir = language === "ar" ? "rtl" : "ltr";

    return (
        <LanguageContext.Provider value={{ language, dir, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
