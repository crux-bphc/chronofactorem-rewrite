import { Route } from "@tanstack/react-router";
import { AtSign } from "lucide-react";
import { ModeToggle } from "./components/mode-toggle";
import { Button } from "./components/ui/button";
import { rootRoute } from "./main";

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "login",
  component: Login,
});

function Login() {
  return (
    <>
      <div className="flex bg-background h-screen w-full justify-center items-center">
        <div className="fixed top-4 right-4">
          <ModeToggle />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="scroll-m-20 md:text-lg text-md tracking-tight lg:text-xl text-muted-foreground">
            Welcome to
          </h2>
          <h1 className="scroll-m-20 md:text-6xl text-4xl font-extrabold tracking-tight lg:text-7xl text-foreground">
            ChronoFactorem
          </h1>
          <Button
            asChild
            className="md:mt-6 mt-2 rounded-lg flex px-4 py-2 items-center"
          >
            <a href="/api/auth/google">
              <AtSign className="mr-2 md:h-4 md:w-4 w-3 h-3" />
              <span className="font-bold md:text-lg text-sm">
                Login with Google
              </span>
            </a>
          </Button>
          <a
            href="/about"
            className="w-fit md:mt-8 mt-2 text-muted-foreground md:text-lg text-sm hover:underline underline-offset-4"
          >
            About ChronoFactorem
          </a>
        </div>
      </div>
      <span className="fixed bottom-0 bg-muted w-full text-center py-1 text-xs md:px-0 px-8 tracking-tight md:text-lg text-muted-foreground">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </span>
    </>
  );
}

export default loginRoute;
