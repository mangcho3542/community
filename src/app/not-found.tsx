import FuzzyText from "@components/common/FuzzyText";
import Link from "@components/ui/Link";

export default function NotFound() {
	return (
		<main className="main items-center px-4 pt-60 gap-6">
			<FuzzyText intensity={0.2} fontSize="1.5rem">
				존재하지 않는 페이지입니다.
			</FuzzyText>

			<Link href="/" className="visited:text-(--fg) visited:no-underline">
				메인 페이지로 돌아가기
			</Link>
		</main>
	);
}
