import { notFound } from "@tanstack/react-router";
import { AxiosError } from "axios";

const handleNotFound = (error: unknown) => {
  if (
    error instanceof AxiosError &&
    error.response &&
    error.response.status === 404
  ) {
    throw notFound();
  }
};
export default handleNotFound;
