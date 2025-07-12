import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import toastHandler from "./errors/toastHandler";

const useEditUser = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { degrees: (string | null)[] }) => {
      return axios.post("/api/user/edit", body, {
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
    onError: (error) => toastHandler(error, toast),
  });
};

export default useEditUser;
