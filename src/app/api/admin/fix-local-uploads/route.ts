import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

// Old records saved as a relative "/uploads/xxx.jpg" path — a local dev
// filesystem path that was never deployed (public/uploads is gitignored),
// so the file only ever existed on whoever's machine wrote it.
type Item = { key: string; model: "SuccessStory" | "PropertyImage"; id: number; field: string; filename: string };

const ALLOWED_FIELDS: Record<Item["model"], string[]> = {
  SuccessStory: ["imageUrl", "propertyImageUrl"],
  PropertyImage: ["imageUrl"],
};

function filenameOf(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/uploads/")) return null;
  return value.slice("/uploads/".length);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const [stories, propertyImages] = await Promise.all([
    prisma.successStory.findMany({
      where: {
        OR: [{ imageUrl: { startsWith: "/uploads" } }, { propertyImageUrl: { startsWith: "/uploads" } }],
      },
    }),
    prisma.propertyImage.findMany({ where: { imageUrl: { startsWith: "/uploads" } } }),
  ]);

  const items: Item[] = [];
  for (const s of stories) {
    const imgName = filenameOf(s.imageUrl);
    if (imgName) items.push({ key: `SuccessStory:${s.id}:imageUrl`, model: "SuccessStory", id: s.id, field: "imageUrl", filename: imgName });
    const propName = filenameOf(s.propertyImageUrl);
    if (propName) items.push({ key: `SuccessStory:${s.id}:propertyImageUrl`, model: "SuccessStory", id: s.id, field: "propertyImageUrl", filename: propName });
  }
  for (const p of propertyImages) {
    const name = filenameOf(p.imageUrl);
    if (name) items.push({ key: `PropertyImage:${p.id}:imageUrl`, model: "PropertyImage", id: p.id, field: "imageUrl", filename: name });
  }

  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const { model, id, field, url } = body as { model: Item["model"]; id: number; field: string; url: string };

  if (!ALLOWED_FIELDS[model]?.includes(field) || !Number.isInteger(id) || typeof url !== "string" || !url.startsWith("http")) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  if (model === "SuccessStory") {
    await prisma.successStory.update({ where: { id }, data: { [field]: url } });
  } else {
    await prisma.propertyImage.update({ where: { id }, data: { [field]: url } });
  }

  return NextResponse.json({ success: true });
}
