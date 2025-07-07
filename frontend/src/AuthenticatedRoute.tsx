import { Outlet, Route, redirect } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import { NavBar } from "./components/navbar";
import { rootRoute } from "./main";

const userAuthStatusType = z.object({
  message: z.string(),
  redirect: z.string().optional(),
  error: z.string().optional(),
});

const authenticatedRoute = new Route({
  id: "authenticated",
  getParentRoute: () => rootRoute,
  beforeLoad: async () => {
    try {
      await axios.get<z.infer<typeof userAuthStatusType>>("/api/auth/check", {
        headers: {
          "Content-Type": "application/json ",
        },
      });
    } catch (e) {
      if (e instanceof AxiosError && e.response) {
        if (
          e.response.status === 200 &&
          e.response.data.message === "user needs to get degrees"
        ) {
          throw redirect({
            to: e.response.data.redirect,
          });
        }
        if (e.response.status === 401 || e.response.status === 500) {
          throw redirect({
            to: "/login",
          });
        }
      } else {
        throw e;
      }
    }
  },
  component: () => {
    return (
      <>
        <NavBar />
        <Outlet />
      </>
    );
  },
});

export default authenticatedRoute;
