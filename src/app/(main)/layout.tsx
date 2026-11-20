import Header from "@components/features/header/Header";
import Nav from "@components/features/nav/Nav";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <Nav />
      {children}
    </>
  );
}
