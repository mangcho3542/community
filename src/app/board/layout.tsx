import BoardNav from "@widgets/board-nav/BoardNav";

export default function BoardLayout({ children }: LayoutProps<"/board">) {
	return (
		<>
		<BoardNav />
		{children}
		</>
	);
}
