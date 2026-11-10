import { redirect } from "next/navigation";

export default function board() {
    return redirect("/board/now", "replace");
}