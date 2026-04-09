import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename, contentType, size } = await request.json() as {
    filename: string;
    contentType: string;
    size: number;
  };

  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
  }

  if (size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowed.includes(contentType)) {
    return NextResponse.json({ error: "Only PDF and Word documents allowed" }, { status: 400 });
  }

  const ext = filename.split(".").pop() ?? "pdf";
  const key = `resumes/${session.user.id}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION ?? "us-east-1"}.amazonaws.com/${key}`;

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
