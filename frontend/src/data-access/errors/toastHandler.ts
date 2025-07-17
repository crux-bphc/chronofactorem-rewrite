import { AxiosError } from "axios";
import type { toast } from "@/components/ui/use-toast";
import { HTTPError, UnknownError } from ".";
import { handleLoginRedirect } from "./handlers";

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
  console.error(error);
  toaster(UnknownError());
};

export default toastHandler;
