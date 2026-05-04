import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        category: true,
        author: { select: { firstName: true, lastName: true } },
      },
    });

    if (!article) {
      return NextResponse.json({ success: false, error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: article });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { slug } = await params;
    const body = await req.json();

    const article = await prisma.article.update({
      where: { slug },
      data: {
        ...(body.titleTh !== undefined && { titleTh: body.titleTh }),
        ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
        ...(body.contentTh !== undefined && { contentTh: body.contentTh }),
        ...(body.contentEn !== undefined && { contentEn: body.contentEn }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.featuredImage !== undefined && { featuredImage: body.featuredImage }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
      },
    });

    return NextResponse.json({ success: true, data: article });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { slug } = await params;
    await prisma.article.delete({ where: { slug } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
