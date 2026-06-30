export function isR2Configured(): boolean {
  return !!(
    process.env.R2_WORKER_URL &&
    process.env.R2_UPLOAD_SECRET
  );
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const workerUrl = process.env.R2_WORKER_URL!;
  const secret = process.env.R2_UPLOAD_SECRET!;

  const res = await fetch(`${workerUrl}/${key}`, {
    method: "PUT",
    body: body instanceof Buffer ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer : (body as Uint8Array).buffer as ArrayBuffer,
    headers: {
      "Content-Type": contentType,
      "X-Upload-Secret": secret,
    },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.status.toString());
    throw new Error(`R2 Worker upload failed: ${res.status} ${msg}`);
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}
