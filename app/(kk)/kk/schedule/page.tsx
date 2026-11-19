import { SiteHeader } from "@/components/header";
import { ScheduleBoard } from "@/components/schedule-board";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("kk", "schedule");

export default function SchedulePage() {
  return (
    <>
      <SiteHeader />
      <main id="content">
        <ScheduleBoard />
      </main>
    </>
  );
}
