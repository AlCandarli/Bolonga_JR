import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const uploadMode = formData.get("uploadMode") as string;
        const subjectCode = formData.get("subjectCode") as string;
        const examName = formData.get("examName") as string;

        if (!file) {
            return NextResponse.json({ error: "لم يتم العثور على ملف!" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const workbook = xlsx.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // يقرأ السطر الأول كعناوين تلقائياً
        const rawData = xlsx.utils.sheet_to_json(worksheet) as any[];

        // -------------------------------------------------------------
        // الحالة الأولى: تسجيل الطلاب (Complete Database)
        // يدعم وجود عناوين (Code, Name) أو بدون عناوين (تلقائي)
        // -------------------------------------------------------------
        if (uploadMode === "complete") {
            const rawData2D = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            let addedCount = 0;

            for (const row of rawData2D) {
                if (!row || row.length < 2) continue;

                const val0 = String(row[0] || "").trim();
                const val1 = String(row[1] || "").trim();

                // تخطي صف العناوين إذا كان موجوداً
                if (val0.toLowerCase() === 'name' || val1.toLowerCase() === 'code' || val0 === 'الاسم' || val0.toLowerCase() === 'code') {
                    continue;
                }

                // الكود عادة يحتوي على حروف إنجليزية وأرقام ولا يحتوي على مسافات
                const isCode1 = /^[a-zA-Z0-9_.-]+$/.test(val1);
                
                let studentName = val0;
                let studentCode = val1;

                // إذا كان العمود الأول هو الكود بدلاً من الثاني، نبدل القيم
                if (!isCode1 && /^[a-zA-Z0-9_.-]+$/.test(val0)) {
                    studentCode = val0;
                    studentName = val1;
                }

                if (!studentCode || !studentName || studentCode === 'undefined' || studentName === 'undefined') continue;

                await prisma.student.upsert({
                    where: { code: studentCode },
                    update: { name: studentName },
                    create: { code: studentCode, name: studentName },
                });
                addedCount++;
            }

            if (addedCount === 0 && rawData2D.length > 0) {
                return NextResponse.json({ error: "لم يتم العثور على أي بيانات خاضعة لشروط التسجيل! تأكد من الملف الخاص بك." }, { status: 400 });
            }

            return NextResponse.json({ message: `تم تسجيل ${addedCount} طالب بنجاح!` }, { status: 200 });
        }

        // -------------------------------------------------------------
        // الحالة الثانية: رفع الدرجات (Specific Exam)
        // العناوين المطلوبة في الصف الأول: Code, Score
        // -------------------------------------------------------------
        if (uploadMode === "specific" && subjectCode && examName) {
            let gradesCount = 0;
            for (const rawRow of rawData) {
                const row = Object.keys(rawRow).reduce((acc: any, key) => {
                    acc[key.trim().toLowerCase()] = rawRow[key];
                    return acc;
                }, {});

                const valCode = row["code"];
                const valScore = row["score"];

                if (valCode === undefined || valScore === undefined) continue;

                const studentCode = String(valCode).trim();
                const score = String(valScore).trim();

                if (!studentCode || !score) continue;

                const student = await prisma.student.findUnique({
                    where: { code: studentCode }
                });

                if (student) {
                    await prisma.grade.upsert({
                        where: {
                            studentId_subjectId_examName: {
                                studentId: student.id,
                                subjectId: subjectCode,
                                examName: examName,
                            },
                        },
                        update: { score: score },
                        create: {
                            score: score,
                            examName: examName,
                            studentId: student.id,
                            subjectId: subjectCode,
                        },
                    });
                    gradesCount++;
                }
            }

            // إذا كانت الملفات فيها بيانات ولكن لم يتم إضافة أي درجة
            if (gradesCount === 0 && rawData.length > 0) {
                return NextResponse.json({ error: "لم يتم تحديث أي درجة! تأكد أن العناوين هي Code و Score، وتأكد أن أكواد الطلاب مسجلة مسبقاً في النظام." }, { status: 400 });
            }

            return NextResponse.json({ message: `تم تحديث ${gradesCount} درجة بنجاح!` }, { status: 200 });
        }

        // -------------------------------------------------------------
        // الحالة الثالثة: المعالجة الذكية بالذكاء الاصطناعي (AI Semantic Breakdown)
        // -------------------------------------------------------------
        if (uploadMode === "semester" && subjectCode) {
            const rawData2D = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            // 1. Fetch all students rapidly to build a vector map
            const allStudents = await prisma.student.findMany();
            const normalize = (str: string) => str.replace(/\s+/g, ' ').trim().toLowerCase();
            
            const studentMap = new Map<string, any>();
            for (const s of allStudents) {
                studentMap.set(normalize(s.name), s);
            }

            let totalGradesInserted = 0;
            const validTextGrades = ["غائب", "مؤجل", "محروم", "معفى", "صفر", "غ"];
            const skipHeaders = ["code", "id", "كود", "الكود", "الرمز", "رقم الطالب", "رقم التسجيل", "تسلسل", "م", "ت", "تولد"];

            // 2. Scan infinite grid sequentially
            for (let i = 0; i < rawData2D.length; i++) {
                const row = rawData2D[i];
                if (!row) continue;

                let matchedStudent = null;
                let nameColIndex = -1;

                // A. Check if this is a "Grade Row" by hunting for the Anchor (Student Name)
                for (let j = 0; j < row.length; j++) {
                    const cellValue = String(row[j] || "");
                    const normalizedVal = normalize(cellValue);
                    if (!normalizedVal) continue;

                    if (studentMap.has(normalizedVal)) {
                        matchedStudent = studentMap.get(normalizedVal);
                        nameColIndex = j;
                        break;
                    }
                }

                if (!matchedStudent) continue; // Not a student, just pure template formatting row.

                // B. We found the Anchor. Now read Horizontally through this Grade Row.
                for (let j = 0; j < row.length; j++) {
                    if (j === nameColIndex) continue; // Skip their own name

                    const cellValue = row[j];
                    if (cellValue === undefined || cellValue === null || String(cellValue).trim() === "") continue;

                    const scoreStr = String(cellValue).trim();

                    // C. Verify this is a plausible Grade Entity.
                    const isNum = !isNaN(parseFloat(scoreStr)) && isFinite(Number(scoreStr));
                    const isValidText = validTextGrades.includes(scoreStr);

                    if (isNum || isValidText) {
                        // D. Vertical Raycast! Shoot upwards strictly in this column [j] to find the Header Tile.
                        let examName = "امتحان عام";
                        for (let k = i - 1; k >= 0; k--) {
                            const headerRow = rawData2D[k];
                            if (headerRow && headerRow[j]) {
                                const possibleHeader = String(headerRow[j]).trim();
                                // Avoid seizing numbers above as headers (e.g., if there's a 10 above the grade 8)
                                if (possibleHeader !== "" && !(!isNaN(parseFloat(possibleHeader)) && isFinite(Number(possibleHeader)))) {
                                    examName = possibleHeader;
                                    break;
                                }
                            }
                        }

                        // Protect against capturing systemic headers as grading metrics.
                        if (skipHeaders.includes(examName.toLowerCase())) continue;

                        // E. Persist flawlessly exactly what we traced!
                        await prisma.grade.upsert({
                            where: {
                                studentId_subjectId_examName: {
                                    studentId: matchedStudent.id,
                                    subjectId: subjectCode,
                                    examName: examName,
                                },
                            },
                            update: { score: scoreStr },
                            create: {
                                score: scoreStr,
                                examName: examName,
                                studentId: matchedStudent.id,
                                subjectId: subjectCode,
                            },
                        });

                        totalGradesInserted++;
                    }
                }
            }

            if (totalGradesInserted === 0) {
                return NextResponse.json({ error: "لم يتم رصد أي درجات. يرجى التأكد من أن أسماء الطلاب في الملف تتطابق تماماً مع أسمائهم في النظام." }, { status: 400 });
            }

            return NextResponse.json({ message: `تم تسجيل وتقسيم ${totalGradesInserted} درجة لكافة الطلاب في الملف بنجاح وبسرعة عالية بدون الاعتماد على الذكاء الاصطناعي!` }, { status: 200 });
        }

        return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "تأكد من تنسيق الملف وأن العناوين في الصف الأول." }, { status: 500 });
    }
}