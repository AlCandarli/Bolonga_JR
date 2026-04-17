import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Student code is required parameter." }, { status: 400 });
        }

        // Fetch the student and all their grades (with subjects), ordered by newest first.
        const student = await prisma.student.findUnique({
            where: { code: code },
            include: {
                grades: {
                    include: {
                        subject: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found in the database." }, { status: 404 });
        }

        // We want to group the grades by subject so the UI can render Subject Cards easily.
        const subjectsMap = new Map<string, any>();

        for (const grade of student.grades) {
            if (!subjectsMap.has(grade.subjectId)) {
                subjectsMap.set(grade.subjectId, {
                    subjectId: grade.subject.id,
                    subjectName: grade.subject.name,
                    grades: []
                });
            }
            
            subjectsMap.get(grade.subjectId).grades.push({
                id: grade.id,
                examName: grade.examName,
                score: grade.score,
                date: grade.createdAt,
            });
        }

        const enrolledSubjects = Array.from(subjectsMap.values());

        return NextResponse.json({
            studentName: student.name,
            studentCode: student.code,
            subjects: enrolledSubjects,
        }, { status: 200 });

    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ error: "Failed to load student dashboard." }, { status: 500 });
    }
}
