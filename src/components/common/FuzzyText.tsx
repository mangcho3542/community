"use client";

import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useRef,
	Children,
} from "react";

export interface FuzzyTextProps {
	children?: ReactNode;
	fontSize?: number | string;
	fontWeight?: number | string;
	fontFamily?: string;
	color?: string;
	intensity?: number;
	fuzzRange?: number;
	fps?: number;
	direction?: "horizontal" | "vertical" | "both";
	transitionDuration?: number;
	glitchMode?: boolean;
	glitchInterval?: number;
	glitchDuration?: number;
	gradient?: string[] | null;
	letterSpacing?: number;
	className?: string;
	style?: CSSProperties;
}

interface Metrics {
	width: number;
	left: number;
	ascent: number;
	descent: number;
}

// 안티에일리어싱이 비트맵 가장자리에서 잘리지 않도록 좌우로 두는 여백.
const INK_PAD = 1;

export default function FuzzyText({
	children,
	fontSize = "1rem",
	fontWeight = 900,
	fontFamily = "inherit",
	color = "var(--fg)",
	intensity = 0.18,
	fuzzRange = 30,
	fps = 40,
	direction = "horizontal",
	transitionDuration = 0,
	glitchMode = false,
	glitchInterval = 2000,
	glitchDuration = 200,
	gradient = null,
	letterSpacing = 0,
	className = "",
	style,
}: FuzzyTextProps) {
	const canvasRef = useRef<
		HTMLCanvasElement & { cleanupFuzzyText?: () => void }
	>(null);

	const text = Children.toArray(children).join("");
	const cssFontSize = typeof fontSize === "number" ? `${fontSize}px` : fontSize;

	// 흔들림이 만들어내는 최대 변위. 이만큼은 여백으로 비워둬야 글자가 잘리지 않는다.
	const peakIntensity = glitchMode ? Math.max(intensity, 1) : intensity;
	const maxDx =
		direction === "vertical" ? 0 : Math.ceil(peakIntensity * fuzzRange * 0.5);
	const maxDy =
		direction === "horizontal" ? 0 : Math.ceil(peakIntensity * fuzzRange * 0.25);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const offscreen = document.createElement("canvas");
		const offCtx = offscreen.getContext("2d");
		if (!offCtx) return;

		let isCancelled = false;
		let animationFrameId = 0;
		let repaintFrameId = 0;
		let glitchTimeoutId: ReturnType<typeof setTimeout> | undefined;
		let glitchEndTimeoutId: ReturnType<typeof setTimeout> | undefined;

		// paint() 가 갱신하고 애니메이션 루프가 읽는 레이아웃 상태.
		let dpr = 1;
		let boxWidth = 0;
		let boxHeight = 0;
		let bitmapWidth = 0;
		let bitmapHeight = 0;
		let originX = 0;
		let originY = 0;
		// 같은 조건이면 다시 측정/렌더하지 않기 위한 캐시 키.
		let lastKey = "";

		let isGlitching = false;
		let currentIntensity = intensity;
		let lastFrameTime = 0;
		const frameDuration = 1000 / fps;

		const resolveColor = (value: string) =>
			value.startsWith("var(")
				? getComputedStyle(document.documentElement)
						.getPropertyValue(value.slice(4, -1).trim())
						.trim() || value
				: value;

		const readFontStyle = () => {
			const computed = window.getComputedStyle(canvas);
			return {
				family:
					fontFamily === "inherit"
						? computed.fontFamily || "sans-serif"
						: fontFamily,
				// 캔버스에 font-size 를 직접 걸어두므로 rem/em 도 여기서 px 로 풀린다.
				// (임시 span 을 body 에 붙여 재던 예전 방식은 리사이즈마다 강제 리플로우를 유발했다)
				px: parseFloat(computed.fontSize) || 16,
			};
		};

		const measure = (px: number, spacing: number, family: string): Metrics => {
			offCtx.font = `${fontWeight} ${px}px ${family}`;
			offCtx.textBaseline = "alphabetic";

			const metrics = offCtx.measureText(text);
			const ascent = metrics.actualBoundingBoxAscent ?? px;
			const descent = metrics.actualBoundingBoxDescent ?? px * 0.2;

			if (spacing === 0) {
				const left = metrics.actualBoundingBoxLeft ?? 0;
				const right = metrics.actualBoundingBoxRight ?? metrics.width;
				return { width: Math.max(left + right, 0), left, ascent, descent };
			}

			let width = 0;
			for (const char of text) {
				width += offCtx.measureText(char).width + spacing;
			}
			return { width: Math.max(width - spacing, 0), left: 0, ascent, descent };
		};

		const paint = () => {
			if (isCancelled) return;

			const rect = canvas.getBoundingClientRect();
			const nextBoxWidth = Math.round(rect.width);
			const nextBoxHeight = Math.round(rect.height);
			if (nextBoxWidth <= 0 || nextBoxHeight <= 0) return;

			const { family, px: basePx } = readFontStyle();
			const nextDpr = window.devicePixelRatio || 1;

			const key = `${nextBoxWidth}|${nextBoxHeight}|${nextDpr}|${basePx}|${family}`;
			if (key === lastKey) return;
			lastKey = key;

			dpr = nextDpr;
			boxWidth = nextBoxWidth;
			boxHeight = nextBoxHeight;

			// 글자 + 흔들림 여백이 박스를 넘으면 폰트를 줄여서 맞춘다.
			// 좁은 모바일 폭에서 양옆이 잘리던 원인이 여기였다.
			const roomWidth = Math.max(1, boxWidth - maxDx * 2 - INK_PAD * 2);
			const roomHeight = Math.max(1, boxHeight - maxDy * 2);

			const base = measure(basePx, letterSpacing, family);
			const baseHeight = base.ascent + base.descent;
			const scale = Math.min(
				1,
				base.width > 0 ? roomWidth / base.width : 1,
				baseHeight > 0 ? roomHeight / baseHeight : 1,
			);

			// 비트맵을 축소해서 그리면 흐려지므로, 줄인 폰트 크기로 다시 렌더한다.
			const px = basePx * scale;
			const spacing = letterSpacing * scale;
			const metrics = scale < 1 ? measure(px, spacing, family) : base;

			bitmapWidth = Math.max(1, Math.ceil(metrics.width) + INK_PAD * 2);
			bitmapHeight = Math.max(1, Math.ceil(metrics.ascent + metrics.descent));

			// 캔버스 크기를 바꾸면 컨텍스트 상태가 초기화되므로 이후에 다시 설정한다.
			offscreen.width = Math.ceil(bitmapWidth * dpr);
			offscreen.height = Math.ceil(bitmapHeight * dpr);
			offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
			offCtx.font = `${fontWeight} ${px}px ${family}`;
			offCtx.textBaseline = "alphabetic";

			if (gradient && gradient.length >= 2) {
				const grad = offCtx.createLinearGradient(0, 0, bitmapWidth, 0);
				gradient.forEach((stop, i) =>
					grad.addColorStop(i / (gradient.length - 1), stop),
				);
				offCtx.fillStyle = grad;
			} else {
				offCtx.fillStyle = resolveColor(color);
			}

			if (spacing !== 0) {
				let xPos = INK_PAD;
				for (const char of text) {
					offCtx.fillText(char, xPos, metrics.ascent);
					xPos += offCtx.measureText(char).width + spacing;
				}
			} else {
				offCtx.fillText(text, INK_PAD + metrics.left, metrics.ascent);
			}

			const targetWidth = Math.ceil(boxWidth * dpr);
			const targetHeight = Math.ceil(boxHeight * dpr);
			// 크기가 그대로면 건드리지 않는다. 대입만으로도 버퍼가 비워지며 깜빡인다.
			if (canvas.width !== targetWidth) canvas.width = targetWidth;
			if (canvas.height !== targetHeight) canvas.height = targetHeight;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			originX = Math.round((boxWidth - bitmapWidth) / 2);
			originY = Math.round((boxHeight - bitmapHeight) / 2);

			// 루프는 최초 한 번만 띄운다. 리사이즈마다 껐다 켜지 않으므로 빈 화면이 없다.
			if (!animationFrameId) animationFrameId = window.requestAnimationFrame(run);
		};

		const run = (timestamp: number) => {
			if (isCancelled) return;
			animationFrameId = window.requestAnimationFrame(run);

			if (timestamp - lastFrameTime < frameDuration) return;
			lastFrameTime = timestamp;

			ctx.clearRect(0, 0, boxWidth, boxHeight);

			const targetIntensity = isGlitching ? 1 : intensity;
			if (transitionDuration > 0) {
				const step = 1 / (transitionDuration / frameDuration);
				currentIntensity =
					currentIntensity < targetIntensity
						? Math.min(currentIntensity + step, targetIntensity)
						: Math.max(currentIntensity - step, targetIntensity);
			} else {
				currentIntensity = targetIntensity;
			}

			for (let j = 0; j < bitmapHeight; j++) {
				let dx = 0;
				let dy = 0;
				if (direction !== "vertical") {
					dx = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
				}
				if (direction !== "horizontal") {
					dy = Math.floor(
						currentIntensity * (Math.random() - 0.5) * fuzzRange * 0.5,
					);
				}

				// dpr 이 정수가 아니어도 소스 줄이 겹치거나 비지 않도록 경계를 맞춘다.
				const sourceY = Math.round(j * dpr);
				const sourceHeight = Math.round((j + 1) * dpr) - sourceY;
				if (sourceHeight <= 0) continue;

				ctx.drawImage(
					offscreen,
					0,
					sourceY,
					offscreen.width,
					sourceHeight,
					originX + dx,
					originY + j + dy,
					bitmapWidth,
					1,
				);
			}
		};

		const startGlitchLoop = () => {
			if (!glitchMode || isCancelled) return;
			glitchTimeoutId = setTimeout(() => {
				if (isCancelled) return;
				isGlitching = true;
				glitchEndTimeoutId = setTimeout(() => {
					isGlitching = false;
					startGlitchLoop();
				}, glitchDuration);
			}, glitchInterval);
		};

		const stopLoops = () => {
			if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
			animationFrameId = 0;
			clearTimeout(glitchTimeoutId);
			clearTimeout(glitchEndTimeoutId);
		};

		// 폰트는 최대 한 번만 기다린다. 이후 리사이즈는 전부 동기 경로로 즉시 다시 그린다.
		let isFontSettled = false;
		const paintWhenFontReady = () => {
			if (isCancelled) return;
			if (isFontSettled) {
				paint();
				return;
			}

			const { family, px } = readFontStyle();
			const spec = `${fontWeight} ${px}px ${family}`;

			let isLoaded = true;
			try {
				isLoaded = document.fonts.check(spec);
			} catch {
				isLoaded = true;
			}

			if (isLoaded) {
				isFontSettled = true;
				paint();
				return;
			}

			// 기다리는 동안 빈 화면을 두지 않도록 폴백 글꼴로 먼저 그려둔다.
			paint();
			Promise.resolve(document.fonts.load(spec))
				.catch(() => document.fonts.ready)
				.catch(() => undefined)
				.then(() => {
					if (isCancelled) return;
					isFontSettled = true;
					lastKey = ""; // 글꼴이 바뀌었으니 다시 측정한다.
					paint();
				});
		};

		// 리사이즈 중 연속으로 들어오는 알림을 한 프레임으로 모은다.
		const schedulePaint = () => {
			if (repaintFrameId) return;
			repaintFrameId = window.requestAnimationFrame(() => {
				repaintFrameId = 0;
				paintWhenFontReady();
			});
		};

		const observer = new ResizeObserver(schedulePaint);
		observer.observe(canvas);
		// CSS 박스는 그대로인 채 devicePixelRatio 만 바뀌는 경우(기기 모드 전환)를 위한 보조 트리거.
		window.addEventListener("resize", schedulePaint);

		paintWhenFontReady();
		startGlitchLoop();

		canvas.cleanupFuzzyText = stopLoops;

		return () => {
			isCancelled = true;
			observer.disconnect();
			window.removeEventListener("resize", schedulePaint);
			if (repaintFrameId) window.cancelAnimationFrame(repaintFrameId);
			stopLoops();
		};
	}, [
		text,
		fontWeight,
		fontFamily,
		color,
		intensity,
		fuzzRange,
		fps,
		direction,
		transitionDuration,
		glitchMode,
		glitchInterval,
		glitchDuration,
		gradient,
		letterSpacing,
		maxDx,
		maxDy,
	]);

	// SSR 시점부터 박스 크기가 확정되도록 CSS 크기를 직접 지정한다.
	// font-size 도 함께 걸어야 캔버스 자신의 computed style 로 실제 px 을 읽을 수 있다.
	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{
				display: "block",
				width: "100%",
				maxWidth: "100%",
				height: `calc(${cssFontSize} * 1.6 + ${maxDy * 2}px)`,
				fontSize: cssFontSize,
				...style,
			}}
		/>
	);
}
