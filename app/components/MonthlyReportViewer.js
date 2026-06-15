"use client";

import { useMemo, useState } from "react";

function RichContent({ html }) {
  return <span className="rich-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

function formatDate(value) {
  return value ? value.replaceAll("-", " / ") : "";
}

function getPeriodLabel(report) {
  if (!report?.period_start || !report?.period_end) {
    return "当前月报";
  }

  return `${formatDate(report.period_start)} 至 ${formatDate(report.period_end)}`;
}

export default function MonthlyReportViewer({ reports }) {
  const [selectedId, setSelectedId] = useState(reports[0]?.id || "fallback");
  const report = useMemo(
    () => reports.find((item) => item.id === selectedId) || reports[0],
    [reports, selectedId]
  );

  if (!report) {
    return null;
  }

  return (
    <>
      <div className="report-query-bar">
        <div>
          <span>统计周期</span>
          <b>{getPeriodLabel(report)}</b>
        </div>
        <label>
          查询历史月报
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {reports.map((item) => (
              <option value={item.id} key={item.id}>
                {getPeriodLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="poster-wrap">
        <article className="poster" aria-label="月度工作报告">
          <div className="poster-inner">
            <section className="overview-block">
              <h3>本月工作概况</h3>
              <div className="overview-lines">
                {report.overview_lines.map((line, index) => (
                  <div className="overview-line" key={`${line}-${index}`}>
                    <i>{index + 1}</i>
                    <RichContent html={line} />
                  </div>
                ))}
              </div>
            </section>

            <section className="reflection-block">
              <h3>总结与反思</h3>
              <div className="reflection-list">
                {report.reflections.map((item, index) => (
                  <div className="reflection-item" key={`${item.title}-${index}`}>
                    <b>{item.title}</b>
                    <div className="reflection-text">
                      <span className="label">事例：</span>
                      <RichContent html={item.example} />
                    </div>
                    <div className="reflection-text">
                      <span className="label">分析：</span>
                      <RichContent html={item.analysis} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="todo-block">
              <h3>To do list</h3>
              <div className="todo-list">
                {report.todo_items.map((item, index) => (
                  <div className="todo-item" key={`${item.title}-${index}`}>
                    <i>{index + 1}</i>
                    <div>
                      <b>{item.title}</b>
                      <RichContent html={item.detail} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </article>
      </div>
    </>
  );
}
