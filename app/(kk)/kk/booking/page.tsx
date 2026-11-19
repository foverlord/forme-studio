import { BookingFlow } from "@/components/booking-flow";
import { SiteHeader } from "@/components/header";
import { getDictionary } from "@/content/dictionary";
import { pageMetadata } from "@/lib/seo";
import { whatsAppGreetingHref } from "@/lib/whatsapp";

export const metadata = pageMetadata("kk", "booking");

export default function BookingPage() {
  const copy = getDictionary("kk");
  const href = whatsAppGreetingHref(copy.booking.whatsappTemplate);
  return (
    <>
      <SiteHeader />
      <main id="content">
        <noscript>
          <div className="wrap" style={{ padding: "32px 0" }}>
            <a className="btn btn-cta" href={href}>
              {copy.booking.sendError.whatsapp}
            </a>
          </div>
        </noscript>
        <BookingFlow />
      </main>
    </>
  );
}
