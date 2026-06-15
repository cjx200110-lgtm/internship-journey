"use client";

import { useEffect, useState } from "react";
import RichTextEditor from "@/app/components/RichTextEditor";
import PasswordDialog from "@/app/components/PasswordDialog";

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
  const [drafts, setDrafts] = useState([]);
  const [status, setStatus] = useState("加载中");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  async function loadReports(activeId = "") {
    const response = await fetch("/api/admin/monthly-report");
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      const nextDrafts = result.drafts || [];
      const activeReport =
        nextDrafts.find((item) => item.id === activeId) ||
        (result.reports || []).find((item) => item.id === activeId) ||
        result.report ||
        null;

      setDrafts(nextDrafts);
      setReport(normalizeReport(activeReport));
      setStatus(activeReport ? "已加载月报草稿" : "暂无月报草稿");
    } else {
      setStatus(result.error || "月报加载失败");
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  function newDraft() {
    setReport(normalizeReport(null));
    setStatus("已新建空白草稿");
  }

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

  function requestSaveDraft() {
    setIsSaving(true);
    setStatus("");
    const payload = {
      ...report,
      period_start: report.period_start || undefined,
      period_end: report.period_end || undefined,
      overview_lines: report.overview_lines.filter((line) => line.trim()),
      reflections: report.reflections.filter(
        (item) => item.title.trim() && item.example.trim() && item.analysis.trim()
      ),
      todo_items: report.todo_items.filter((item) => item.title.trim() && item.detail.trim())
    };

    if (!payload.overview_lines.length || !payload.reflections.length || !payload.todo_items.length) {
      setStatus("请至少保留并填写每个模块的一条内容");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setPendingAction({ type: "save", payload });
  }

  async function saveDraft(payload, password) {
    setIsSaving(true);
    setStatus("");

    const response = await fetch("/api/admin/monthly-report", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, password })
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setReport(normalizeReport(result.report));
      await loadReports(result.report.id);
      setStatus("草稿已保存");
    } else {
      setStatus(result.error || "草稿保存失败");
    }

    setIsSaving(false);
    setPendingAction(null);
  }

  function requestPublishReport() {
    if (!report.id) {
      setStatus("请先保存草稿");
      return;
    }

    setPendingAction({ type: "publish", id: report.id });
  }

  async function publishReport(id, password) {
    setIsSaving(true);
    setStatus("");

    const response = await fetch("/api/admin/monthly-report/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password })
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setReport(normalizeReport(result.report));
      await loadReports(result.report.id);
      setStatus("已发布到展示页面");
    } else {
      setStatus(result.error || "发布失败");
    }

    setIsSaving(false);
    setPendingAction(null);
  }

  async function confirmPendingAction(password) {
    if (pendingAction?.type === "save") {
      await saveDraft(pendingAction.payload, password);
    }

    if (pendingAction?.type === "publish") {
      await publishReport(pendingAction.id, password);
    }
  }

  return (
    <div className="report-editor">
      <div className="report-draft-box">
        <div className="editor-row">
          <h2>月报草稿</h2>
          <button type="button" onClick={newDraft}>
            新建草稿
          </button>
        </div>
        {drafts.length ? (
          <div className="report-draft-list">
            {drafts.map((draft) => (
              <button
                type="button"
                className={draft.id === report.id ? "active" : ""}
                onClick={() => {
                  setReport(normalizeReport(draft));
                  setStatus("已切换草稿");
                }}
                key={draft.id}
              >
                <span>{draft.period_start} 至 {draft.period_end}</span>
                <small>{draft.updated_at ? `更新于 ${draft.updated_at.slice(0, 10)}` : "未更新"}</small>
              </button>
            ))}
          </div>
        ) : (
          <p className="form-status">暂无草稿</p>
        )}
      </div>

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

      <div className="report-editor-actions">
        <button type="button" onClick={requestSaveDraft} disabled={isSaving}>
          保存草稿
        </button>
        <button type="button" onClick={requestPublishReport} disabled={isSaving || !report.id}>
          发布到展示页面
        </button>
      </div>
      {status ? <p className="form-status">{status}</p> : null}
      <PasswordDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.type === "publish" ? "发布到展示页面" : "保存月报草稿"}
        confirmLabel={pendingAction?.type === "publish" ? "确认发布" : "确认保存"}
        isBusy={isSaving}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </div>
  );
}
