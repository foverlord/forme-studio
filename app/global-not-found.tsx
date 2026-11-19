import type { Metadata } from "next";
import { geologica, onest } from "@/app/fonts";
import { getDictionary } from "@/content/dictionary";
import "./globals.css";

const ru = getDictionary("ru");
const kk = getDictionary("kk");

export const metadata: Metadata = {
  title: ru.notFound.title,
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ru" className={`${geologica.variable} ${onest.variable}`}>
      <body>
        <main id="content" className="sec">
          <div className="wrap">
            <h1 className="h2">{ru.notFound.title}</h1>
            <p className="lead" style={{ margin: "16px 0 24px" }}>
              {ru.notFound.text}
            </p>
            <p>
              <a className="btn btn-out" href="/">
                {ru.notFound.home}
              </a>
            </p>
            <h2 className="h3" lang="kk" style={{ marginTop: 48 }}>
              {kk.notFound.title}
            </h2>
            <p className="lead" lang="kk" style={{ margin: "16px 0 24px" }}>
              {kk.notFound.text}
            </p>
            <p>
              <a className="btn btn-out" href="/kk" hrefLang="kk" lang="kk">
                {kk.notFound.home}
              </a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
