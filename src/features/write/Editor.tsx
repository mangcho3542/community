"use client";

import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import {
  useEditor,
  EditorContent,
  useEditorState,
  JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import clsx from "clsx";
import EditorToolbar from "./EditorToolbar";
import {
  ExclusiveMarks,
  HeadingSize,
  KeepMarksOnUndo,
} from "./config/ToolbarConfig";
import { useEffect, useState } from "react";
import { getStorageItem, setStorageItem } from "@shared/lib/LocalStorage";

const extensions = [
  // 이 네 mark는 ExclusiveMarks가 대신 등록한다.
  StarterKit.configure({
    bold: false,
    underline: false,
    italic: false,
    strike: false,
  }),
  ExclusiveMarks,
  KeepMarksOnUndo,
  TextAlign.configure({
    types: ["heading", "paragraph", "image"],
    defaultAlignment: "left",
  }),
  TextStyleKit.configure({
    backgroundColor: false,
    color: {
      types: ["heading", "paragraph"],
    },
    fontFamily: {
      types: ["heading", "paragraph"],
    },
    lineHeight: {
      types: ["heading", "paragraph"],
    },
  }),
  Image.configure({
    inline: true,
    allowBase64: false,
    HTMLAttributes: { class: "max-w-full" },
  }),
];

const storage_key = "write/draft"; //localStorage에 저장할 key  

export default function Editor() {
  const [hasUnsavedChange, setHasUnsavedChange] = useState(false);

  const editorProps = useEditor({
    extensions: extensions,
    content: "",
    immediatelyRender: false,
    autofocus: true,
    editable: true,
    // 임시저장된 글이 있으면 불러온다.
    onCreate({ editor }) {
      const draft = getStorageItem<JSONContent>(storage_key);
      if (!draft) return;
      // 불러온 글은 실행 취소 대상이 아니고, 저장되지 않은 변경사항도 아니다.
      editor
        .chain()
        .setMeta("addToHistory", false)
        .setContent(draft, { emitUpdate: false })
        .run();
    },
    onUpdate: () => setHasUnsavedChange(true),
    editorProps: {
      attributes: {
        class: clsx(
          "prose prose-sm md:prose-md lg:prose-lg xl:prose-xl focus:outline-none",
          //p
          "prose-p:w-fit prose-p:h-fit prose-p:m-0",
          //h1~h3
          "prose-h1:w-fit prose-h1:h-fit prose-h2:w-fit prose-h2:h-fit prose-h3:w-fit prose-h3:h-fit",
          "**:[[style*='text-align:_center']]:mx-auto **:[[style*='text-align:_right']]:ml-auto",
          "[--tw-prose-body:var(--fg)] [--tw-prose-headings:var(--fg)] [--tw-prose-bold:var(--fg)]",
          "h-fit min-h-[80vh] shadow-sm dark:bg-bg-secondary p-2",
          // 기본 글은 regular(400), 굵게(<strong>)는 bold(700). prose 기본값은 600이다.
          "font-normal prose-strong:font-bold",
          "prose-blockquote:border-s-2 prose-a:cursor-pointer",
          "[--tw-prose-quote-borders:var(--border-primary)]",
          "[--tw-prose-quotes:var(--fg-secondary)] [--tw-prose-links:var(--fg-editor-link)]",
        ),
      },
    },
  });

  const editorState = useEditorState({
    editor: editorProps,
    selector(snapshot) {
      const { editor } = snapshot;
      if (!editor) return null;

      return {
        isHeading1: editor.isActive("textStyle", { fontSize: HeadingSize[1] }),
        isHeading2: editor.isActive("textStyle", { fontSize: HeadingSize[2] }),
        isHeading3: editor.isActive("textStyle", { fontSize: HeadingSize[3] }),
        isBold: editor.isActive("bold"),
        isUnderline: editor.isActive("underline"),
        isItalic: editor.isActive("italic"),
        isStrike: editor.isActive("strike"),
        isBlockQuote: editor.isActive("blockquote"),
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        isAlignLeft: editor.isActive({ textAlign: "left" }),
        isAlignCenter: editor.isActive({ textAlign: "center" }),
        isAlignRight: editor.isActive({ textAlign: "right" }),
        isLink: editor.isActive("link"),
        isImage: editor.isActive("image"),
      };
    },
  });

  // 저장되지 않은 변경사항이 있을 때만 페이지를 떠나기 전에 경고한다.
  useEffect(() => {
    if (!hasUnsavedChange) return;

    // 경고 문구와 버튼은 브라우저가 정한다. preventDefault만 하면 된다.
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChange]);

  if (!editorProps || !editorState) {
    return <p>에디터 정보를 불러오고 있습니다...</p>;
  }

  // 현재 글을 localStorage에 임시저장한다. 저장에 실패하면 throw하므로 경고는 유지된다.
  function saveDraft() {
    if (!editorProps) return;
    setStorageItem(storage_key, editorProps.getJSON());
    setHasUnsavedChange(false);
  }

  return (
    <div className="flex w-full flex-col items-center">
      <EditorToolbar
        editor={editorProps}
        state={editorState}
        onSave={saveDraft}
      />
      <EditorContent
        editor={editorProps}
        className="h-fit w-full border-x"
        onClick={(e) => {
          e.currentTarget.focus();
        }}
      />
    </div>
  );
}

function tmp() {
  return (
    <div onClick={(e) => {}}>

    </div>
  )
}