import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import chronoAPI from "../axios";
import toastHandler from "../errors/toastHandler";

const useEditUser = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { degrees: (string | null)[] }) => {
      return chronoAPI.post("/api/user/edit", body);
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
