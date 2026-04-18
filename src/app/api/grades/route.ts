import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    
    if (!subjectId) {
        return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });
    }

    // Delete all grades corresponding to this subject
    const result = await prisma.grade.deleteMany({
        where: { subjectId }
    });

    return NextResponse.json({ message: `Successfully deleted ${result.count} grades for subject.` }, { status: 200 });
  } catch (error) {
    console.error("Error deleting grades:", error);
    return NextResponse.json({ error: "Failed to delete grades." }, { status: 500 });
  }
}
