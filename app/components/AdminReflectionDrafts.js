"use client";

import { useEffect, useState } from "react";

const DRAFT_STORAGE_KEY = "jessie-reflection-upload-drafts";

function stripHtml(value) {
  return (value || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function readDrafts() {
  const savedDrafts = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "[]");
  return Array.isArray(savedDrafts) ? savedDrafts : [];
}

export default function AdminReflectionDrafts() {
  const [drafts, setDrafts] = useState([]);

  function loadDrafts() {
    setDrafts(readDrafts());
  }

  useEffect(() => {
    loadDrafts();
    window.addEventListener("reflection-drafts-updated", loadDrafts);
    window.addEventListener("storage", loadDrafts);

    return () => {
      window.removeEventListener("reflection-drafts-updated", loadDrafts);
      window.removeEventListener("storage", loadDrafts);
    };
  }, []);

  function continueDraft(draft) {
    window.dispatchEvent(new CustomEvent("reflection-draft-selected", { detail: draft }));
    window.dispatchEvent(new CustomEvent("admin-tab-selected", { detail: "upload" }));
  }

  function deleteDraft(id) {
    const nextDrafts = drafts.filter((item) => item.id !== id);
    setDrafts(nextDrafts);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts));
    window.dispatchEvent(new Event("reflection-drafts-updated"));
  }

  return (
    <div className="reflection-draft-box">
      {drafts.length ? (
        <div className="reflection-draft-list">
          {drafts.map((draft) => (
            <article className="reflection-draft-item" key={draft.id}>
              <div>
                <span>{draft.reflection_date?.replaceAll("-", " / ")}</span>
                <b>{draft.title || "无标题"}</b>
                <p>{stripHtml(draft.content).slice(0, 72)}</p>
              </div>
              <div>
                <button type="button" onClick={() => continueDraft(draft)}>
                  继续编辑
                </button>
                <button type="button" onClick={() => deleteDraft(draft.id)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="form-status">暂无日常心得草稿</p>
      )}
      <p className="file-help">草稿保存文字内容；图片需在正式上传前重新选择。</p>
    </div>
  );
}
