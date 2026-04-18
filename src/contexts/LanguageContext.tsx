"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, TranslationKeys } from "@/lib/translations";

interface LanguageContextProps {
    language: Language;
    dir: "ltr";
    t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>("en");

    useEffect(() => {
        // Force English/LTR on load
        document.documentElement.dir = "ltr";
        document.documentElement.lang = "en";
        setLanguage("en");
    }, []);

    const t = (key: TranslationKeys): string => {
        return translations["en"][key] || key;
    };

    const dir = "ltr";

    return (
        <LanguageContext.Provider value={{ language, dir, t }}>
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
