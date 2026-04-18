import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password } = body;

        if (!password || typeof password !== "string") {
            return NextResponse.json({ error: "Password is required." }, { status: 400 });
        }

        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error("ADMIN_PASSWORD environment variable is not set.");
            return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
        }

        if (password === adminPassword) {
            // Create admin session
            await createSession('admin-dashboard', 'admin');
            return NextResponse.json({ ok: true }, { status: 200 });
        }

        return NextResponse.json({ error: "Invalid password." }, { status: 401 });

    } catch {
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}
