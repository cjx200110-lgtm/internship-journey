"use client";

import { useState } from "react";
import AdminReflectionRecords from "@/app/components/AdminReflectionRecords";
import AdminMonthlyReportRecords from "@/app/components/AdminMonthlyReportRecords";

const recordTabs = [
  { id: "reflections", label: "日常心得" },
  { id: "monthly", label: "月报" }
];

export default function AdminUploadRecords() {
  const [activeTab, setActiveTab] = useState("reflections");

  return (
    <div className="admin-record-tabs">
      <div className="admin-record-tab-list" role="tablist" aria-label="上传记录分类">
        {recordTabs.map((tab) => (
          <button
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            aria-selected={activeTab === tab.id}
            role="tab"
            onClick={() => setActiveTab(tab.id)}
            key={tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "reflections" ? <AdminReflectionRecords /> : null}
      {activeTab === "monthly" ? <AdminMonthlyReportRecords /> : null}
    </div>
  );
}
