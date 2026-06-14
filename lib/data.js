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
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("monthly_reports")
    .select("id,period_start,period_end,overview_lines,reflections,todo_items,created_at")
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
