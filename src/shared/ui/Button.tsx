import { ButtonProps } from "./props";
import { cn, tw } from "@shared/lib/class";

const StringClassName = tw`h-10 min-w-10 px-4 gap-2`;
const NotStringClassName = tw`size-fit p-1`

export default function Button({ className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex appearance-none items-center justify-center select-none relative",
        "rounded-md whitespace-nowrap align-middle cursor-pointer text-sm font-medium",
        "hover-tint text-fg",
        typeof children === "string" ? StringClassName : NotStringClassName,
        className,
      )}
    >
      {children}
    </button>
  );
}
