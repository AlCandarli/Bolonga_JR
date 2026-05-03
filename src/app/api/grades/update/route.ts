import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const body = await req.json();
        const { studentCode, divisionId, newScore } = body;

        if (!studentCode || !divisionId || newScore === undefined || newScore === null) {
            return NextResponse.json({ error: "Missing required fields: studentCode, divisionId, newScore" }, { status: 400 });
        }

        const score = parseFloat(String(newScore));
        if (isNaN(score) || score < 0) {
            return NextResponse.json({ error: "Invalid score value. Must be a non-negative number." }, { status: 400 });
        }

        // Find the student by their code
        const student = await prisma.student.findUnique({
            where: { code: studentCode.trim() },
        });

        if (!student) {
            return NextResponse.json({ error: `Student with code "${studentCode}" not found.` }, { status: 404 });
        }

        // Find the division to validate maxScore
        const division = await prisma.subjectDivision.findUnique({
            where: { id: divisionId },
        });

        if (!division) {
            return NextResponse.json({ error: "Division not found." }, { status: 404 });
        }

        if (division.maxScore !== null && score > division.maxScore) {
            return NextResponse.json({
                error: `Score ${score} exceeds the maximum allowed score of ${division.maxScore} for this division.`
            }, { status: 400 });
        }

        // Check if a grade record already exists
        const existingGrade = await prisma.grade.findUnique({
            where: {
                studentId_divisionId: {
                    studentId: student.id,
                    divisionId: divisionId,
                }
            }
        });

        if (!existingGrade) {
            return NextResponse.json({
                error: `No existing grade found for student "${studentCode}" in this division. Use the grade upload feature to add a new grade first.`
            }, { status: 404 });
        }

        // Update the grade
        const updatedGrade = await prisma.grade.update({
            where: { id: existingGrade.id },
            data: { score },
        });

        return NextResponse.json({
            message: `Grade updated successfully! Student: ${student.name} | Old score: ${existingGrade.score} → New score: ${score}`,
            grade: updatedGrade,
            studentName: student.name,
            oldScore: existingGrade.score,
            newScore: score,
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating grade:", error);
        return NextResponse.json({ error: "Internal server error while updating grade." }, { status: 500 });
    }
}
