import { AnchorScroll } from "@/components/anchor-scroll";
import { Directions } from "@/components/directions";
import { SiteHeader } from "@/components/header";
import { Hero } from "@/components/hero";
import { About, Contacts, FinalCta, FirstVisit, Intro, Pause, Prices, Team } from "@/components/home-sections";
import { RevealObserver } from "@/components/reveal";
import { TodayStrip } from "@/components/today-strip";

export function HomeView() {
  return (
    <>
      <div className="hero-stack">
        <SiteHeader />
        <Hero />
      </div>
      <RevealObserver />
      <AnchorScroll />
      <main id="content">
        <TodayStrip />
        <Intro />
        <Directions />
        <Pause />
        <FirstVisit />
        <Team />
        <Prices />
        <About />
        <FinalCta />
        <Contacts />
      </main>
    </>
  );
}
