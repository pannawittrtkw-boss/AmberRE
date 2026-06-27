/**
 * One-time migration: copy all Vercel Blob images to Cloudflare R2
 * and update database URLs.
 *
 * Run AFTER July 24 2026 when Blob store unblocks:
 *   node scripts/migrate-blob-to-r2.mjs
 *
 * Requires env vars: DATABASE_URL, CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 *                    R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
 */

import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const BLOB_DOMAIN = "alztehjc7ufhivh9.public.blob.vercel-storage.com";

const prisma = new PrismaClient();
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function isBlobUrl(url) {
  return typeof url === "string" && url.includes(BLOB_DOMAIN);
}

// Extract path from Blob URL → use as R2 key
function blobUrlToKey(url) {
  const u = new URL(url);
  return u.pathname.replace(/^\//, "");
}

async function migrateUrl(url) {
  if (!isBlobUrl(url)) return url;
  const key = blobUrlToKey(url);

  // Check if already migrated (R2 key exists)
  const r2Url = `${process.env.R2_PUBLIC_URL}/${key}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  SKIP (fetch failed ${res.status}): ${url}`);
      return url;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buf,
        ContentType: contentType,
      })
    );

    console.log(`  OK: ${key}`);
    return r2Url;
  } catch (err) {
    console.error(`  ERROR: ${url}`, err.message);
    return url;
  }
}

async function main() {
  console.log("=== Blob → R2 Migration ===\n");

  // 1. PropertyImage
  const propImages = await prisma.propertyImage.findMany({
    where: { imageUrl: { contains: BLOB_DOMAIN } },
    select: { id: true, imageUrl: true },
  });
  console.log(`PropertyImage: ${propImages.length} rows to migrate`);
  for (const row of propImages) {
    const newUrl = await migrateUrl(row.imageUrl);
    if (newUrl !== row.imageUrl) {
      await prisma.propertyImage.update({
        where: { id: row.id },
        data: { imageUrl: newUrl },
      });
    }
  }

  // 2. Contract signedPdfUrl
  const contracts = await prisma.contract.findMany({
    where: { signedPdfUrl: { contains: BLOB_DOMAIN } },
    select: { id: true, signedPdfUrl: true },
  });
  console.log(`\nContract signedPdfUrl: ${contracts.length} rows to migrate`);
  for (const row of contracts) {
    const newUrl = await migrateUrl(row.signedPdfUrl);
    if (newUrl !== row.signedPdfUrl) {
      await prisma.contract.update({
        where: { id: row.id },
        data: { signedPdfUrl: newUrl },
      });
    }
  }

  // 3. User profileImage
  const users = await prisma.user.findMany({
    where: { profileImage: { contains: BLOB_DOMAIN } },
    select: { id: true, profileImage: true },
  });
  console.log(`\nUser profileImage: ${users.length} rows to migrate`);
  for (const row of users) {
    const newUrl = await migrateUrl(row.profileImage);
    if (newUrl !== row.profileImage) {
      await prisma.user.update({
        where: { id: row.id },
        data: { profileImage: newUrl },
      });
    }
  }

  console.log("\n=== Done ===");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
