"use client";

import { useEffect, useState } from "react";
import PasswordDialog from "@/app/components/PasswordDialog";

function stripHtml(value) {
  return (value || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function formatDate(value) {
  return value ? value.replaceAll("-", " / ") : "";
}

export default function AdminReflectionDrafts() {
  const [drafts, setDrafts] = useState([]);
  const [status, setStatus] = useState("加载中");
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadDrafts() {
    const response = await fetch("/api/reflection-drafts");
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setDrafts(result.drafts || []);
      setStatus(result.drafts?.length ? "" : "暂无日常心得草稿");
    } else {
      setStatus(result.error || "日常心得草稿加载失败");
    }
  }

  useEffect(() => {
    loadDrafts();
    window.addEventListener("reflection-drafts-updated", loadDrafts);

    return () => {
      window.removeEventListener("reflection-drafts-updated", loadDrafts);
    };
  }, []);

  function continueDraft(draft) {
    sessionStorage.setItem("selected-reflection-draft", JSON.stringify(draft));
    window.dispatchEvent(new CustomEvent("admin-tab-selected", { detail: "upload" }));
  }

  async function deleteDraft(password) {
    setIsDeleting(true);
    setStatus("");

    const response = await fetch("/api/reflection-drafts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pendingDeleteId, password })
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setDrafts((current) => current.filter((item) => item.id !== pendingDeleteId));
      setStatus("草稿已删除");
      setPendingDeleteId("");
    } else {
      setStatus(result.error || "删除失败");
    }

    setIsDeleting(false);
  }

  return (
    <div className="reflection-draft-box">
      {drafts.length ? (
        <div className="reflection-draft-list">
          {drafts.map((draft) => (
            <article className="reflection-draft-item" key={draft.id}>
              <div>
                <span>{formatDate(draft.reflection_date)}</span>
                <b>{draft.title || "无标题"}</b>
                <p>{stripHtml(draft.content).slice(0, 72)}</p>
                {draft.image_urls?.length ? <small>{draft.image_urls.length} 张图片</small> : null}
              </div>
              <div>
                <button type="button" onClick={() => continueDraft(draft)}>
                  继续编辑
                </button>
                <button type="button" onClick={() => setPendingDeleteId(draft.id)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="form-status">{status}</p>
      )}
      <p className="file-help">草稿会保存文字和图片，换设备也可以继续编辑。</p>
      <PasswordDialog
        open={Boolean(pendingDeleteId)}
        title="删除日常心得草稿"
        confirmLabel="确认删除"
        isBusy={isDeleting}
        onCancel={() => setPendingDeleteId("")}
        onConfirm={deleteDraft}
      />
    </div>
  );
}
