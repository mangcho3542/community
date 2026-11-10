"use client";

import { BoardAry, BoardLabel } from "@entities/board/model/Board";
import clsx from "clsx";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

const underlineClassName = clsx(
	"relative",
	"after:absolute after:bottom-0 after:left-0 after:block after:content-['']",
	"after:w-full after:text-inherit",
	"after:border-b-2 after:border-solid after:border-border-primary",
	"after:h-0.25 after:-translate-y-4 after:opacity-0",
	"after:transition-all after:duration-500",
);

const underlineHoverClassName = clsx(
	"hover:after:opacity-100 hover:after:-translate-y-1.5",
);

export default function BoardNav() {
	const { board } = useParams<{ board?: string }>();
	const x = useRef(0);
	const [flag, setFlag] = useState(false);
	const router = useRouter();

	return (
		<nav
			className={clsx(
				"flex shrink-0 rounded-sm overflow-x-auto scrollbar-hide items-center",
				"bg-bg-secondary cursor-pointer relative md:w-xl mx-auto",
			)}
			onMouseDown={(e) => {
				x.current = e.clientX;
				setFlag(true);
			}}
			onMouseMove={(e) => {
				if (!flag) return;
				e.currentTarget.scrollLeft -= e.clientX - x.current;
				x.current = e.clientX;
			}}
			onMouseUp={() => {
				setFlag(false);
			}}
			onMouseLeave={() => {
				setFlag(false);
			}}
		>
			{BoardAry.map((b) => (
				<div
					key={b}
					className={clsx(
						board === b ? "text-fg" : "text-secondary",
						"w-fit h-fit hover:text-fg py-1 grow mx-3 select-none box-content",
						"flex justify-center items-center whitespace-nowrap relative",
						underlineClassName,
						!flag && underlineHoverClassName,
					)}
					onClick={() => router.push(`/board/${b}`)}
				>
					{BoardLabel[b]}
				</div>
			))}
		</nav>
	);
}
