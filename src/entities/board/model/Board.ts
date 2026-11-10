import { notFound } from "next/navigation";

export const BoardAry = [
    "now",          //실시간
    "best",         //7일간 게시물을 인기순으로 보여줌
    "greeting",     //가입인사
    "free",         //자유
    "selfie",       //셀카
    "question",     //질문
    "secret",       //익명 & 비밀
    "review",       //리뷰
    "exp",          //경험
    "romance",      //로망
    "info",         //정보
    "meeting",      //구인
] as const;

export type BoardT = (typeof BoardAry)[number];

export const isBoard = (value: string): value is BoardT =>
    BoardAry.includes(value as BoardT);

export function assertBoard(value: string): asserts value is BoardT {
    if (!isBoard(value)) notFound();
}

export const BoardLabel: Record<BoardT, string> = {
    now: "실시간",
    best: "인기",
    greeting: "가입인사",
    free: "자유",
    selfie: "셀카",
    question: "질문",
    secret: "비밀",
    review: "리뷰",
    exp: "경험",
    romance: "로망",
    info: "정보",
    meeting: "구인",
};
