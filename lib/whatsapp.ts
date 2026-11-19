import { fill } from "@/content/dictionary";

/** Public studio number. Not a secret. */
export const WHATSAPP_E164 = "77717799438";

export function whatsAppHref(template: string, vars: Record<string, string>): string {
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(fill(template, vars))}`;
}

/** Greeting-only link: keeps the template's leading sentences that have no placeholders. */
export function whatsAppGreetingHref(template: string): string {
  const parts = template.split(/(?<=[.!?])\s+/);
  const kept: string[] = [];
  for (const p of parts) {
    if (p.includes("{")) break;
    kept.push(p);
  }
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(kept.join(" "))}`;
}
