import { redirect } from "next/navigation";

export default function InstagramPage() {
  redirect("/social-manager?platform=instagram");
}
