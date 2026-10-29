import { Link } from "@tanstack/react-router";
import type { timetableType } from "lib";
import { Edit2, Eye, EyeOff, Trash } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import DeleteTimetableDialog from "@/components/DeleteTimetableDialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import useEditTimetable from "@/data-access/hooks/useEditTimetable";
import { router } from "../router";
import TimetableInfoBadge from "./TimetableInfoBadge";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";

type Props = {
  timetable: z.infer<typeof timetableType>;
  showFooter: boolean;
};

function TimetableCard({ timetable, showFooter }: Props) {
  const [timetableName, setTimetableName] = useState<null | string>(null);
  const [timetableVisibility, setTimetableVisibility] = useState<
    null | boolean
  >(null);

  const { mutate: editTimetable } = useEditTimetable();

  return (
    <TooltipProvider>
      <Card className="flex flex-col gap-6 p-4 sm:p-6 shadow-lg sm:w-md rounded-xl">
        <CardHeader className="p-0">
          <CardTitle className="flex flex-row text-xl/tight items-start gap-4">
            <Link
              to={timetable.draft ? "/edit/$timetableId" : "/view/$timetableId"}
              params={{
                timetableId: timetable.id,
              }}
              className="flex-1"
            >
              {timetable.name}
            </Link>

            <TimetableInfoBadge timetable={timetable} />

            {timetable.archived && (
              <span>{timetable.private ? <EyeOff /> : <Eye />}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex gap-4 items-end justify-end">
          {showFooter && (
            <>
              {!timetable.draft && (
                <Button
                  variant="outline"
                  onClick={() =>
                    editTimetable({
                      id: timetable.id,
                      body: {
                        name: timetable.name,
                        isPrivate: !timetable.private,
                        isDraft: timetable.draft,
                      },
                    })
                  }
                >
                  Make {timetable.private ? "Public" : "Private"}
                </Button>
              )}
              <ButtonGroup>
                {timetable.archived ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="p-3">
                        <Edit2 />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-100">
                      <DialogHeader>
                        <DialogTitle>Edit Archived Timetable</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={timetableName ?? timetable.name}
                            onChange={(e) => setTimetableName(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                        <div className="mx-auto">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="visibility"
                              checked={timetableVisibility ?? timetable.private}
                              onCheckedChange={setTimetableVisibility}
                            />
                            <Label htmlFor="visibility">Private</Label>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button
                            type="submit"
                            onClick={() => {
                              editTimetable({
                                id: timetable.id,
                                body: {
                                  name: timetableName ?? timetable.name,
                                  isPrivate:
                                    timetableVisibility ?? timetable.private,
                                  isDraft: false,
                                },
                              });
                            }}
                          >
                            Save changes
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      editTimetable(
                        {
                          id: timetable.id,
                          body: {
                            name: timetable.name,
                            isPrivate: true,
                            isDraft: true,
                          },
                        },
                        {
                          onSuccess: () => {
                            router.navigate({
                              to: "/edit/$timetableId",
                              params: { timetableId: timetable.id },
                            });
                          },
                        },
                      );
                    }}
                  >
                    <Edit2 />
                  </Button>
                )}

                <DeleteTimetableDialog timetableId={timetable.id}>
                  <Trash />
                </DeleteTimetableDialog>
              </ButtonGroup>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default TimetableCard;
