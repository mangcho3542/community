import { BoardAry, BoardT, assertBoard } from "@entities/board/model/Board";

export const dynamicParams = false;

export function generateStaticParams() {
	return BoardAry.map((board) => ({ board }));
}

export default async function BoardPage({
	params,
}: PageProps<"/board/[board]">) {
	const { board } = (await params) as { board: BoardT };
	

	return <main className="main "></main>;
}
