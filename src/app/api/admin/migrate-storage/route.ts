import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 60;

const VERCEL_BLOB = "blob.vercel-storage.com";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

async function migrateFileToR2(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const key = new URL(url).pathname.replace(/^\//, "");
  return uploadToR2(key, buffer, contentType);
}

async function countRemaining() {
  const [propertyImages, projects, successStories, transactions] = await Promise.all([
    prisma.propertyImage.count({ where: { imageUrl: { contains: VERCEL_BLOB } } }),
    prisma.project.count({
      where: {
        OR: [
          { imageUrl: { contains: VERCEL_BLOB } },
          { logoUrl: { contains: VERCEL_BLOB } },
          { photoAlbum: { contains: VERCEL_BLOB } },
        ],
      },
    }),
    prisma.successStory.count({
      where: {
        OR: [
          { imageUrl: { contains: VERCEL_BLOB } },
          { propertyImageUrl: { contains: VERCEL_BLOB } },
        ],
      },
    }),
    prisma.transaction.count({ where: { slipUrl: { contains: VERCEL_BLOB } } }),
  ]);
  return {
    propertyImages,
    projects,
    successStories,
    transactions,
    total: propertyImages + projects + successStories + transactions,
  };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const remaining = await countRemaining();
  return NextResponse.json({ success: true, data: { remaining, r2Configured: isR2Configured() } });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (!isR2Configured()) {
    return NextResponse.json({ success: false, error: "R2 is not configured on this deployment" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  let budget = Math.min(Math.max(parseInt(body.limit, 10) || 30, 1), 100);
  let migrated = 0;
  const errors: string[] = [];

  // ── PropertyImage.imageUrl ──
  if (budget > 0) {
    const rows = await prisma.propertyImage.findMany({
      where: { imageUrl: { contains: VERCEL_BLOB } },
      take: budget,
    });
    for (const row of rows) {
      try {
        const newUrl = await migrateFileToR2(row.imageUrl);
        await prisma.propertyImage.update({ where: { id: row.id }, data: { imageUrl: newUrl } });
        migrated++;
      } catch (e: any) {
        errors.push(`PropertyImage#${row.id}: ${e?.message || e}`);
      }
      budget--;
      if (budget <= 0) break;
    }
  }

  // ── Project.imageUrl / logoUrl / photoAlbum ──
  if (budget > 0) {
    const rows = await prisma.project.findMany({
      where: {
        OR: [
          { imageUrl: { contains: VERCEL_BLOB } },
          { logoUrl: { contains: VERCEL_BLOB } },
          { photoAlbum: { contains: VERCEL_BLOB } },
        ],
      },
      take: budget,
    });
    for (const row of rows) {
      if (budget <= 0) break;
      const data: { imageUrl?: string; logoUrl?: string; photoAlbum?: string } = {};

      if (budget > 0 && row.imageUrl?.includes(VERCEL_BLOB)) {
        try {
          data.imageUrl = await migrateFileToR2(row.imageUrl);
          migrated++;
        } catch (e: any) {
          errors.push(`Project#${row.id}.imageUrl: ${e?.message || e}`);
        }
        budget--;
      }
      if (budget > 0 && row.logoUrl?.includes(VERCEL_BLOB)) {
        try {
          data.logoUrl = await migrateFileToR2(row.logoUrl);
          migrated++;
        } catch (e: any) {
          errors.push(`Project#${row.id}.logoUrl: ${e?.message || e}`);
        }
        budget--;
      }
      if (budget > 0 && row.photoAlbum?.includes(VERCEL_BLOB)) {
        try {
          const photos: string[] = JSON.parse(row.photoAlbum);
          const newPhotos: string[] = [];
          for (const photoUrl of photos) {
            if (budget > 0 && photoUrl.includes(VERCEL_BLOB)) {
              try {
                newPhotos.push(await migrateFileToR2(photoUrl));
                migrated++;
              } catch (e: any) {
                errors.push(`Project#${row.id}.photoAlbum: ${e?.message || e}`);
                newPhotos.push(photoUrl);
              }
              budget--;
            } else {
              newPhotos.push(photoUrl);
            }
          }
          data.photoAlbum = JSON.stringify(newPhotos);
        } catch (e: any) {
          errors.push(`Project#${row.id}.photoAlbum parse: ${e?.message || e}`);
        }
      }

      if (Object.keys(data).length > 0) {
        await prisma.project.update({ where: { id: row.id }, data });
      }
    }
  }

  // ── SuccessStory.imageUrl / propertyImageUrl ──
  if (budget > 0) {
    const rows = await prisma.successStory.findMany({
      where: {
        OR: [
          { imageUrl: { contains: VERCEL_BLOB } },
          { propertyImageUrl: { contains: VERCEL_BLOB } },
        ],
      },
      take: budget,
    });
    for (const row of rows) {
      if (budget <= 0) break;
      const data: { imageUrl?: string; propertyImageUrl?: string } = {};

      if (budget > 0 && row.imageUrl?.includes(VERCEL_BLOB)) {
        try {
          data.imageUrl = await migrateFileToR2(row.imageUrl);
          migrated++;
        } catch (e: any) {
          errors.push(`SuccessStory#${row.id}.imageUrl: ${e?.message || e}`);
        }
        budget--;
      }
      if (budget > 0 && row.propertyImageUrl?.includes(VERCEL_BLOB)) {
        try {
          data.propertyImageUrl = await migrateFileToR2(row.propertyImageUrl);
          migrated++;
        } catch (e: any) {
          errors.push(`SuccessStory#${row.id}.propertyImageUrl: ${e?.message || e}`);
        }
        budget--;
      }

      if (Object.keys(data).length > 0) {
        await prisma.successStory.update({ where: { id: row.id }, data });
      }
    }
  }

  // ── Transaction.slipUrl ──
  if (budget > 0) {
    const rows = await prisma.transaction.findMany({
      where: { slipUrl: { contains: VERCEL_BLOB } },
      take: budget,
    });
    for (const row of rows) {
      try {
        const newUrl = await migrateFileToR2(row.slipUrl!);
        await prisma.transaction.update({ where: { id: row.id }, data: { slipUrl: newUrl } });
        migrated++;
      } catch (e: any) {
        errors.push(`Transaction#${row.id}: ${e?.message || e}`);
      }
      budget--;
      if (budget <= 0) break;
    }
  }

  const remaining = await countRemaining();
  return NextResponse.json({ success: true, data: { migrated, errors, remaining } });
}
