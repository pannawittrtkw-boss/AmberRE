import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Public: approved submissions only, for the results display.
export async function GET() {
  try {
    const surveys = await prisma.survey.findMany({
      where: { isApproved: true },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: surveys });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Open to anyone, logged in or not — new submission each time, no
// restriction to once (matches the original Survey model's design). A
// logged-in submitter is still linked via userId for admin's reference,
// but the display name is whatever they typed (or blank for anonymous).
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { rating, feedback, name, anonymous } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    const survey = await prisma.survey.create({
      data: {
        userId: session?.user ? Number((session.user as any).id) : null,
        rating,
        feedback: feedback || null,
        name: anonymous ? null : (typeof name === "string" && name.trim() ? name.trim().slice(0, 200) : null),
      },
    });

    return NextResponse.json({ success: true, data: survey }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
