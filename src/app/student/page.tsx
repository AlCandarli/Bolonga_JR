"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// Types
type Grade = { id: string; examName: string; score: string; date: string; };
type SubjectData = { subjectId: string; subjectName: string; grades: Grade[]; };
type DashboardData = { studentName: string; studentCode: string; subjects: SubjectData[]; };

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code");

    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState("");

    // Subject redirect handled via router

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
                    setError(result.error || "Failed to load dashboard");
                }
            } catch (err) {
                console.error(err);
                setError("Network connection issue.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, [code, router]);

    if (!isMounted) return null;

    if (error) {
        return (
            <main className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-[#030303] text-white" dir="ltr">
                <div className="relative z-10 w-full max-w-sm rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-red-500/20 shadow-[0_8px_40px_0_rgba(255,0,0,0.1)] p-10 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black mb-2 tracking-tight text-white">Access Denied</h2>
                    <p className="text-white/40 font-medium mb-8 text-sm">{error}</p>
                    <button onClick={() => router.push('/')} className="w-full h-14 bg-white/10 hover:bg-white text-white hover:text-black font-bold rounded-2xl transition-all duration-300">
                        Return to Login
                    </button>
                </div>
            </main>
        );
    }

    if (isLoading || !data) {
        return (
            <main className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-[#030303]" dir="ltr">
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
        <main className={`relative min-h-screen w-full flex flex-col overflow-x-hidden bg-[#030303] transition-opacity duration-1000 ease-out opacity-100`} dir="ltr">
            
            {/* Cinematic Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-brand-primary opacity-10 blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute bottom-[0%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-indigo-900 opacity-[0.15] blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
                <div className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-500 opacity-[0.05] blur-[100px]" />
                <div className="absolute inset-0 bg-black/80 backdrop-blur-[5px]" />
            </div>

            {/* Header / Nav */}
            <nav className="relative z-10 w-full border-b border-white/5 bg-white/[0.01] backdrop-blur-2xl px-4 sm:px-12 py-4 sm:py-5 flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-5">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 relative rounded-full overflow-hidden shadow-2xl p-0.5 bg-gradient-to-b from-brand-primary/40 to-transparent border border-white/10">
                        <Image src="/logo.jpeg" alt="Bologna JR" fill sizes="(max-width: 768px) 40px, 56px" className="object-cover rounded-full" priority />
                    </div>
                    <div className="flex flex-col justify-center">
                        <p className="text-[10px] sm:text-xs text-brand-primary font-bold tracking-widest uppercase mb-0.5">Welcome Back</p>
                        <h1 className="text-base sm:text-2xl font-black text-white tracking-tight drop-shadow-md truncate max-w-[150px] sm:max-w-none">{data.studentName}</h1>
                        <span className="text-[9px] sm:text-[10px] text-white/30 font-medium tracking-widest uppercase mt-0.5">ID: {data.studentCode}</span>
                    </div>
                </div>
                <button onClick={() => router.push('/')} className="px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg sm:rounded-xl transition-all active:scale-95 text-white/50 hover:text-white backdrop-blur-sm group">
                    <span className="flex items-center gap-1.5 sm:gap-2">
                        Logout
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </span>
                </button>
            </nav>

            {/* Dashboard Body */}
            <div className="relative z-10 flex-1 px-4 sm:px-12 py-6 sm:py-10 w-full max-w-7xl mx-auto">
                <div className="mb-6 sm:mb-10 text-center sm:text-left">
                    <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40 tracking-tight">Academic Overview</h2>
                    <p className="text-sm text-white/40 mt-2 font-medium">Select a subject card to view your detailed module grades.</p>
                </div>

                {data.subjects.length === 0 ? (
                    <div className="w-full py-20 flex flex-col items-center justify-center border border-white/5 bg-white/[0.02] rounded-3xl backdrop-blur-md">
                        <svg className="w-16 h-16 text-white/10 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                        <h3 className="text-xl font-bold text-white/60 mb-1">No Academic Records</h3>
                        <p className="text-sm text-white/30 text-center max-w-xs">There are no grades uploaded to your profile yet. Please check back later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {data.subjects.map((sub, idx) => {
                            // grades are already sorted desc by API
                            const latestGrade = sub.grades.length > 0 ? sub.grades[0] : null;

                            return (
                                <div 
                                    key={sub.subjectId}
                                    onClick={() => router.push('/student/subject/' + sub.subjectId + '?code=' + code)}
                                    className="group relative flex flex-col h-full rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/5 hover:border-brand-primary/30 shadow-[0_4px_20px_0_rgba(0,0,0,0.4)] sm:shadow-lg hover:shadow-[0_0_40px_rgba(0,229,255,0.1)] p-5 sm:p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 overflow-hidden animate-in fade-in slide-in-from-bottom-8"
                                    style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
                                >
                                    {/* Card Subtle Glow */}
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/20 blur-[60px] rounded-full group-hover:bg-brand-primary/40 transition-colors duration-500" />
                                    
                                    <div className="flex-1 relative z-10">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all duration-300">
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/50 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1 sm:mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-brand-primary transition-all">
                                            {sub.subjectName}
                                        </h3>
                                        <p className="text-xs font-semibold text-white/30 tracking-widest uppercase mb-8">{sub.subjectId}</p>
                                    </div>

                                    {/* The Notice / Footer Section */}
                                    <div className="relative z-10 w-full pt-4 mt-auto border-t border-white/5 group-hover:border-white/10 transition-colors">
                                        {latestGrade ? (
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Latest Entry</span>
                                                    <span className="text-[10px] text-brand-primary/80 font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/20">Updated</span>
                                                </div>
                                                <p className="text-sm font-semibold text-white/80 line-clamp-1 group-hover:text-white transition-colors">
                                                    {latestGrade.examName} <span className="mx-1 text-white/20">•</span> <span className="text-brand-primary font-black">{latestGrade.score}</span>
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-yellow-500/50"></span>
                                                <p className="text-xs text-white/40 font-medium">No grades uploaded yet</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Bottom gradient border line */}
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-primary/0 via-brand-primary/0 to-brand-primary/0 group-hover:via-brand-primary/50 transition-all duration-700" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            
            
        </main>
    );
}

export default function StudentDashboard() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-brand-primary rounded-full animate-spin"></div>
            </main>
        }>
            <DashboardContent />
        </Suspense>
    );
}
