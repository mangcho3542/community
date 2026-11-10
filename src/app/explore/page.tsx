import { type Metadata } from "next";
import SearchBar from "@features/explore/SearchBar";

//최근 검색어를 뭐라고 해야할까

export const metadata: Metadata = {
    title: "비스듬 - 검색",
    description: ""
}

export default function ExplorePage() {
    return (
        <main className="main items-center rounded-lg bg-bg-secondary px-7">
            <SearchBar />
        </main>
    )
}