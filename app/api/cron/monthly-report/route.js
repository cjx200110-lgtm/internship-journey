import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getReportPeriod } from "@/lib/reportPeriod";
import { generateMonthlyReport } from "@/lib/generateMonthlyReport";

export async function GET(request) {
  try {
    const secret = process.env.CRON_SECRET;
    const authorization = request.headers.get("authorization");

    if (secret && authorization !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const period = getReportPeriod(new Date());
    const supabase = getSupabaseAdmin();

    const { data: reflections, error: reflectionsError } = await supabase
      .from("reflections")
      .select("id,title,content,reflection_date,created_at")
      .gte("reflection_date", period.startDate)
      .lte("reflection_date", period.endDate)
      .order("reflection_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (reflectionsError) {
      throw reflectionsError;
    }

    const generated = await generateMonthlyReport({
      reflections: reflections || [],
      period
    });

    const { data: report, error: upsertError } = await supabase
      .from("monthly_reports")
      .upsert(
        {
          period_start: period.startDate,
          period_end: period.endDate,
          overview_lines: generated.overview_lines,
          reflections: generated.reflections,
          todo_items: generated.todo_items
        },
        { onConflict: "period_start,period_end" }
      )
      .select("id,period_start,period_end,overview_lines,reflections,todo_items,created_at")
      .single();

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
