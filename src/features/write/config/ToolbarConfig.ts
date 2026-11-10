import { ToolbarConfig } from "../model/Editor";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Underline from "@tiptap/extension-underline";
import { Plugin } from "@tiptap/pm/state";
import { Editor, Extension } from "@tiptap/react";

type TextAlignT = "left" | "center" | "right";
type HeadingLevelT = 1 | 2 | 3;

// 선택 영역 없이 글이 있는 블록에서 누르면 기존 글은 그대로 두고, 커서 위치에 빈 블록을 새로 만든다.
// 선택 영역이 있거나, 빈 블록이거나, 그 자리에 블록을 넣을 수 없으면 false를 반환한다.
// 이때는 호출한 쪽이 블록 자체를 바꾼다.
function insertBlock(editor: Editor, attrs: Record<string, unknown>) {
  const { empty, $from } = editor.state.selection;
  const { parent, parentOffset, pos } = $from;
  if (!empty || !parent.isTextblock || !parent.content.size) return false;

  const type = parent.type;
  const atStart = parentOffset === 0;
  const atEnd = parentOffset === parent.content.size;
  const index = atStart ? $from.index(-1) : $from.indexAfter(-1);
  if (!$from.node(-1).canReplaceWith(index, index, type)) return false;

  // 블록 맨 앞이면 그 블록 앞에, 아니면 뒤에 넣는다. 중간이면 블록을 둘로 나누고 그 사이에 넣는다.
  const at = atStart ? pos - 1 : pos + 1;
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      if (!atStart && !atEnd) tr.split(pos);
      tr.insert(at, type.create({ ...parent.attrs, ...attrs }));
      return true;
    })
    .setTextSelection(at + 1)
    .run();
  return true;
}

// 제목은 블록(<h1>)이 아니라 글자 크기 mark다. 일반 글과 같은 줄에 둘 수 있다.
export const HeadingSize = { 1: "2.25em", 2: "1.5em", 3: "1.25em" } as const;

const toggleHeading = (editor: Editor, level: HeadingLevelT) => {
  const fontSize = HeadingSize[level];
  return editor.isActive("textStyle", { fontSize })
    ? editor
        .chain()
        .focus()
        .unsetFontSize()
        // 선택 영역이 없으면 unsetFontSize가 속성이 빈 textStyle을 stored mark로 남긴다. 그것을 지운다.
        .command(({ tr }) => {
          const mark = tr.storedMarks?.find((m) => m.type.name === "textStyle");
          if (mark && Object.values(mark.attrs).every((v) => v == null))
            tr.removeStoredMark(mark.type);
          return true;
        })
        .run()
    : editor.chain().focus().setFontSize(fontSize).run();
};

const toggleAlign = (editor: Editor, align: TextAlignT) => {
  const active = editor.isActive({ textAlign: align });
  return (
    insertBlock(editor, { textAlign: active ? undefined : align }) ||
    (active
      ? editor.chain().focus().unsetTextAlign().run()
      : editor.chain().focus().setTextAlign(align).run())
  );
};

export const HeadingOptions: ToolbarConfig[] = [
  {
    icon: "Heading1",
    actions: (editor) => toggleHeading(editor, 1),
    stateKey: "isHeading1",
    text: "제목1",
  },
  {
    icon: "Heading2",
    actions: (editor) => toggleHeading(editor, 2),
    stateKey: "isHeading2",
    text: "제목2",
  },
  {
    icon: "Heading3",
    actions: (editor) => toggleHeading(editor, 3),
    stateKey: "isHeading3",
    text: "제목3",
  },
];

const Marks = ["bold", "underline", "italic", "strike"] as const;
type MarkT = (typeof Marks)[number];

// mark는 한 번에 하나만 켠다. 켜져 있던 mark를 모두 끄고, 누른 mark가 꺼져 있었으면 켠다.
const toggleMark = (
  editor: Pick<Editor, "isActive" | "chain">,
  name: MarkT,
) => {
  const active = editor.isActive(name);
  const chain = editor.chain().focus();
  Marks.forEach((mark) => chain.unsetMark(mark));
  if (!active) chain.setMark(name);
  return chain.run();
};

// StarterKit의 bold, underline, italic, strike 대신 쓴다. StarterKit에서는 이 넷을 꺼야 한다.
export const ExclusiveMarks = Extension.create({
  name: "exclusiveMarks",
  priority: 1000,
  // schema에서 서로를 배제한다. 마크다운 입력, 붙여넣기처럼 toggleMark를 거치지 않는 경로에서도 겹치지 않는다.
  addExtensions() {
    const excludes = Marks.join(" ");
    return [
      Bold.extend({ excludes }),
      Underline.extend({ excludes }),
      Italic.extend({ excludes }),
      Strike.extend({ excludes }),
    ];
  },
  // 기본 단축키의 toggleBold 등은 다른 mark가 켜져 있으면 실패한다.
  // 기본 확장(priority 100)보다 먼저 처리해서 단축키도 toggleMark를 쓰게 한다.
  addKeyboardShortcuts() {
    // 항상 true를 반환한다. false면 기본 단축키와 브라우저 단축키가 이어서 실행된다.
    const toggle = (name: MarkT) => () => {
      toggleMark(this.editor, name);
      return true;
    };
    return {
      "Mod-b": toggle("bold"),
      "Mod-B": toggle("bold"),
      "Mod-u": toggle("underline"),
      "Mod-U": toggle("underline"),
      "Mod-i": toggle("italic"),
      "Mod-I": toggle("italic"),
      "Mod-Shift-s": toggle("strike"),
    };
  },
});

// 실행 취소와 다시 실행은 글만 되돌린다. 켜 둔 mark(굵게, 제목 등)는 그대로 둔다.
export const KeepMarksOnUndo = Extension.create({
  name: "keepMarksOnUndo",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction(transactions, oldState, newState) {
          // "history$"는 prosemirror-history가 실행 취소, 다시 실행 transaction에 붙이는 meta다.
          if (!transactions.some((tr) => tr.getMeta("history$"))) return null;
          const { parent } = newState.selection.$from;
          const marks =
            oldState.storedMarks ?? oldState.selection.$from.marks();
          return newState.tr.setStoredMarks(
            marks.filter((mark) => parent.type.allowsMarkType(mark.type)),
          );
        },
      }),
    ];
  },
});

export const MarkOptions: ToolbarConfig[] = [
  {
    icon: "Bold",
    actions: (editor) => toggleMark(editor, "bold"),
    stateKey: "isBold",
    text: "굵게",
  },
  {
    icon: "Underline",
    actions: (editor) => toggleMark(editor, "underline"),
    stateKey: "isUnderline",
    text: "밑줄",
  },
  {
    icon: "Italic",
    actions: (editor) => toggleMark(editor, "italic"),
    stateKey: "isItalic",
    text: "기울임",
  },
  {
    icon: "Strikethrough",
    actions: (editor) => toggleMark(editor, "strike"),
    stateKey: "isStrike",
    text: "취소선",
  },
];

export const ListOptions: ToolbarConfig[] = [
  {
    icon: "TextQuote",
    actions: (editor) => editor.chain().focus().toggleBlockquote().run(),
    stateKey: "isBlockQuote",
    text: "인용문",
  },
  {
    icon: "List",
    actions: (editor) => editor.chain().focus().toggleBulletList().run(),
    stateKey: "isBulletList",
    text: "글머리 기호",
  },
  {
    icon: "ListOrdered",
    actions: (editor) => editor.chain().focus().toggleOrderedList().run(),
    stateKey: "isOrderedList",
    text: "번호 매기기",
  },
];

export const AlignOptions: ToolbarConfig[] = [
  {
    icon: "TextAlignStart",
    actions: (editor) => toggleAlign(editor, "left"),
    stateKey: "isAlignLeft",
    text: "왼쪽 정렬",
  },
  {
    icon: "TextAlignCenter",
    actions: (editor) => toggleAlign(editor, "center"),
    stateKey: "isAlignCenter",
    text: "가운데 정렬",
  },
  {
    icon: "TextAlignEnd",
    actions: (editor) => toggleAlign(editor, "right"),
    stateKey: "isAlignRight",
    text: "오른쪽 정렬",
  },
];

export const InsertOptions: [ToolbarConfig<string>, ToolbarConfig<string>] = [
  {
    icon: "Link",
    actions: (editor: Editor, href: string) =>
      editor.chain().focus().setLink({ href }).run(),
    stateKey: "isLink",
    text: "링크",
  },
  {
    icon: "Image",
    actions: (editor: Editor, src: string) =>
      editor.chain().focus().setImage({ src }).run(),
    stateKey: "isImage",
    text: "이미지",
  },
];
