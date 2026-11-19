import { RootDocument } from "@/components/root-document";
import { rootMetadata } from "@/lib/seo";

export const metadata = rootMetadata("kk");

export default function KazakhLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="kk">{children}</RootDocument>;
}
