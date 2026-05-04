"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ChevronDown, BookOpen, TrendingUp, Award, Clock, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";


// Types
type Grade = { id: string; examName: string; score: number; maxScore: number; date: string; };
type SubjectData = { subjectId: string; subjectName: string; maxScore: number; grades: Grade[]; };
type DashboardData = { studentName: string; studentCode: string; subjects: SubjectData[]; };

function DashboardContent() {
    const router = useRouter();



    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setIsMounted(true);

        const fetchDashboard = async () => {
            try {
                const res = await fetch(`/api/student/dashboard`);
                const result = await res.json();

                if (res.ok) {
                    setData(result);
                } else {
                    setError(result.error || "Access Denied");
                }
            } catch (err) {
                console.error(err);
                setError("Access Denied");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, [router]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
        } catch (err) {
            console.error("Logout failed:", err);
            router.push('/');
        }
    };

    // Data Processing & Calculations
    const processedStats = useMemo(() => {
        if (!data) return { gpa: "0.0", credits: 0, modules: 0, filteredSubjects: [] };

        let totalScore = 0;
        let count = 0;

        const enhancedSubjects = data.subjects.map((sub) => {
            const latestGrade = sub.grades.length > 0 ? sub.grades[0] : null;

            // Sum ALL grade entries for this subject (not just the latest one)
            const totalSubjectScore = sub.grades.reduce((sum, g) => {
                const val = Number(g.score);
                return sum + (isNaN(val) ? 0 : val);
            }, 0);
            const scoreNum = sub.grades.length > 0 ? totalSubjectScore : NaN;

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
            <main className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-background text-foreground" dir="ltr">
                <div className="relative z-10 w-full max-w-sm rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-red-500/20 shadow-[0_8px_40px_0_rgba(255,0,0,0.1)] p-10 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black mb-2 tracking-tight text-foreground">Access Denied</h2>
                    <p className="text-text-muted font-medium mb-8 text-sm">{error}</p>
                    <button onClick={() => router.push('/')} className="w-full h-14 bg-white/10 hover:bg-white text-foreground hover:text-black font-bold rounded-2xl transition-all duration-300">
                        Return to Login
                    </button>
                </div>
            </main>
        );
    }

    if (isLoading || !data) {
        return (
            <main className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-background" dir="ltr">
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
        <main className={`relative min-h-screen w-full flex flex-col overflow-x-hidden bg-background text-foreground transition-opacity duration-1000 ease-out opacity-100`} dir="ltr">

            {/* Cinematic Layout Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                {/* Dark Mode Background Blobs */}
                <div className="hidden dark:block absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-brand-primary opacity-10 blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="hidden dark:block absolute bottom-[0%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-indigo-900 opacity-[0.10] blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
                
                {/* Light Mode Background Blobs */}
                <div className="dark:hidden absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-200 opacity-30 blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="dark:hidden absolute bottom-[0%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-blue-100 opacity-40 blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-slate-50/50 dark:bg-black/20 backdrop-blur-[1px]" />
            </div>

            {/* Header / Nav */}
            <nav className="relative z-10 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/30 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 relative rounded-full overflow-hidden shadow-2xl p-0.5 bg-gradient-to-b from-brand-primary/40 to-transparent border border-slate-200 dark:border-white/20">
                            <Image src="/logo.png" alt="Bologna JR" fill sizes="(max-width: 768px) 48px, 56px" className="object-cover rounded-full bg-white" priority />
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="text-[10px] sm:text-xs text-brand-primary font-bold tracking-widest uppercase mb-0.5">Welcome Back</p>
                            <h1 className="text-base sm:text-2xl font-black text-foreground tracking-tight drop-shadow-md truncate max-w-[200px] sm:max-w-none">{data.studentName}</h1>
                            <span className="text-[10px] text-text-muted font-medium tracking-widest uppercase mt-0.5">ID: {data.studentCode}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <button onClick={handleLogout} className="px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-all active:scale-95 text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white backdrop-blur-sm group">
                            <span className="flex items-center gap-2">
                                Logout
                                <svg className={`w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Dashboard Body Container */}
            <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

                {/* Top Section */}
                <div className="mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-6">Academic Overview</h2>

                    {/* Top Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Overall GPA Card */}
                        <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 flex items-center gap-5 shadow-lg group backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                                <TrendingUp className="w-7 h-7 text-brand-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground/50 font-bold tracking-widest uppercase mb-1">Average Score</p>
                                <h3 className="text-3xl font-black text-foreground">{processedStats.gpa} <span className="text-lg text-text-muted font-medium">/ 50</span></h3>
                            </div>
                        </div>

                        {/* Enrolled Modules Card */}
                        <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 flex items-center gap-5 shadow-lg group backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                <BookOpen className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground/50 font-bold tracking-widest uppercase mb-1">Enrolled Modules</p>
                                <h3 className="text-3xl font-black text-foreground">{processedStats.modules}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1 group">
                        <input
                            type="text"
                            placeholder="Search subjects by name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full h-14 bg-white/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-brand-primary/50 focus:bg-white dark:focus:bg-white/10 transition-all font-medium shadow-inner backdrop-blur-sm`}
                        />
                    </div>
                </div>

                {/* Subject Cards Grid */}
                {data.subjects.length === 0 ? (
                    <div className="w-full py-24 flex flex-col items-center justify-center border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 rounded-3xl backdrop-blur-md shadow-lg">
                        <Clock className="w-16 h-16 text-slate-300 dark:text-white/10 mb-5" />
                        <h3 className="text-2xl font-bold text-slate-500 dark:text-white/40 mb-2">No Academic Records</h3>
                        <p className="text-slate-400 dark:text-white/30 text-center max-w-sm">There are no grades uploaded to your profile yet. Please check back after exams.</p>
                    </div>
                ) : processedStats.filteredSubjects.length === 0 ? (
                    <div className="w-full py-20 flex flex-col items-center justify-center border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 rounded-3xl backdrop-blur-md shadow-lg">
                        <Search className="w-12 h-12 text-slate-300 dark:text-white/10 mb-4" />
                        <h3 className="text-xl font-bold text-slate-500 dark:text-white/40 mb-1">No matches found</h3>
                        <p className="text-sm text-slate-400 dark:text-white/30 text-center">Try adjusting your search query or semester filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                        {processedStats.filteredSubjects.map((sub, idx) => {
                            const isPassing = !isNaN(sub.scoreNum) && sub.scoreNum >= (sub.maxScore / 2);
                            const isFailing = !isNaN(sub.scoreNum) && sub.scoreNum < (sub.maxScore / 2);
                            const isNoGrade = isNaN(sub.scoreNum);

                            const progressWidth = isNoGrade ? "0%" : `${Math.min(100, Math.max(0, sub.scoreNum))}%`;

                            return (
                                <div
                                    key={sub.subjectId}
                                    onClick={() => router.push('/student/subject/' + sub.subjectId)}
                                    className="group flex flex-col h-full rounded-2xl bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-brand-primary/40 dark:hover:border-brand-primary/40 shadow-md hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_8px_30px_rgba(79,70,229,0.3)] p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden relative animate-in fade-in slide-in-from-bottom-8 backdrop-blur-sm"
                                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-primary/10 transition-transform duration-300 border border-slate-200 dark:border-white/5">
                                            <BookOpen className="w-6 h-6 text-slate-400 dark:text-white/30 group-hover:text-brand-primary transition-colors" />
                                        </div>

                                    </div>

                                    <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-brand-primary transition-colors line-clamp-1">
                                        {sub.subjectName}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-8 text-sm font-semibold text-text-muted uppercase tracking-widest">
                                        <span>{sub.subjectId}</span>
                                    </div>

                                    {/* Footer Details & Progress */}
                                    <div className="mt-auto">
                                        {sub.latestGrade ? (
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase font-bold tracking-wider mb-1">Latest Entry</p>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-white/90 line-clamp-1">{sub.latestGrade.examName}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase font-bold tracking-wider mb-1">Score</p>
                                                    <p className="text-xl font-black text-slate-900 dark:text-white">{sub.latestGrade.score} <span className="text-xs text-slate-400 dark:text-white/40">/ {sub.latestGrade.maxScore}</span></p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-4">
                                                <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase font-bold tracking-wider mb-1">Status</p>
                                                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-500/80">Pending Assessment</p>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-slate-200 dark:border-white/10 relative z-10">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1">Total Score</p>
                                                    <div className="flex items-baseline gap-1">
                                                        {isNoGrade ? (
                                                            <span className="text-2xl font-black text-slate-400 dark:text-white/20">--</span>
                                                        ) : (
                                                            <>
                                                                <span className={`text-2xl font-black ${isFailing ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                                                    {sub.scoreNum}
                                                                </span>
                                                                <span className="text-sm font-bold text-slate-500 dark:text-white/30">/{sub.maxScore}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {isNoGrade ? (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                                        <Clock className="w-5 h-5 text-slate-400 dark:text-white/20" />
                                                    </div>
                                                ) : isPassing ? (
                                                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-200 dark:border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                                    </div>
                                                )}
                                            </div>
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
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-border-color border-t-brand-primary rounded-full animate-spin"></div>
            </main>
        }>
            <DashboardContent />
        </Suspense>
    );
}
