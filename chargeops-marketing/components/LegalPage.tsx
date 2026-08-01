import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BackToTop } from "@/components/BackToTop";
import { CheckIcon } from "@/components/Icons";
import type { LegalPageContent } from "@/lib/legal";

export function LegalPage({ content }: { content: LegalPageContent }) {
  return (
    <>
      <SiteHeader />
      <main className="bg-surface-alt">
        <section className="border-b border-line bg-white">
          <div className="container-x py-14 sm:py-20">
            <span className="pill bg-primary-soft text-primary-dark">
              <CheckIcon className="h-3.5 w-3.5" /> {content.eyebrow}
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-ink-strong sm:text-5xl">
              {content.title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-body">
              {content.description}
            </p>
            <p className="mt-4 text-sm font-medium text-ink-muted">
              Cập nhật lần cuối: {content.updatedAt}
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="container-x grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="h-fit rounded-card border border-line bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Nội dung
              </p>
              <nav className="mt-3 space-y-2">
                {content.sections.map((section) => (
                  <a
                    key={section.title}
                    href={`#${slug(section.title)}`}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-body transition hover:bg-primary-soft hover:text-primary-dark"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="space-y-5">
              {content.sections.map((section) => (
                <article
                  key={section.title}
                  id={slug(section.title)}
                  className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8"
                >
                  <h2 className="text-xl font-bold text-ink-strong">{section.title}</h2>
                  <div className="mt-4 space-y-3">
                    {section.body.map((line) => (
                      <p key={line} className="leading-relaxed text-ink-body">
                        {line}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
