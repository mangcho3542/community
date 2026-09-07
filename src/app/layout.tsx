import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "@components/ui/Link";
import {
	BookSearch,
	Bell,
	CircleUser,
	LucideHome,
	MessageCircleMore,
	Search,
} from "lucide-react";
import clsx from "clsx";
import "./globals.css";

const suite = localFont({
	src: [
		{
			path: "../../public/SUITE-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../../public/SUITE-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../../public/SUITE-SemiBold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "../../public/SUITE-Bold.woff2",
			weight: "700",
			style: "normal",
		},
	],
});

export const metadata: Metadata = {
	title: "비스듬",
	description: "BDSM 커뮤니티",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="ko" className={suite.className}>
			<body>
				{/**Header */}
				<header className="w-full md:w-xl h-fit flex flex-row py-2 px-2 md:mx-auto">
					<Link href="/" underline={false} className="h-full text-lg font-bold">
						BSDM
					</Link>

					<div className="flex w-fit h-full items-center gap-2 ml-auto">
						<Link href="/guide" className="size-fit">
							<BookSearch />
						</Link>

						<Link href="/notification" className="size-fit">
							<Bell />
						</Link>
					</div>
				</header>

				{children}

				{/**Nav */}
				<nav
					className={clsx(
						"w-full md:w-fit mt-auto h-fit md:h-full",
						"fixed left-0 bottom-0",
						"md:fixed md:left-0 md:top-0",
					)}
				>
					<ul
						className={clsx(
							"py-2 md:px-2 w-full md:w-fit h-fit md:h-full",
							"flex flex-row md:flex-col justify-center md:gap-3",
						)}
					>
						<li className="flex justify-center grow md:grow-0 h-fit">
							<Link href="/">
								<LucideHome />
							</Link>
						</li>

						<li className="flex justify-center grow md:grow-0 h-fit">
							<Link href="/search">
								<Search />
							</Link>
						</li>

						<li className="flex justify-center grow md:grow-0 h-fit">
							<Link href="/chat">
								<MessageCircleMore />
							</Link>
						</li>

						<li className="flex justify-center grow md:grow-0 h-fit">
							<Link href="/dashboard">
								<CircleUser />
							</Link>
						</li>
					</ul>
				</nav>
			</body>
		</html>
	);
}
