import AdminForm from "@/app/components/AdminForm";
import MonthlyReportEditor from "@/app/components/MonthlyReportEditor";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <main className="admin-page">
      <section className="admin-panel">
        <h1>上传日常心得</h1>
        <AdminForm />
      </section>
      <section className="admin-panel">
        <h1>月报草稿</h1>
        <MonthlyReportEditor />
      </section>
    </main>
  );
}
