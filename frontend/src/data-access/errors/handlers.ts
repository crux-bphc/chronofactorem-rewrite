import { notFound } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { router } from "@/main";

export const handleNotFound = (error: unknown) => {
  if (
    error instanceof AxiosError &&
    error.response &&
    error.response.status === 404
  ) {
    throw notFound();
  }
};

export const handleLoginRedirect = (error: unknown) => {
  if (
    error instanceof AxiosError &&
    error.response &&
    error.response.status === 401
  ) {
    router.navigate({
      to: "/login",
    });
  }
};
