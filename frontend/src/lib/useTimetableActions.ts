import { useIsMutating } from "@tanstack/react-query";
import { TimetableActionType, useTimetableState } from "@/context";
import useCopyTimetable from "@/data-access/hooks/useCopyTimetable";
import useEditTimetable, {
  editTimetableKey,
} from "@/data-access/hooks/useEditTimetable";
import { router } from "../router";
import { preloadEditorOnIntent, preloadOnIntent } from "./preloadOnIntent";

/** Copy, edit and publish for the timetable on the editor and view pages. */
export function useTimetableActions(): {
  copy(): void;
  edit(): void;
  publish(): void;
  isEditing: boolean;
  /** spread on the buttons, to preload the page each one opens */
  intent: Record<
    "copy" | "edit" | "publish",
    Partial<ReturnType<typeof preloadOnIntent>>
  >;
} {
  const {
    state: { timetable },
    dispatch,
  } = useTimetableState();
  const { mutateAsync: editTimetable } = useEditTimetable();
  const isEditing = useIsMutating({ mutationKey: editTimetableKey }) > 0;
  const { mutateAsync: copyTimetable } = useCopyTimetable();

  const edit = () => {
    if (timetable === undefined) return;
    editTimetable({
      id: timetable.id,
      body: {
        isDraft: true,
        isPrivate: true,
        name: timetable?.name ?? "",
      },
    })
      .then(() =>
        router.navigate({
          to: "/edit/$timetableId",
          params: { timetableId: timetable.id },
        }),
      )
      .catch(() => {
        // useEditTimetable already toasts the error.
      });
  };

  const copy = () => {
    if (timetable === undefined) return;
    dispatch({
      type: TimetableActionType.SetIsCopyingTimetable,
      isCopyingTimetable: true,
    });
    setTimeout(() => {
      // react query drops per-call mutate callbacks once their
      // component unmounts (the caller may be a menu that closes),
      // so navigate from the promise instead
      copyTimetable(timetable.id)
        .then((res) =>
          router.navigate({
            to: "/edit/$timetableId",
            params: { timetableId: res.data.id },
          }),
        )
        .catch(() => {
          // useCopyTimetable already toasts the error
        });
      setTimeout(() => {
        dispatch({
          type: TimetableActionType.SetIsCopyingTimetable,
          isCopyingTimetable: false,
        });
      }, 1000);
    }, 1000);
  };

  const publish = () => {
    if (timetable === undefined) return;
    router.navigate({
      to: "/finalize/$timetableId",
      params: { timetableId: timetable.id },
    });
  };

  const intent = {
    copy: preloadEditorOnIntent(),
    edit: timetable
      ? preloadOnIntent({
          to: "/edit/$timetableId",
          params: { timetableId: timetable.id },
        })
      : {},
    publish: timetable
      ? preloadOnIntent({
          to: "/finalize/$timetableId",
          params: { timetableId: timetable.id },
        })
      : {},
  };

  return { copy, edit, publish, isEditing, intent };
}
