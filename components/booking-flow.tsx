"use client";

import { useEffect, useRef, useState } from "react";
import { useCopy, useLocalHref, useLocale } from "@/components/locale";
import { fill } from "@/content/dictionary";
import { displayClassName, displayHall } from "@/content/kk-copy";
import { getAddress, trialPrice } from "@/content/studio";
import { trainerById } from "@/content/trainers";
import { useStudioTime } from "@/components/studio-time";
import {
  alternatives,
  beginnerChoices,
  findSession,
  isTrialPrice,
  nearestTrial,
  type Session,
} from "@/lib/schedule";
import { formatPhone, phoneError, plural, type PhoneError } from "@/lib/text";
import type { Locale } from "@/lib/locale";
import { formatLong, formatShort, weekdayOf } from "@/lib/time";
import { whatsAppHref } from "@/lib/whatsapp";
import { demoNote } from "@/content/demo-note";
import { WHATSAPP_E164 } from "@/lib/whatsapp";

type Phase = "boot" | "select" | "form" | "submitting" | "success" | "error";
type Intent = "book" | "waitlist";
type Field = "name" | "phone" | "consent";

type Draft = { name: string; phone: string; firstTime: boolean; consent: boolean };

const DRAFT_KEY = "forme-draft";
const EMPTY: Draft = { name: "", phone: "+7", firstTime: false, consent: false };

function readDraft(): Draft {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "+7",
      firstTime: Boolean(parsed.firstTime),
      consent: Boolean(parsed.consent),
    };
  } catch {
    return EMPTY;
  }
}

function writeDraft(draft: Draft) {
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function whenLabel(session: Session, locale: Locale): string {
  const copy = useCopy();
  const short = formatShort(session.date, locale);
  const day = copy.weekdays.short[weekdayOf(session.date)];
  return `${day}, ${short.split(", ").slice(1).join(", ")}`;
}

export function BookingFlow() {
  const copy = useCopy();
  const locale = useLocale();
  const href = useLocalHref();
  const address = getAddress(locale);
  const { now, hydrated } = useStudioTime();
  const [phase, setPhase] = useState<Phase>("boot");
  const [session, setSession] = useState<Session | null>(null);
  const [autoPicked, setAutoPicked] = useState(false);
  const [intent, setIntent] = useState<Intent>("book");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [firstTime, setFirstTime] = useState(false);
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, phone: false, consent: false });
  const [attempted, setAttempted] = useState(false);
  const [bringOpen, setBringOpen] = useState(false);
  const [externalNote, setExternalNote] = useState(false);
  const pendingFocus = useRef<string | null>(null);
  const [booted, setBooted] = useState(false);
  const [company, setCompany] = useState("");
  const [sendProblem, setSendProblem] = useState<null | "error" | "rate">(null);
  const startedAt = useRef(0);

  if (hydrated && now && !booted) {
    setBooted(true);
    const params = new URLSearchParams(window.location.search);
    const draft = readDraft();
    const nextIntent: Intent = params.get("intent") === "waitlist" ? "waitlist" : "book";
    const raw = params.get("session");
    let next = raw ? findSession(raw) : null;
    let auto = false;
    if (!next) {
      next = nearestTrial(now.getTime());
      auto = true;
    }
    let nextPhase: Phase = params.get("view") === "select" ? "select" : "form";
    const sessionFull = Boolean(next && (next.seats <= 0 || next.demoFullOnSubmit));
    if (sessionFull && nextIntent !== "waitlist" && nextPhase === "form") nextPhase = "error";
    setSession(next);
    setAutoPicked(auto);
    setIntent(nextIntent);
    setPhase(nextPhase);
    setName(draft.name);
    setPhone(draft.phone || "+7");
    setFirstTime(draft.firstTime);
    setConsent(draft.consent);
    if (startedAt.current === 0) startedAt.current = Date.now();
  }

  useEffect(() => {
    if (phase === "error") document.getElementById("seats-alert")?.focus();
    if (phase === "success") document.getElementById("success-title")?.focus();
    if (phase === "form" && sendProblem) document.getElementById("send-status-title")?.focus();
  }, [phase, sendProblem]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    document.getElementById(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  }, [attempted, name, phone, consent]);

  function persist(next: Partial<Draft>) {
    writeDraft({
      name: next.name ?? name,
      phone: next.phone ?? phone,
      firstTime: next.firstTime ?? firstTime,
      consent: next.consent ?? consent,
    });
  }

  function errors(): Partial<Record<Field, string>> {
    const next: Partial<Record<Field, string>> = {};
    if (name.trim().length < 2) next.name = copy.booking.errors.name;
    const phoneKind: PhoneError | null = phoneError(phone);
    if (phoneKind === "empty") next.phone = copy.booking.errors.phoneEmpty;
    if (phoneKind === "short") next.phone = copy.booking.errors.phoneShort;
    if (phoneKind === "prefix") next.phone = copy.booking.errors.phonePrefix;
    if (!consent) next.consent = copy.booking.errors.consent;
    return next;
  }

  const fieldErrors = errors();
  const show = (field: Field) => Boolean((touched[field] || attempted) && fieldErrors[field]);
  const summaryFields = (["name", "phone", "consent"] as const).filter((field) => fieldErrors[field]);

  async function send() {
    if (!session) return;
    setAttempted(true);
    const current = errors();
    const order: Field[] = ["name", "phone", "consent"];
    const first = order.find((field) => current[field]);
    if (first) {
      pendingFocus.current = first === "consent" ? "consent" : first;
      setSendProblem(null);
      return;
    }
    setSendProblem(null);
    setPhase("submitting");
    const payload = {
      name: name.trim(),
      phone,
      className: displayClassName(locale, session.name),
      date: session.date,
      time: session.start,
      locale,
      startedAt: startedAt.current || Date.now(),
      company,
    };
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setPhase("success");
        return;
      }
      setSendProblem(response.status === 429 ? "rate" : "error");
      setPhase("form");
    } catch {
      setSendProblem("error");
      setPhase("form");
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void send();
  }

  function choose(next: Session) {
    setSession(next);
    setAutoPicked(false);
    setIntent("book");
    setPhase("form");
    const url = new URL(window.location.href);
    url.searchParams.set("session", next.sessionId);
    url.searchParams.delete("view");
    url.searchParams.delete("intent");
    window.history.replaceState(null, "", url);
  }

  if (phase === "boot" || !now) {
    return (
      <div className="wrap">
        <div className="bk split" aria-busy="true">
          <div className="summary">
            <div className="skel" style={{ width: 180, height: 16 }} />
            <div className="skel" style={{ width: 220, height: 32, marginTop: 12 }} />
            <div className="skel" style={{ width: 260, height: 16, marginTop: 12 }} />
          </div>
          <div className="bk-main">
            <h1 className="h2" style={{ fontSize: 32 }}>{copy.booking.formTitle}</h1>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "select") {
    const choices = beginnerChoices(now.getTime(), session?.sessionId ?? null);
    return (
      <div className="wrap">
        <div className="bk bk-narrow">
          <div>
            <p className="cap">{copy.booking.selectKicker}</p>
            <h1 className="h2" style={{ fontSize: 32, margin: "12px 0 8px" }}>
              {copy.booking.selectTitle}
            </h1>
            <p className="lead">{copy.booking.selectLead}</p>
            <div className="sheet">
              {choices.map((item) => (
                <SessionRow
                  key={item.sessionId}
                  session={item}
                  selected={item.sessionId === session?.sessionId}
                  onPick={() => choose(item)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "success" && session) {
    const trainer = trainerById(session.trainerId, locale);
    return (
      <div className="wrap">
        <div className="bk bk-success">
          <div className="okbox" role="status" aria-live="polite">
            <div className="ok-ic ok-pop" aria-hidden="true">
              ✓
            </div>
            <h1 id="success-title" className="h2 ok-rise" style={{ fontSize: 32, animationDelay: "320ms" }} tabIndex={-1}>
              {copy.booking.delivered.title}
            </h1>
            <p className="success-note ok-rise" style={{ animationDelay: "380ms" }}>
              {copy.booking.delivered.text}
            </p>
            <div className="demo-cta ok-rise" style={{ animationDelay: "410ms" }}>
              <p>{demoNote[locale].lead}</p>
              <a
                className="btn btn-cta"
                href={`https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(demoNote[locale].message)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {demoNote[locale].whatsapp}
              </a>
            </div>
            <div className="ok-rise" style={{ animationDelay: "440ms" }}>
              <p className="num" style={{ fontSize: 20, fontWeight: 500 }}>
                {formatLong(session.date, locale)} · {session.start} · {displayClassName(locale, session.name)}
              </p>
              <p style={{ color: "var(--muted)" }}>{trainer.name}</p>
              <div className="pills">
                <button className="link" type="button" onClick={() => setExternalNote(true)}>
                  {copy.booking.route}
                </button>
                <button className="btn btn-out" type="button" onClick={() => setBringOpen((value) => !value)} aria-expanded={bringOpen}>
                  {copy.booking.bring}
                </button>
              </div>
              {externalNote ? <p role="status">{copy.booking.externalNote}</p> : null}
              <div className={bringOpen ? "bring-panel open" : "bring-panel"} inert={!bringOpen}>
                <div className="bring-clip">
                  <ul className="bring">
                    {copy.booking.bringList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    const options = alternatives(now.getTime(), session?.sessionId ?? "");
    return (
      <div className="wrap">
        <div className="bk bk-narrow">
          <div>
            <div className="alert" id="seats-alert" role="alert" tabIndex={-1} style={{ margin: 0 }}>
              <strong>{copy.booking.errorTitle}</strong>
              {copy.booking.errorText}
            </div>
            <h2 className="h2" style={{ fontSize: 28, margin: "32px 0 8px" }}>
              {copy.booking.alternatives}
            </h2>
            {options.map((item) => (
              <SessionRow key={item.sessionId} session={item} selected={false} onPick={() => choose(item)} />
            ))}
            {options.length === 0 ? <p>{copy.booking.missing}</p> : null}
            <div className="pills">
              <button
                className="btn btn-out"
                type="button"
                onClick={() => {
                  setIntent("waitlist");
                  setPhase("form");
                }}
              >
                {copy.booking.waitlist}
              </button>
              <button className="btn btn-out" type="button" onClick={() => setPhase("form")}>
                {copy.booking.retry}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="wrap">
        <div className="bk">
          <p>{copy.booking.missing}</p>
          <a className="link" href={href("/schedule")}>
            {copy.allSchedule}
          </a>
        </div>
      </div>
    );
  }

  const trainer = trainerById(session.trainerId, locale);
  const sending = phase === "submitting";
  const summaryNames = summaryFields.map((field) =>
    field === "name" ? copy.booking.errors.nameField : field === "phone" ? copy.booking.errors.phoneField : copy.booking.errors.consentField,
  );
  const summaryText =
    summaryNames.length === 0
      ? ""
      : summaryNames.length === 1
        ? summaryNames[0]
        : `${summaryNames.slice(0, -1).join(", ")} ${copy.booking.errors.and} ${summaryNames[summaryNames.length - 1]}`;
  const waHref = whatsAppHref(copy.booking.whatsappTemplate, {
    class: displayClassName(locale, session.name),
    date: formatLong(session.date, locale),
    time: session.start,
    name: name.trim(),
    phone,
  });

  return (
    <div className="wrap">
      <div className="bk split">
        <aside>
          <p className="cap" style={{ marginBottom: 12 }}>
            {sending ? copy.booking.sendingStep : fill(copy.booking.step, { current: "2", total: "3" })}
          </p>
          <div className="summary">
            {autoPicked && intent === "book" ? <span className="pre">{copy.booking.picked}</span> : null}
            <span className="t">
              {whenLabel(session, locale)} · {session.start}
            </span>
            <b style={{ fontSize: 18 }}>
              {displayClassName(locale, session.name)} · {session.durationMin} {copy.units.min}
              {session.level === "beginner" ? ` · ${copy.levels.beginner.toLowerCase()}` : ""}
            </b>
            <span style={{ color: "var(--muted)" }}>
              {trainer.name} · {displayHall(locale, session.hall)} · {address.short}
            </span>
            <span className="num" style={{ marginTop: 8 }}>
              {isTrialPrice(session.level, session.trial)
                ? fill(copy.booking.summaryTrial, { price: trialPrice })
                : copy.booking.summaryOther}
            </span>
            <button className="link" type="button" style={{ justifySelf: "start", marginTop: 12 }} onClick={() => setPhase("select")}>
              {copy.booking.change}
            </button>
          </div>
        </aside>
        <form className="bk-main" onSubmit={onSubmit} noValidate aria-busy={sending} action="/api/booking" method="post">
          <h1 className="h2" style={{ fontSize: 32 }}>
            {copy.booking.formTitle}
          </h1>
          <p className="demo-note">{demoNote[locale].note}</p>
          {attempted && summaryFields.length > 0 ? (
            <div className="alert" role="alert">
              <strong>
                {fill(copy.booking.errors.summary, {
                  n: String(summaryFields.length),
                  fields: plural(summaryFields.length, copy.booking.fields.one, copy.booking.fields.few, copy.booking.fields.many),
                })}
              </strong>
              {summaryText.charAt(0).toUpperCase()}
              {summaryText.slice(1)}.
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="name">{copy.booking.name}</label>
            <input
              id="name"
              className="input"
              name="name"
              autoComplete="name"
              value={name}
              readOnly={sending}
              aria-invalid={show("name") || undefined}
              aria-describedby={show("name") ? "name-error" : undefined}
              onBlur={() => setTouched((value) => ({ ...value, name: true }))}
              onChange={(event) => {
                setName(event.target.value);
                persist({ name: event.target.value });
              }}
            />
            {show("name") ? (
              <span className="er" id="name-error">
                ⚠ {fieldErrors.name}
              </span>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="phone">{copy.booking.phone}</label>
            <input
              id="phone"
              className="input"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              readOnly={sending}
              aria-invalid={show("phone") || undefined}
              aria-describedby={show("phone") ? "phone-error phone-hint" : "phone-hint"}
              onBlur={() => setTouched((value) => ({ ...value, phone: true }))}
              onChange={(event) => {
                const next = formatPhone(event.target.value);
                setPhone(next);
                persist({ phone: next });
              }}
            />
            <span className="hint" id="phone-hint">
              {copy.booking.phoneHint}
            </span>
            {show("phone") ? (
              <span className="er" id="phone-error">
                ⚠ {fieldErrors.phone}
              </span>
            ) : null}
          </div>
          <label className="chk">
            <input
              type="checkbox"
              checked={firstTime}
              disabled={sending}
              onChange={(event) => {
                setFirstTime(event.target.checked);
                persist({ firstTime: event.target.checked });
              }}
            />
            <span>
              {copy.booking.firstTime} <span style={{ color: "var(--muted)" }}>{copy.booking.optional}</span>
            </span>
          </label>
          <label className="chk">
            <input
              id="consent"
              type="checkbox"
              checked={consent}
              disabled={sending}
              aria-invalid={show("consent") || undefined}
              aria-describedby={show("consent") ? "consent-error" : undefined}
              onBlur={() => setTouched((value) => ({ ...value, consent: true }))}
              onChange={(event) => {
                setConsent(event.target.checked);
                persist({ consent: event.target.checked });
              }}
            />
            <span>
              {copy.booking.consent}
              {show("consent") ? (
                <>
                  <br />
                  <span className="er" id="consent-error">
                    ⚠ {fieldErrors.consent}
                  </span>
                </>
              ) : null}
            </span>
          </label>
          <div className="hp" aria-hidden="true">
            <input
              id="company"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </div>
          <input type="hidden" name="class_name" value={displayClassName(locale, session.name)} />
          <input type="hidden" name="date" value={session.date} />
          <input type="hidden" name="time" value={session.start} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="startedAt" value={startedAt.current || ""} />
          {sendProblem ? (
            <div className="send-status" role="alert" aria-live="assertive">
              <h2 id="send-status-title" tabIndex={-1}>
                {copy.booking.sendError.title}
              </h2>
              <p>{sendProblem === "rate" ? copy.booking.sendError.rateLimit : copy.booking.sendError.text}</p>
              <div className="send-actions">
                <a className="btn btn-cta btn-block" href={waHref} target="_blank" rel="noopener noreferrer">
                  {copy.booking.sendError.whatsapp}
                </a>
                <button className="link" type="button" onClick={() => void send()}>
                  {copy.booking.sendError.retry}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-cta btn-block"
              type="submit"
              style={{ marginTop: 24 }}
              disabled={sending}
              aria-disabled={sending}
              onMouseDown={(event) => event.preventDefault()}
            >
              {sending ? <span className="spin" aria-hidden="true" /> : null}
              {sending ? copy.booking.sending : fill(copy.booking.submit, { time: session.start })}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function SessionRow({ session, selected, onPick }: { session: Session; selected: boolean; onPick: () => void }) {
  const copy = useCopy();
  const locale = useLocale();
  const trainer = trainerById(session.trainerId, locale);
  const low = session.seats > 0 && session.seats <= 3;
  const seats =
    session.seats <= 0
      ? copy.seats.none
      : `${session.seats} ${plural(session.seats, copy.seats.one, copy.seats.few, copy.seats.many)}`;
  return (
    <div className="row">
      <div className="t">
        {session.start}
        <small>
          {session.durationMin} {copy.units.min}
        </small>
      </div>
      <div>
        <div className="n">{displayClassName(locale, session.name)}</div>
        <div className="m">
          {copy.weekdays.short[weekdayOf(session.date)]} · {trainer.name}
        </div>
      </div>
      <div className="x">
        {selected ? <span className="tag">{copy.booking.chosen}</span> : <span className={low ? "seats low" : "seats"}>{seats}</span>}
        <button className="btn btn-out" type="button" onClick={onPick}>
          {selected ? copy.booking.keep : copy.booking.pick}
        </button>
      </div>
    </div>
  );
}
