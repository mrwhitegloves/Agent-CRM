import { redirect } from "next/navigation";

export default function Home() {
  // We'll redirect to the login page immediately.
  // The AuthProvider in the layout handles routing to /admin or /agent once authenticated.
  redirect("/login");
}
