import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import chronoAPI from "../axios";
import toastHandler from "../errors/toastHandler";

// shares the section mutations' key and scope, so it queues behind them
export const useRemoveTimetableCourse = (timetableId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["timetable", timetableId] });

  const { mutate: restore } = useMutation({
    mutationKey: ["sections", timetableId],
    scope: { id: `sections:${timetableId}` },
    mutationFn: async (sectionIds: string[]) => {
      for (const sectionId of sectionIds) {
        await chronoAPI.post(`/api/timetable/${timetableId}/add`, {
          sectionId,
        });
      }
    },
    // refetch on failure too: earlier sections may already be back
    onSettled: invalidate,
    onError: (error) => toastHandler(error, toast),
  });

  return useMutation({
    mutationKey: ["sections", timetableId],
    scope: { id: `sections:${timetableId}` },
    mutationFn: async ({ courseId }: { courseId: string; code: string }) => {
      if (timetableId === undefined) throw new Error("Timetable is not loaded");
      const result = await chronoAPI.post<{ sectionIds: string[] }>(
        `/api/timetable/${timetableId}/removeCourse`,
        { courseId },
      );
      return result.data;
    },
    onSuccess: ({ sectionIds }, { code }) => {
      toast({
        title: `Removed ${code}`,
        action: (
          <ToastAction
            altText={`Undo removing ${code}`}
            onClick={() => restore(sectionIds)}
          >
            Undo
          </ToastAction>
        ),
      });
      return invalidate();
    },
    onError: (error) => toastHandler(error, toast),
  });
};
