"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageToggle() {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 rounded-xl transition-all active:scale-95 text-brand-primary backdrop-blur-sm group"
        >
            <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="mt-0.5">{language === "en" ? "العربية" : "English"}</span>
        </button>
    );
}
