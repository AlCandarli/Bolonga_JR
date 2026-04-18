import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// هذي الدالة (POST) عشان نضيف مادة جديدة للداتا بيس
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await req.json();
        const { code, name } = body;

        if (!code || !name) {
            return NextResponse.json({ error: "Please provide subject name and code" }, { status: 400 });
        }

        if (String(name).length > 255 || String(code).length > 100) {
            return NextResponse.json({ error: "Input too long." }, { status: 400 });
        }

        // نحفظ المادة (بنخلي رمز المادة هو الـ ID عشان نضمن إنه ما يتكرر)
        const subject = await prisma.subject.upsert({
            where: { id: code },
            update: { name: name },
            create: { id: code, name: name },
        });

        return NextResponse.json({ message: "Subject added successfully!", subject }, { status: 200 });
    } catch (error) {
        console.error("Error creating subject:", error);
        return NextResponse.json({ error: "Failed to add subject" }, { status: 500 });
    }
}

// هذي الدالة (GET) عشان نجيب كل المواد ونعرضها في القائمة المنسدلة
export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const subjects = await prisma.subject.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(subjects, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
    }
}

// دالة لحذف مادة بصلاحيات الادمن
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing subject id" }, { status: 400 });

        await prisma.subject.delete({ where: { id } });
        return NextResponse.json({ message: "Subject deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
    }
}