"use client";

import {
	type Dispatch,
	type KeyboardEvent,
	type SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";
import { useRouter } from "next/navigation";
import { Clock, Search, X } from "lucide-react";
import { getStorageItem, setStorageItem } from "@shared/lib/LocalStorage";
import Dialog from "@shared/ui/Dialog";
import Button from "@shared/ui/Button";
import clsx from "clsx";

const storage_key = "search/recent_searches"; //localStorage에 저장할 key
const icon_size = 20; //아이콘 크기

interface SearchBarHeaderProps {
	isEmpty: boolean;
	onRemoveAllClick: () => void;
	recentSearches: string[];
	setRecentSeaches: Dispatch<SetStateAction<string[]>>;
}

function SearchBarHeader({
	isEmpty,
	onRemoveAllClick,
	recentSearches,
	setRecentSeaches,
}: SearchBarHeaderProps) {
	if (isEmpty) return <p>최근 검색어가 없습니다.</p>;

	return (
		<>
			<div className="w-full h-fit flex">
				<div className="size-fit text-sm">최근 검색어</div>

				<Button
					className="ml-auto size-fit text-sm text-secondary"
					onClick={onRemoveAllClick}
				>
					전체 삭제
				</Button>
			</div>

			{recentSearches.map((s) => (
				<div className="h-fit w-full flex mt-4 items-center" key={s}>
					<Clock width={icon_size} height={icon_size} className="shrink-0" />
					<span className="text-sm ml-2 grow truncate whitespace-nowrap ">
						{s}
					</span>

					<Button
						className="ml-3 size-fit shrink-0"
						onClick={() => setRecentSeaches((ary) => ary.filter((v) => v != s))}
					>
						<X width={icon_size} height={icon_size} />
					</Button>
				</div>
			))}
		</>
	);
}

export default function SearchBar() {
	const [value, setValue] = useState("");
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	//서버 렌더와 클라이언트 첫 렌더를 일치시키기 위해 빈 배열로 시작한다.
	const [recentSearches, setRecentSearches] = useState<string[]>([]);
	//localStorage 로드 전에 빈 배열로 덮어쓰지 않도록 로드 완료 여부를 기록한다.
	const [loaded, setLoaded] = useState(false);

	const isEmpty = recentSearches.length === 0;

	//pageshow event handler(뒤로가기 감지할 함수)
	function onPageShow(e: PageTransitionEvent) {
		if (e.persisted && typeof window !== "undefined") {
			//뒤로가기를 통해 페이지에 진입한 경우
			const stored = getStorageItem<string[]>(storage_key);
			if (Array.isArray(stored)) setRecentSearches(stored);
		}
	}

	//첫 render에서 recentSearches 읽어와서 set으로 할당
	//window에 pageshow eventlistner 할당
	useEffect(() => {
		const stored = getStorageItem<string[]>(storage_key);
		if (Array.isArray(stored)) setRecentSearches(stored);
		setLoaded(true);

		window.addEventListener("pageshow", onPageShow);

		return () => {
			window.removeEventListener("pageshow", onPageShow);
		};
	}, []);

	useEffect(() => {
		if (!loaded) return;
		setStorageItem(storage_key, recentSearches);
	}, [recentSearches, loaded]);

	//검색하는 함수
	function search() {
		const keyword = value.trim();
		if (!keyword) return; //빈 검색어는 기록하지 않는다.

		//기존에 keyword가 있다면 keyword를 삭제하고
		//제일 마지막에 keyword를 추가
		const next = recentSearches.filter((s) => s != keyword);
		next.push(keyword);

		//state를 바꾸면 이동 전에 목록이 먼저 갱신되므로 localStorage에만 저장한다.
		setStorageItem(storage_key, next);

		router.push(`/search?keyword=${encodeURIComponent(keyword)}`);
	}

	//input keydown event handler
	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && !e.nativeEvent.isComposing) {
			search();
		}
	}

	//CircleX 버튼 클릭 handler
	function handleClick() {
		const input = inputRef.current;
		if (input) input.value = "";
		setValue("");
	}

	//최근 검색어 모두 삭제
	function removeAllRecentSearches() {
		setRecentSearches([]);
		setDialogOpen(false);
	}

	return (
		<>
			<div className="w-full h-fit relative mt-7 mb-5">
				<input
					type="search"
					placeholder="검색"
					aria-placeholder="검색"
					role="search"
					aria-label="원하는 검색어를 통해 사용자 게시물 검색"
					className={clsx(
						"py-1.5 pl-7 text-base border rounded-md w-full",
						"flex items-center",
					)}
					ref={inputRef}
					onChange={(e) => setValue(e.currentTarget.value)}
					onKeyDown={handleKeyDown}
				/>

				<Button
					className="size-fit absolute left-[1%] top-[50%] translate-y-[-50%]"
					title="검색"
					onClick={() => search()}
				>
					<Search width={icon_size} height={icon_size} />
				</Button>

				{/**Input 초기화 버튼 */}
				{value && (
					<Button
						onClick={handleClick}
						className="size-fit absolute right-[1%] top-[50%] translate-y-[-50%]"
						title="초기화"
					>
						<X width={icon_size} height={icon_size} />
					</Button>
				)}
			</div>

			<SearchBarHeader
				isEmpty={isEmpty}
				onRemoveAllClick={() => setDialogOpen(true)}
				recentSearches={recentSearches}
				setRecentSeaches={setRecentSearches}
			/>

			<Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
				<Dialog.Positioner>
					<Dialog.Content className="gap-1 ">
						<Dialog.CloseTrigger />
						<Dialog.Title className="w-full flex justify-center">
							정말 전체 삭제할까요?
						</Dialog.Title>

						<Dialog.Description className="w-full flex justify-center">
							최근 검색했던 내용이 모두 사라집니다.
						</Dialog.Description>

						<div className="flex justify-center gap-10 mt-2">
							<Button
								className="bg-danger px-5 font-semibold hover:bg-danger"
								onClick={removeAllRecentSearches}
							>
								삭제
							</Button>

							<Button
								className="bg-bg-fourth px-5 font-semibold"
								onClick={() => setDialogOpen(false)}
							>
								취소
							</Button>
						</div>
					</Dialog.Content>
				</Dialog.Positioner>
			</Dialog.Root>
		</>
	);
}
