import { RootDocument } from "@/components/root-document";
import { rootMetadata } from "@/lib/seo";

export const metadata = rootMetadata("ru");

export default function RussianLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="ru">{children}</RootDocument>;
}
