"use client";

import { useEffect, useState } from "react";

const blankReport = {
  id: null,
  period_start: "",
  period_end: "",
  status: "draft",
  overview_lines: ["", "", ""],
  reflections: [
    { title: "", example: "", analysis: "" },
    { title: "", example: "", analysis: "" }
  ],
  todo_items: [
    { title: "", detail: "" },
    { title: "", detail: "" },
    { title: "", detail: "" }
  ]
};

function normalizeReport(report) {
  if (!report) {
    return blankReport;
  }

  return {
    ...blankReport,
    ...report,
    overview_lines: [...(report.overview_lines || []), "", "", ""].slice(0, 3),
    reflections: report.reflections?.length ? report.reflections : blankReport.reflections,
    todo_items: report.todo_items?.length ? report.todo_items : blankReport.todo_items
  };
}

export default function MonthlyReportEditor() {
  const [report, setReport] = useState(blankReport);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("加载中");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadReport() {
      const response = await fetch("/api/admin/monthly-report");
      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        setReport(normalizeReport(result.report));
        setStatus(result.report ? "已加载月报草稿" : "暂无 AI 月报草稿");
      } else {
        setStatus(result.error || "月报加载失败");
      }
    }

    loadReport();
  }, []);

  function updateOverview(index, value) {
    setReport((current) => ({
      ...current,
      overview_lines: current.overview_lines.map((line, lineIndex) =>
        lineIndex === index ? value : line
      )
    }));
  }

  function updateReflection(index, key, value) {
    setReport((current) => ({
      ...current,
      reflections: current.reflections.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  }

  function updateTodo(index, key, value) {
    setReport((current) => ({
      ...current,
      todo_items: current.todo_items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  }

  function addReflection() {
    if (report.reflections.length >= 4) {
      return;
    }

    setReport((current) => ({
      ...current,
      reflections: [...current.reflections, { title: "", example: "", analysis: "" }]
    }));
  }

  function removeReflection(index) {
    if (report.reflections.length <= 2) {
      return;
    }

    setReport((current) => ({
      ...current,
      reflections: current.reflections.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function addTodo() {
    if (report.todo_items.length >= 5) {
      return;
    }

    setReport((current) => ({
      ...current,
      todo_items: [...current.todo_items, { title: "", detail: "" }]
    }));
  }

  function removeTodo(index) {
    if (report.todo_items.length <= 3) {
      return;
    }

    setReport((current) => ({
      ...current,
      todo_items: current.todo_items.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function saveDraft() {
    setIsSaving(true);
    setStatus("");

    const response = await fetch("/api/admin/monthly-report", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...report, password })
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setReport(normalizeReport(result.report));
      setStatus("草稿已保存");
    } else {
      setStatus(result.error || "草稿保存失败");
    }

    setIsSaving(false);
  }

  async function publishReport() {
    if (!report.id) {
      setStatus("请先保存草稿");
      return;
    }

    setIsSaving(true);
    setStatus("");

    const response = await fetch("/api/admin/monthly-report/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: report.id, password })
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setReport(normalizeReport(result.report));
      setStatus("已发布到展示页面");
    } else {
      setStatus(result.error || "发布失败");
    }

    setIsSaving(false);
  }

  return (
    <div className="report-editor">
      <div className="report-editor-meta">
        <span>{report.period_start && report.period_end ? `${report.period_start} 至 ${report.period_end}` : "当前月报"}</span>
        <span>{report.status === "published" ? "已发布" : "草稿"}</span>
      </div>

      <div className="report-editor-group">
        <h2>本月工作概况</h2>
        {report.overview_lines.map((line, index) => (
          <textarea
            key={index}
            value={line}
            onChange={(event) => updateOverview(index, event.target.value)}
            rows={2}
          />
        ))}
      </div>

      <div className="report-editor-group">
        <div className="editor-row">
          <h2>总结与反思</h2>
          <button type="button" onClick={addReflection} disabled={report.reflections.length >= 4}>
            添加
          </button>
        </div>
        {report.reflections.map((item, index) => (
          <div className="editor-card" key={index}>
            <input
              value={item.title}
              onChange={(event) => updateReflection(index, "title", event.target.value)}
              placeholder="标题"
            />
            <textarea
              value={item.example}
              onChange={(event) => updateReflection(index, "example", event.target.value)}
              rows={3}
              placeholder="事例"
            />
            <textarea
              value={item.analysis}
              onChange={(event) => updateReflection(index, "analysis", event.target.value)}
              rows={3}
              placeholder="分析"
            />
            <button type="button" onClick={() => removeReflection(index)} disabled={report.reflections.length <= 2}>
              删除
            </button>
          </div>
        ))}
      </div>

      <div className="report-editor-group">
        <div className="editor-row">
          <h2>To do list</h2>
          <button type="button" onClick={addTodo} disabled={report.todo_items.length >= 5}>
            添加
          </button>
        </div>
        {report.todo_items.map((item, index) => (
          <div className="editor-card" key={index}>
            <input
              value={item.title}
              onChange={(event) => updateTodo(index, "title", event.target.value)}
              placeholder="标题"
            />
            <textarea
              value={item.detail}
              onChange={(event) => updateTodo(index, "detail", event.target.value)}
              rows={2}
              placeholder="内容"
            />
            <button type="button" onClick={() => removeTodo(index)} disabled={report.todo_items.length <= 3}>
              删除
            </button>
          </div>
        ))}
      </div>

      <label className="report-password">
        上传密码
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>

      <div className="report-editor-actions">
        <button type="button" onClick={saveDraft} disabled={isSaving}>
          保存草稿
        </button>
        <button type="button" onClick={publishReport} disabled={isSaving || !report.id}>
          发布到展示页面
        </button>
      </div>
      {status ? <p className="form-status">{status}</p> : null}
    </div>
  );
}
