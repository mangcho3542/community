import { assertBoard } from "@entities/board/model/Board";

export default async function BoardDetailLayout({ children, params }: LayoutProps<"/board/[board]">) {
	const { board } = await params;
	assertBoard(board); // 여기서부터 board는 BoardT

	return children;
}
