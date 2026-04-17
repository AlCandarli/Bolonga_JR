"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, ChevronDown, BookOpen, TrendingUp, Award, Clock } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

// Types
type Grade = { id: string; examName: string; score: string; date: string; };
type SubjectData = { subjectId: string; subjectName: string; grades: Grade[]; };
type DashboardData = { studentName: string; studentCode: string; subjects: SubjectData[]; };

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    
    const { t, dir } = useLanguage();

    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setIsMounted(true);
        if (!code) {
            router.push("/");
            return;
        }

        const fetchDashboard = async () => {
            try {
                const res = await fetch(`/api/student/dashboard?code=${code}`);
                const result = await res.json();
                
                if (res.ok) {
                    setData(result);
                } else {
                    setError(result.error || t('access_denied'));
                }
            } catch (err) {
                console.error(err);
                setError(t('access_denied'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, [code, router, t]);

    // Data Processing & Calculations
    const processedStats = useMemo(() => {
        if (!data) return { gpa: "0.0", credits: 0, modules: 0, filteredSubjects: [] };

        let totalScore = 0;
        let count = 0;

        const enhancedSubjects = data.subjects.map((sub) => {
            const latestGrade = sub.grades.length > 0 ? sub.grades[0] : null;
            const scoreNum = latestGrade ? parseFloat(latestGrade.score) : NaN;
            
            if (!isNaN(scoreNum)) {
                totalScore += scoreNum;
                count++;
            }

            return { ...sub, latestGrade, scoreNum };
        });

        // Filtering - Only search query now
        const filteredSubjects = enhancedSubjects.filter(sub => {
            return sub.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   sub.subjectId.toLowerCase().includes(searchQuery.toLowerCase());
        });

        // Average score (Raw value, displayed out of 50 in UI)
        const avgScore = count > 0 ? (totalScore / count) : 0;
        
        return {
            gpa: avgScore.toFixed(1),
            credits: data.subjects.length * 3, // Mock 3 credits per subject
            modules: data.subjects.length,
            filteredSubjects
        };
    }, [data, searchQuery]);

    if (!isMounted) return null;

    if (error) {
        return (
            <main className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-slate-950 text-white" dir={dir}>
                <div className="relative z-10 w-full max-w-sm rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-red-500/20 shadow-[0_8px_40px_0_rgba(255,0,0,0.1)] p-10 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black mb-2 tracking-tight text-white">{t('access_denied')}</h2>
                    <p className="text-white/40 font-medium mb-8 text-sm">{error}</p>
                    <button onClick={() => router.push('/')} className="w-full h-14 bg-white/10 hover:bg-white text-white hover:text-black font-bold rounded-2xl transition-all duration-300">
                        {t('return_login')}
                    </button>
                    <div className="mt-4 flex justify-center"><LanguageToggle /></div>
                </div>
            </main>
        );
    }

    if (isLoading || !data) {
        return (
            <main className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-slate-950" dir={dir}>
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-primary opacity-10 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[10px]" />
                <div className="relative z-10 flex flex-col items-center gap-6 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20"></div>
                    <div className="h-6 w-48 bg-white/10 rounded-full"></div>
                    <div className="h-3 w-32 bg-white/5 rounded-full mt-2"></div>
                </div>
            </main>
        );
    }

    return (
        <main className={`relative min-h-screen w-full flex flex-col overflow-x-hidden bg-slate-950 text-slate-200 transition-opacity duration-1000 ease-out opacity-100`} dir={dir}>
            
            {/* Cinematic Layout Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-brand-primary opacity-10 blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute bottom-[0%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-indigo-900 opacity-[0.10] blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
            </div>

            {/* Header / Nav */}
            <nav className="relative z-10 w-full border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 relative rounded-full overflow-hidden shadow-2xl p-0.5 bg-gradient-to-b from-brand-primary/40 to-transparent border border-white/10">
                            <Image src="/logo.png" alt="Bologna JR" fill sizes="(max-width: 768px) 48px, 56px" className="object-cover rounded-full" priority />
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="text-[10px] sm:text-xs text-brand-primary font-bold tracking-widest uppercase mb-0.5">{t('welcome_back')}</p>
                            <h1 className="text-base sm:text-2xl font-black text-white tracking-tight drop-shadow-md truncate max-w-[200px] sm:max-w-none">{data.studentName}</h1>
                            <span className="text-[10px] text-white/40 font-medium tracking-widest uppercase mt-0.5">{t('id')}: {data.studentCode}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <LanguageToggle />
                        <button onClick={() => router.push('/')} className="px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-95 text-white/60 hover:text-white backdrop-blur-sm group">
                            <span className="flex items-center gap-2">
                                {t('logout')}
                                <svg className={`w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity ${dir === 'rtl' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Dashboard Body Container */}
            <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                
                {/* Top Section */}
                <div className="mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-6">{t('academic_overview')}</h2>
                    
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Overall GPA Card */}
                        <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5 p-6 flex items-center gap-5 shadow-lg group">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                                <TrendingUp className="w-7 h-7 text-brand-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-white/50 font-bold tracking-widest uppercase mb-1">{t('average_score')}</p>
                                <h3 className="text-3xl font-black text-white">{processedStats.gpa} <span className="text-lg text-white/30 font-medium">/ 50</span></h3>
                            </div>
                        </div>

                        {/* Enrolled Modules Card */}
                        <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5 p-6 flex items-center gap-5 shadow-lg group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                <BookOpen className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm text-white/50 font-bold tracking-widest uppercase mb-1">{t('enrolled_modules')}</p>
                                <h3 className="text-3xl font-black text-white">{processedStats.modules}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1 group">
                        <div className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2`}>
                            <Search className="w-5 h-5 text-white/40 group-focus-within:text-brand-primary transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            placeholder={t('search_placeholder')} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full h-14 bg-white/5 border border-white/10 rounded-xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-white placeholder:text-white/30 focus:outline-none focus:border-brand-primary/50 focus:bg-white/10 transition-all font-medium shadow-inner`}
                        />
                    </div>
                </div>

                {/* Subject Cards Grid */}
                {data.subjects.length === 0 ? (
                    <div className="w-full py-24 flex flex-col items-center justify-center border border-white/5 bg-white/[0.02] rounded-3xl backdrop-blur-md">
                        <Clock className="w-16 h-16 text-white/10 mb-5" />
                        <h3 className="text-2xl font-bold text-white/60 mb-2">{t('no_records_title')}</h3>
                        <p className="text-white/40 text-center max-w-sm">{t('no_records_desc')}</p>
                    </div>
                ) : processedStats.filteredSubjects.length === 0 ? (
                    <div className="w-full py-20 flex flex-col items-center justify-center border border-white/5 bg-white/[0.02] rounded-3xl backdrop-blur-md">
                        <Search className="w-12 h-12 text-white/10 mb-4" />
                        <h3 className="text-xl font-bold text-white/60 mb-1">{t('no_matches_title')}</h3>
                        <p className="text-sm text-white/40 text-center">{t('no_matches_desc')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                        {processedStats.filteredSubjects.map((sub, idx) => {
                            const isPassing = !isNaN(sub.scoreNum) && sub.scoreNum >= 50;
                            const isFailing = !isNaN(sub.scoreNum) && sub.scoreNum < 50;
                            const isNoGrade = isNaN(sub.scoreNum);

                            const progressWidth = isNoGrade ? "0%" : `${Math.min(100, Math.max(0, sub.scoreNum))}%`;
                            
                            return (
                                <div 
                                    key={sub.subjectId}
                                    onClick={() => router.push('/student/subject/' + sub.subjectId + '?code=' + code)}
                                    className="group flex flex-col h-full rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-brand-primary/40 shadow-lg hover:shadow-[0_8px_30px_rgba(0,229,255,0.15)] p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden relative animate-in fade-in slide-in-from-bottom-8"
                                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-primary/10 transition-transform duration-300">
                                            <BookOpen className="w-6 h-6 text-white/50 group-hover:text-brand-primary transition-colors" />
                                        </div>
                                        {/* Status Badge */}
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isPassing ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isFailing ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                                            {isPassing ? t('pass') : isFailing ? t('fail') : t('no_grade')}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-brand-primary transition-colors line-clamp-1">
                                        {sub.subjectName}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-8 text-sm font-semibold text-white/40 uppercase tracking-widest">
                                        <span>{sub.subjectId}</span>
                                    </div>

                                    {/* Footer Details & Progress */}
                                    <div className="mt-auto">
                                        {sub.latestGrade ? (
                                            <div className="flex justify-between items-end mb-2">
                                                <div>
                                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">{t('latest_entry')}</p>
                                                    <p className="text-sm font-semibold text-white/90 line-clamp-1">{sub.latestGrade.examName}</p>
                                                </div>
                                                <div className={`text-${dir === 'rtl' ? 'left' : 'right'}`}>
                                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">{t('score')}</p>
                                                    <p className={`text-xl font-black ${isPassing ? 'text-emerald-400' : 'text-rose-400'}`}>{sub.latestGrade.score}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-4">
                                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">{t('status')}</p>
                                                <p className="text-sm font-semibold text-yellow-500/80">{t('pending_assessment')}</p>
                                            </div>
                                        )}

                                        {/* Progress Bar UI */}
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${isPassing ? 'bg-emerald-500' : isFailing ? 'bg-rose-500' : 'bg-transparent'}`}
                                                style={{ width: progressWidth }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-select {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                }
            `}</style>
        </main>
    );
}

export default function StudentDashboard() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-brand-primary rounded-full animate-spin"></div>
            </main>
        }>
            <DashboardContent />
        </Suspense>
    );
}
