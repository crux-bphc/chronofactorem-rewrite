import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

const NotFound = () => (
  <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center px-7 py-16">
    <h1 className="text-[96px] font-semibold leading-none tracking-tight">
      404
    </h1>
    <div className="mt-4 text-xl font-medium">Page Not Found</div>
    <Button asChild className="mt-6 self-start">
      <Link to="/">Go home</Link>
    </Button>
  </div>
);

export default NotFound;
