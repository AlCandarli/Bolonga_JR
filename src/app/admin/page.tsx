"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminGradeUploader from "@/components/AdminGradeUploader";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Check if already authenticated via cookie
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    if (data.role === 'admin') {
                        setIsAuthenticated(true);
                    }
                }
            } catch (e) {
                console.error("Session check failed");
            }
        };
        checkAuth();
    }, []);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"upload" | "subjects" | "students" | "update" | "settings">("upload");

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Students Bulk Upload State
    const [studentsFile, setStudentsFile] = useState<File | null>(null);
    const [isUploadingStudents, setIsUploadingStudents] = useState(false);

    const [examName, setExamName] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [gradeUploadMode, setGradeUploadMode] = useState<"specific" | "semester">("specific");

    const [subjectName, setSubjectName] = useState("");
    const [subjectCode, setSubjectCode] = useState("");
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [subjectDivisions, setSubjectDivisions] = useState<{name: string, maxScore: string}[]>([{name: "", maxScore: "100"}]);

    const addDivisionField = () => setSubjectDivisions([...subjectDivisions, {name: "", maxScore: "100"}]);
    const removeDivisionField = (index: number) => {
        if(subjectDivisions.length > 1) {
            const newDivs = [...subjectDivisions];
            newDivs.splice(index, 1);
            setSubjectDivisions(newDivs);
        }
    };
    const updateDivision = (index: number, field: 'name' | 'maxScore', value: string) => {
        const newDivs = [...subjectDivisions];
        newDivs[index][field] = value;
        setSubjectDivisions(newDivs);
    };

    // Add Student States
    const [studentName, setStudentName] = useState("");
    const [studentCode, setStudentCode] = useState("");
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [subjectsList, setSubjectsList] = useState<{ id: string, name: string }[]>([]);

    // Fetch subjects from the backend
    const fetchSubjects = async () => {
        try {
            const res = await fetch("/api/subjects");
            if (res.ok) {
                const data = await res.json();
                setSubjectsList(data);
            }
        } catch (error) {
            console.error("Failed to fetch subjects", error);
        }
    };

    // Fetch subjects immediately after successful admin login
    useEffect(() => {
        if (isAuthenticated) {
            fetchSubjects();
        }
    }, [isAuthenticated]);

    // Delete States
    // Delete States
    const [isDeletingSubject, setIsDeletingSubject] = useState(false);
    const [deleteSubjectCode, setDeleteSubjectCode] = useState("");
    const [deleteStudentCode, setDeleteStudentCode] = useState("");
    const [isDeletingStudent, setIsDeletingStudent] = useState(false);
    const [deleteGradeSubject, setDeleteGradeSubject] = useState("");
    const [isDeletingGrades, setIsDeletingGrades] = useState(false);

    // Update Grade States
    const [updateStudentCode, setUpdateStudentCode] = useState("");
    const [updateSubjectId, setUpdateSubjectId] = useState("");
    const [updateDivisionId, setUpdateDivisionId] = useState("");
    const [updateNewScore, setUpdateNewScore] = useState("");
    const [isUpdatingGrade, setIsUpdatingGrade] = useState(false);
    const [updateResult, setUpdateResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Get divisions for the selected subject in the update form
    const updateSubjectObj = (subjectsList as any[]).find((s: any) => s.id === updateSubjectId);

    // Handlers
    const handleDeleteSubject = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete '${name}' and ALL its grades?`)) return;
        setIsDeletingSubject(true);
        try {
            const res = await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, { method: "DELETE" });
            if (res.ok) {
                alert(`Subject '${name}' deleted successfully!`);
                fetchSubjects();
            } else {
                const err = await res.json();
                alert(`Failed: ${err.error}`);
            }
        } catch(e) {
            alert("Error deleting subject.");
        } finally {
            setIsDeletingSubject(false);
        }
    };

    const handleDeleteSubjectByCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deleteSubjectCode) return;
        if (!confirm(`Are you sure you want to permanently delete subject '${deleteSubjectCode}' and ALL its grades?`)) return;
        setIsDeletingSubject(true);
        try {
            const res = await fetch(`/api/subjects?id=${encodeURIComponent(deleteSubjectCode)}`, { method: "DELETE" });
            if (res.ok) {
                alert(`Subject '${deleteSubjectCode}' deleted successfully!`);
                setDeleteSubjectCode("");
                fetchSubjects();
            } else {
                const err = await res.json();
                alert(`Failed: ${err.error}`);
            }
        } catch(e) {
            alert("Error deleting subject.");
        } finally {
            setIsDeletingSubject(false);
        }
    };

    const handleDeleteStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deleteStudentCode) return;
        if (!confirm(`Are you sure you want to permanently delete student '${deleteStudentCode}' and ALL their grades?`)) return;
        setIsDeletingStudent(true);
        try {
            const res = await fetch(`/api/students?code=${encodeURIComponent(deleteStudentCode)}`, { method: "DELETE" });
            if (res.ok) {
                alert(`Student '${deleteStudentCode}' deleted successfully!`);
                setDeleteStudentCode("");
            } else {
                const err = await res.json();
                alert(`Failed: ${err.error}`);
            }
        } catch(e) {
            alert("Error deleting student.");
        } finally {
            setIsDeletingStudent(false);
        }
    };

    const handleDeleteGrades = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deleteGradeSubject) return;
        if (!confirm(`Are you sure you want to permanently clear ALL grades for this subject?`)) return;
        setIsDeletingGrades(true);
        try {
            const res = await fetch(`/api/grades?subjectId=${encodeURIComponent(deleteGradeSubject)}`, { method: "DELETE" });
            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                setDeleteGradeSubject("");
            } else {
                const err = await res.json();
                alert(`Failed: ${err.error}`);
            }
        } catch(e) {
            alert("Error clearing grades.");
        } finally {
            setIsDeletingGrades(false);
        }
    };


    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            if (res.ok) {
                setIsAuthenticated(true);
            } else {
                setError("Invalid password. Please try again.");
            }
        } catch {
            setError("Server error. Please try again later.");
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setIsAuthenticated(false);
            router.push('/');
        } catch (e) {
            router.push('/');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;
        if (!selectedSubject) {
            alert("Please select a subject.");
            return;
        }
        if (gradeUploadMode === "specific" && !examName) {
            alert("Please provide the exam name.");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("uploadMode", gradeUploadMode);
            formData.append("subjectCode", selectedSubject);
            if (gradeUploadMode === "specific") {
                formData.append("examName", examName);
            }

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const resData = await response.json();
                alert(resData.message || "File processed and grades updated successfully!");
                setSelectedFile(null);
                setExamName("");
                setSelectedSubject("");
            } else {
                const errData = await response.json();
                alert(`Upload failed: ${errData.error || response.statusText}`);
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message || "Unknown error occurred"}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subjectName) return;
        const validDivisions = subjectDivisions.filter(d => d.name.trim() !== "");
        if (validDivisions.length === 0) {
            alert("Please add at least one valid division for the subject.");
            return;
        }

        setIsAddingSubject(true);
        try {
            const res = await fetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name: subjectName, 
                    code: subjectCode || subjectName, 
                    divisions: validDivisions.map(d => ({ name: d.name, maxScore: parseFloat(d.maxScore) || 100 }))
                }),
            });

            if (res.ok) {
                alert(`Subject '${subjectName}' added successfully!`);
                setSubjectName("");
                setSubjectCode("");
                setSubjectDivisions([{name: "", maxScore: "100"}]);
                fetchSubjects();
            } else {
                alert("Failed to add subject.");
            }
        } catch (error) {
            console.error(error);
            alert("Server error.");
        } finally {
            setIsAddingSubject(false);
        }
    };

    const handleStudentsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setStudentsFile(e.target.files[0]);
        }
    };

    const handleStudentsUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentsFile) return;

        setIsUploadingStudents(true);
        try {
            const formData = new FormData();
            formData.append("file", studentsFile);
            formData.append("uploadMode", "complete");

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const resData = await response.json();
                alert(resData.message || "Students database recorded successfully!");
                setStudentsFile(null);
            } else {
                const errData = await response.json();
                alert(`Upload failed: ${errData.error || response.statusText}`);
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message || "Unknown error occurred"}`);
        } finally {
            setIsUploadingStudents(false);
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentName || !studentCode) return;

        setIsAddingStudent(true);
        try {
            const res = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: studentName, code: studentCode }),
            });

            if (res.ok) {
                alert(`Student '${studentName}' added successfully!`);
                setStudentName("");
                setStudentCode("");
            } else {
                alert("Failed to add student.");
            }
        } catch (error) {
            console.error(error);
            alert("Server error.");
        } finally {
            setIsAddingStudent(false);
        }
    };
    const handleUpdateGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateResult(null);
        if (!updateStudentCode || !updateSubjectId || !updateDivisionId || updateNewScore === "") return;

        setIsUpdatingGrade(true);
        try {
            const res = await fetch("/api/grades/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentCode: updateStudentCode.trim(),
                    divisionId: updateDivisionId,
                    newScore: parseFloat(updateNewScore),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setUpdateResult({ type: 'success', message: data.message });
                setUpdateNewScore("");
            } else {
                setUpdateResult({ type: 'error', message: data.error || "Failed to update grade." });
            }
        } catch (err) {
            setUpdateResult({ type: 'error', message: "Network error. Please try again." });
        } finally {
            setIsUpdatingGrade(false);
        }
    };

    // -------------------------
    // LOGIN VIEW
    // -------------------------
    if (!isAuthenticated) {
        return (
            <main className={`relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-[#030303] transition-opacity duration-1000 ease-out ${isMounted ? "opacity-100" : "opacity-0"}`} dir="ltr">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-primary opacity-10 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute bottom-[10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-indigo-900 opacity-[0.12] blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
                    <div className="absolute top-[40%] right-[30%] w-[40vw] h-[40vw] rounded-full bg-emerald-700 opacity-5 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[10px]" />
                </div>

                <div className="relative z-10 w-full max-w-[22rem] sm:max-w-sm rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_40px_0_rgba(0,0,0,0.8)] p-8 sm:p-10 relative overflow-hidden group">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

                    <div className="flex flex-col items-center space-y-6 mb-10">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-full overflow-hidden shadow-2xl p-1 bg-gradient-to-b from-white/10 to-transparent border border-border-color hover:scale-105 transition-transform duration-500 ease-out cursor-default">
                            <Image src="/logo.png" alt="Bologna JR" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover rounded-full" priority />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tight drop-shadow-md">Admin Portal</h1>
                        </div>
                    </div>

                    <form onSubmit={handleAdminLogin} className="flex flex-col gap-6">
                        <div className="relative group/input">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password..."
                                className="w-full h-16 bg-surface border border-border-color rounded-2xl px-6 text-center text-foreground placeholder:text-foreground/20 focus:outline-none focus:bg-white/5 focus:border-brand-primary/40 transition-all duration-300 font-bold tracking-[0.2em] shadow-inner backdrop-blur-sm"
                                required
                                autoFocus
                            />
                            <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-focus-within/input:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF]" />
                        </div>

                        <div className="h-4 flex items-center justify-center">
                            {error && <p className="text-red-400 text-xs font-semibold animate-pulse">{error}</p>}
                        </div>

                        <button type="submit" className="group relative w-full h-16 bg-white hover:bg-brand-primary text-black font-extrabold text-lg sm:text-xl rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] transition-all duration-300 active:scale-[0.96] flex items-center justify-center overflow-hidden">
                            <span className="relative z-10 flex items-center gap-2">
                                Login
                                <svg className="w-6 h-6 opacity-60 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            </span>
                        </button>

                        <button type="button" onClick={() => router.push('/')} className="text-foreground/20 hover:text-text-muted text-xs sm:text-sm font-medium transition-colors mt-2">
                            Return to Student Portal
                        </button>
                    </form>
                </div>
            </main>
        );
    }

    // -------------------------
    // DASHBOARD VIEW
    // -------------------------
    return (
        <main className={`relative min-h-screen w-full flex flex-col overflow-x-hidden bg-[#030303] transition-opacity duration-1000 ease-out ${isMounted ? "opacity-100" : "opacity-0"}`} dir="ltr">
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                {/* Dark Mode Background Blobs */}
                <div className="hidden dark:block absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-primary opacity-10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="hidden dark:block absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600 opacity-[0.15] blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
                
                {/* Light Mode Background Blobs */}
                <div className="dark:hidden absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-200 opacity-30 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="dark:hidden absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100 opacity-40 blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-slate-50/50 dark:bg-black/40 backdrop-blur-[1px]" />
            </div>

            <nav className="relative z-10 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/30 backdrop-blur-2xl px-5 sm:px-10 py-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 relative rounded-full overflow-hidden shadow-2xl p-0.5 bg-gradient-to-b from-slate-200 to-transparent dark:from-white/10 dark:to-transparent border border-slate-200 dark:border-white/20">
                        <Image src="/logo.png" alt="Bologna JR" fill className="object-cover rounded-full bg-white" priority />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-white/60 tracking-tight">Bologna JR</h1>
                        <p className="text-[10px] text-slate-500 dark:text-white/40 mt-0.5 font-medium tracking-widest uppercase">Admin Management</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button onClick={handleLogout} className="px-4 py-2 text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-all active:scale-95 text-slate-500 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400 backdrop-blur-sm">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-5 w-full my-4">

                {/* TABS NAVIGATOR */}
                <div className="w-full max-w-4xl flex flex-wrap sm:flex-nowrap p-1.5 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl mb-6 border border-slate-200 dark:border-white/10 shadow-lg">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'upload' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white'}`}
                    >
                        Upload Grades
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'students' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white'}`}
                    >
                        Students
                    </button>
                    <button
                        onClick={() => setActiveTab('subjects')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'subjects' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white'}`}
                    >
                        Subjects
                    </button>
                    <button
                        onClick={() => setActiveTab('update')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'update' ? 'bg-amber-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white'}`}
                    >
                        Update Grade
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'settings' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white'}`}
                    >
                        System Admin
                    </button>
                </div>

                {/* TAB 1: UPLOAD GRADES */}
                {activeTab === 'upload' && (
                    <AdminGradeUploader subjectsList={subjectsList} />
                )}

                {/* TAB: UPDATE GRADE */}
                {activeTab === 'update' && (
                    <div className="w-full max-w-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-full rounded-[2.5rem] bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl border border-amber-200 dark:border-amber-500/20 shadow-xl dark:shadow-[0_8px_40px_0_rgba(0,0,0,0.8)] p-8 sm:p-12 relative overflow-hidden">
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

                            {/* Header */}
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 mb-4">
                                    <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground tracking-tight mb-2">Update a Grade</h2>
                                <p className="text-sm text-slate-500 dark:text-text-muted font-medium">Correct or override an existing student grade for a specific division.</p>
                            </div>

                            <form onSubmit={handleUpdateGrade} className="flex flex-col gap-6">

                                {/* Student Code */}
                                <div className="relative group/input">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest mb-2 pl-2">Student Code</label>
                                    <input
                                        type="text"
                                        value={updateStudentCode}
                                        onChange={(e) => setUpdateStudentCode(e.target.value)}
                                        placeholder="e.g. STU9921"
                                        className="w-full h-14 bg-white dark:bg-surface border border-slate-200 dark:border-border-color rounded-2xl px-6 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-foreground/20 focus:outline-none focus:border-amber-400/60 transition-all duration-300 font-bold tracking-widest uppercase shadow-inner"
                                        required
                                    />
                                    <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-amber-400 group-focus-within/input:w-3/4 transition-all duration-500 ease-out" />
                                </div>

                                {/* Subject Selector */}
                                <div className="relative group/input">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest mb-2 pl-2">Subject</label>
                                    <select
                                        value={updateSubjectId}
                                        onChange={(e) => { setUpdateSubjectId(e.target.value); setUpdateDivisionId(""); }}
                                        className="w-full h-14 bg-white dark:bg-surface border border-slate-200 dark:border-border-color rounded-2xl px-6 text-slate-900 dark:text-foreground focus:outline-none focus:border-amber-400/60 transition-all duration-300 font-bold shadow-inner appearance-none"
                                        required
                                    >
                                        <option value="" disabled>Select subject...</option>
                                        {(subjectsList as any[]).map((sub: any) => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-amber-400 group-focus-within/input:w-3/4 transition-all duration-500 ease-out" />
                                </div>

                                {/* Division Selector */}
                                {updateSubjectObj?.divisions && updateSubjectObj.divisions.length > 0 && (
                                    <div className="relative group/input">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest mb-2 pl-2">Division / Exam</label>
                                        <select
                                            value={updateDivisionId}
                                            onChange={(e) => setUpdateDivisionId(e.target.value)}
                                            className="w-full h-14 bg-white dark:bg-surface border border-slate-200 dark:border-border-color rounded-2xl px-6 text-slate-900 dark:text-foreground focus:outline-none focus:border-amber-400/60 transition-all duration-300 font-bold shadow-inner appearance-none"
                                            required
                                        >
                                            <option value="" disabled>Select division...</option>
                                            {updateSubjectObj.divisions.map((div: any) => (
                                                <option key={div.id} value={div.id}>{div.name} (max: {div.maxScore})</option>
                                            ))}
                                        </select>
                                        <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-amber-400 group-focus-within/input:w-3/4 transition-all duration-500 ease-out" />
                                    </div>
                                )}

                                {/* New Score */}
                                <div className="relative group/input">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest mb-2 pl-2">
                                        New Score
                                        {updateSubjectObj?.divisions && updateDivisionId && (() => {
                                            const div = updateSubjectObj.divisions.find((d: any) => d.id === updateDivisionId);
                                            return div ? <span className="ml-2 text-amber-500 font-black">/ {div.maxScore}</span> : null;
                                        })()}
                                    </label>
                                    <input
                                        type="number"
                                        value={updateNewScore}
                                        onChange={(e) => setUpdateNewScore(e.target.value)}
                                        placeholder="Enter new score..."
                                        min="0"
                                        step="0.5"
                                        className="w-full h-14 bg-white dark:bg-surface border border-slate-200 dark:border-border-color rounded-2xl px-6 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-foreground/20 focus:outline-none focus:border-amber-400/60 transition-all duration-300 font-bold text-xl shadow-inner"
                                        required
                                    />
                                    <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-amber-400 group-focus-within/input:w-3/4 transition-all duration-500 ease-out" />
                                </div>

                                {/* Result Banner */}
                                {updateResult && (
                                    <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300 ${
                                        updateResult.type === 'success'
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
                                    }`}>
                                        <span className="text-lg mt-[-2px]">{updateResult.type === 'success' ? '✅' : '❌'}</span>
                                        <span>{updateResult.message}</span>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isUpdatingGrade || !updateStudentCode || !updateSubjectId || !updateDivisionId || updateNewScore === ""}
                                    className={`group relative w-full h-16 font-extrabold text-lg rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 overflow-hidden ${
                                        (!updateStudentCode || !updateSubjectId || !updateDivisionId || updateNewScore === "")
                                            ? 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-text-muted cursor-not-allowed border border-slate-200 dark:border-border-color'
                                            : 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg hover:shadow-amber-500/30 dark:shadow-amber-500/20'
                                    }`}
                                >
                                    {isUpdatingGrade ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Save Updated Grade
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB 2: MANAGE SUBJECTS */}
                {activeTab === 'subjects' && (() => {
                    const totalSubjectScore = subjectDivisions.reduce((sum, div) => sum + (Number(div.maxScore) || 0), 0);
                    return (
                    <div className="w-full max-w-2xl rounded-[2.5rem] bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl border border-slate-200 dark:border-white/[0.05] shadow-xl dark:shadow-[0_8px_40px_0_rgba(0,0,0,0.8)] p-8 sm:p-12 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500">
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

                        <div className="text-center mb-10">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground tracking-tight mb-2">Add New Subject</h2>
                            <p className="text-sm text-slate-500 dark:text-text-muted font-medium">Create a new subject module in the university database.</p>
                        </div>

                        <form onSubmit={handleAddSubject} className="flex flex-col gap-6">

                            <div className="relative group/input">
                                <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest mb-2 pl-2">Subject Name</label>
                                <input
                                    type="text"
                                    value={subjectName}
                                    onChange={(e) => setSubjectName(e.target.value)}
                                    placeholder="e.g. Advanced Mathematics"
                                    className="w-full h-16 bg-white dark:bg-surface border border-slate-200 dark:border-border-color rounded-2xl px-6 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-foreground/20 focus:outline-none focus:bg-slate-50 dark:focus:bg-white/5 focus:border-brand-primary/40 transition-all duration-300 font-bold shadow-inner backdrop-blur-sm"
                                    required
                                />
                                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-focus-within/input:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF] dark:shadow-[0_0_10px_#4f46e5]" />
                            </div>

                            <div className="relative group/input flex-1">
                                <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest mb-2 pl-2">Subject Code / ID</label>
                                <input
                                    type="text"
                                    value={subjectCode}
                                    onChange={(e) => setSubjectCode(e.target.value)}
                                    placeholder="e.g. MATH301"
                                    className="w-full h-16 bg-white dark:bg-surface border border-slate-200 dark:border-border-color rounded-2xl px-6 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-foreground/20 focus:outline-none focus:bg-slate-50 dark:focus:bg-white/5 focus:border-brand-primary/40 transition-all duration-300 font-bold tracking-widest uppercase shadow-inner backdrop-blur-sm"
                                />
                                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-focus-within/input:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF] dark:shadow-[0_0_10px_#4f46e5]" />
                            </div>

                            {/* Divisions Section */}
                            <div className="p-5 rounded-2xl border border-slate-200 dark:border-border-color bg-slate-50 dark:bg-black/30 space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest">Subject Divisions</label>
                                    <button type="button" onClick={addDivisionField} className="text-xs bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 dark:border-brand-primary/50 px-3 py-1.5 rounded-lg hover:bg-brand-primary hover:text-white dark:hover:text-black transition">
                                        + Add Division
                                    </button>
                                </div>
                                {subjectDivisions.map((div, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            placeholder="Division Name" 
                                            value={div.name} 
                                            onChange={e => updateDivision(i, 'name', e.target.value)} 
                                            className="flex-1 h-12 bg-white dark:bg-surface border border-slate-200 dark:border-border-color rounded-xl px-4 text-sm text-slate-900 dark:text-foreground focus:outline-none focus:border-brand-primary/50 transition-all"
                                            required
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="Max Score" 
                                            value={div.maxScore} 
                                            onChange={e => updateDivision(i, 'maxScore', e.target.value)} 
                                            className="w-24 h-12 bg-white dark:bg-surface border border-slate-200 dark:border-border-color rounded-xl px-4 text-sm text-slate-900 dark:text-foreground focus:outline-none focus:border-brand-primary/50 transition-all text-center"
                                            required
                                        />
                                        {subjectDivisions.length > 1 && (
                                            <button type="button" onClick={() => removeDivisionField(i)} className="text-red-500 hover:text-red-600 dark:hover:text-red-400 p-2 transition-colors bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border-color h-12 w-12 flex justify-center items-center">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Total Score Indicator */}
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest">Total Subject Score:</span>
                                    <span className="text-2xl font-black text-slate-900 dark:text-brand-primary">{totalSubjectScore}</span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={isAddingSubject || !subjectName} className={`group relative w-full h-16 font-extrabold text-lg sm:text-xl rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${(!subjectName) ? 'bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-text-muted cursor-not-allowed border border-slate-200 dark:border-border-color' : 'bg-slate-900 text-white hover:bg-brand-primary dark:bg-white dark:text-black dark:hover:bg-brand-primary shadow-lg hover:shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]'}`}>
                                    {isAddingSubject ? (
                                        <span className="relative z-10 flex items-center gap-3">
                                            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Creating...
                                        </span>
                                    ) : (
                                        <span className="relative z-10 flex items-center gap-2">
                                            Add Subject
                                            <svg className="w-6 h-6 opacity-60 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                    );
                })()}
                {/* TAB 3: MANAGE STUDENTS */}
                {activeTab === 'students' && (
                    <div className="w-full max-w-2xl flex flex-col gap-6">
                        
                        {/* 1. Bulk Excel Registration */}
                        <div className="w-full rounded-[2.5rem] bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl border border-slate-200 dark:border-white/[0.05] shadow-xl dark:shadow-[0_8px_40px_0_rgba(0,0,0,0.8)] p-8 sm:p-12 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500">
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                            
                            <div className="text-center mb-8">
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground tracking-tight mb-2">Bulk Registration</h2>
                                <p className="text-sm text-slate-500 dark:text-text-muted font-medium">
                                    Upload an Excel database to register multiple students at once.<br/>
                                    <span className="text-brand-primary font-bold">Headers must be in Row 1: <code className="bg-slate-100 dark:bg-white/10 px-1 rounded mx-1 text-slate-900 dark:text-white">Code</code> and <code className="bg-slate-100 dark:bg-white/10 px-1 rounded mx-1 text-slate-900 dark:text-white">Name</code></span>
                                </p>
                            </div>

                            <form onSubmit={handleStudentsUpload} className="flex flex-col gap-6">
                                <div className="relative group/upload w-full">
                                    <input type="file" id="students-file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleStudentsFileChange} className="hidden" />
                                    <label htmlFor="students-file" className={`flex flex-col items-center justify-center w-full h-32 sm:h-40 border border-slate-300 dark:border-border-color rounded-3xl cursor-pointer transition-all duration-300 shadow-inner backdrop-blur-sm ${studentsFile ? 'bg-brand-primary/10 border-brand-primary/50 shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'bg-slate-50 dark:bg-surface hover:bg-slate-100 dark:hover:bg-white/5 hover:border-brand-primary/30'}`}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                            {studentsFile ? (
                                                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-foreground mb-1 truncate w-full max-w-[16rem]">{studentsFile.name}</p>
                                            ) : (
                                                <p className="text-sm sm:text-base text-slate-500 dark:text-text-muted font-bold mb-1"><span className="text-slate-900 dark:text-foreground">Click to browse</span> (.CSV / .XLSX)</p>
                                            )}
                                        </div>
                                    </label>
                                    <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-hover/upload:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF] dark:shadow-[0_0_10px_#4f46e5]" />
                                </div>

                                <button type="submit" disabled={!studentsFile || isUploadingStudents} className={`group relative w-full h-14 font-extrabold text-base sm:text-lg rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${!studentsFile ? 'bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-text-muted cursor-not-allowed border border-slate-200 dark:border-border-color' : 'bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-brand-primary dark:hover:bg-brand-primary shadow-lg hover:shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]'}`}>
                                    {isUploadingStudents ? (
                                        <span className="relative z-10 flex items-center gap-3">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Uploading...
                                        </span>
                                    ) : (
                                        <span className="relative z-10 flex items-center gap-2">
                                            Process Student Database
                                        </span>
                                    )}
                                </button>
                            </form>
                        </div>
                        {/* 2. Manual Registration */}
                        <div className="w-full rounded-[2.5rem] bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl border border-slate-200 dark:border-white/[0.05] shadow-xl dark:shadow-[0_8px_40px_0_rgba(0,0,0,0.8)] p-8 sm:p-12 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500 delay-100">
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                            
                            <div className="text-center mb-10">
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground tracking-tight mb-2">Register Student</h2>
                                <p className="text-sm text-slate-500 dark:text-text-muted font-medium">Manually register a single student into the university database.</p>
                            </div>

                            <form onSubmit={handleAddStudent} className="flex flex-col gap-6">
                            
                            <div className="relative group/input">
                                <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest mb-2 pl-2">Student Full Name</label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    placeholder="e.g. Ali Ahmed"
                                    className="w-full h-16 bg-white dark:bg-surface border border-slate-200 dark:border-border-color rounded-2xl px-6 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-foreground/20 focus:outline-none focus:bg-slate-50 dark:focus:bg-white/5 focus:border-brand-primary/40 transition-all duration-300 font-bold shadow-inner backdrop-blur-sm"
                                    required
                                />
                                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-focus-within/input:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF] dark:shadow-[0_0_10px_#4f46e5]" />
                            </div>

                            <div className="relative group/input flex-1">
                                <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest mb-2 pl-2">Student Secret Code</label>
                                <input
                                    type="text"
                                    value={studentCode}
                                    onChange={(e) => setStudentCode(e.target.value)}
                                    placeholder="e.g. STU9921"
                                    className="w-full h-16 bg-white dark:bg-surface border border-slate-200 dark:border-border-color rounded-2xl px-6 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-foreground/20 focus:outline-none focus:bg-slate-50 dark:focus:bg-white/5 focus:border-brand-primary/40 transition-all duration-300 font-bold tracking-widest uppercase shadow-inner backdrop-blur-sm"
                                    required
                                />
                                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-focus-within/input:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF] dark:shadow-[0_0_10px_#4f46e5]" />
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={isAddingStudent || !studentName || !studentCode} className={`group relative w-full h-16 text-black font-extrabold text-lg sm:text-xl rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${(!studentName || !studentCode) ? 'bg-white/10 text-text-muted cursor-not-allowed border border-border-color' : 'bg-white hover:bg-brand-primary shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)]'}`}>
                                    {isAddingStudent ? (
                                        <span className="relative z-10 flex items-center gap-3">
                                            <svg className="animate-spin h-6 w-6 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Registering...
                                        </span>
                                    ) : (
                                        <span className="relative z-10 flex items-center gap-2">
                                            Add Student
                                            <svg className="w-6 h-6 opacity-60 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                )}

                {/* TAB 4: SYSTEM ADMIN & SETTINGS */}
                {activeTab === 'settings' && (
                    <div className="w-full max-w-2xl flex flex-col gap-8 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="text-center mb-2">
                            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400 tracking-tight mb-2 drop-shadow-lg">System Management</h2>
                            <p className="text-sm text-red-300/60 font-medium">Warning: Actions here are permanent and cannot be undone.</p>
                        </div>

                        {/* EXISTING SUBJECTS LIST */}
                        {subjectsList.length > 0 && (
                            <div className="w-full rounded-[2.5rem] bg-red-50 dark:bg-red-950/20 backdrop-blur-2xl border border-red-200 dark:border-red-500/20 shadow-lg dark:shadow-[0_8px_40px_0_rgba(153,27,27,0.2)] p-8 sm:p-10 relative overflow-hidden group hover:border-red-300 dark:hover:border-red-500/40 transition-colors">
                                <h3 className="text-xl font-bold tracking-widest text-red-400 mb-6 uppercase text-left flex items-center gap-3">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Manage Subjects
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {subjectsList.map((sub) => (
                                        <div key={sub.id} className="flex items-center justify-between bg-white dark:bg-black/40 border border-red-200 dark:border-red-500/10 p-4 rounded-2xl hover:bg-red-50/50 dark:hover:bg-black/60 transition-colors">
                                            <div>
                                                <p className="text-slate-900 dark:text-foreground font-bold">{sub.name}</p>
                                                <p className="text-xs text-red-500 dark:text-red-400/60 font-mono mt-1">{sub.id}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteSubject(sub.id, sub.name)}
                                                disabled={isDeletingSubject}
                                                className="px-4 py-2 bg-red-900/40 text-red-200 hover:text-foreground hover:bg-red-600 border border-red-800/50 rounded-xl text-xs font-bold transition-all active:scale-95"
                                            >
                                                {isDeletingSubject ? "..." : "Delete"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* DELETE SUBJECT BY CODE ZONE (Added by request) */}
                        <div className="w-full rounded-[2.5rem] bg-red-50 dark:bg-red-950/20 backdrop-blur-2xl border border-red-200 dark:border-red-500/20 shadow-lg dark:shadow-[0_8px_40px_0_rgba(153,27,27,0.2)] p-8 sm:p-10 relative overflow-hidden group hover:border-red-300 dark:hover:border-red-500/40 transition-colors">
                            <h3 className="text-xl font-bold tracking-widest text-red-400 mb-6 uppercase text-left flex items-center gap-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete Subject By Code
                            </h3>
                            <form onSubmit={handleDeleteSubjectByCode} className="flex flex-col gap-5">
                                <div className="relative group/input flex-1">
                                    <label className="block text-xs font-bold text-red-500 dark:text-red-300/60 uppercase tracking-widest mb-2 pl-2">Subject Code / ID</label>
                                    <input
                                        type="text"
                                        value={deleteSubjectCode}
                                        onChange={(e) => setDeleteSubjectCode(e.target.value)}
                                        placeholder="e.g. MATH301"
                                        className="w-full h-14 bg-white dark:bg-surface border border-red-200 dark:border-red-500/10 rounded-2xl px-6 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-foreground/20 focus:outline-none focus:border-red-500/50 transition-all font-bold tracking-widest uppercase shadow-inner hover:bg-slate-50 dark:hover:bg-black/80"
                                    />
                                </div>
                                <button type="submit" disabled={isDeletingSubject || !deleteSubjectCode} className={`group relative w-full h-14 text-white dark:text-foreground font-bold text-base rounded-xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${(!deleteSubjectCode) ? 'bg-slate-300 dark:bg-white/5 text-slate-500 dark:text-text-muted cursor-not-allowed border border-slate-200 dark:border-border-color' : 'bg-red-500 dark:bg-red-600/80 hover:bg-red-600 dark:hover:bg-red-500 shadow-lg'}`}>
                                    {isDeletingSubject ? "Deleting..." : "Permanently Delete Subject"}
                                </button>
                            </form>
                        </div>

                        {/* DELETE GRADEs ZONE */}
                        <div className="w-full rounded-[2.5rem] bg-red-50 dark:bg-red-950/20 backdrop-blur-2xl border border-red-200 dark:border-red-500/20 shadow-lg dark:shadow-[0_8px_40px_0_rgba(153,27,27,0.2)] p-8 sm:p-10 relative overflow-hidden group hover:border-red-300 dark:hover:border-red-500/40 transition-colors">
                            <h3 className="text-xl font-bold tracking-widest text-red-400 mb-6 uppercase text-left flex items-center gap-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>
                                Clear Grades
                            </h3>
                            <form onSubmit={handleDeleteGrades} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-red-500 dark:text-red-300/60 uppercase tracking-widest mb-2 pl-2">Select Subject to Clear Grades</label>
                                    <select value={deleteGradeSubject} onChange={(e) => setDeleteGradeSubject(e.target.value)} className="w-full h-14 bg-white dark:bg-surface border border-red-200 dark:border-red-500/10 rounded-2xl px-4 text-slate-900 dark:text-foreground focus:outline-none focus:border-red-500/50 transition-all font-semibold shadow-inner appearance-none hover:bg-slate-50 dark:hover:bg-black/80">
                                        <option value="" disabled>Select Subject...</option>
                                        {subjectsList.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.id} - {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" disabled={!deleteGradeSubject || isDeletingGrades} className={`group relative w-full h-14 text-white dark:text-foreground font-bold text-base rounded-xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${!deleteGradeSubject ? 'bg-slate-300 dark:bg-white/5 text-slate-500 dark:text-text-muted cursor-not-allowed border border-slate-200 dark:border-border-color' : 'bg-red-500 dark:bg-red-600/80 hover:bg-red-600 dark:hover:bg-red-500 shadow-lg'}`}>
                                    {isDeletingGrades ? "Clearing..." : "Clear All Grades"}
                                </button>
                            </form>
                        </div>

                        {/* DELETE STUDENT ZONE */}
                        <div className="w-full rounded-[2.5rem] bg-red-50 dark:bg-red-950/20 backdrop-blur-2xl border border-red-200 dark:border-red-500/20 shadow-lg dark:shadow-[0_8px_40px_0_rgba(153,27,27,0.2)] p-8 sm:p-10 relative overflow-hidden group hover:border-red-300 dark:hover:border-red-500/40 transition-colors">
                            <h3 className="text-xl font-bold tracking-widest text-red-400 mb-6 uppercase text-left flex items-center gap-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Delete Student
                            </h3>
                            <form onSubmit={handleDeleteStudent} className="flex flex-col gap-5">
                                <div className="relative group/input flex-1">
                                    <label className="block text-xs font-bold text-red-500 dark:text-red-300/60 uppercase tracking-widest mb-2 pl-2">Student Secret Code</label>
                                    <input
                                        type="text"
                                        value={deleteStudentCode}
                                        onChange={(e) => setDeleteStudentCode(e.target.value)}
                                        placeholder="e.g. STU9921"
                                        className="w-full h-14 bg-white dark:bg-surface border border-red-200 dark:border-red-500/10 rounded-2xl px-6 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-foreground/20 focus:outline-none focus:border-red-500/50 transition-all font-bold tracking-widest uppercase shadow-inner hover:bg-slate-50 dark:hover:bg-black/80"
                                    />
                                </div>
                                <button type="submit" disabled={isDeletingStudent || !deleteStudentCode} className={`group relative w-full h-14 text-white dark:text-foreground font-bold text-base rounded-xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${(!deleteStudentCode) ? 'bg-slate-300 dark:bg-white/5 text-slate-500 dark:text-text-muted cursor-not-allowed border border-slate-200 dark:border-border-color' : 'bg-red-500 dark:bg-red-600/80 hover:bg-red-600 dark:hover:bg-red-500 shadow-lg'}`}>
                                    {isDeletingStudent ? "Deleting..." : "Permanently Delete Student"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}