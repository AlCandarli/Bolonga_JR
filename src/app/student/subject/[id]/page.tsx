"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Image from "next/image";
import { Download, FileText, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";


// Types
type Grade = { id: string; examName: string; score: string; date: string; };
type SubjectData = { subjectId: string; subjectName: string; grades: Grade[]; };
type DashboardData = { studentName: string; studentCode: string; subjects: SubjectData[]; };

function SubjectContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();


    const id = params?.id;

    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [subject, setSubject] = useState<SubjectData | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setIsMounted(true);
        if (!id) {
            return;
        }

        const fetchDashboard = async () => {
            try {
                const res = await fetch(`/api/student/dashboard`);
                const result = await res.json();

                if (res.ok) {
                    setData(result);
                    const found = result.subjects.find((s: SubjectData) => s.subjectId === id);
                    if (found) {
                        setSubject(found);
                    } else {
                        setError("No grade entries available for this module.");
                    }
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
    }, [id, router]);

    if (!isMounted) return null;

    if (error) {
        return (
            <main className="relative min-h-screen w-full flex flex-col justify-center items-center bg-slate-950 text-white" dir="ltr">
                <div className="relative z-10 w-full max-w-sm rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-red-500/20 p-10 text-center shadow-2xl">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-2 tracking-tight text-white">Access Denied</h2>
                    <p className="text-white/40 font-medium mb-8 text-sm">{error}</p>
                    <button onClick={() => router.push(`/student`)} className="w-full h-14 bg-white/10 hover:bg-white text-white hover:text-black font-bold rounded-2xl transition-all duration-300">
                        Back
                    </button>
                </div>
            </main>
        );
    }

    if (isLoading || !data || !subject) {
        return (
            <main className="relative min-h-screen w-full flex flex-col justify-center items-center bg-slate-950" dir="ltr">
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
        <main className={`relative min-h-screen w-full flex flex-col bg-slate-950 text-slate-200 transition-opacity duration-1000 ease-out opacity-100`} dir="ltr">
            {/* Cinematic Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none print:hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-brand-primary opacity-10 blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute bottom-[0%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-indigo-900 opacity-[0.10] blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
            </div>

            {/* Print Header (Visible ONLY on print) */}
            <div className="hidden print:flex flex-col items-center justify-center w-full pb-8 pt-4 border-b border-gray-200 mb-8 text-black">
                <h1 className="text-3xl font-black">Official Grade Report</h1>
                <div className="mt-6 space-y-2 text-center text-sm font-medium text-gray-600">
                    <p>Student Name: <span className="text-black font-bold">{data.studentName}</span></p>
                    <p>Student Code: <span className="text-black font-bold">{data.studentCode}</span></p>
                    <p className="mt-4">Module: <span className="font-bold text-black">{subject.subjectName} ({subject.subjectId})</span></p>
                </div>
            </div>

            {/* Navigation Header */}
            <nav className="relative z-10 w-full border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 relative rounded-full overflow-hidden shadow-2xl p-0.5 bg-gradient-to-b from-brand-primary/40 to-transparent border border-white/10">
                            <Image src="/logo.png" alt="Bologna JR" fill sizes="(max-width: 768px) 40px, 56px" className="object-cover rounded-full" priority />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-base sm:text-2xl font-black text-white tracking-tight drop-shadow-md truncate max-w-[150px] sm:max-w-none">{data.studentName}</h1>
                            <span className="text-[10px] text-white/40 font-medium tracking-widest uppercase mt-0.5">ID: {data.studentCode}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 rounded-xl transition-all active:scale-95 text-brand-primary backdrop-blur-sm group"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                        <button
                            onClick={() => router.push(`/student`)}
                            className="px-4 py-2.5 text-xs sm:text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-95 text-white/60 hover:text-white backdrop-blur-sm group flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className={`relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col`}>

                {/* Header Information */}
                <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-brand-primary tracking-widest uppercase">
                            {subject.subjectId}
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                        {subject.subjectName}
                    </h2>
                    <p className="text-sm sm:text-base text-white/40 font-medium max-w-2xl leading-relaxed">
                        Complete academic record for this module. You can securely download a copy of these grades for your records.
                    </p>
                </div>

                {/* Mobile-only download button */}
                <button
                    onClick={() => window.print()}
                    className="sm:hidden w-full flex items-center justify-center gap-2 mb-8 px-4 py-4 text-sm font-bold bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 rounded-2xl text-brand-primary transition-all active:scale-95 print:hidden"
                >
                    <Download className="w-5 h-5" />
                    Download PDF
                </button>

                {/* Grades Container */}
                <div className="w-full bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-5 sm:p-10 shadow-2xl backdrop-blur-sm print:bg-transparent print:border-none print:shadow-none print:p-0">
                    {subject.grades.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center">
                            <FileText className="w-16 h-16 text-white/10 mb-5" />
                            <p className="text-white/40 font-bold text-lg text-center max-w-xs">No grade entries available for this module.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            {subject.grades.map((grade, idx) => {
                                const d = new Date(grade.date);
                                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                const scoreNum = parseFloat(grade.score);
                                const isPassing = !isNaN(scoreNum) && scoreNum >= 25; // Scale is now out of 50

                                return (
                                    <div
                                        key={grade.id}
                                        className="group relative flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-brand-primary/30 rounded-2xl p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 print:bg-transparent print:border-b print:border-gray-100 print:rounded-none"
                                        style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
                                    >
                                        <div className="flex-1 mb-4 sm:mb-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className={`w-2 h-2 rounded-full ${isPassing ? 'bg-emerald-500/40' : 'bg-rose-500/40'} group-hover:scale-125 transition-transform`} />
                                                <h4 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors print:text-black">
                                                    {grade.examName}
                                                </h4>
                                            </div>
                                            <p className={`text-[10px] text-white/30 font-bold uppercase tracking-widest pl-5 print:text-gray-400`}>
                                                {dateStr}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6 w-full sm:w-auto">
                                            <div className="w-full sm:w-28 py-3 rounded-2xl flex flex-col items-center justify-center border bg-white/5 border-white/10 group-hover:border-white/30 transition-all print:bg-transparent print:border-none">
                                                <span className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1 print:hidden">Score</span>
                                                <span className="text-3xl font-black text-white print:text-black">
                                                    {grade.score}
                                                </span>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    main { background: white !important; padding: 0 !important; overflow: visible !important; }
                }
            `}</style>
        </main>
    );
}

export default function SubjectDashboard() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-brand-primary rounded-full animate-spin"></div>
            </main>
        }>
            <SubjectContent />
        </Suspense>
    );
}
