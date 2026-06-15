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
  const activeFormatRef = useRef({
    bold: false,
    underline: false,
    strikeThrough: false,
    fontName: ""
  });

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

    if (command in activeFormatRef.current) {
      activeFormatRef.current[command] = !activeFormatRef.current[command];
    }

    if (command === "fontName") {
      activeFormatRef.current.fontName = commandValue || "";
    }

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

  function ensureDefaultTyping() {
    if (
      !editorRef.current?.textContent?.trim() &&
      !activeFormatRef.current.bold &&
      !activeFormatRef.current.underline &&
      !activeFormatRef.current.strikeThrough
    ) {
      editorRef.current.innerHTML = "";
      placeCaretAtEnd();
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

  function insertFormattedText(text) {
    const selection = window.getSelection();

    if (!selection?.rangeCount) {
      return;
    }

    selection.deleteFromDocument();
    const range = selection.getRangeAt(0);
    const node = document.createElement("span");
    const textDecorations = [];

    node.textContent = text;
    node.style.setProperty("font-weight", activeFormatRef.current.bold ? "800" : "400", "important");

    if (activeFormatRef.current.underline) {
      textDecorations.push("underline");
    }

    if (activeFormatRef.current.strikeThrough) {
      textDecorations.push("line-through");
    }

    if (textDecorations.length) {
      node.style.textDecoration = textDecorations.join(" ");
    }

    if (activeFormatRef.current.fontName) {
      node.style.fontFamily = activeFormatRef.current.fontName;
    }

    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function handleBeforeInput(event) {
    if (event.inputType !== "insertText" || !event.data) {
      return;
    }

    event.preventDefault();
    ensureDefaultTyping();
    insertFormattedText(event.data);
    syncValue();
  }

  function handlePaste(event) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    ensureDefaultTyping();
    insertFormattedText(text);
    syncValue();
  }

  function handleInput() {
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
        onBeforeInput={handleBeforeInput}
        onFocus={ensureDefaultTyping}
        onKeyDown={ensureDefaultTyping}
        onInput={handleInput}
        onPaste={handlePaste}
        style={{ minHeight: `${minRows * 34}px` }}
        suppressContentEditableWarning
      />
    </div>
  );
}
