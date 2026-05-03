"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, FileSpreadsheet, Keyboard, Save, CheckCircle, AlertCircle, X, Check } from "lucide-react";
import * as XLSX from "xlsx";

type Subject = { id: string; name: string; divisions?: { id: string, name: string, maxScore: number }[] };
type GradeEntry = { name: string; code: string; score: string; [key: string]: string };

const DataCell = ({ initialValue, rowIndex, colIndex, header, onBlurUpdate }: { initialValue: string, rowIndex: number, colIndex: number, header: string, onBlurUpdate: (rowIndex: number, header: string, value: string) => void }) => {
    const [val, setVal] = useState(initialValue);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setVal(initialValue);
    }, [initialValue]);

    return (
        <div className="w-full relative">
            {isEditing ? (
                <input
                    type="text"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    onBlur={() => {
                        setIsEditing(false);
                        onBlurUpdate(rowIndex, header, val);
                    }}
                    autoFocus
                    className="w-full bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-foreground px-3 py-2 rounded-lg outline-none border border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
            ) : (
                <div 
                    onClick={() => setIsEditing(true)}
                    className="w-full px-3 py-2 text-sm font-semibold text-slate-700 dark:text-foreground/90 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg cursor-text min-h-[36px] transition-colors flex items-center"
                >
                    {val || <span className="text-slate-400 dark:text-text-muted italic">Click to enter</span>}
                </div>
            )}
        </div>
    );
};
interface AdminGradeUploaderProps {
    subjectsList: Subject[];
}

export default function AdminGradeUploader({ subjectsList }: AdminGradeUploaderProps) {
    const [entryMode, setEntryMode] = useState<"file" | "manual">("file");
    const [gradeUploadMode, setGradeUploadMode] = useState<"specific" | "semester">("specific");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedDivision, setSelectedDivision] = useState("");
    
    // Grid Data State
    const [gridData, setGridData] = useState<GradeEntry[]>([]);
    const [gridHeaders, setGridHeaders] = useState<string[]>([]);
    
    // File state
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Manual state
    const [students, setStudents] = useState<{ code: string; name: string }[]>([]);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    
    // Submission state
    const [isUploading, setIsUploading] = useState(false);

    // Get current subject to show its divisions
    const currentSubjectObj = subjectsList.find(s => s.id === selectedSubject);

    // Fetch students when switching to manual mode for the first time
    useEffect(() => {
        if (entryMode === "manual" && students.length === 0) {
            fetchStudents();
        }
    }, [entryMode]);

    const fetchStudents = async () => {
        setIsFetchingStudents(true);
        try {
            const res = await fetch("/api/students");
            if (res.ok) {
                const data = await res.json();
                
                // If API returns no students, let's mock 10 students for demo/admin purposes
                const studentList = data.length > 0 ? data : Array.from({ length: 10 }, (_, i) => ({
                    code: `STU${1000 + i}`,
                    name: `Mock Student ${i + 1}`
                }));

                setStudents(studentList);

                // Initialize grid with students
                const initialGrid = studentList.map((s: any) => ({
                    Code: s.code,
                    Name: s.name,
                    Score: ""
                }));
                setGridData(initialGrid);
                setGridHeaders(["Code", "Name", "Score"]);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setIsFetchingStudents(false);
        }
    };

    // Handle File Drop / Select
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFileName(file.name);
            await parseFileToGrid(file);
        }
    };

    const parseFileToGrid = (file: File) => {
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                    
                    if (json.length > 0) {
                        const headers = json[0].map(h => String(h).trim());
                        setGridHeaders(headers);
                        
                        const rows = json.slice(1).map(row => {
                            const entry: any = {};
                            headers.forEach((header, index) => {
                                entry[header] = row[index] !== undefined ? String(row[index]) : "";
                            });
                            return entry;
                        }).filter(row => row.Code || row.code); // Filter empty rows
                        
                        setGridData(rows);
                        setEntryMode("file");
                    }
                    resolve();
                } catch (error) {
                    console.error("Error parsing file:", error);
                    alert("Failed to parse the file. Ensure it's a valid CSV/XLSX.");
                    reject(error);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    };

    // On Blur handler sent to DataCell to update the actual parent state
    const handleCellChange = (rowIndex: number, column: string, value: string) => {
        setGridData((prev) => {
            const newData = [...prev];
            newData[rowIndex] = { ...newData[rowIndex], [column]: value };
            return newData;
        });
    };

    const handleClear = () => {
        setGridData([]);
        setGridHeaders([]);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Save & Publish
    const handleSaveAndPublish = async () => {
        if (!selectedSubject) {
            alert("Please select a subject.");
            return;
        }
        if (gradeUploadMode === "specific" && !selectedDivision) {
            alert("Please select a subject division.");
            return;
        }
        if (gridData.length === 0) {
            alert("No data to save.");
            return;
        }

        setIsUploading(true);

        try {
            // Reconstruct CSV from gridData
            const headerRow = gridHeaders.join(",");
            const csvRows = gridData.map(row => {
                return gridHeaders.map(header => {
                    const cell = row[header] || row[header.toLowerCase()] || row[header.charAt(0).toUpperCase() + header.slice(1)];
                    return `"${(cell || "").replace(/"/g, '""')}"`;
                }).join(",");
            });
            const csvContent = [headerRow, ...csvRows].join("\n");
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const file = new File([blob], fileName || "manual_entry.csv", { type: "text/csv" });

            const formData = new FormData();
            formData.append("file", file);
            formData.append("uploadMode", gradeUploadMode);
            formData.append("subjectCode", selectedSubject);
            if (gradeUploadMode === "specific") {
                formData.append("divisionId", selectedDivision);
            }

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const resData = await response.json();
                alert(resData.message || "Grades processed successfully!");
                handleClear();
                setSelectedDivision("");
                setSelectedSubject("");
                if (entryMode === "manual") {
                    fetchStudents(); // Reset manual grid
                }
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

    return (
        <div className="w-full max-w-4xl rounded-[2.5rem] bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-8 sm:p-12 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500 backdrop-blur-md">
            <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground tracking-tight mb-2">Upload Grades</h2>
                <div className="flex bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl max-w-[20rem] mx-auto overflow-hidden p-1 mb-5 shadow-sm">
                    <button type="button" onClick={() => setGradeUploadMode("specific")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gradeUploadMode === "specific" ? "bg-white text-slate-900 shadow-md dark:bg-white/20 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white"}`}>Specific Division</button>
                    <button type="button" onClick={() => setGradeUploadMode("semester")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gradeUploadMode === "semester" ? "bg-white text-slate-900 shadow-md dark:bg-white/20 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white"}`}>Full Semester</button>
                </div>
            </div>

            {/* Config Area */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest mb-2 pl-2">Subject</label>
                    <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setSelectedDivision(""); }} className="w-full h-14 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all font-semibold shadow-inner appearance-none custom-select">
                        <option value="" disabled>Select Subject...</option>
                        {subjectsList.map((sub) => (
                            <option key={sub.id} value={sub.id}>{sub.id} - {sub.name}</option>
                        ))}
                    </select>
                </div>
                {gradeUploadMode === "specific" && (
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-text-muted uppercase tracking-widest mb-2 pl-2">Division</label>
                        <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)} disabled={!currentSubjectObj || !currentSubjectObj.divisions || currentSubjectObj.divisions.length === 0} className="w-full h-14 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all font-semibold shadow-inner appearance-none custom-select disabled:opacity-50 disabled:cursor-not-allowed">
                            <option value="" disabled>{(!currentSubjectObj || !currentSubjectObj.divisions || currentSubjectObj.divisions.length === 0) ? "No divisions found for subject" : "Select Division..."}</option>
                            {currentSubjectObj?.divisions?.map((div) => (
                                <option key={div.id} value={div.id}>{div.name} (Max: {div.maxScore})</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Entry Mode Toggles */}
            <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
                <button 
                    onClick={() => { setEntryMode("file"); setGradeUploadMode("specific"); }} 
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${entryMode === "file" ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'}`}
                >
                    <FileSpreadsheet className="w-5 h-5" />
                    Upload from File
                </button>
                <button 
                    onClick={() => { setEntryMode("manual"); setGradeUploadMode("specific"); }} 
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${entryMode === "manual" ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'}`}
                >
                    <Keyboard className="w-5 h-5" />
                    Manual Entry
                </button>
            </div>

            {/* File Dropzone - Shows when in file mode and no data yet */}
            {entryMode === "file" && gridData.length === 0 && (
                <div className="relative group/upload w-full mb-8">
                    <input type="file" id="file-upload" ref={fileInputRef} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border border-slate-300 dark:border-white/10 border-dashed rounded-[2rem] cursor-pointer bg-slate-50/50 dark:bg-black/30 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-brand-primary/40 dark:hover:border-brand-primary/40 transition-all duration-300 backdrop-blur-sm">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-white dark:bg-white/5 shadow-sm flex items-center justify-center mb-4 group-hover/upload:scale-110 transition-transform duration-300 border border-slate-200 dark:border-transparent">
                                <Upload className="w-8 h-8 text-slate-400 dark:text-white/40 group-hover/upload:text-brand-primary" />
                            </div>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-white/70 font-bold mb-1"><span className="text-slate-900 dark:text-white underline decoration-brand-primary/50 underline-offset-4">Click to browse</span> or drag and drop</p>
                            <p className="text-xs text-slate-400 dark:text-white/30 font-semibold mt-2 uppercase tracking-widest">Excel or CSV</p>
                        </div>
                    </label>
                </div>
            )}

            {/* Data Grid Section */}
            {gridData.length > 0 && (
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {entryMode === "file" ? <FileSpreadsheet className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> : <Keyboard className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
                            {entryMode === "file" ? `Data Preview: ${fileName}` : "Student Roster Setup"}
                        </h3>
                        {entryMode === "file" && (
                            <button onClick={handleClear} className="text-xs font-bold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-1 bg-red-50 dark:bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-400/20 hover:bg-red-100 dark:hover:bg-red-400/20 transition-all">
                                <X className="w-4 h-4" /> Cancel
                            </button>
                        )}
                    </div>
                    
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl relative custom-scrollbar bg-white dark:bg-[#050505]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                    {gridHeaders.map(h => (
                                        <th key={h} className="p-4 text-xs font-black text-brand-primary uppercase tracking-widest whitespace-nowrap bg-slate-50 dark:bg-black/40 sticky top-0 backdrop-blur-md">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {gridData.map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                        {gridHeaders.map((header, colIdx) => {
                                            const isEditable = header.toLowerCase() !== 'name' && header.toLowerCase() !== 'code';

                                            return (
                                                <td key={`${rIdx}-${header}`} className="p-2 min-w-[120px]">
                                                    {isEditable ? (
                                                        <DataCell 
                                                            initialValue={row[header] || ""}
                                                            rowIndex={rIdx}
                                                            colIndex={colIdx}
                                                            header={header}
                                                            onBlurUpdate={handleCellChange}
                                                        />
                                                    ) : (
                                                        <span className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-white/70 block truncate max-w-[200px]" title={row[header]}>{row[header] || "-"}</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {gridData.length === 0 && entryMode === "manual" && !isFetchingStudents && (
                            <div className="p-8 text-center text-slate-400 dark:text-slate-500">No students found. Register some students first.</div>
                        )}
                        {isFetchingStudents && (
                            <div className="p-8 text-center text-indigo-500 flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Loading student roster...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sticky Save Button */}
            <div className={`mt-4 pt-4 border-t border-border-color transition-all duration-500 ${gridData.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <button 
                    onClick={handleSaveAndPublish}
                    disabled={isUploading || gridData.length === 0} 
                    className="group relative w-full h-16 bg-white hover:bg-brand-primary text-black font-extrabold text-lg sm:text-xl rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center overflow-hidden"
                >
                    {isUploading ? (
                        <span className="relative z-10 flex items-center gap-3">
                            <svg className="animate-spin h-6 w-6 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Saving Grades...
                        </span>
                    ) : (
                        <span className="relative z-10 flex items-center gap-2">
                            <Save className="w-6 h-6 opacity-70 group-hover:scale-110 transition-transform" />
                            Save & Publish Grades
                        </span>
                    )}
                </button>
            </div>
            
            {/* Custom CSS for hiding the default select arrow to make it look cleaner (optional) */}
            <style jsx>{`
                .custom-select {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
                    background-repeat: no-repeat;
                    background-position-x: 96%;
                    background-position-y: 50%;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 229, 255, 0.4);
                }
            `}</style>
        </div>
    );
}
