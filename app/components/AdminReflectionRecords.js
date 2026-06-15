"use client";

import { useEffect, useState } from "react";

function stripHtml(value) {
  return (value || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function formatDate(value) {
  return value ? value.replaceAll("-", " / ") : "";
}

export default function AdminReflectionRecords() {
  const [records, setRecords] = useState([]);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("加载中");
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadRecords() {
    const response = await fetch("/api/reflections");
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setRecords(result.reflections || []);
      setStatus(result.reflections?.length ? "" : "暂无上传记录");
    } else {
      setStatus(result.error || "上传记录加载失败");
    }
  }

  useEffect(() => {
    loadRecords();
    window.addEventListener("reflection-records-updated", loadRecords);

    return () => {
      window.removeEventListener("reflection-records-updated", loadRecords);
    };
  }, []);

  async function deleteRecord(id) {
    setIsDeleting(true);
    setStatus("");

    const response = await fetch("/api/reflections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password })
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setRecords((current) => current.filter((item) => item.id !== id));
      setStatus("已删除");
    } else {
      setStatus(result.error || "删除失败");
    }

    setIsDeleting(false);
  }

  return (
    <div className="admin-records">
      <label>
        上传密码
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      <div className="admin-record-list">
        {records.map((item) => (
          <article className="admin-record" key={item.id}>
            <div>
              <span className="admin-record-date">{formatDate(item.reflection_date)}</span>
              <b>{item.title || "无标题"}</b>
              <p>{stripHtml(item.content).slice(0, 96)}</p>
            </div>
            <button type="button" onClick={() => deleteRecord(item.id)} disabled={isDeleting}>
              删除
            </button>
          </article>
        ))}
      </div>
      {status ? <p className="form-status">{status}</p> : null}
    </div>
  );
}
