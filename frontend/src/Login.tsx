import { Route } from "@tanstack/react-router";
import { AtSign } from "lucide-react";
import { rootRoute } from "./main";

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "login",
  component: Login,
});

function Login() {
  return (
    <>
      <div className="flex bg-slate-950 h-screen w-full justify-center items-center">
        <div className="flex flex-col items-center">
          <h2 className="scroll-m-20 md:text-lg text-md tracking-tight lg:text-xl text-slate-400">
            Welcome to
          </h2>
          <h1 className="scroll-m-20 md:text-6xl text-4xl font-extrabold tracking-tight lg:text-7xl text-slate-50">
            ChronoFactorem
          </h1>
          <a
            href={"/api/auth/google"}
            className="w-fit md:text-lg text-sm md:mt-6 mt-2 bg-slate-700 text-slate-50 rounded-lg flex px-4 py-2 items-center font-bold hover:bg-slate-600 transition ease-in-out"
          >
            <AtSign className="mr-2 md:h-4 d:w-4 w-3 h-3" />
            Login with Google
          </a>
          <a
            href="/about"
            className="w-fit md:mt-8 mt-2 text-slate-400 md:text-lg text-sm hover:underline underline-offset-4"
          >
            About ChronoFactorem
          </a>
        </div>
      </div>
      <span className="fixed bottom-0 bg-slate-800 w-full text-center py-1 text-xs md:px-0 px-8 tracking-tight md:text-lg text-slate-400">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </span>
    </>
  );
}

export default loginRoute;
