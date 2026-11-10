import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	async rewrites() {
		return [
			{
				source: "/",
				destination: "/board/now",
			},
		];
	},
	experimental: {
		staleTimes: {
			dynamic: 0,
			static: 300
		}
	}
};

export default nextConfig;
