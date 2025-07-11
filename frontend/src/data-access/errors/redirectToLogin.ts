import { AxiosError } from "axios";
import { router } from "@/main";

const handleLoginRedirect = (error: unknown) => {
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
export default handleLoginRedirect;
