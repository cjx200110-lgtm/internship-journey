"use client";

import { useEffect, useRef, useState } from "react";
import RichTextEditor from "@/app/components/RichTextEditor";
import PasswordDialog from "@/app/components/PasswordDialog";

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
  const [activeDraftImageUrls, setActiveDraftImageUrls] = useState([]);
  const [imageCount, setImageCount] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    function applyDraft(draft) {
      if (!draft) {
        return;
      }

      setTitle(draft.title || "");
      setReflectionDate(draft.reflection_date || today());
      setContent(draft.content || "");
      setActiveDraftId(draft.id || "");
      setActiveDraftImageUrls(draft.image_urls || []);
      setImageCount(0);
      setFileInputKey((value) => value + 1);
      setStatus("已载入草稿");
    }

    const selectedDraft = sessionStorage.getItem("selected-reflection-draft");

    if (selectedDraft) {
      try {
        applyDraft(JSON.parse(selectedDraft));
      } catch {
        setStatus("草稿载入失败");
      }

      sessionStorage.removeItem("selected-reflection-draft");
    }

    function handleDraftSelected(event) {
      applyDraft(event.detail);
    }

    window.addEventListener("reflection-draft-selected", handleDraftSelected);

    return () => {
      window.removeEventListener("reflection-draft-selected", handleDraftSelected);
    };
  }, []);

  function resetForm() {
    setTitle("");
    setReflectionDate(today());
    setContent("");
    setActiveDraftId("");
    setActiveDraftImageUrls([]);
    setImageCount(0);
    setFileInputKey((value) => value + 1);
  }

  function removeDraftImage(url) {
    setActiveDraftImageUrls((current) => current.filter((imageUrl) => imageUrl !== url));
  }

  function requestSaveDraft() {
    const plainText = stripHtml(content);

    if (!title.trim() && !plainText && !imageCount && !activeDraftImageUrls.length) {
      setStatus("请先填写标题、心得内容或选择图片");
      return;
    }

    setPendingAction({ type: "draft" });
  }

  async function saveDraft(password) {
    setIsSubmitting(true);
    setStatus("");

    const formData = new FormData(formRef.current);
    formData.set("id", activeDraftId);
    formData.set("title", title.trim());
    formData.set("content", content);
    formData.set("reflection_date", reflectionDate);
    formData.set("image_urls", JSON.stringify(activeDraftImageUrls));
    formData.set("password", password);

    const response = await fetch("/api/reflection-drafts", {
      method: "POST",
      body: formData
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setActiveDraftId(result.draft.id);
      setActiveDraftImageUrls(result.draft.image_urls || []);
      setImageCount(0);
      setFileInputKey((value) => value + 1);
      setStatus("草稿已保存");
      window.dispatchEvent(new Event("reflection-drafts-updated"));
    } else {
      setStatus(result.error || "草稿保存失败");
    }

    setIsSubmitting(false);
    setPendingAction(null);
  }

  async function submitReflection(password) {
    setIsSubmitting(true);
    setStatus("");

    const formData = new FormData(formRef.current);
    formData.set("title", title.trim());
    formData.set("content", content);
    formData.set("reflection_date", reflectionDate);
    formData.set("image_urls", JSON.stringify(activeDraftImageUrls));
    formData.set("password", password);

    const response = await fetch("/api/reflections", {
      method: "POST",
      body: formData
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      if (activeDraftId) {
        await fetch("/api/reflection-drafts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: activeDraftId, password, keep_images: true })
        });
        window.dispatchEvent(new Event("reflection-drafts-updated"));
      }

      resetForm();
      setStatus("已上传");
      window.dispatchEvent(new Event("reflection-records-updated"));
    } else {
      setStatus(result.error || "上传失败");
    }

    setIsSubmitting(false);
    setPendingAction(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setPendingAction({ type: "upload" });
  }

  function confirmPendingAction(password) {
    if (pendingAction?.type === "draft") {
      saveDraft(password);
      return;
    }

    if (pendingAction?.type === "upload") {
      submitReflection(password);
    }
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
        {activeDraftImageUrls.length ? (
          <div className="reflection-draft-image-list">
            {activeDraftImageUrls.map((url) => (
              <span key={url}>
                <img src={url} alt="" />
                <button type="button" onClick={() => removeDraftImage(url)}>
                  移除
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="admin-form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "提交中" : "上传日常心得"}
          </button>
          <button type="button" className="secondary-button" onClick={requestSaveDraft} disabled={isSubmitting}>
            存为草稿
          </button>
        </div>
        {status ? <p className="form-status">{status}</p> : null}
      </form>
      <PasswordDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.type === "draft" ? "保存日常心得草稿" : "上传日常心得"}
        confirmLabel={pendingAction?.type === "draft" ? "确认保存" : "确认上传"}
        isBusy={isSubmitting}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </>
  );
}
