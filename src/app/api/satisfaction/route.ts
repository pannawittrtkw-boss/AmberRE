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

// Any logged-in user can submit a satisfaction rating — new submission each
// time, no restriction to once (matches the original Survey model's design).
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { rating, feedback } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    const survey = await prisma.survey.create({
      data: {
        userId: Number((session.user as any).id),
        rating,
        feedback: feedback || null,
      },
    });

    return NextResponse.json({ success: true, data: survey }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
