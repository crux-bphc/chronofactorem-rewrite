import { Route } from "@tanstack/react-router";
import { rootRoute } from "../router";

const aboutRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "about",
  component: About,
});

function About() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pt-2 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:max-w-[720px] lg:px-7 lg:pt-10">
      <h1 className="text-2xl font-semibold lg:text-3xl">
        About ChronoFactorem
      </h1>
      <div>
        <p className="mt-3 text-base leading-relaxed text-ink lg:text-lg">
          ChronoFactorem is a project that makes the process of creating
          timetables and sharing them easy as pie. ChronoFactorem is developed
          and maintained by CRUx: The Programming and Computing Club of BITS
          Hyderabad.
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink lg:text-lg">
          This version of ChronoFactorem is the first real release of
          ChronoFactorem. We really wanted to iron out as many bugs as we can
          before we push it out to you to ensure a smooth experience, so it got
          a little delayed. If you do still find bugs, please{" "}
          <a
            href="https://github.com/crux-bphc/chronofactorem-rewrite/issues"
            className="text-brand underline underline-offset-2"
          >
            report them
          </a>
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink lg:text-lg">
          This is a ground-up rewrite of the last iteration of ChronoFactorem.
          We thank Harshvardhan Jha (Product Owner + Developer), Aviral Agarwal
          (Scrum Master + Developer), Kushagra Gupta (Developer), Abhinav
          Sukumar Rao (Developer), Vikramjeet Das (Developer) for the previous
          version.
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink lg:text-lg">
          This version has a different set of features to make it easier to make
          timetables. As we move on from this registration, you will see even
          more features being added to this project.
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink lg:text-lg">
          The backend code is some of the most solid code we've written over the
          years, you can go{" "}
          <a
            href="https://github.com/crux-bphc/chronofactorem-rewrite/"
            className="text-brand underline underline-offset-2"
          >
            look at it and star it
          </a>
          . We thank Arunachala AM, Jason Goveas, Anurav Garg, Dharanikanth
          Reddy, Karthik Prakash, Shreyash Dash, Kovid Lakhera, Palaniappan R,
          Meghraj Goswami, Soumitra Shewale, Kishan Abijay, Namit Bhutani,
          Chaitanya Keyal and Samir Khairati for this rewrite of ChronoFactorem.
        </p>
      </div>
    </main>
  );
}

export default aboutRoute;
