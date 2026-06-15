"use client";

import { useEffect, useState } from "react";
import RichTextEditor from "@/app/components/RichTextEditor";

const blankReport = {
  id: null,
  period_start: "",
  period_end: "",
  status: "draft",
  overview_lines: [""],
  reflections: [
    { title: "", example: "", analysis: "" }
  ],
  todo_items: [
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
    overview_lines: report.overview_lines?.length ? report.overview_lines : blankReport.overview_lines,
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

  function addOverview() {
    setReport((current) => ({
      ...current,
      overview_lines: [...current.overview_lines, ""]
    }));
  }

  function removeOverview(index) {
    if (report.overview_lines.length <= 1) {
      return;
    }

    setReport((current) => ({
      ...current,
      overview_lines: current.overview_lines.filter((_, lineIndex) => lineIndex !== index)
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
    setReport((current) => ({
      ...current,
      reflections: [...current.reflections, { title: "", example: "", analysis: "" }]
    }));
  }

  function removeReflection(index) {
    if (report.reflections.length <= 1) {
      return;
    }

    setReport((current) => ({
      ...current,
      reflections: current.reflections.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function addTodo() {
    setReport((current) => ({
      ...current,
      todo_items: [...current.todo_items, { title: "", detail: "" }]
    }));
  }

  function removeTodo(index) {
    if (report.todo_items.length <= 1) {
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
    const payload = {
      ...report,
      overview_lines: report.overview_lines.filter((line) => line.trim()),
      reflections: report.reflections.filter(
        (item) => item.title.trim() && item.example.trim() && item.analysis.trim()
      ),
      todo_items: report.todo_items.filter((item) => item.title.trim() && item.detail.trim()),
      password
    };

    if (!payload.overview_lines.length || !payload.reflections.length || !payload.todo_items.length) {
      setStatus("请至少保留并填写每个模块的一条内容");
      setIsSaving(false);
      return;
    }

    const response = await fetch("/api/admin/monthly-report", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
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
        <div className="editor-row">
          <h2>本月工作概况</h2>
          <button type="button" onClick={addOverview}>
            添加
          </button>
        </div>
        {report.overview_lines.map((line, index) => (
          <div className="editor-card" key={index}>
            <RichTextEditor
              value={line}
              onChange={(value) => updateOverview(index, value)}
              minRows={2}
              placeholder={`概况 ${index + 1}`}
            />
            <button type="button" onClick={() => removeOverview(index)} disabled={report.overview_lines.length <= 1}>
              删除
            </button>
          </div>
        ))}
      </div>

      <div className="report-editor-group">
        <div className="editor-row">
          <h2>总结与反思</h2>
          <button type="button" onClick={addReflection}>
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
            <RichTextEditor
              value={item.example}
              onChange={(value) => updateReflection(index, "example", value)}
              minRows={3}
              placeholder="事例"
            />
            <RichTextEditor
              value={item.analysis}
              onChange={(value) => updateReflection(index, "analysis", value)}
              minRows={3}
              placeholder="分析"
            />
            <button type="button" onClick={() => removeReflection(index)} disabled={report.reflections.length <= 1}>
              删除
            </button>
          </div>
        ))}
      </div>

      <div className="report-editor-group">
        <div className="editor-row">
          <h2>To do list</h2>
          <button type="button" onClick={addTodo}>
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
            <RichTextEditor
              value={item.detail}
              onChange={(value) => updateTodo(index, "detail", value)}
              minRows={2}
              placeholder="内容"
            />
            <button type="button" onClick={() => removeTodo(index)} disabled={report.todo_items.length <= 1}>
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
