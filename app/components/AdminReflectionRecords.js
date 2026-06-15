"use client";

import { useEffect, useState } from "react";
import RichTextEditor from "@/app/components/RichTextEditor";
import PasswordDialog from "@/app/components/PasswordDialog";

function stripHtml(value) {
  return (value || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function formatDate(value) {
  return value ? value.replaceAll("-", " / ") : "";
}

export default function AdminReflectionRecords() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("加载中");
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

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

  async function deleteRecord(id, password) {
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

  function updateRecord(id, key, value) {
    setRecords((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  }

  function removeImage(id, url) {
    setRecords((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, image_urls: (item.image_urls || []).filter((imageUrl) => imageUrl !== url) }
          : item
      )
    );
  }

  async function saveRecord(item, event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("id", item.id);
    formData.set("title", item.title || "");
    formData.set("content", item.content || "");
    formData.set("reflection_date", item.reflection_date);
    formData.set("image_urls", JSON.stringify(item.image_urls || []));
    setPendingAction({
      type: "save",
      id: item.id,
      formData
    });
  }

  async function confirmPendingAction(password) {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.type === "delete") {
      await deleteRecord(pendingAction.id, password);
      setPendingAction(null);
      return;
    }

    setSavingId(pendingAction.id);
    setStatus("");
    const formData = pendingAction.formData;
    formData.set("password", password);

    const response = await fetch("/api/reflections", {
      method: "PUT",
      body: formData
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setRecords((current) =>
        current.map((record) => (record.id === pendingAction.id ? result.reflection : record))
      );
      setEditingId("");
      setExpandedId(pendingAction.id);
      setStatus("已保存修改");
    } else {
      setStatus(result.error || "保存失败");
    }

    setSavingId("");
    setPendingAction(null);
  }

  return (
    <div className="admin-records">
      <div className="admin-record-list">
        {records.map((item) => (
          <article className="admin-record" key={item.id}>
            {editingId === item.id ? (
              <form className="admin-record-edit" onSubmit={(event) => saveRecord(item, event)}>
                <label>
                  日期
                  <input
                    type="date"
                    value={item.reflection_date}
                    onChange={(event) => updateRecord(item.id, "reflection_date", event.target.value)}
                    required
                  />
                </label>
                <label>
                  标题
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(event) => updateRecord(item.id, "title", event.target.value)}
                    placeholder="可不填"
                  />
                </label>
                <label>
                  心得
                  <RichTextEditor
                    value={item.content || ""}
                    onChange={(value) => updateRecord(item.id, "content", value)}
                    minRows={6}
                  />
                </label>
                {item.image_urls?.length ? (
                  <div className="admin-record-images">
                    {item.image_urls.map((url) => (
                      <span key={url}>
                        <img src={url} alt="" />
                        <button type="button" onClick={() => removeImage(item.id, url)}>
                          移除
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <label>
                  补充图片
                  <input name="images" type="file" accept="image/*" multiple />
                </label>
                <div className="admin-record-actions">
                  <button type="submit" disabled={savingId === item.id}>
                    {savingId === item.id ? "保存中" : "保存修改"}
                  </button>
                  <button type="button" onClick={() => setEditingId("")}>
                    取消
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="admin-record-head">
                  <span className="admin-record-date">{formatDate(item.reflection_date)}</span>
                  <b className="admin-record-title">{item.title || "无标题"}</b>
                  {expandedId === item.id ? null : (
                    <p className="admin-record-preview">{stripHtml(item.content).slice(0, 96)}</p>
                  )}
                </div>
                <div className="admin-record-actions">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === item.id ? "" : item.id)}
                  >
                    {expandedId === item.id ? "收起" : "查看全文"}
                  </button>
                  <button type="button" onClick={() => setEditingId(item.id)}>
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ type: "delete", id: item.id })}
                    disabled={isDeleting}
                  >
                    删除
                  </button>
                </div>
                {expandedId === item.id ? (
                  <div className="admin-record-full">
                    <div
                      className="rich-content"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                    {item.image_urls?.length ? (
                      <div className="admin-record-images">
                        {item.image_urls.map((url) => (
                          <a href={url} target="_blank" rel="noreferrer" key={url}>
                            <img src={url} alt="" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </article>
        ))}
      </div>
      {status ? <p className="form-status">{status}</p> : null}
      <PasswordDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.type === "delete" ? "删除上传记录" : "保存修改"}
        confirmLabel={pendingAction?.type === "delete" ? "确认删除" : "确认保存"}
        isBusy={isDeleting || Boolean(savingId)}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </div>
  );
}
