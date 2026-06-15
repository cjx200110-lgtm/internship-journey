"use client";

import { useEffect, useRef, useState } from "react";
import RichTextEditor from "@/app/components/RichTextEditor";
import PasswordDialog from "@/app/components/PasswordDialog";

const DRAFT_STORAGE_KEY = "jessie-reflection-upload-drafts";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function stripHtml(value) {
  return (value || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function AdminForm() {
  const [title, setTitle] = useState("");
  const [reflectionDate, setReflectionDate] = useState(today());
  const [content, setContent] = useState("");
  const [activeDraftId, setActiveDraftId] = useState("");
  const [imageCount, setImageCount] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    function handleDraftSelected(event) {
      const draft = event.detail;

      if (!draft) {
        return;
      }

      setTitle(draft.title || "");
      setReflectionDate(draft.reflection_date || today());
      setContent(draft.content || "");
      setActiveDraftId(draft.id);
      setImageCount(0);
      setFileInputKey((value) => value + 1);
      setStatus("已载入草稿，图片需重新选择");
    }

    window.addEventListener("reflection-draft-selected", handleDraftSelected);

    return () => {
      window.removeEventListener("reflection-draft-selected", handleDraftSelected);
    };
  }, []);

  function getDrafts() {
    const savedDrafts = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "[]");
    return Array.isArray(savedDrafts) ? savedDrafts : [];
  }

  function persistDrafts(nextDrafts) {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts));
    window.dispatchEvent(new Event("reflection-drafts-updated"));
  }

  function resetForm() {
    setTitle("");
    setReflectionDate(today());
    setContent("");
    setImageCount(0);
    setFileInputKey((value) => value + 1);
    setActiveDraftId("");
  }

  function saveDraft() {
    const plainText = stripHtml(content);

    if (!title.trim() && !plainText) {
      setStatus("请先填写标题或心得内容");
      return;
    }

    const draft = {
      id: activeDraftId || crypto.randomUUID(),
      title: title.trim(),
      reflection_date: reflectionDate,
      content,
      updated_at: new Date().toISOString()
    };
    const drafts = getDrafts();
    const nextDrafts = activeDraftId
      ? drafts.map((item) => (item.id === activeDraftId ? draft : item))
      : [draft, ...drafts];

    persistDrafts(nextDrafts);
    setActiveDraftId(draft.id);
    setStatus("草稿已保存");
  }

  async function submitReflection(password) {
    setIsSubmitting(true);
    setStatus("");

    const form = formRef.current;
    const formData = new FormData(form);
    formData.set("title", title.trim());
    formData.set("content", content);
    formData.set("reflection_date", reflectionDate);
    formData.set("password", password);

    const response = await fetch("/api/reflections", {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      if (activeDraftId) {
        const drafts = getDrafts();
        persistDrafts(drafts.filter((item) => item.id !== activeDraftId));
      }
      resetForm();
      setStatus("已保存");
      window.dispatchEvent(new Event("reflection-records-updated"));
    } else {
      const result = await response.json().catch(() => ({}));
      setStatus(result.error || "保存失败");
    }

    setIsSubmitting(false);
    setShowPasswordDialog(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setShowPasswordDialog(true);
  }

  return (
    <>
      <form className="admin-form" ref={formRef} onSubmit={handleSubmit}>
        <label>
          日期
          <input
            name="reflection_date"
            type="date"
            value={reflectionDate}
            onChange={(event) => setReflectionDate(event.target.value)}
            required
          />
        </label>
        <label>
          标题
          <input
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="可不填"
          />
        </label>
        <label>
          心得
          <RichTextEditor
            value={content}
            onChange={setContent}
            minRows={8}
            placeholder="写下今天的心得"
          />
        </label>
        <label>
          图片
          <input
            key={fileInputKey}
            name="images"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setImageCount(event.target.files?.length || 0)}
          />
          <span className="file-help">
            {imageCount > 0 ? `已选择 ${imageCount} 张图片` : "可选择多张图片"}
          </span>
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中" : "上传日常心得"}
        </button>
        <button type="button" className="secondary-button" onClick={saveDraft} disabled={isSubmitting}>
          存为草稿
        </button>
        {status ? <p className="form-status">{status}</p> : null}
      </form>
      <PasswordDialog
        open={showPasswordDialog}
        title="上传日常心得"
        confirmLabel="确认上传"
        isBusy={isSubmitting}
        onCancel={() => setShowPasswordDialog(false)}
        onConfirm={submitReflection}
      />
    </>
  );
}
