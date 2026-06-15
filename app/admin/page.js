import AdminTabs from "@/app/components/AdminTabs";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <main className="admin-page">
      <AdminTabs />
    </main>
  );
}
