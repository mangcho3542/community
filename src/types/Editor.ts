import { Editor } from "@tiptap/react";
import { icons } from "lucide-react";

export type EditorActiveState = {
  isHeading1: boolean;
  isHeading2: boolean;
  isHeading3: boolean;
  isBold: boolean;
  isUnderline: boolean;
  isItalic: boolean;
  isStrike: boolean;
  isBlockQuote: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isAlignLeft: boolean;
  isAlignCenter: boolean;
  isAlignRight: boolean;
  isLink: boolean;
  isImage: boolean;
};

export type ActiveStateKey = keyof EditorActiveState;

export interface ToolbarConfig<P = void> {
  icon: keyof typeof icons;
  actions: (editor: Editor, payload: P) => boolean;
  stateKey: ActiveStateKey;
  text: string;
}

