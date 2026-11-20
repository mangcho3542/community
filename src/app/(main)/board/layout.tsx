import BoardNav from "@components/features/board-nav/BoardNav";

export default function BoardLayout({ children }: LayoutProps<"/board">) {
	return (
		<>
		<BoardNav />
		{children}
		</>
	);
}
