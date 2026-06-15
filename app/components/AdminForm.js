"use client";

import { useState } from "react";
import RichTextEditor from "@/app/components/RichTextEditor";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminForm() {
  const [title, setTitle] = useState("");
  const [reflectionDate, setReflectionDate] = useState(today());
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [imageCount, setImageCount] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    const form = event.currentTarget;
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
      setPassword("");
      setImageCount(0);
      setFileInputKey((value) => value + 1);
      setStatus("已保存");
    } else {
      const result = await response.json().catch(() => ({}));
      setStatus(result.error || "保存失败");
    }

    setIsSubmitting(false);
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
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
      <label>
        上传密码
        <input
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "保存中" : "上传日常心得"}
      </button>
      {status ? <p className="form-status">{status}</p> : null}
    </form>
  );
}
