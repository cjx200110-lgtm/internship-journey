import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPassword } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const PublishSchema = z.object({
  id: z.string().uuid(),
  password: z.string().optional()
});

export async function POST(request) {
  try {
    const payload = PublishSchema.parse(await request.json());
    assertAdminPassword(payload.password || "");

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("monthly_reports")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", payload.id)
      .select("id,period_start,period_end,overview_lines,reflections,todo_items,status,published_at,created_at,updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ report: data });
  } catch (error) {
    const status = error.status || (error.name === "ZodError" ? 400 : 500);
    return NextResponse.json({ error: error.message }, { status });
  }
}
