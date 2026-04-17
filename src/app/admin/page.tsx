"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"upload" | "subjects" | "students" | "settings">("upload");

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

    // Add Student States
    const [studentName, setStudentName] = useState("");
    const [studentCode, setStudentCode] = useState("");
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    // أضف هذا الـ State مع بقية الـ States فوق
    const [subjectsList, setSubjectsList] = useState<{ id: string, name: string }[]>([]);

    // هذي الدالة تجيب المواد من الباك إند
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

    // أول ما الإدمن يسجل دخول صحيح، خليه يجيب المواد
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

    const ADMIN_PASSWORD = "123";

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setError("");
        } else {
            setError("Invalid password. Please try again.");
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
        if (!subjectName || !subjectCode) return;

        setIsAddingSubject(true);
        try {
            const res = await fetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: subjectName, code: subjectCode }),
            });

            if (res.ok) {
                alert(`Subject '${subjectName}' added successfully!`);
                setSubjectName("");
                setSubjectCode("");
                fetchSubjects(); // نحدث القائمة المنسدلة مباشرة بعد الإضافة
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
                        <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-full overflow-hidden shadow-2xl p-1 bg-gradient-to-b from-white/10 to-transparent border border-white/10 hover:scale-105 transition-transform duration-500 ease-out cursor-default">
                            <Image src="/logo.jpeg" alt="Bologna JR" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover rounded-full" priority />
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
                                className="w-full h-16 bg-black/50 border border-white/5 rounded-2xl px-6 text-center text-white placeholder:text-white/20 focus:outline-none focus:bg-white/5 focus:border-brand-primary/40 transition-all duration-300 font-bold tracking-[0.2em] shadow-inner backdrop-blur-sm"
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

                        <button type="button" onClick={() => router.push('/')} className="text-white/20 hover:text-white/60 text-xs sm:text-sm font-medium transition-colors mt-2">
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
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-primary opacity-10 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-indigo-900 opacity-[0.12] blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[10px]" />
            </div>

            <nav className="relative z-10 w-full border-b border-white/5 bg-white/[0.02] backdrop-blur-2xl px-5 sm:px-10 py-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 relative rounded-full overflow-hidden shadow-2xl p-0.5 bg-gradient-to-b from-white/10 to-transparent border border-white/10">
                        <Image src="/logo.jpeg" alt="Bologna JR" fill className="object-cover rounded-full" priority />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight">Bologna JR</h1>
                        <p className="text-[10px] text-white/40 mt-0.5 font-medium tracking-widest uppercase">Admin Management</p>
                    </div>
                </div>
                <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 text-xs sm:text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-95 text-white/60 hover:text-red-400 backdrop-blur-sm">
                    Logout
                </button>
            </nav>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-5 w-full my-4">

                {/* TABS NAVIGATOR */}
                <div className="w-full max-w-4xl flex flex-wrap sm:flex-nowrap p-1.5 bg-white/5 backdrop-blur-md rounded-2xl mb-6 border border-white/10 shadow-lg">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'upload' ? 'bg-white text-black shadow-md scale-[1.02]' : 'text-white/50 hover:text-white'}`}
                    >
                        Upload Grades
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'students' ? 'bg-white text-black shadow-md scale-[1.02]' : 'text-white/50 hover:text-white'}`}
                    >
                        Students
                    </button>
                    <button
                        onClick={() => setActiveTab('subjects')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'subjects' ? 'bg-white text-black shadow-md scale-[1.02]' : 'text-white/50 hover:text-white'}`}
                    >
                        Subjects
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'settings' ? 'bg-white text-black shadow-md scale-[1.02]' : 'text-white/50 hover:text-white'}`}
                    >
                        System Admin
                    </button>
                </div>

                {/* TAB 1: UPLOAD GRADES */}
                {activeTab === 'upload' && (
                    <div className="w-full max-w-2xl rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_40px_0_rgba(0,0,0,0.8)] p-8 sm:p-12 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500">
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

                        <div className="text-center mb-8">
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Upload Grades</h2>
                            <p className="text-sm text-white/40 font-medium mb-5">
                                {gradeUploadMode === "specific" 
                                    ? "Upload student scores for a specific exam."
                                    : "Upload a full semester breakdown. Exam columns will be extracted dynamically."
                                }
                                <br/>
                                <span className="text-brand-primary font-bold">
                                    Headers must be in Row 1: <code className="bg-white/10 px-1 rounded mx-1">Code</code> 
                                    {gradeUploadMode === "specific" ? "and" : ""} <code className="bg-white/10 px-1 rounded mx-1">{gradeUploadMode === "specific" ? "Score" : "[Exam 1], [Exam 2]..."}</code>
                                </span>
                            </p>
                            
                            <div className="flex bg-white/5 border border-white/10 rounded-xl max-w-[20rem] mx-auto overflow-hidden p-1">
                                <button type="button" onClick={() => setGradeUploadMode("specific")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gradeUploadMode === "specific" ? "bg-white text-black shadow-md" : "text-white/50 hover:text-white"}`}>Specific Exam</button>
                                <button type="button" onClick={() => setGradeUploadMode("semester")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gradeUploadMode === "semester" ? "bg-white text-black shadow-md" : "text-white/50 hover:text-white"}`}>Full Semester</button>
                            </div>
                        </div>

                        <form onSubmit={handleUpload} className="flex flex-col gap-8">
                            <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 pl-2">Subject</label>
                                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full h-14 bg-black/50 border border-white/10 rounded-2xl px-4 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-semibold shadow-inner appearance-none">
                                        <option value="" disabled>Select Subject...</option>
                                        {subjectsList.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.id} - {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {gradeUploadMode === "specific" && (
                                    <div className="flex-1 animate-in fade-in zoom-in-95">
                                        <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 pl-2">Exam Type</label>
                                        <input type="text" value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Midterm 1" className="w-full h-14 bg-black/50 border border-white/10 rounded-2xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-primary/50 transition-all font-semibold shadow-inner" />
                                    </div>
                                )}
                            </div>

                            {/* File Drag & Drop */}
                            <div className="relative group/upload w-full">
                                <input type="file" id="file-upload" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} className="hidden" />
                                <label htmlFor="file-upload" className={`flex flex-col items-center justify-center w-full h-48 sm:h-56 border border-white/5 rounded-[2rem] cursor-pointer transition-all duration-300 shadow-inner backdrop-blur-sm ${selectedFile ? 'bg-brand-primary/10 border-brand-primary/50 shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'bg-black/50 hover:bg-white/5 hover:border-brand-primary/30'}`}>
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                        {selectedFile ? (
                                            <>
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-primary/20 flex items-center justify-center mb-4 border border-brand-primary/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                                                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                </div>
                                                <p className="text-base sm:text-lg font-bold text-white mb-1 truncate w-full max-w-[16rem]">{selectedFile.name}</p>
                                                <p className="text-[10px] sm:text-xs text-white/40 font-semibold tracking-widest uppercase mt-2">Ready to upload</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover/upload:scale-110 transition-transform duration-300">
                                                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                                </div>
                                                <p className="text-sm sm:text-lg text-white/60 font-bold mb-1"><span className="text-white">Click to browse</span> or drag and drop</p>
                                                <p className="text-[10px] sm:text-xs text-white/30 font-semibold tracking-widest mt-2 uppercase">.CSV / .XLSX</p>
                                            </>
                                        )}
                                    </div>
                                </label>
                                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-hover/upload:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF]" />
                            </div>

                            <button type="submit" disabled={!selectedFile || isUploading} className={`group relative w-full h-16 text-black font-extrabold text-lg sm:text-xl rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${!selectedFile ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5' : 'bg-white hover:bg-brand-primary shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)]'}`}>
                                {isUploading ? (
                                    <span className="relative z-10 flex items-center gap-3">
                                        <svg className="animate-spin h-6 w-6 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processing...
                                    </span>
                                ) : (
                                    <span className="relative z-10 flex items-center gap-2">
                                        Process Exam Grades File
                                        <svg className={`w-6 h-6 opacity-60 transition-transform duration-300 ease-out ${selectedFile ? 'group-hover:-translate-y-1' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB 2: MANAGE SUBJECTS */}
                {activeTab === 'subjects' && (
                    <div className="w-full max-w-2xl rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_40px_0_rgba(0,0,0,0.8)] p-8 sm:p-12 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500">
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

                        <div className="text-center mb-10">
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Add New Subject</h2>
                            <p className="text-sm text-white/40 font-medium">Create a new subject module in the university database.</p>
                        </div>

                        <form onSubmit={handleAddSubject} className="flex flex-col gap-6">

                            <div className="relative group/input">
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 pl-2">Subject Name</label>
                                <input
                                    type="text"
                                    value={subjectName}
                                    onChange={(e) => setSubjectName(e.target.value)}
                                    placeholder="e.g. Advanced Mathematics"
                                    className="w-full h-16 bg-black/50 border border-white/5 rounded-2xl px-6 text-white placeholder:text-white/20 focus:outline-none focus:bg-white/5 focus:border-brand-primary/40 transition-all duration-300 font-bold shadow-inner backdrop-blur-sm"
                                    required
                                />
                                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-focus-within/input:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF]" />
                            </div>

                            <div className="relative group/input flex-1">
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 pl-2">Subject Code / ID</label>
                                <input
                                    type="text"
                                    value={subjectCode}
                                    onChange={(e) => setSubjectCode(e.target.value)}
                                    placeholder="e.g. MATH301"
                                    className="w-full h-16 bg-black/50 border border-white/5 rounded-2xl px-6 text-white placeholder:text-white/20 focus:outline-none focus:bg-white/5 focus:border-brand-primary/40 transition-all duration-300 font-bold tracking-widest uppercase shadow-inner backdrop-blur-sm"
                                    required
                                />
                                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-focus-within/input:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF]" />
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={isAddingSubject || !subjectName || !subjectCode} className={`group relative w-full h-16 text-black font-extrabold text-lg sm:text-xl rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${(!subjectName || !subjectCode) ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5' : 'bg-white hover:bg-brand-primary shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)]'}`}>
                                    {isAddingSubject ? (
                                        <span className="relative z-10 flex items-center gap-3">
                                            <svg className="animate-spin h-6 w-6 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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
                )}
                {/* TAB 3: MANAGE STUDENTS */}
                {activeTab === 'students' && (
                    <div className="w-full max-w-2xl flex flex-col gap-6">
                        
                        {/* 1. Bulk Excel Registration */}
                        <div className="w-full rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_40px_0_rgba(0,0,0,0.8)] p-8 sm:p-12 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500">
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                            
                            <div className="text-center mb-8">
                                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Bulk Registration</h2>
                                <p className="text-sm text-white/40 font-medium">
                                    Upload an Excel database to register multiple students at once.<br/>
                                    <span className="text-brand-primary font-bold">Headers must be in Row 1: <code className="bg-white/10 px-1 rounded mx-1">Code</code> and <code className="bg-white/10 px-1 rounded mx-1">Name</code></span>
                                </p>
                            </div>

                            <form onSubmit={handleStudentsUpload} className="flex flex-col gap-6">
                                <div className="relative group/upload w-full">
                                    <input type="file" id="students-file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleStudentsFileChange} className="hidden" />
                                    <label htmlFor="students-file" className={`flex flex-col items-center justify-center w-full h-32 sm:h-40 border border-white/5 rounded-3xl cursor-pointer transition-all duration-300 shadow-inner backdrop-blur-sm ${studentsFile ? 'bg-brand-primary/10 border-brand-primary/50 shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'bg-black/50 hover:bg-white/5 hover:border-brand-primary/30'}`}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                            {studentsFile ? (
                                                <p className="text-base sm:text-lg font-bold text-white mb-1 truncate w-full max-w-[16rem]">{studentsFile.name}</p>
                                            ) : (
                                                <p className="text-sm sm:text-base text-white/60 font-bold mb-1"><span className="text-white">Click to browse</span> (.CSV / .XLSX)</p>
                                            )}
                                        </div>
                                    </label>
                                    <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-hover/upload:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF]" />
                                </div>

                                <button type="submit" disabled={!studentsFile || isUploadingStudents} className={`group relative w-full h-14 text-black font-extrabold text-base sm:text-lg rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${!studentsFile ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5' : 'bg-white hover:bg-brand-primary shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)]'}`}>
                                    {isUploadingStudents ? (
                                        <span className="relative z-10 flex items-center gap-3">
                                            <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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
                        <div className="w-full rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_40px_0_rgba(0,0,0,0.8)] p-8 sm:p-12 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500 delay-100">
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                            
                            <div className="text-center mb-10">
                                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Register Student</h2>
                                <p className="text-sm text-white/40 font-medium">Manually register a single student into the university database.</p>
                            </div>

                            <form onSubmit={handleAddStudent} className="flex flex-col gap-6">
                            
                            <div className="relative group/input">
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 pl-2">Student Full Name</label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    placeholder="e.g. Ali Ahmed"
                                    className="w-full h-16 bg-black/50 border border-white/5 rounded-2xl px-6 text-white placeholder:text-white/20 focus:outline-none focus:bg-white/5 focus:border-brand-primary/40 transition-all duration-300 font-bold shadow-inner backdrop-blur-sm"
                                    required
                                />
                                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-focus-within/input:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF]" />
                            </div>

                            <div className="relative group/input flex-1">
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 pl-2">Student Secret Code</label>
                                <input
                                    type="text"
                                    value={studentCode}
                                    onChange={(e) => setStudentCode(e.target.value)}
                                    placeholder="e.g. STU9921"
                                    className="w-full h-16 bg-black/50 border border-white/5 rounded-2xl px-6 text-white placeholder:text-white/20 focus:outline-none focus:bg-white/5 focus:border-brand-primary/40 transition-all duration-300 font-bold tracking-widest uppercase shadow-inner backdrop-blur-sm"
                                    required
                                />
                                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-focus-within/input:w-3/4 transition-all duration-500 ease-out shadow-[0_0_10px_#00E5FF]" />
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={isAddingStudent || !studentName || !studentCode} className={`group relative w-full h-16 text-black font-extrabold text-lg sm:text-xl rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${(!studentName || !studentCode) ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5' : 'bg-white hover:bg-brand-primary shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)]'}`}>
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
                            <div className="w-full rounded-[2.5rem] bg-red-950/20 backdrop-blur-2xl border border-red-500/20 shadow-[0_8px_40px_0_rgba(153,27,27,0.2)] p-8 sm:p-10 relative overflow-hidden group hover:border-red-500/40 transition-colors">
                                <h3 className="text-xl font-bold tracking-widest text-red-400 mb-6 uppercase text-left flex items-center gap-3">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Manage Subjects
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {subjectsList.map((sub) => (
                                        <div key={sub.id} className="flex items-center justify-between bg-black/40 border border-red-500/10 p-4 rounded-2xl hover:bg-black/60 transition-colors">
                                            <div>
                                                <p className="text-white font-bold">{sub.name}</p>
                                                <p className="text-xs text-red-400/60 font-mono mt-1">{sub.id}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteSubject(sub.id, sub.name)}
                                                disabled={isDeletingSubject}
                                                className="px-4 py-2 bg-red-900/40 text-red-200 hover:text-white hover:bg-red-600 border border-red-800/50 rounded-xl text-xs font-bold transition-all active:scale-95"
                                            >
                                                {isDeletingSubject ? "..." : "Delete"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* DELETE SUBJECT BY CODE ZONE (Added by request) */}
                        <div className="w-full rounded-[2.5rem] bg-red-950/20 backdrop-blur-2xl border border-red-500/20 shadow-[0_8px_40px_0_rgba(153,27,27,0.2)] p-8 sm:p-10 relative overflow-hidden group hover:border-red-500/40 transition-colors">
                            <h3 className="text-xl font-bold tracking-widest text-red-400 mb-6 uppercase text-left flex items-center gap-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete Subject By Code
                            </h3>
                            <form onSubmit={handleDeleteSubjectByCode} className="flex flex-col gap-5">
                                <div className="relative group/input flex-1">
                                    <label className="block text-xs font-bold text-red-300/60 uppercase tracking-widest mb-2 pl-2">Subject Code / ID</label>
                                    <input
                                        type="text"
                                        value={deleteSubjectCode}
                                        onChange={(e) => setDeleteSubjectCode(e.target.value)}
                                        placeholder="e.g. MATH301"
                                        className="w-full h-14 bg-black/50 border border-red-500/10 rounded-2xl px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-all font-bold tracking-widest uppercase shadow-inner hover:bg-black/80"
                                    />
                                </div>
                                <button type="submit" disabled={isDeletingSubject || !deleteSubjectCode} className={`group relative w-full h-14 text-white font-bold text-base rounded-xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${(!deleteSubjectCode) ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' : 'bg-red-600/80 hover:bg-red-500 shadow-lg'}`}>
                                    {isDeletingSubject ? "Deleting..." : "Permanently Delete Subject"}
                                </button>
                            </form>
                        </div>

                        {/* DELETE GRADEs ZONE */}
                        <div className="w-full rounded-[2.5rem] bg-red-950/20 backdrop-blur-2xl border border-red-500/20 shadow-[0_8px_40px_0_rgba(153,27,27,0.2)] p-8 sm:p-10 relative overflow-hidden group hover:border-red-500/40 transition-colors">
                            <h3 className="text-xl font-bold tracking-widest text-red-400 mb-6 uppercase text-left flex items-center gap-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>
                                Clear Grades
                            </h3>
                            <form onSubmit={handleDeleteGrades} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-red-300/60 uppercase tracking-widest mb-2 pl-2">Select Subject to Clear Grades</label>
                                    <select value={deleteGradeSubject} onChange={(e) => setDeleteGradeSubject(e.target.value)} className="w-full h-14 bg-black/50 border border-red-500/10 rounded-2xl px-4 text-white focus:outline-none focus:border-red-500/50 transition-all font-semibold shadow-inner appearance-none hover:bg-black/80">
                                        <option value="" disabled>Select Subject...</option>
                                        {subjectsList.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.id} - {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" disabled={!deleteGradeSubject || isDeletingGrades} className={`group relative w-full h-14 text-white font-bold text-base rounded-xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${!deleteGradeSubject ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' : 'bg-red-600/80 hover:bg-red-500 shadow-lg'}`}>
                                    {isDeletingGrades ? "Clearing..." : "Clear All Grades"}
                                </button>
                            </form>
                        </div>

                        {/* DELETE STUDENT ZONE */}
                        <div className="w-full rounded-[2.5rem] bg-red-950/20 backdrop-blur-2xl border border-red-500/20 shadow-[0_8px_40px_0_rgba(153,27,27,0.2)] p-8 sm:p-10 relative overflow-hidden group hover:border-red-500/40 transition-colors">
                            <h3 className="text-xl font-bold tracking-widest text-red-400 mb-6 uppercase text-left flex items-center gap-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Delete Student
                            </h3>
                            <form onSubmit={handleDeleteStudent} className="flex flex-col gap-5">
                                <div className="relative group/input flex-1">
                                    <label className="block text-xs font-bold text-red-300/60 uppercase tracking-widest mb-2 pl-2">Student Secret Code</label>
                                    <input
                                        type="text"
                                        value={deleteStudentCode}
                                        onChange={(e) => setDeleteStudentCode(e.target.value)}
                                        placeholder="e.g. STU9921"
                                        className="w-full h-14 bg-black/50 border border-red-500/10 rounded-2xl px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-all font-bold tracking-widest uppercase shadow-inner hover:bg-black/80"
                                    />
                                </div>
                                <button type="submit" disabled={isDeletingStudent || !deleteStudentCode} className={`group relative w-full h-14 text-white font-bold text-base rounded-xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden ${(!deleteStudentCode) ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' : 'bg-red-600/80 hover:bg-red-500 shadow-lg'}`}>
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