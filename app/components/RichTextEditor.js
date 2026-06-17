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

const defaultFormat = {
  bold: false,
  underline: false,
  strikeThrough: false,
  fontName: ""
};

export default function RichTextEditor({ value, onChange, minRows = 3, placeholder = "" }) {
  const editorRef = useRef(null);
  const activeFormatRef = useRef({ ...defaultFormat });

  useEffect(() => {
    const editor = editorRef.current;

    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value || "";
      normalizeLoadedContent();
    }
  }, [value]);

  function syncValue() {
    onChange(editorRef.current?.innerHTML || "");
  }

  function normalizeLoadedContent() {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.querySelectorAll("b, strong").forEach((element) => {
      const span = document.createElement("span");
      span.className = "rt-bold";
      span.style.fontWeight = "700";
      span.innerHTML = element.innerHTML;
      element.replaceWith(span);
    });

    editor.querySelectorAll("span").forEach((element) => {
      const weight = element.style.fontWeight;

      if (element.classList.contains("rt-bold") || weight === "700" || weight === "800" || weight === "bold") {
        element.classList.add("rt-bold");
        element.style.fontWeight = "700";
      } else {
        element.classList.add("rt-regular");
        element.style.fontWeight = "400";
      }
    });
  }

  function resetDefaultFormatIfEmpty() {
    const editor = editorRef.current;

    if (!editor?.textContent?.trim()) {
      activeFormatRef.current = { ...defaultFormat };
      editor.dataset.bold = "false";
      editor.dataset.underline = "false";
      editor.dataset.strikeThrough = "false";
      editor.dataset.fontName = "";

      if (document.queryCommandState("bold")) {
        document.execCommand("bold", false);
      }

      if (document.queryCommandState("underline")) {
        document.execCommand("underline", false);
      }

      if (document.queryCommandState("strikeThrough")) {
        document.execCommand("strikeThrough", false);
      }
    }
  }

  function cleanAccidentalBoldWhenDefault() {
    const editor = editorRef.current;

    if (!editor || activeFormatRef.current.bold) {
      return;
    }

    editor.querySelectorAll("b, strong").forEach((element) => {
      const span = document.createElement("span");
      span.className = "rt-regular";
      span.style.fontWeight = "400";
      span.innerHTML = element.innerHTML;
      element.replaceWith(span);
    });

    editor.querySelectorAll("span:not(.rt-bold)").forEach((element) => {
      element.classList.add("rt-regular");
      element.style.fontWeight = "400";
    });
  }

  function runCommand(command, commandValue = null) {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();

    if (command === "fontName") {
      activeFormatRef.current.fontName = commandValue || "";

      if (commandValue) {
        document.execCommand("fontName", false, commandValue);
      } else {
        document.execCommand("removeFormat", false);
      }
    } else {
      activeFormatRef.current[command] = !activeFormatRef.current[command];
      document.execCommand(command, false);
    }

    editor.dataset.bold = activeFormatRef.current.bold ? "true" : "false";
    editor.dataset.underline = activeFormatRef.current.underline ? "true" : "false";
    editor.dataset.strikeThrough = activeFormatRef.current.strikeThrough ? "true" : "false";
    editor.dataset.fontName = activeFormatRef.current.fontName;
    syncValue();
  }

  function placeCaretAtEnd() {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function handleFocus() {
    resetDefaultFormatIfEmpty();
  }

  function handleMouseDown(event) {
    const editor = event.currentTarget;

    window.setTimeout(() => {
      editor.focus();

      if (!editor.textContent?.trim()) {
        placeCaretAtEnd();
      }
    }, 0);
  }

  function handleClick(event) {
    if (!event.currentTarget.textContent?.trim()) {
      placeCaretAtEnd();
    }
  }

  function handleInput() {
    cleanAccidentalBoldWhenDefault();
    syncValue();
  }

  function handlePaste(event) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    cleanAccidentalBoldWhenDefault();
    syncValue();
  }

  function handleToolbarMouseDown(event, command, commandValue = null) {
    event.preventDefault();
    event.stopPropagation();
    runCommand(command, commandValue);
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
        <button type="button" tabIndex={-1} onMouseDown={(event) => handleToolbarMouseDown(event, "strikeThrough")}>
          S
        </button>
        <select
          aria-label="字体"
          defaultValue=""
          onChange={(event) => runCommand("fontName", event.target.value)}
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
        tabIndex={0}
        data-placeholder={placeholder}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onFocus={handleFocus}
        onInput={handleInput}
        onPaste={handlePaste}
        style={{ minHeight: `${minRows * 34}px` }}
        suppressContentEditableWarning
      />
    </div>
  );
}
