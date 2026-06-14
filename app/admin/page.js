import AdminForm from "@/app/components/AdminForm";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <main className="admin-page">
      <section className="admin-panel">
        <h1>上传日常心得</h1>
        <AdminForm />
      </section>
    </main>
  );
}
