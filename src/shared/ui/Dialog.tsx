"use client";

import {
  type ComponentPropsWithRef,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Portal } from "./Portal";
import { cn } from "@shared/lib/class";
import { AnimatePresence, motion } from "framer-motion";
import { ButtonProps, DivProps } from "./props";
import { X } from "lucide-react";
import Button from "./Button";

interface DialogContextI {
  onOpenChange?: (open: boolean) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DefaultDialogContext = {
  onOpenChange: () => {},
  open: false,
  setOpen: () => {},
};

const DialogContext = createContext<DialogContextI>(DefaultDialogContext);

interface DialogRootProps extends ComponentPropsWithRef<typeof motion.div> {
  closeOnEsc?: boolean;
  closeOnInteractOutside?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerIds?: string[];
  closeTriggerIds?: string[];
}

function useDialog() {
  const context = useContext(DialogContext);
  if (context === DefaultDialogContext)
    throw Error("Dialog컴포넌트 내부에서만 useDialog를 사용할 수 있음.");
  return context;
}

function DialogRoot({
  closeOnEsc = true,
  closeOnInteractOutside = true,
  defaultOpen = false,
  open: value,
  onOpenChange,
  triggerIds,
  closeTriggerIds,
  className,
  children,
  ...rest
}: DialogRootProps) {
  const [open, setOpenState] = useState(value ?? defaultOpen);

  //props로 받은 open이 바뀔때마다 open(state)을 변경
  //open을 넘기지 않은 경우(uncontrolled)에는 defaultOpen을 덮어쓰지 않는다.
  useEffect(() => {
    if (value === undefined) return;
    setOpen(value);
  }, [value]);

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  // 배열 참조가 매 render마다 바뀌어도 id 목록이 같으면 effect를 다시 실행하지 않음
  const triggerIdsKey = triggerIds?.join(",");
  const closeTriggerIdsKey = closeTriggerIds?.join(",");

  //triggerIds에 eventlistner 추가/삭제
  useEffect(() => {
    if (!triggerIdsKey) return;

    const triggers = triggerIdsKey
      .split(",")
      .map((triggerId) => document.getElementById(triggerId));
    const onTriggerClick = () => setOpen(true);

    for (const trigger of triggers) {
      trigger?.addEventListener("click", onTriggerClick);
    }

    return () => {
      for (const trigger of triggers) {
        trigger?.removeEventListener("click", onTriggerClick);
      }
    };
  }, [triggerIdsKey, setOpen]);

  //closeTriggerIds에 eventlistner 추가/삭제
  useEffect(() => {
    if (!closeTriggerIdsKey) return;

    const triggers = closeTriggerIdsKey
      .split(",")
      .map((triggerId) => document.getElementById(triggerId));
    const onTriggerClick = () => setOpen(false);

    for (const trigger of triggers) {
      trigger?.addEventListener("click", onTriggerClick);
    }

    return () => {
      for (const trigger of triggers) {
        trigger?.removeEventListener("click", onTriggerClick);
      }
    };
  }, [closeTriggerIdsKey, setOpen]);

  useEffect(() => {
    if (!closeOnEsc || !open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeOnEsc, open, setOpen]);

  return (
    <DialogContext.Provider
      value={{
        onOpenChange,
        open,
        setOpen,
      }}
    >
      <Portal containerId="dialog-root">
        <AnimatePresence>
          {open && (
            <motion.div
              {...rest}
              className={cn(
                "fixed top-0 left-0 z-200 h-screen w-screen",
                className,
              )}
              onClick={(e) => {
                // Content 내부 클릭이 bubbling되어 닫히는 것 방지
                if (closeOnInteractOutside && e.target === e.currentTarget)
                  setOpen(false);
              }}
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(4px)" }}
              exit={{ backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </DialogContext.Provider>
  );
}

function DialogPositioner({ className, children, ...rest }: DivProps) {
  return (
    <div
      {...rest}
      className={cn(
        "pointer-events-none flex flex-col items-center justify-center",
        "fixed top-0 left-0 h-screen w-screen overflow-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

function DialogContent({
  className,
  children,
  ...rest
}: ComponentPropsWithRef<typeof motion.div>) {
  return (
    <motion.div
      {...rest}
      className={cn(
        "pointer-events-auto relative h-fit rounded-md shadow-lg md:min-w-xs",
        "bg-bg-third relative flex flex-col gap-2 px-4 py-3",
        className,
      )}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      role="dialog"
      tabIndex={-1}
      aria-modal
    >
      {children}
    </motion.div>
  );
}

function DialogTrigger({ children, onClick, ...rest }: ButtonProps) {
  const { setOpen } = useDialog();

  return (
    <Button
      {...rest}
      onClick={(e) => {
        setOpen(true);
        onClick?.(e);
      }}
      aria-label="Close Dialog"
    >
      {children}
    </Button>
  );
}

function DialogCloseTrigger() {
  const { setOpen } = useDialog();

  return (
    <Button
      className={cn("absolute top-2 right-2")}
      onClick={() => setOpen(false)}
    >
      <X />
    </Button>
  );
}

function DialogTitle({
  className,
  children,
  ...rest
}: ComponentPropsWithRef<"h2">) {
  return (
    <h2 {...rest} className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
}

function DialogDescription({ className, children, ...rest }: DivProps) {
  return (
    <div {...rest} className={cn("text-secondary text-sm", className)}>
      {children}
    </div>
  );
}

const Dialog = {
  Root: DialogRoot,
  Positioner: DialogPositioner,
  Content: DialogContent,
  Trigger: DialogTrigger,
  CloseTrigger: DialogCloseTrigger,
  Title: DialogTitle,
  Description: DialogDescription,
};

export default Dialog;
