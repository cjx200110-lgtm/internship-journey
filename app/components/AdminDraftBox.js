"use client";

import AdminReflectionDrafts from "@/app/components/AdminReflectionDrafts";
import MonthlyReportEditor from "@/app/components/MonthlyReportEditor";

export default function AdminDraftBox() {
  return (
    <div className="admin-draft-modules">
      <section className="admin-draft-module">
        <h2>日常心得</h2>
        <AdminReflectionDrafts />
      </section>
      <section className="admin-draft-module">
        <h2>AI生成的月度报告</h2>
        <MonthlyReportEditor />
      </section>
    </div>
  );
}
