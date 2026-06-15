"use client";

import { useState } from "react";
import AdminForm from "@/app/components/AdminForm";
import AdminReflectionRecords from "@/app/components/AdminReflectionRecords";
import MonthlyReportEditor from "@/app/components/MonthlyReportEditor";

const tabs = [
  { id: "upload", label: "日常心得上传" },
  { id: "records", label: "上传记录" },
  { id: "drafts", label: "草稿箱" }
];

export default function AdminTabs() {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="admin-tabs">
      <div className="admin-tab-list" role="tablist" aria-label="后台分页">
        {tabs.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
            key={tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="admin-panel" role="tabpanel">
        {activeTab === "upload" ? (
          <>
            <h1>日常心得上传</h1>
            <AdminForm />
          </>
        ) : null}

        {activeTab === "records" ? (
          <>
            <h1>上传记录</h1>
            <AdminReflectionRecords />
          </>
        ) : null}

        {activeTab === "drafts" ? (
          <>
            <h1>草稿箱</h1>
            <MonthlyReportEditor />
          </>
        ) : null}
      </section>
    </div>
  );
}
