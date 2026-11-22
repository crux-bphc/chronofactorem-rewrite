import { Link } from "@tanstack/react-router";
import { CruxMark } from "./CruxMark";
import { Button } from "./ui/button";

const NotFound = () => (
  <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center px-7 py-16">
    <CruxMark />
    <h1 className="font-mono text-[88px] leading-none font-normal tracking-[-0.04em]">
      404
    </h1>
    <div className="mt-4 text-xl font-medium tracking-[-0.015em]">
      Page Not Found
    </div>
    <Button asChild className="mt-6 self-start">
      <Link to="/">Go home</Link>
    </Button>
  </div>
);

export default NotFound;
