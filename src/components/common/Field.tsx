import { DivProps, InputProps, LabelProps, SpanProps } from "@/types/Props";
import { createContext, useContext, useId, useMemo } from "react";
import { cn } from "@utils/cn";

export interface FieldContextI {
	disabled: boolean;
	invalid: boolean;
	readonly: boolean;
	required: boolean;
	targetId: string;
}

const FieldContext = createContext<FieldContextI | null>(null);

export function useField() {
	const context = useContext(FieldContext);

	if (context === null) {
		throw new Error(
			"useFieldContext는 Field컴포넌트 내부에서만 사용할 수 있습니다.",
		);
	}

	return context;
}

export interface FieldRootProps extends DivProps {
	disabled?: boolean;
	invalid?: boolean;
	required?: boolean;
	readonly?: boolean;
	targetId?: string;
}

export function FieldRoot({
	disabled,
	invalid,
	readonly,
	required,
	id,
	children,
	className,
	...rest
}: FieldRootProps) {
	const targetId = id ?? useId();

	const context = useMemo(
		() =>
			({ disabled, invalid, readonly, required, targetId }) as FieldContextI,
		[disabled, invalid, readonly, required, targetId],
	);

	return (
		<FieldContext.Provider value={context}>
			<div
				{...rest}
				className={cn(
					"flex flex-col items-start gap-1 w-full max-w-sm",
					"data-disabled:opacity-50 data-disabled:grayscale",
					className,
				)}
				data-disabled={!!disabled}
			>
				{children}
			</div>
		</FieldContext.Provider>
	);
}

export function FieldLabel({
	className,
	...rest
}: Omit<LabelProps, "htmlFor">) {
	const context = useField();

	return (
		<label
			{...rest}
			className={cn("size-fit text-sm", className)}
			htmlFor={context.targetId}
		/>
	);
}

export function FieldRequiredIndicator({
	className,
	...rest
}: Omit<SpanProps, "children">) {
	const context = useField();

	return (
		context.required && (
			<span {...rest} className={cn("text-red-600 size-fit", className)}>
				{context.required && "*"}
			</span>
		)
	);
}

export function FieldHelperText({ className, children, ...rest }: SpanProps) {
	const context = useField();
	return (
		!context.invalid && (
			<span {...rest} className={cn("text-sm size-fit", className)}>
				{children}
			</span>
		)
	);
}

export function FieldErrorText({ className, children, ...rest }: SpanProps) {
	const context = useField();

	return (
		context.invalid && (
			<span
				{...rest}
				className={cn("text-sm size-fit text-red-600", className)}
			>
				{children}
			</span>
		)
	);
}

export function FieldInput({
	className,
	type,
	...rest
}: Omit<InputProps, "id" | "disabled" | "readOnly" | "required">) {
	const context = useField();

	return (
		<input
			{...rest}
			id={context.targetId}
			disabled={context.disabled}
			readOnly={context.readonly}
			required={context.required}
			aria-invalid={context.invalid || false}
		/>
	);
}

export const Field = {
	Root: FieldRoot,
	Label: FieldLabel,
	Input: FieldInput,
	HelperText: FieldHelperText,
	ErrorText: FieldErrorText,
	RequiredIndicator: FieldRequiredIndicator,
};
