import { AxiosError } from "axios";
import type { toast } from "@/components/ui/use-toast";
import { HTTPError, UnknownError } from ".";
import handleLoginRedirect from "./redirectToLogin";

const toastHandler = (error: Error, toaster: typeof toast) => {
  if (error instanceof AxiosError && error.response) {
    switch (error.response.status) {
      case 401:
        handleLoginRedirect(error);
        break;
      default:
        toaster(HTTPError(error.response, error.response.status));
        return;
    }
  }
  toaster(UnknownError());
};

export default toastHandler;
