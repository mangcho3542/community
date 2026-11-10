"use client";
import {
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  createContext,
  type ElementType,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn, tw } from "@shared/lib/class";
import { Portal } from "./Portal";
import {
  TooltipI,
  TooltipPosition,
  useTooltip,
  UseTooltipProps,
} from "@shared/lib/Tooltip";

// (top, left)는 trigger 기준 anchor 좌표.
// translate(%)는 tooltip 자신의 크기 기준이라 width/height를 측정하지 않아도 중심이 맞는다.
// tailwind v4의 translate-*는 css `translate` 속성을 쓰므로 motion의 `transform`(x, y)과 충돌하지 않음.
const translateClassName: Record<TooltipPosition, string> = {
  top: tw`-translate-x-1/2 -translate-y-full`,
  right: tw`-translate-y-1/2`,
  bottom: tw`-translate-x-1/2`,
  left: tw`-translate-x-full -translate-y-1/2`,
};

// 등장/퇴장 시 trigger 쪽으로 살짝 밀리는 offset
function getMotionOffset(position: TooltipPosition, gap: number) {
  switch (position) {
    case "top":
      return { y: gap };
    case "right":
      return { x: -gap };
    case "bottom":
      return { y: -gap };
    case "left":
      return { x: gap };
  }
}

function getCoords(rect: DOMRect, position: TooltipPosition, gap: number) {
  const centerX = (rect.left + rect.right) / 2;
  const centerY = (rect.top + rect.bottom) / 2;

  switch (position) {
    case "top":
      return { top: rect.top - gap, left: centerX };
    case "right":
      return { top: centerY, left: rect.right + gap };
    case "bottom":
      return { top: rect.bottom + gap, left: centerX };
    case "left":
      return { top: centerY, left: rect.left - gap };
  }
}

const TooltipContext = createContext<TooltipI | null>(null);

function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context)
    throw new Error(
      "Tooltip.Positioner와 Tooltip.Trigger는 Tooltip.Root 안에서만 사용 가능합니다.",
    );
  return context;
}

interface TooltipRootProps extends Omit<UseTooltipProps, "trigger"> {
  tooltip?: TooltipI;
  children?: ReactNode;
}

function TooltipRoot({ tooltip, children, ...props }: TooltipRootProps) {
  // hook은 조건부로 호출할 수 없으므로 항상 호출하고, 외부에서 받은 tooltip이 있으면 그것을 쓴다.
  const ownTooltip = useTooltip(props);

  return (
    <TooltipContext.Provider value={tooltip ?? ownTooltip}>
      {children}
    </TooltipContext.Provider>
  );
}

interface TooltipPositionerProps extends ComponentPropsWithRef<typeof motion.div> {};
function TooltipPositioner({
  className,
  style,
  children,
  ...rest
}: TooltipPositionerProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const { open, setOpen, trigger, openDelay, closeDelay, position, gap } =
    useTooltipContext();
  const motionOffset = getMotionOffset(position, gap);

  // trigger에 hover/focus하면 openDelay 후 열고, 벗어나면 closeDelay 후 닫음
  useEffect(() => {
    const el = trigger.current;
    if (!el) return;

    // state로 두면 handler가 등록 시점의 값만 기억해 이전 timer를 취소하지 못한다.
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onOpen = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setCoords(getCoords(el.getBoundingClientRect(), position, gap));
        setOpen(true);
      }, openDelay);
    };

    const onClose = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setOpen(false), closeDelay);
    };

    // focus/blur는 bubbling되지 않아 trigger 안쪽 요소(예: li 안의 a)의 focus를 놓친다.
    el.addEventListener("mouseenter", onOpen);
    el.addEventListener("mouseleave", onClose);
    el.addEventListener("focusin", onOpen);
    el.addEventListener("focusout", onClose);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("mouseenter", onOpen);
      el.removeEventListener("mouseleave", onClose);
      el.removeEventListener("focusin", onOpen);
      el.removeEventListener("focusout", onClose);
    };
  }, [trigger, openDelay, closeDelay, position, gap, setOpen]);

  // 열려 있는 동안 scroll/resize되면 trigger 위치를 다시 계산
  useEffect(() => {
    const el = trigger.current;
    if (!open || !el) return;

    const update = () =>
      setCoords(getCoords(el.getBoundingClientRect(), position, gap));

    // capture: window뿐 아니라 내부 scroll container의 scroll도 감지
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, trigger, position, gap]);

  //esc 누를시 tooltip 닫기
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if(e.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return (() => window.removeEventListener("keydown", handleKeyDown))
  }, [trigger]);

  return (
    <Portal containerId="tooltip-root">
      <AnimatePresence>
        {open && (
          <motion.div
            {...rest}
            className={cn(
              "pointer-events-none fixed z-300 w-max",
              "bg-bg-third text-fg rounded-md px-2 py-1 text-sm shadow-md",
              "flex h-fit items-center justify-center",
              translateClassName[position],
              className,
            )}
            style={{ ...style, top: coords.top, left: coords.left }}
            initial={{ opacity: 0, ...motionOffset }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...motionOffset }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            role="tooltip"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

type TooltipTriggerProps<T extends ElementType = "div"> = Omit<
  ComponentPropsWithoutRef<T>,
  "ref"
> & {
  as?: T;
  ref?: Ref<HTMLElement>;
};

function TooltipTrigger<T extends ElementType = "div">({
  as,
  ref,
  ...rest
}: TooltipTriggerProps<T>) {
  const { trigger: triggerRef } = useTooltipContext();
  const Component: ElementType = as ?? "div";

  // context의 trigger ref와 props로 받은 ref에 같은 element를 연결
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [triggerRef, ref],
  );

  return <Component {...rest} ref={setRef} />;
}

const Tooltip = {
  Root: TooltipRoot,
  Positioner: TooltipPositioner,
  Trigger: TooltipTrigger,
};

export default Tooltip;
