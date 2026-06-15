"use client";

import { useEffect, useState } from "react";

function formatDate(value) {
  return value ? value.replaceAll("-", " / ") : "";
}

function stripHtml(value) {
  return (value || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function AdminMonthlyReportRecords() {
  const [reports, setReports] = useState([]);
  const [expandedId, setExpandedId] = useState("");
  const [status, setStatus] = useState("加载中");

  useEffect(() => {
    async function loadReports() {
      const response = await fetch("/api/admin/monthly-report");
      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        const publishedReports = (result.reports || []).filter(
          (report) => report.status === "published"
        );
        setReports(publishedReports);
        setStatus(publishedReports.length ? "" : "暂无月报记录");
      } else {
        setStatus(result.error || "月报记录加载失败");
      }
    }

    loadReports();
  }, []);

  return (
    <div className="monthly-records">
      <div className="admin-record-list">
        {reports.map((report) => (
          <article className="admin-record monthly-record" key={report.id}>
            <div className="admin-record-head">
              <span className="admin-record-date">
                {formatDate(report.period_start)} 至 {formatDate(report.period_end)}
              </span>
              <b className="admin-record-title">月报</b>
              {expandedId === report.id ? null : (
                <p className="admin-record-preview">
                  {(report.overview_lines || []).map(stripHtml).join(" / ").slice(0, 96)}
                </p>
              )}
            </div>
            <div className="admin-record-actions">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === report.id ? "" : report.id)}
              >
                {expandedId === report.id ? "收起" : "查看全文"}
              </button>
            </div>
            {expandedId === report.id ? (
              <div className="monthly-record-full">
                <section>
                  <h3>本月工作概况</h3>
                  {(report.overview_lines || []).map((line, index) => (
                    <div
                      className="rich-content"
                      dangerouslySetInnerHTML={{ __html: line }}
                      key={index}
                    />
                  ))}
                </section>

                <section>
                  <h3>总结与反思</h3>
                  {(report.reflections || []).map((item, index) => (
                    <div className="monthly-record-reflection" key={index}>
                      <b>{item.title}</b>
                      <div className="monthly-record-text">
                        <span>事例：</span>
                        <span
                          className="rich-content"
                          dangerouslySetInnerHTML={{ __html: item.example }}
                        />
                      </div>
                      <div className="monthly-record-text">
                        <span>分析：</span>
                        <span
                          className="rich-content"
                          dangerouslySetInnerHTML={{ __html: item.analysis }}
                        />
                      </div>
                    </div>
                  ))}
                </section>

                <section>
                  <h3>To do list</h3>
                  {(report.todo_items || []).map((item, index) => (
                    <div className="monthly-record-todo" key={index}>
                      <b>{item.title}</b>
                      <div
                        className="rich-content"
                        dangerouslySetInnerHTML={{ __html: item.detail }}
                      />
                    </div>
                  ))}
                </section>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {status ? <p className="form-status">{status}</p> : null}
    </div>
  );
}
