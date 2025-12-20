import { Route } from "@tanstack/react-router";
import { ArrowUpRightFromCircle } from "lucide-react";
import { rootRoute } from "../main";

const aboutRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "about",
  component: About,
});

function About() {
  return (
    <main className="lg:pl-20 px-16 pt-16">
      <h1 className="text-4xl font-bold tracking-tight">
        About ChronoFactorem
      </h1>
      <div className="lg:w-2/3 text-2xl">
        <p className="pt-4">
          ChronoFactorem is a project that makes the process of creating
          timetables and sharing them easy as pie. ChronoFactorem is developed
          and maintained by CRUx: The Programming and Computing Club of BITS
          Hyderabad.
        </p>
        <p className="pt-4">
          This version of ChronoFactorem is the first real release of
          ChronoFactorem. We really wanted to iron out as many bugs as we can
          before we push it out to you to ensure a smooth experience, so it got
          a little delayed. If you do still find bugs, please report them{" "}
          <a
            href="https://github.com/crux-bphc/chronofactorem-rewrite/issues"
            className="text-blue-400 inline pl-1 items-center"
          >
            here
            <ArrowUpRightFromCircle className="inline w-5 h-5 ml-1 mr-1" />
          </a>
        </p>
        <p className="pt-4">
          This is a ground-up rewrite of the last iteration of ChronoFactorem.
          We thank Harshvardhan Jha (Product Owner + Developer), Aviral Agarwal
          (Scrum Master + Developer), Kushagra Gupta (Developer), Abhinav
          Sukumar Rao (Developer), Vikramjeet Das (Developer) for the previous
          version.
        </p>
        <p className="pt-4">
          This version has a different set of features to make it easier to make
          timetables. As we move on from this registration, you will see even
          more features being added to this project.
        </p>
        <p className="pt-4">
          The backend code is some of the most solid code we've written over the
          years, you can go look at it and star it{" "}
          <a
            href="https://github.com/crux-bphc/chronofactorem-rewrite/"
            className="text-blue-400 inline pl-1 items-center"
          >
            here
            <ArrowUpRightFromCircle className="inline w-5 h-5 ml-1 mr-1" />
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
