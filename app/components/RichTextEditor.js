"use client";

import { useEffect, useRef } from "react";

const fonts = [
  { label: "默认字体", value: "" },
  { label: "微软雅黑", value: "Microsoft YaHei" },
  { label: "苹方", value: "PingFang SC" },
  { label: "宋体", value: "SimSun" },
  { label: "黑体", value: "SimHei" },
  { label: "Arial", value: "Arial" }
];

export default function RichTextEditor({ value, onChange, minRows = 3, placeholder = "" }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  function syncValue() {
    onChange(editorRef.current?.innerHTML || "");
  }

  function runCommand(command, commandValue = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  }

  function ensureDefaultTyping() {
    if (!editorRef.current?.textContent?.trim()) {
      document.execCommand("removeFormat", false, null);
      if (document.queryCommandState("bold")) {
        document.execCommand("bold", false, null);
      }
      if (document.queryCommandState("underline")) {
        document.execCommand("underline", false, null);
      }
      if (document.queryCommandState("strikeThrough")) {
        document.execCommand("strikeThrough", false, null);
      }
    }
  }

  function handlePaste(event) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    syncValue();
  }

  return (
    <div className="rich-text">
      <div className="rich-text-toolbar" aria-label="文本格式工具栏">
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")}>
          B
        </button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("underline")}>
          U
        </button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("strikeThrough")}>
          S
        </button>
        <select
          aria-label="字体"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) {
              runCommand("fontName", event.target.value);
            }
          }}
        >
          {fonts.map((font) => (
            <option key={font.label} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>
      <div
        ref={editorRef}
        className="rich-text-editor"
        contentEditable
        data-placeholder={placeholder}
        onFocus={ensureDefaultTyping}
        onInput={syncValue}
        onPaste={handlePaste}
        style={{ minHeight: `${minRows * 34}px` }}
        suppressContentEditableWarning
      />
    </div>
  );
}
