import { NextResponse } from "next/server";
import { getLatestMonthlyReport } from "@/lib/data";

export async function GET() {
  try {
    const report = await getLatestMonthlyReport();
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
