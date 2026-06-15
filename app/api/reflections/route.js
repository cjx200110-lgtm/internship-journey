import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPassword } from "@/lib/adminAuth";
import { IMAGE_BUCKET, getImagePaths, uploadReflectionImages } from "@/lib/reflectionImages";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const CreateReflectionSchema = z.object({
  title: z.string().trim().optional().nullable(),
  content: z.string().trim().min(1),
  reflection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  image_urls: z.array(z.string().url()).optional()
});

const UpdateReflectionSchema = CreateReflectionSchema.extend({
  id: z.string().uuid(),
  image_urls: z.array(z.string().url()).optional()
});

const MAX_IMAGE_COUNT = 6;

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
        reflection_date: formData.get("reflection_date"),
        image_urls: JSON.parse(String(formData.get("image_urls") || "[]"))
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

async function parseUpdateRequest(request) {
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
      payload: UpdateReflectionSchema.parse({
        id: formData.get("id"),
        title: formData.get("title") || null,
        content: formData.get("content"),
        reflection_date: formData.get("reflection_date"),
        image_urls: JSON.parse(String(formData.get("image_urls") || "[]"))
      }),
      password: String(formData.get("password") || ""),
      files
    };
  }

  const body = await request.json();
  return {
    payload: UpdateReflectionSchema.parse(body),
    password: String(body.password || ""),
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
    const newImageUrls = await uploadReflectionImages(supabase, files);
    const imageUrls = [...(payload.image_urls || []), ...newImageUrls];

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

export async function PUT(request) {
  try {
    const { payload, password, files } = await parseUpdateRequest(request);
    assertAdminPassword(password);
    const supabase = getSupabaseAdmin();
    const newImageUrls = await uploadReflectionImages(supabase, files);
    const imageUrls = [...(payload.image_urls || []), ...newImageUrls];

    const { data, error } = await supabase
      .from("reflections")
      .update({
        title: payload.title || null,
        content: payload.content,
        reflection_date: payload.reflection_date,
        image_urls: imageUrls
      })
      .eq("id", payload.id)
      .select("id,title,content,reflection_date,image_urls,created_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ reflection: data });
  } catch (error) {
    const status = error.status || (error.name === "ZodError" ? 400 : 500);
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request) {
  try {
    const { id, password } = await request.json();
    assertAdminPassword(password || "");

    if (!id) {
      return NextResponse.json({ error: "Missing reflection id." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: reflection, error: findError } = await supabase
      .from("reflections")
      .select("id,image_urls")
      .eq("id", id)
      .single();

    if (findError) {
      throw findError;
    }

    const { error } = await supabase.from("reflections").delete().eq("id", id);

    if (error) {
      throw error;
    }

    const imagePaths = getImagePaths(reflection.image_urls);

    if (imagePaths.length) {
      await supabase.storage.from(IMAGE_BUCKET).remove(imagePaths);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error.status || (error.name === "ZodError" ? 400 : 500);
    return NextResponse.json({ error: error.message }, { status });
  }
}
