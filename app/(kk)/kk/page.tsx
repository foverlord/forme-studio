import { HomeView } from "@/components/home-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("kk", "home");

export default function Page() {
  return <HomeView />;
}
