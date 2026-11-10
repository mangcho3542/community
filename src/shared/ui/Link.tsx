import { cn } from "@shared/lib/class";
import NextLink from "next/link";
import { useMemo, type ComponentProps } from "react";

const underlineClassName = cn(
	"after:absolute after:bottom-0 after:left-0 after:block after:content-['']",
	"after:w-full",
	"after:border-b-2 after:border-solid after:border-border-primary",
	"after:h-0.25 after:-translate-y-4 after:opacity-0",
	"after:transition-all after:duration-500",
	"hover:after:opacity-100 hover:after:-translate-y-2",
);

export interface LinkProps extends ComponentProps<typeof NextLink> {
	underline?: boolean;
}

export default function Link({
	className,
	children,
	underline = true,
	...rest
}: LinkProps) {
	const enableUnderline = useMemo(
		() => typeof children === "string" && underline,
		[children, underline],
	);

	return (
		<NextLink
			{...rest}
			className={cn(
				"relative text-inherit",
				enableUnderline && underlineClassName,
				className,
			)}
		>
			{children}
		</NextLink>
	);
}
