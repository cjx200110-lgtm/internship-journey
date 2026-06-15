import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPassword } from "@/lib/adminAuth";
import { IMAGE_BUCKET, getImagePaths, uploadReflectionImages } from "@/lib/reflectionImages";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const DraftSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  title: z.string().trim().optional().nullable(),
  content: z.string().optional().default(""),
  reflection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  image_urls: z.array(z.string().url()).optional()
});

async function parseDraftRequest(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const files = formData
      .getAll("images")
      .filter((file) => file && typeof file === "object" && file.size > 0);

    return {
      payload: DraftSchema.parse({
        id: formData.get("id") || null,
        title: formData.get("title") || null,
        content: String(formData.get("content") || ""),
        reflection_date: formData.get("reflection_date"),
        image_urls: JSON.parse(String(formData.get("image_urls") || "[]"))
      }),
      password: String(formData.get("password") || ""),
      files
    };
  }

  const body = await request.json();
  return {
    payload: DraftSchema.parse(body),
    password: String(body.password || ""),
    files: []
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("reflection_drafts")
      .select("id,title,content,reflection_date,image_urls,created_at,updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ drafts: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { payload, password, files } = await parseDraftRequest(request);
    assertAdminPassword(password);

    if (!payload.title?.trim() && !payload.content?.replace(/<[^>]*>/g, "").trim() && !files.length && !payload.image_urls?.length) {
      return NextResponse.json({ error: "请先填写标题、心得内容或选择图片。" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let oldImageUrls = [];

    if (payload.id) {
      const { data: existingDraft, error: findError } = await supabase
        .from("reflection_drafts")
        .select("id,image_urls")
        .eq("id", payload.id)
        .single();

      if (findError) {
        throw findError;
      }

      oldImageUrls = existingDraft.image_urls || [];
    }

    const newImageUrls = await uploadReflectionImages(supabase, files);
    const imageUrls = [...(payload.image_urls || []), ...newImageUrls];
    const draft = {
      title: payload.title || null,
      content: payload.content || "",
      reflection_date: payload.reflection_date,
      image_urls: imageUrls,
      updated_at: new Date().toISOString()
    };

    const query = payload.id
      ? supabase.from("reflection_drafts").update(draft).eq("id", payload.id)
      : supabase.from("reflection_drafts").insert(draft);

    const { data, error } = await query
      .select("id,title,content,reflection_date,image_urls,created_at,updated_at")
      .single();

    if (error) {
      throw error;
    }

    const removedImagePaths = getImagePaths(oldImageUrls.filter((url) => !imageUrls.includes(url)));

    if (removedImagePaths.length) {
      await supabase.storage.from(IMAGE_BUCKET).remove(removedImagePaths);
    }

    return NextResponse.json({ draft: data });
  } catch (error) {
    const status = error.status || (error.name === "ZodError" ? 400 : 500);
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request) {
  try {
    const { id, password, keep_images } = await request.json();
    assertAdminPassword(password || "");

    if (!id) {
      return NextResponse.json({ error: "Missing draft id." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: draft, error: findError } = await supabase
      .from("reflection_drafts")
      .select("id,image_urls")
      .eq("id", id)
      .single();

    if (findError) {
      throw findError;
    }

    const { error } = await supabase.from("reflection_drafts").delete().eq("id", id);

    if (error) {
      throw error;
    }

    const imagePaths = getImagePaths(draft.image_urls);

    if (!keep_images && imagePaths.length) {
      await supabase.storage.from(IMAGE_BUCKET).remove(imagePaths);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error.status || (error.name === "ZodError" ? 400 : 500);
    return NextResponse.json({ error: error.message }, { status });
  }
}
