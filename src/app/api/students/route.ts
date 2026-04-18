import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { code, name } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "Please provide student name and code" }, { status: 400 });
    }

    if (String(name).length > 255 || String(code).length > 100) {
      return NextResponse.json({ error: "Input too long." }, { status: 400 });
    }

    const student = await prisma.student.upsert({
      where: { code: code },
      update: { name: name },
      create: { code: code, name: name },
    });

    return NextResponse.json({ message: "Student added successfully!", student }, { status: 200 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json({ error: "Failed to add student" }, { status: 500 });
  }
}

// دالة لحذف طالب من خلال الكود
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Missing student code" }, { status: 400 });

    await prisma.student.delete({ where: { code: code } });
    return NextResponse.json({ message: "Student deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete student. Perhaps code does not exist?" }, { status: 500 });
  }
}

// دالة لجلب جميع الطلاب
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const students = await prisma.student.findMany({
      orderBy: { name: 'asc' },
      select: { code: true, name: true }
    });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
