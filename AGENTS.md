<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 응답 규칙

- 출력할 때는 항상 caveman(모드: full)을 사용한다.
- 항상 ponytail(강도: full)을 사용한다.
- 코드를 작성하거나 수정할 때는 항상 ponytail plugin을 강도 full로 켠 상태에서 작업한다. ponytail이 꺼져 있거나 강도가 full이 아니면 코드를 쓰기 전에 `/ponytail full`로 먼저 맞춘다.

caveman은 말투를, ponytail은 작성하는 코드를 다룬다. 두 plugin을 함께 켠다.

이 규칙들은 세션 시작부터 끝까지 적용한다. 사용자가 직접 끄거나 단계를 바꾸라고 할 때만 바꾼다.

# 프로젝트 개요

"비스듬" 커뮤니티 웹 서비스. Next.js App Router 기반이고, `src` 아래를 `components`, `lib`, `utils`, `store`, `types`, `constants`로 나눈다.

- 프레임워크: Next.js 16.3.4 (App Router, Turbopack), React 19.2.8
- 언어: TypeScript (`strict`, `allowJs: false`)
- 패키지 매니저: bun 1.4.0 (`bun.lock`). npm, yarn, pnpm으로 설치하지 않고, `npx`도 쓰지 않는다 (대신 `bunx`).
- React Compiler 사용 (`next.config.ts`의 `reactCompiler: true`). 수동 `useMemo`/`useCallback`은 꼭 필요할 때만 쓴다.

## 명령어

| 명령어 | 용도 |
| --- | --- |
| `bun run dev` | 개발 서버 |
| `bun run build` | 프로덕션 빌드 (타입 검사 포함) |
| `bun run lint` | ESLint |
| `bunx tsc --noEmit` | 타입 검사만 |

패키지 바이너리는 `bunx`로 실행한다. `npx`는 쓰지 않는다.

# 디렉터리 구조

```
src/
├── app/                  Next.js App Router. 라우팅과 조합만 담당한다.
│   ├── layout.tsx        루트 레이아웃 (폰트, portal 루트)
│   ├── not-found.tsx     404 페이지
│   ├── globals.css       Tailwind 진입점, 디자인 토큰
│   ├── _styles/          전역 CSS 조각 (private folder, 라우팅 대상 아님)
│   └── (main)/           route group. layout.tsx에서 Header, Nav를 배치한다.
│       ├── board/        /board, /board/[board]
│       ├── explore/      /explore
│       ├── write/        /write
│       └── test/         컴포넌트 실험용 페이지
├── components/
│   ├── common/           도메인과 무관한 UI 키트 (Button, Dialog, Field, Link, Portal, Toast, Tooltip 등)
│   └── features/         도메인 기능 단위 컴포넌트. 기능별 폴더로 나눈다.
│       ├── header/       Header (상단 로고, 가이드, 알림 링크)
│       ├── nav/          Nav (전역 메뉴)
│       ├── board-nav/    BoardNav (게시판 탭)
│       ├── introduce/    Introduce
│       ├── explore/      SearchBar (검색, 최근 검색어)
│       └── write/        Editor, EditorToolbar, ToolbarConfig.ts
├── lib/                  Next.js 서버에서 쓰는 함수 (현재 비어 있음)
├── utils/                클라이언트에서 쓰는 함수, hook (class.ts의 cn/tw, LocalStorage.ts, Tooltip.ts의 useTooltip)
├── store/                zustand store (Toaster.ts)
├── types/                타입만 export하는 파일 (props.ts, Editor.ts)
└── constants/            상수 (Board.ts: 게시판 목록, BoardT, 타입 가드, 라벨)
public/                   SUITE 폰트(woff2) 등 정적 파일
```

## 새 파일을 둘 위치

| 종류 | 위치 |
| --- | --- |
| 도메인과 무관한 범용 UI 컴포넌트 | `components/common/` |
| 도메인 기능 컴포넌트 (헤더, 메뉴, 검색, 에디터 등) | `components/features/<기능>/` |
| 한 기능 컴포넌트에서만 쓰는 설정값, 보조 함수 | 그 기능 폴더 안 (`components/features/write/ToolbarConfig.ts`) |
| Next.js 서버에서만 쓰는 함수 (DB, 인증, 서버 액션 등) | `lib/` |
| 클라이언트에서 쓰는 함수, hook | `utils/` |
| zustand store | `store/` |
| 타입만 export하는 파일 | `types/` |
| 여러 곳에서 쓰는 상수 | `constants/` |
| 전역 CSS | `src/app/_styles/` 에 만들고 `globals.css`에서 `@import` |
| route 파일 (`page.tsx`, `layout.tsx` 등) | `src/app/` |

- `components/common`은 `components/features`를 import하지 않는다.
- `src/app` 안의 파일은 다른 폴더에서 import하지 않는다.

# Import alias

`tsconfig.json`의 `paths`에 정의된 alias는 다음과 같다.

| Alias | 경로 |
| --- | --- |
| `@components/*` | `src/components/*` |
| `@lib/*` | `src/lib/*` |
| `@utils/*` | `src/utils/*` |
| `@store/*` | `src/store/*` |
| `@/types/*` | `src/types/*` |
| `@constants/*` | `src/constants/*` |

- 다른 폴더의 파일은 alias로 import한다.
  ```ts
  import Button from "@components/common/Button";
  import SearchBar from "@components/features/explore/SearchBar";
  import { cn } from "@utils/class";
  import { useToasterStore } from "@store/Toaster";
  import { ButtonProps } from "@/types/props";
  import { BoardAry } from "@constants/Board";
  ```
- 같은 폴더 안은 상대 경로로 import한다.
  ```ts
  import EditorToolbar from "./EditorToolbar";
  import { Portal } from "./Portal";
  ```
- `../`로 폴더를 거슬러 올라가지 않는다. 예: `../../utils/class`는 쓰지 않는다.
- `src/app`에는 alias가 없다.
- `@/*`, `@shared/*`, `@entities/*`, `@features/*`, `@widgets/*`는 없는 alias다. 쓰지 않는다.
- barrel 파일(`index.ts`)은 쓰지 않는다. 파일 경로를 직접 import한다.

# Next.js 사용 방식

- 작업 전에 `node_modules/next/dist/docs/`에서 해당 주제 문서를 읽는다. 이 버전은 학습 데이터의 Next.js와 다를 수 있다.
- `src/app`은 라우팅과 조합만 담당한다. 화면 로직과 UI는 `components`, `utils`, `store` 등에 두고 `page.tsx`, `layout.tsx`는 그것을 불러와 배치한다.
- `/`는 `next.config.ts`의 `rewrites`로 `/board/now`에 연결된다. `src/app/page.tsx`는 없다.
- `params`는 Promise다. `await params`로 읽는다. props 타입은 전역 helper `PageProps<"/board/[board]">`, `LayoutProps<"/board">`를 쓴다.
- 기본은 Server Component다. state, effect, 브라우저 API, 이벤트 핸들러가 필요한 파일에만 첫 줄에 `"use client"`를 쓴다.
- 폰트는 `next/font/local`로 `public/SUITE-*.woff2`를 불러온다 (`src/app/layout.tsx`).
- 루트 레이아웃에 portal 대상 `#dialog-root`, `#toast-root`가 있다. `Dialog`와 `Toast`는 `@components/common/Portal`을 통해 이 요소에 렌더링한다.
- `src/app` 안에서 route가 아닌 파일을 모을 때는 `_folder` 형태의 private folder를 쓴다.

# 스타일

- Tailwind CSS v4. 설정 파일 없이 `src/app/globals.css`에서 `@import "tailwindcss"`, `@plugin`, `@theme inline`으로 구성한다.
- 색상은 `globals.css`의 CSS 변수 토큰을 쓴다: `text-fg`, `text-secondary`, `bg-bg`, `bg-bg-secondary`, `border-border-primary`, `bg-danger`, `bg-success` 등. 다크 모드는 `prefers-color-scheme`으로 토큰 값만 바뀐다. 색상 값을 직접 쓰지 않는다.
- 전역 CSS 조각은 `src/app/_styles/`에 있다.
  - `components.css`: `.main` (페이지 `<main>` 공통 레이아웃)
  - `utilities.css`: `scrollbar-hide`, `hover-tint`
- 클래스 병합은 `@utils/class`의 `cn()`을 쓴다 (`clsx` + `tailwind-merge`). 외부에서 `className`을 받는 컴포넌트는 `cn(기본값, className)` 형태로 합친다.
- 컴포넌트 밖에서 클래스 문자열을 상수로 둘 때는 `` tw`...` `` 태그를 쓴다. Tailwind IntelliSense가 적용된다 (`.vscode/settings.json`).
- CSS Modules, CSS-in-JS는 쓰지 않는다.

# 패키지

| 패키지 | 용도 |
| --- | --- |
| `next` 16.3.4, `react` / `react-dom` 19.2.8 | 프레임워크 |
| `babel-plugin-react-compiler` | React Compiler |
| `tailwindcss` v4, `@tailwindcss/postcss` | 스타일 |
| `@tailwindcss/typography` | 에디터 본문 `prose` 스타일 |
| `clsx`, `tailwind-merge` | 클래스 조합 (`cn`) |
| `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` | 글쓰기 에디터 |
| `@tiptap/extension-image`, `-text-align`, `-text-style` | 에디터 확장 |
| `zustand` | 클라이언트 상태 (`store/Toaster.ts`) |
| `zod` | 스키마 검증 |
| `framer-motion` | 애니메이션 (Dialog, Toast, Tooltip) |
| `lucide-react` | 아이콘. 이름으로 렌더링할 때는 `@components/common/LucideIcon` |
| `eslint`, `eslint-config-next`, `eslint-config-prettier` | 린트 |
| `prettier`, `prettier-plugin-tailwindcss` | 포맷, Tailwind 클래스 정렬 |

새 패키지는 `bun add`로 추가한다. 추가하기 전에 위 패키지로 해결되는지 먼저 확인한다.

# 코드 규칙

- 포맷은 prettier를 따른다 (`.prettierrc.json`: 세미콜론 사용, 큰따옴표).
- UI 텍스트와 주석은 한국어로 쓴다.
- `components/common` 컴포넌트는 `Tooltip.Root`, `Dialog.Root`, `Field.Root`처럼 compound component 패턴을 쓴다.
- HTML 요소 props 타입은 `@/types/props`의 `ButtonProps`, `DivProps` 등을 쓴다.
- 타입 이름 접미사: 유니온과 alias는 `T` (`BoardT`, `PlacementT`), context와 store 형태는 `I` (`ToastI`, `FieldContextI`).
- 게시판 slug는 `@constants/Board`의 `BoardAry`가 유일한 출처다. 문자열을 `BoardT`로 좁힐 때는 `isBoard`, `assertBoard`를 쓴다.
