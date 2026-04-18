import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        // Verify student code in database
        const student = await prisma.student.findUnique({
            where: { code: code }
        });

        if (!student) {
            return NextResponse.json({ error: "Invalid student code. Please check again." }, { status: 401 });
        }

        // Create student session
        await createSession(student.code, 'student');

        return NextResponse.json({ 
            message: "Login successful", 
            studentName: student.name 
        }, { status: 200 });

    } catch (error) {
        console.error("Login API error:", error);
        return NextResponse.json({ error: "An error occurred during login." }, { status: 500 });
    }
}
