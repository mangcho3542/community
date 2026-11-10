"use client";
import {
  ButtonProps,
  DivProps,
  InputProps,
  LabelProps,
  SpanProps,
} from "./props";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { cn } from "@shared/lib/class";
import Button from "./Button";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface NumberInputContextI {
  disabled: boolean;
  invalid: boolean;
  readonly: boolean;
  required: boolean;
  targetId: string;
  value: number;
  setValue: Dispatch<SetStateAction<number>>;
  min: number;
  max: number;
  onChange?: (v: number) => void;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const NumberInputContext = createContext<NumberInputContextI | null>(null);

export function useNumberInput() {
  const context = useContext(NumberInputContext);

  if (context === null) {
    throw new Error(
      "useNumberInput은 NumberInput컴포넌트 내부에서만 사용할 수 있습니다.",
    );
  }

  return context;
}

export interface NumberInputRootProps extends Omit<DivProps, "onChange"> {
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  readonly?: boolean;
  targetId?: string;
  defaultValue?: number;
  state?: [number, Dispatch<SetStateAction<number>>];
  onChange?: (v: number) => void;
  min?: number;
  max?: number;
}

export function NumberInputRoot({
  disabled = false,
  invalid = false,
  readonly = false,
  required = false,
  id,
  children,
  className,
  defaultValue = 0,
  state,
  onChange,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  ...rest
}: NumberInputRootProps) {
  const generatedId = useId();
  const targetId = id ?? generatedId;
  const dv =
    defaultValue >= Number.MIN_SAFE_INTEGER &&
    defaultValue <= Number.MAX_SAFE_INTEGER
      ? defaultValue
      : (min + max) / 2;

  const internalState = useState(dv);
  const [value, setValue] = state ?? internalState;

  const context = useMemo<NumberInputContextI>(
    () => ({
      disabled,
      invalid,
      readonly,
      required,
      targetId,
      value,
      setValue,
      min,
      max,
      onChange,
    }),
    [
      disabled,
      invalid,
      readonly,
      required,
      targetId,
      value,
      setValue,
      min,
      max,
      onChange,
    ],
  );

  useEffect(() => {
    onChange?.(value);
  }, [value]);

  return (
    <NumberInputContext.Provider value={context}>
      <div
        {...rest}
        className={cn(
          "flex w-full max-w-sm flex-col items-start gap-1",
          "data-disabled:opacity-50 data-disabled:grayscale",
          className,
        )}
        data-disabled={!!disabled}
      >
        {children}
      </div>
    </NumberInputContext.Provider>
  );
}

export function NumberInputLabel({
  className,
  ...rest
}: Omit<LabelProps, "htmlFor">) {
  const context = useNumberInput();

  return (
    <label
      {...rest}
      className={cn("size-fit text-sm", className)}
      htmlFor={context.targetId}
    />
  );
}

export function NumberInputRequiredIndicator({
  className,
  ...rest
}: Omit<SpanProps, "children">) {
  const context = useNumberInput();

  return (
    context.required && (
      <span {...rest} className={cn("size-fit text-red-600", className)}>
        {context.required && "*"}
      </span>
    )
  );
}

export function NumberInputHelperText({
  className,
  children,
  ...rest
}: SpanProps) {
  const context = useNumberInput();
  return (
    !context.invalid && (
      <span {...rest} className={cn("size-fit text-sm", className)}>
        {children}
      </span>
    )
  );
}

export function NumberInputErrorText({
  className,
  children,
  ...rest
}: SpanProps) {
  const context = useNumberInput();

  return (
    context.invalid && (
      <span
        {...rest}
        className={cn("size-fit text-sm text-red-600", className)}
      >
        {children}
      </span>
    )
  );
}

export function NumberInputControl({ children, className, ...rest }: DivProps) {
  return (
    <div {...rest} className={cn("relative isolate size-fit", className)}>
      {children}
    </div>
  );
}

export function NumberInputInput({
  className,
  onFocus,
  onBlur,
  ref,
  ...rest
}: Omit<InputProps, "id" | "disabled" | "readOnly" | "required" | "type">) {
  const {
    targetId,
    disabled,
    readonly,
    required,
    invalid,
    value,
    setValue,
    min,
    max,
  } = useNumberInput();

  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // React onWheel은 passive라 preventDefault가 안 되므로 native listener 사용
  useEffect(() => {
    const el = inputRef.current;
    if (!focused || !el || disabled || readonly) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      const step = e.deltaY < 0 ? 1 : -1;
      setValue((v) => clamp((Number.isNaN(v) ? 0 : v) + step, min, max));
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [focused, disabled, readonly, setValue, min, max]);

  return (
    <input
      {...rest}
      ref={(el) => {
        inputRef.current = el;
        if (typeof ref === "function") return ref(el);
        if (ref) ref.current = el;
      }}
      type="number"
      className={cn(
        "number-input py-[11px] pr-[30px] pl-1 text-base font-medium",
        "border-border-primary rounded-md border border-solid",
        className,
      )}
      id={targetId}
      disabled={disabled}
      readOnly={readonly}
      required={required}
      aria-invalid={invalid || false}
      value={value}
      min={min}
      max={max}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onChange={(e) => {
        setValue(e.currentTarget.valueAsNumber);
      }}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
    />
  );
}

export function NumberInputIncrementTrigger({
  className,
  onClick,
  ...rest
}: Omit<ButtonProps, "children">) {
  const { setValue, min, max } = useNumberInput();

  return (
    <Button
      {...rest}
      className={cn(
        "border-border-primary rounded-none rounded-tr-md border border-b-0 border-solid",
        "absolute top-0 right-0 inline-flex justify-center",
        className,
      )}
      onClick={(e) => {
        setValue((v) => clamp(v + 1, min, max));
        onClick?.(e);
      }}
    >
      <ChevronUp width={16} height={16} />
    </Button>
  );
}

export function NumberInputDecrementTrigger({
  className,
  onClick,
  ...rest
}: Omit<ButtonProps, "children">) {
  const { setValue, min, max } = useNumberInput();

  return (
    <Button
      {...rest}
      className={cn(
        "border-border-primary rounded-none rounded-br-md border border-solid",
        "absolute right-0 bottom-0 inline-flex justify-center",
        className,
      )}
      onClick={(e) => {
        setValue((v) => clamp(v - 1, min, max));
        onClick?.(e);
      }}
    >
      <ChevronDown width={16} height={16} />
    </Button>
  );
}

export const NumberInput = {
  Root: NumberInputRoot,
  Label: NumberInputLabel,
  Control: NumberInputControl,
  Input: NumberInputInput,
  IncrementTrigger: NumberInputIncrementTrigger,
  DecrementTrigger: NumberInputDecrementTrigger,
  HelperText: NumberInputHelperText,
  ErrorText: NumberInputErrorText,
  RequiredIndicator: NumberInputRequiredIndicator,
};
