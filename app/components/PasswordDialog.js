"use client";

import { useState } from "react";

export default function PasswordDialog({
  open,
  title = "请输入上传密码",
  confirmLabel = "确认",
  isBusy = false,
  onCancel,
  onConfirm
}) {
  const [password, setPassword] = useState("");

  if (!open) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();
    onConfirm(password);
    setPassword("");
  }

  function handleCancel() {
    setPassword("");
    onCancel();
  }

  return (
    <div className="password-dialog-backdrop" role="presentation">
      <form className="password-dialog" onSubmit={handleSubmit}>
        <h2>{title}</h2>
        <label>
          上传密码
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="请输入上传密码"
            autoFocus
            required
          />
        </label>
        <div>
          <button type="submit" disabled={isBusy}>
            {isBusy ? "提交中" : confirmLabel}
          </button>
          <button type="button" onClick={handleCancel} disabled={isBusy}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
