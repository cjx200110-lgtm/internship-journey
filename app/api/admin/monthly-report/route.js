import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPassword } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getReportPeriod } from "@/lib/reportPeriod";

const ReportSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  password: z.string().optional(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  overview_lines: z.array(z.string().trim().min(1)).min(1),
  reflections: z.array(
    z.object({
      title: z.string().trim().min(1),
      example: z.string().trim().min(1),
      analysis: z.string().trim().min(1)
    })
  ).min(1),
  todo_items: z.array(
    z.object({
      title: z.string().trim().min(1),
      detail: z.string().trim().min(1)
    })
  ).min(1)
});

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("monthly_reports")
      .select("id,period_start,period_end,overview_lines,reflections,todo_items,status,published_at,created_at,updated_at")
      .order("period_end", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({ report: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const payload = ReportSchema.parse(await request.json());
    assertAdminPassword(payload.password || "");

    const period = getReportPeriod(new Date());
    const supabase = getSupabaseAdmin();
    const report = {
      period_start: payload.period_start || period.startDate,
      period_end: payload.period_end || period.endDate,
      overview_lines: payload.overview_lines,
      reflections: payload.reflections,
      todo_items: payload.todo_items,
      status: "draft",
      updated_at: new Date().toISOString()
    };

    const query = payload.id
      ? supabase.from("monthly_reports").update(report).eq("id", payload.id)
      : supabase.from("monthly_reports").upsert(report, { onConflict: "period_start,period_end" });

    const { data, error } = await query
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
