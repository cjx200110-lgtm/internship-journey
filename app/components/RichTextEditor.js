"use client";

import { useRef } from "react";

const fonts = [
  { label: "默认字体", value: "" },
  { label: "微软雅黑", value: "Microsoft YaHei" },
  { label: "苹方", value: "PingFang SC" },
  { label: "宋体", value: "SimSun" },
  { label: "黑体", value: "SimHei" },
  { label: "Arial", value: "Arial" }
];

function wrapSelection(value, start, end, before, after) {
  const selected = value.slice(start, end);
  return `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
}

function getSelectionRange(start, end, before) {
  const offset = before.length;
  return start === end
    ? { start: start + offset, end: start + offset }
    : { start: start + offset, end: end + offset };
}

export default function RichTextEditor({ value, onChange, minRows = 3, placeholder = "" }) {
  const textareaRef = useRef(null);

  function applyFormat(type, fontName = "") {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let before = "";
    let after = "";

    if (type === "bold") {
      before = "<b>";
      after = "</b>";
    }

    if (type === "underline") {
      before = "<u>";
      after = "</u>";
    }

    if (type === "strike") {
      before = "<s>";
      after = "</s>";
    }

    if (type === "font" && fontName) {
      before = `<span style="font-family: ${fontName};">`;
      after = "</span>";
    }

    if (!before && !after) {
      textarea.focus();
      return;
    }

    const nextValue = wrapSelection(value || "", start, end, before, after);
    const nextSelection = getSelectionRange(start, end, before);
    onChange(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelection.start, nextSelection.end);
    });
  }

  function handleToolbarMouseDown(event, type, fontName = "") {
    event.preventDefault();
    applyFormat(type, fontName);
  }

  return (
    <div className="rich-text">
      <div className="rich-text-toolbar" aria-label="文本格式工具栏">
        <button type="button" tabIndex={-1} onMouseDown={(event) => handleToolbarMouseDown(event, "bold")}>
          B
        </button>
        <button type="button" tabIndex={-1} onMouseDown={(event) => handleToolbarMouseDown(event, "underline")}>
          U
        </button>
        <button type="button" tabIndex={-1} onMouseDown={(event) => handleToolbarMouseDown(event, "strike")}>
          S
        </button>
        <select
          aria-label="字体"
          defaultValue=""
          onChange={(event) => applyFormat("font", event.target.value)}
        >
          {fonts.map((font) => (
            <option key={font.label} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        ref={textareaRef}
        className="rich-text-editor"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={minRows}
      />
    </div>
  );
}
