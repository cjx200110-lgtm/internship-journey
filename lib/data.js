import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function getReflections() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reflections")
    .select("id,title,content,reflection_date,image_urls,created_at")
    .order("reflection_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getLatestMonthlyReport() {
  const reports = await getPublishedMonthlyReports();
  return reports[0] || null;
}

export async function getPublishedMonthlyReports() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("monthly_reports")
    .select("id,period_start,period_end,overview_lines,reflections,todo_items,status,published_at,created_at")
    .eq("status", "published")
    .order("period_end", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) {
    if (error.message?.includes("status") || error.message?.includes("published_at")) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("monthly_reports")
        .select("id,period_start,period_end,overview_lines,reflections,todo_items,created_at")
        .order("period_end", { ascending: false });

      if (legacyError) {
        throw legacyError;
      }

      return legacyData || [];
    }

    throw error;
  }

  return data || [];
}
