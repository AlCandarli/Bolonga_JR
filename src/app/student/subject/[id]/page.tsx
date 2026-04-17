"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Image from "next/image";

// Types
type Grade = { id: string; examName: string; score: string; date: string; };
type SubjectData = { subjectId: string; subjectName: string; grades: Grade[]; };
type DashboardData = { studentName: string; studentCode: string; subjects: SubjectData[]; };

function SubjectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams<{ id: string }>();
    
    const id = params?.id;
    const code = searchParams?.get("code");

    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [subject, setSubject] = useState<SubjectData | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setIsMounted(true);
        if (!code || !id) {
            if (!code) router.push("/");
            return;
        }

        const fetchDashboard = async () => {
            try {
                const res = await fetch(`/api/student/dashboard?code=${code}`);
                const result = await res.json();
                
                if (res.ok) {
                    setData(result);
                    const found = result.subjects.find((s: SubjectData) => s.subjectId === id);
                    if (found) {
                        setSubject(found);
                    } else {
                        setError("Subject records not found.");
                    }
                } else {
                    setError(result.error || "Failed to load academic records");
                }
            } catch (err) {
                console.error(err);
                setError("Network connection issue.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, [code, id, router]);

    if (!isMounted) return null;

    if (error) {
        return (
            <main className="relative min-h-screen w-full flex flex-col justify-center items-center bg-[#030303] text-white" dir="ltr">
                <div className="relative z-10 w-full max-w-sm rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-red-500/20 p-10 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black mb-2 tracking-tight text-white">Error</h2>
                    <p className="text-white/40 font-medium mb-8 text-sm">{error}</p>
                    <button onClick={() => router.push(`/student?code=${code}`)} className="w-full h-14 bg-white/10 hover:bg-white text-white hover:text-black font-bold rounded-2xl transition-all duration-300">
                        Return to Dashboard
                    </button>
                </div>
            </main>
        );
    }

    if (isLoading || !data || !subject) {
        return (
            <main className="relative min-h-screen w-full flex flex-col justify-center items-center bg-[#030303]" dir="ltr">
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-primary opacity-10 blur-[130px] animate-pulse" />
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[10px]" />
                <div className="relative z-10 flex flex-col items-center gap-6 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20"></div>
                    <div className="h-6 w-48 bg-white/10 rounded-full"></div>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen w-full flex flex-col bg-[#030303] text-white print:bg-white print:text-black" dir="ltr">
            {/* Cinematic Background - Hidden on Print */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none print:hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-brand-primary opacity-5 blur-[140px]" />
                <div className="absolute bottom-[0%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-indigo-900 opacity-[0.1] blur-[150px]" />
            </div>

            {/* Print Only Header (Visible only when downloading/printing) */}
            <div className="hidden print:flex flex-col items-center justify-center w-full pb-8 pt-4 border-b border-gray-200 mb-8">
                <h1 className="text-3xl font-black text-black">Official Grade Report</h1>
                <p className="text-gray-500 mt-2 font-medium">Student Name: {data.studentName}</p>
                <p className="text-gray-500 font-medium">Student Code: {data.studentCode}</p>
                <p className="text-gray-500 font-medium mt-4">Module: <span className="font-bold text-black">{subject.subjectName} ({subject.subjectId})</span></p>
            </div>

            {/* Web Navigation/Header - Hidden on Print */}
            <nav className="relative z-10 w-full border-b border-white/5 bg-white/[0.01] backdrop-blur-2xl px-4 sm:px-12 py-4 sm:py-5 flex justify-between items-center print:hidden">
                <div className="flex items-center gap-3 sm:gap-5">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 relative rounded-full overflow-hidden shadow-2xl p-0.5 bg-gradient-to-b from-brand-primary/40 to-transparent border border-white/10 flex-shrink-0">
                        <Image src="/logo.jpeg" alt="Bologna JR" fill sizes="(max-width: 768px) 40px, 56px" className="object-cover rounded-full" priority />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-base sm:text-2xl font-black text-white tracking-tight drop-shadow-md truncate max-w-[150px] sm:max-w-none">{data.studentName}</h1>
                        <span className="text-[9px] sm:text-[10px] text-white/30 font-medium tracking-widest uppercase mt-0.5">ID: {data.studentCode}</span>
                    </div>
                </div>
                <div className="flex gap-2 sm:gap-4">
                    <button onClick={() => window.print()} className="px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-sm font-bold bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 rounded-lg sm:rounded-xl transition-all active:scale-95 text-brand-primary backdrop-blur-sm group flex items-center gap-1.5 sm:gap-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 opacity-80 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span className="hidden sm:block">Download PDF</span>
                        <span className="sm:hidden">PDF</span>
                    </button>
                    <button onClick={() => router.push(`/student?code=${code}`)} className="px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg sm:rounded-xl transition-all active:scale-95 text-white/50 hover:text-white backdrop-blur-sm group flex items-center gap-1.5 sm:gap-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        <span className="hidden sm:block">Back</span>
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="relative z-10 flex-1 px-4 sm:px-12 py-8 sm:py-12 w-full max-w-4xl mx-auto flex flex-col">
                
                {/* Header Section */}
                <div className="mb-10 sm:mb-12 print:hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white/50 tracking-widest uppercase">{subject.subjectId}</span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">{subject.subjectName}</h2>
                    <p className="text-sm text-white/40 mt-3 font-medium max-w-xl">Complete academic record for this module. You can securely download a copy of these grades for your records.</p>
                </div>

                {/* Grades List */}
                <div className="flex-1 w-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 sm:p-10 shadow-2xl overflow-hidden print:shadow-none print:border-none print:bg-transparent print:p-0">
                    {subject.grades.length === 0 ? (
                        <div className="text-center py-20">
                            <svg className="w-16 h-16 text-white/10 mx-auto mb-4 print:text-black/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="text-white/40 print:text-gray-500 font-medium text-lg">No grade entries available for this module.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-6">
                            {subject.grades.map((grade) => {
                                const d = new Date(grade.date);
                                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                
                                return (
                                    <div key={grade.id} className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/[0.03] border border-white/5 hover:border-brand-primary/20 rounded-2xl p-5 sm:p-6 transition-all duration-300 print:border-b print:border-gray-200 print:rounded-none print:bg-transparent print:p-4 print:py-6 group">
                                        <div className="flex-1 pr-4 mb-4 sm:mb-0">
                                            <h4 className="text-lg sm:text-xl font-bold text-white/90 group-hover:text-white print:text-black mb-1">{grade.examName}</h4>
                                            <p className="text-xs text-white/30 print:text-gray-500 font-medium uppercase tracking-widest">{dateStr}</p>
                                        </div>
                                        <div className="w-full sm:w-auto shrink-0 px-6 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-center print:bg-transparent print:border-none print:p-0 print:justify-end">
                                            <div className="flex flex-col items-center sm:items-end">
                                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1 sm:hidden print:hidden">Score</span>
                                                <span className="text-2xl sm:text-3xl font-black text-brand-primary print:text-black">{grade.score}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                
            </div>
            
        </main>
    );
}

export default function SubjectDashboard() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-[#030303] flex items-center justify-center print:hidden">
                <div className="w-12 h-12 border-4 border-white/10 border-t-brand-primary rounded-full animate-spin"></div>
            </main>
        }>
            <SubjectContent />
        </Suspense>
    );
}
