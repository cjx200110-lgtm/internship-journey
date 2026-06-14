import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const CreateReflectionSchema = z.object({
  title: z.string().trim().optional().nullable(),
  content: z.string().trim().min(1),
  reflection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const IMAGE_BUCKET = "reflection-images";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_IMAGE_COUNT = 6;

function getExtension(file) {
  const fromName = file.name?.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  const fromType = file.type?.split("/").pop()?.toLowerCase();
  return fromType && /^[a-z0-9]+$/.test(fromType) ? fromType : "png";
}

function assertAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;

  if (expected && password !== expected) {
    const error = new Error("上传密码不正确。");
    error.status = 401;
    throw error;
  }
}

async function ensureImageBucket(supabase) {
  const { error } = await supabase.storage.createBucket(IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_SIZE,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"]
  });

  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

async function uploadImages(supabase, files) {
  const imageUrls = [];

  if (!files.length) {
    return imageUrls;
  }

  await ensureImageBucket(supabase);

  for (const file of files) {
    if (!file.type?.startsWith("image/")) {
      throw new Error("只能上传图片文件。");
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("单张图片不能超过 8MB。");
    }

    const extension = getExtension(file);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const bytes = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }

  return imageUrls;
}

async function parseRequest(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const files = formData
      .getAll("images")
      .filter((file) => file && typeof file === "object" && file.size > 0);

    if (files.length > MAX_IMAGE_COUNT) {
      throw new Error(`一次最多上传 ${MAX_IMAGE_COUNT} 张图片。`);
    }

    return {
      payload: CreateReflectionSchema.parse({
        title: formData.get("title") || null,
        content: formData.get("content"),
        reflection_date: formData.get("reflection_date")
      }),
      password: String(formData.get("password") || ""),
      files
    };
  }

  return {
    payload: CreateReflectionSchema.parse(await request.json()),
    password: "",
    files: []
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("reflections")
      .select("id,title,content,reflection_date,image_urls,created_at")
      .order("reflection_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ reflections: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { payload, password, files } = await parseRequest(request);
    assertAdminPassword(password);
    const supabase = getSupabaseAdmin();
    const imageUrls = await uploadImages(supabase, files);

    const { data, error } = await supabase
      .from("reflections")
      .insert({
        title: payload.title || null,
        content: payload.content,
        reflection_date: payload.reflection_date,
        image_urls: imageUrls
      })
      .select("id,title,content,reflection_date,image_urls,created_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ reflection: data }, { status: 201 });
  } catch (error) {
    const status = error.status || (error.name === "ZodError" ? 400 : 500);
    return NextResponse.json({ error: error.message }, { status });
  }
}
