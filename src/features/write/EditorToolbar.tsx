"use client";
import { ChangeEvent, ReactNode, SubmitEvent, useRef, useState } from "react";
import { LucideIcon } from "@shared/ui/LucideIcon";
import { ButtonProps } from "@shared/ui/props";
import Button from "@shared/ui/Button";
import { icons } from "lucide-react";
import { Editor } from "@tiptap/react";
import { EditorActiveState } from "./model/Editor";
import clsx from "clsx";
import { cn } from "@shared/lib/class";
import {
  AlignOptions,
  HeadingOptions,
  InsertOptions,
  ListOptions,
  MarkOptions,
} from "./config/ToolbarConfig";
import { Toast, useToaster } from "@shared/ui/Toast";
import Tooltip from "@shared/ui/Tooltip";
import Dialog from "@shared/ui/Dialog";
import { Field } from "@shared/ui/Field";

interface ComponentProps {
  children: ReactNode;
}

function ToolbarGroup({ children }: ComponentProps) {
  return (
    <article className="flex h-fit w-fit justify-center gap-1">
      {children}
    </article>
  );
}

function ToolbarLine() {
  return <div className="mx-2 h-[24px] w-[1.5px] bg-gray-300" />;
}

interface ToolbarButtonProps extends ButtonProps {
  icon: keyof typeof icons;
  active: boolean;
}

function ToolbarButton({
  icon,
  active,
  className,
  children,
  ...rest
}: ToolbarButtonProps) {
  return (
    <Button
      {...rest}
      aria-pressed={active}
      className={cn("aria-pressed:tint", className)}
    >
      <LucideIcon name={icon} className="p-0" />
      {children}
    </Button>
  );
}

interface ToolbarProps {
  editor: Editor;
  state: EditorActiveState;
  onSave: () => void;
}

export default function EditorToolbar({ editor, state, onSave }: ToolbarProps) {
  const ImageInputRef = useRef<HTMLInputElement>(null);
  const toaster = useToaster();
  const [linkOpen, setLinkOpen] = useState(false);

  // 임시저장 버튼을 눌렀을 때 함수. 저장 결과를 Toast로 알린다.
  function handleSave() {
    try {
      onSave();
      toaster.create({ title: "작성중인 글을 임시 저장하였습니다.", type: "success" });
    } catch {
      // localStorage 용량 초과, 저장소 접근 차단 등
      toaster.create({ title: "임시저장에 실패했습니다.", type: "error" });
    }
  }

  // 링크 버튼을 눌렀을 때 함수. 링크를 해제하거나 url 입력 Dialog를 연다.
  function handleLink() {
    // 이미 링크면 해제한다. 선택 영역 없이 커서만 링크 안에 있어도 해제된다.
    if (state.isLink) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    //텍스트를 선택하지 않고 링크버튼을 누를 시
    if (editor.state.selection.empty) {
      toaster.create({
        description: "텍스트를 선택 후 링크버튼을 눌러주십시오",
        type: "error",
      });
      return;
    }

    // 이전에 남은 오류 표시를 지우고 Dialog를 연다.
    setLinkOpen(true);
  }

  // 링크 Dialog의 form을 제출했을 때 함수. url을 검증한 뒤 선택 영역에 링크를 건다.
  function handleLinkSubmit(e: SubmitEvent<HTMLFormElement>) {
    // 기본 제출 동작(페이지 이동)을 막는다.
    e.preventDefault();
    // form이 noValidate라 브라우저가 제출을 막지 않는다. 검증 결과만 읽어 Field.ErrorText로 보여준다.
    if (!e.currentTarget.checkValidity()) {
      toaster.create({
        title: 'url은 "https://"로 시작해야합니다.',
        type: "error",
      });
      return;
    }

    // name="url"인 Field.Input의 값을 읽어 링크를 적용하고 Dialog를 닫는다.
    const href = new FormData(e.currentTarget).get("url") as string;
    InsertOptions[0].actions(editor, href);
    setLinkOpen(false);
    // 커서를 링크 끝으로 옮기고 link mark를 해제한다. 이어서 입력하는 글자에는 링크가 걸리지 않는다.
    editor
      .chain()
      .focus()
      .setTextSelection(editor.state.selection.to)
      .unsetMark("link")
      .run();
  }

  //이미지 입력할 때 함수
  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    // 같은 파일을 다시 선택해도 onChange가 발생하도록 초기화
    input.value = "";
    if (!file) return;

    if (
      file.type.startsWith("image/jpeg") ||
      file.type.startsWith("image/png") ||
      file.type.startsWith("image/webp")
    ) {
      //src를 fetch요청의 결과값으로 할당해야함.
      //InsertOptions[1].actions(editor, src);
    } else {
      toaster.create({
        title: "잘못된 이미지 형식입니다!",
        description: "jpeg, png, webp형식의 파일만 업로드하실 수 있습니다.",
        type: "error",
      });
    }
  }

  return (
    <section
      className={clsx(
        "flex h-fit w-full flex-wrap items-center px-3 py-2",
        "border-border-primary border border-solid",
      )}
    >
      <Toast toaster={toaster} />
      <Dialog.Root open={linkOpen} onOpenChange={setLinkOpen}>
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger />
            <Dialog.Title>링크</Dialog.Title>
            <form onSubmit={handleLinkSubmit} noValidate>
              <Field.Root required>
                <div className="mt-3 flex h-fit w-full gap-2">
                  <Field.Input
                    name="url"
                    type="url"
                    pattern="https?://.+"
                    className="border-border-primary flex w-2xs items-center rounded-md border"
                    autoFocus
                    autoComplete="off"
                    placeholder="url을 입력하세요"
                  />

                  <Button
                    type="submit"
                    className="border-border-primary h-10 border border-solid py-1.5"
                  >
                    확인
                  </Button>
                </div>
              </Field.Root>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/**Heading 그룹 */}
      <ToolbarGroup>
        {HeadingOptions.map(({ icon, actions, stateKey, text }) => (
          <Tooltip.Root key={text} gap={6}>
            <Tooltip.Trigger
              as={ToolbarButton}
              icon={icon}
              onClick={() => actions(editor)}
              active={state[stateKey]}
              aria-label={text}
            />

            <Tooltip.Positioner>{text}</Tooltip.Positioner>
          </Tooltip.Root>
        ))}
      </ToolbarGroup>

      <ToolbarLine />

      {/**Mark 그룹 */}
      <ToolbarGroup>
        {MarkOptions.map(({ icon, actions, stateKey, text }) => (
          <Tooltip.Root key={text} gap={6}>
            <Tooltip.Trigger
              as={ToolbarButton}
              icon={icon}
              onClick={() => actions(editor)}
              active={state[stateKey]}
              aria-label={text}
            />
            <Tooltip.Positioner>{text}</Tooltip.Positioner>
          </Tooltip.Root>
        ))}
      </ToolbarGroup>

      <ToolbarLine />

      {/**Align 그룹 */}
      <ToolbarGroup>
        {AlignOptions.map(({ icon, actions, stateKey, text }) => (
          <Tooltip.Root key={text} gap={6}>
            <Tooltip.Trigger
              as={ToolbarButton}
              icon={icon}
              onClick={() => actions(editor)}
              active={state[stateKey]}
              aria-label={text}
            />

            <Tooltip.Positioner>{text}</Tooltip.Positioner>
          </Tooltip.Root>
        ))}
      </ToolbarGroup>

      <ToolbarLine />

      {/**List 그룹 */}
      <ToolbarGroup>
        {ListOptions.map(({ icon, actions, stateKey, text }) => (
          <Tooltip.Root key={text} gap={6}>
            <Tooltip.Trigger
              as={ToolbarButton}
              icon={icon}
              onClick={() => actions(editor)}
              active={state[stateKey]}
              aria-label={text}
            />

            <Tooltip.Positioner>{text}</Tooltip.Positioner>
          </Tooltip.Root>
        ))}
      </ToolbarGroup>

      <ToolbarLine />

      {/**Insert 그룹 + 저장버튼*/}
      <ToolbarGroup>
        <Tooltip.Root gap={6}>
          <Tooltip.Trigger
            as={ToolbarButton}
            icon={InsertOptions[0].icon}
            onClick={handleLink}
            active={state[InsertOptions[0].stateKey]}
            aria-label={InsertOptions[0].text}
          />

          <Tooltip.Positioner>{InsertOptions[0].text}</Tooltip.Positioner>
        </Tooltip.Root>

        <Tooltip.Root gap={6}>
          <Tooltip.Trigger
            as={ToolbarButton}
            icon={InsertOptions[1].icon}
            onClick={() => ImageInputRef.current?.click()}
            active={state[InsertOptions[1].stateKey]}
            aria-label={InsertOptions[1].text}
          />

          <Tooltip.Positioner>{InsertOptions[1].text}</Tooltip.Positioner>
        </Tooltip.Root>
        {/** button 안에 두면 input의 click 이벤트가 button으로 버블링되므로 밖에 둔다. */}
        <input
          ref={ImageInputRef}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleImageChange}
        />

        <Tooltip.Root gap={6}>
          <Tooltip.Trigger
            as={ToolbarButton}
            icon="Save"
            onClick={handleSave}
            active={false}
            aria-label="임시저장"
          />

          <Tooltip.Positioner>임시저장</Tooltip.Positioner>
        </Tooltip.Root>
      </ToolbarGroup>
    </section>
  );
}
