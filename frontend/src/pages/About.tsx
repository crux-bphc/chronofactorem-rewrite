import { createLazyRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { CruxMark } from "../components/CruxMark";

const PREVIOUS_TEAM = [
  { name: "Harshvardhan Jha", role: "Product Owner + Developer" },
  { name: "Aviral Agarwal", role: "Scrum Master + Developer" },
  { name: "Kushagra Gupta", role: "Developer" },
  { name: "Abhinav Sukumar Rao", role: "Developer" },
  { name: "Vikramjeet Das", role: "Developer" },
];

const REWRITE_TEAM = [
  "Arunachala AM",
  "Jason Goveas",
  "Anurav Garg",
  "Dharanikanth Reddy",
  "Karthik Prakash",
  "Shreyash Dash",
  "Kovid Lakhera",
  "Palaniappan R",
  "Meghraj Goswami",
  "Soumitra Shewale",
  "Kishan Abijay",
  "Namit Bhutani",
  "Chaitanya Keyal",
  "Samir Khairati",
];

const linkClass =
  "group inline-flex items-center gap-1 border-b border-ink/25 text-ink transition-colors duration-(--d-1) hover:border-ink";

function About() {
  return (
    <main className="mx-auto w-full max-w-[1040px] px-5 pt-6 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:px-7 lg:pt-14">
      <CruxMark />
      <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-4">
          <h1 className="text-3xl font-medium tracking-[-0.03em] text-ink lg:text-[42px] lg:leading-[1.08]">
            About ChronoFactorem
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            Timetable builder by CRUx, BITS Hyderabad.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-sm font-medium">
            <a
              href="https://github.com/crux-bphc/chronofactorem-rewrite/"
              className={linkClass}
            >
              GitHub repository
              <ArrowUpRight
                className="size-3.5 transition-transform duration-(--d-1) group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
            <a
              href="https://github.com/crux-bphc/chronofactorem-rewrite/issues"
              className={linkClass}
            >
              Report a bug
              <ArrowUpRight
                className="size-3.5 transition-transform duration-(--d-1) group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>

        <div className="max-w-[62ch] space-y-5 text-base leading-[1.65] text-ink lg:text-[17px]">
          <p>
            ChronoFactorem is a project that makes the process of creating
            timetables and sharing them easy as pie. ChronoFactorem is developed
            and maintained by CRUx: The Programming and Computing Club of BITS
            Hyderabad.
          </p>
          <p>
            This version of ChronoFactorem is the first real release of
            ChronoFactorem. We really wanted to iron out as many bugs as we can
            before we push it out to you to ensure a smooth experience, so it
            got a little delayed. If you do still find bugs, please{" "}
            <a
              href="https://github.com/crux-bphc/chronofactorem-rewrite/issues"
              className={`${linkClass} font-medium`}
            >
              report them
            </a>
            .
          </p>
          <p>
            This is a ground-up rewrite of the last iteration of ChronoFactorem,
            built with a different set of features to make timetable creation
            easier across registrations. The backend code is some of the most
            solid code we've written over the years, and you can{" "}
            <a
              href="https://github.com/crux-bphc/chronofactorem-rewrite/"
              className={`${linkClass} font-medium`}
            >
              look at it and star it
            </a>
            .
          </p>

          <section
            aria-labelledby="credits-rewrite"
            className="mt-8 rounded-xl border border-line bg-surface p-5"
          >
            <h2
              id="credits-rewrite"
              className="text-[13px] font-medium text-ink-muted"
            >
              Rewrite contributors
            </h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-ink">
              {REWRITE_TEAM.join(", ")}
            </p>
          </section>

          <section
            aria-labelledby="credits-previous"
            className="rounded-xl border border-line bg-surface p-5"
          >
            <h2
              id="credits-previous"
              className="text-[13px] font-medium text-ink-muted"
            >
              Previous version
            </h2>
            <ul className="mt-2.5 divide-y divide-line text-[15px]">
              {PREVIOUS_TEAM.map((member) => (
                <li
                  key={member.name}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <span className="font-medium text-ink">{member.name}</span>
                  <span className="font-mono text-xs text-ink-muted">
                    {member.role}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

export const Route = createLazyRoute("/about")({
  component: About,
});
