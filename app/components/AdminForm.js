"use client";

import { useRef, useState } from "react";
import RichTextEditor from "@/app/components/RichTextEditor";
import PasswordDialog from "@/app/components/PasswordDialog";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminForm() {
  const [title, setTitle] = useState("");
  const [reflectionDate, setReflectionDate] = useState(today());
  const [content, setContent] = useState("");
  const [imageCount, setImageCount] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const formRef = useRef(null);

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
      setTitle("");
      setContent("");
      setImageCount(0);
      setFileInputKey((value) => value + 1);
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
