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

const CARET_SEED = "\u200b";

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

  function getVisibleText(editor) {
    return (editor?.textContent || "").replaceAll(CARET_SEED, "").trim();
  }

  function isEditorVisuallyEmpty(editor) {
    return !getVisibleText(editor);
  }

  function updateEmptyState() {
    const editor = editorRef.current;

    if (editor) {
      editor.dataset.empty = isEditorVisuallyEmpty(editor) ? "true" : "false";
    }
  }

  function serializeContent() {
    const editor = editorRef.current;

    if (!editor) {
      return "";
    }

    const clone = editor.cloneNode(true);
    clone.querySelectorAll(".rt-caret-seed").forEach((node) => node.remove());
    clone.innerHTML = clone.innerHTML.replaceAll(CARET_SEED, "");

    return clone.textContent.trim() ? clone.innerHTML : "";
  }

  function syncValue() {
    updateEmptyState();
    onChange(serializeContent());
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

    if (isEditorVisuallyEmpty(editor)) {
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

  function ensureCaretSeed() {
    const editor = editorRef.current;

    if (!editor || !isEditorVisuallyEmpty(editor)) {
      updateEmptyState();
      return;
    }

    editor.innerHTML = `<span class="rt-caret-seed">${CARET_SEED}</span>`;
    updateEmptyState();

    const seed = editor.querySelector(".rt-caret-seed")?.firstChild;
    const selection = window.getSelection();

    if (seed && selection) {
      const range = document.createRange();
      range.setStart(seed, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function removeCaretSeedIfNeeded() {
    const editor = editorRef.current;

    if (!editor || isEditorVisuallyEmpty(editor)) {
      updateEmptyState();
      return;
    }

    editor.querySelectorAll(".rt-caret-seed").forEach((node) => {
      const text = node.textContent.replaceAll(CARET_SEED, "");

      if (text) {
        const span = document.createElement("span");
        span.className = "rt-regular";
        span.style.fontWeight = "400";
        span.textContent = text;
        node.replaceWith(span);
      } else {
        node.remove();
      }
    });
    editor.innerHTML = editor.innerHTML.replaceAll(CARET_SEED, "");
    updateEmptyState();
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
      if (element.classList.contains("rt-caret-seed")) {
        return;
      }

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
    ensureCaretSeed();
  }

  function handleMouseDown(event) {
    const editor = event.currentTarget;

    window.setTimeout(() => {
      editor.focus();

      if (isEditorVisuallyEmpty(editor)) {
        ensureCaretSeed();
      }
    }, 0);
  }

  function handleClick(event) {
    if (isEditorVisuallyEmpty(event.currentTarget)) {
      ensureCaretSeed();
    }
  }

  function handleInput() {
    removeCaretSeedIfNeeded();
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
        data-empty="true"
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
