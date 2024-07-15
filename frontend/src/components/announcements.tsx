import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { DialogTrigger } from "@radix-ui/react-dialog";
import { Megaphone } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import type { announcementType } from "../../../lib/src";
import { Button } from "./ui/button";

const fetchAnnouncements = async (): Promise<
  z.infer<typeof announcementType>[]
> => {
  const response = await axios.get<z.infer<typeof announcementType>[]>(
    "api/user/announcements",
  );
  console.log(response.data);
  return response.data;
};

function Announcements() {
  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

  return (
    <Dialog>
      <DialogTrigger>
        <Button className="mr-9" variant="outline" size="icon">
          <Megaphone className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[400px] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="text-xl">Announcements</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div className=" flex flex-col-reverse mx-3 mt-2 gap-3 divide-y divide-y-reverse">
            {announcements?.length ? (
              announcements
                .sort(
                  (a, b) =>
                    new Date(a.createdAt as string).getTime() -
                    new Date(b.createdAt as string).getTime(),
                )
                .map((announcement) => (
                  <div className="flex gap-1 flex-col">
                    <h1 className="font-bold text-base">
                      {announcement.title}
                    </h1>
                    <p className="opacity-70 text-xs">
                      {new Date(announcement.createdAt as string)
                        .toLocaleString()
                        .slice(0, -3)}
                    </p>
                    <p className="opacity-90 mb-3">{announcement.message}</p>
                  </div>
                ))
            ) : (
              <p>No announcements</p>
            )}
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

export default Announcements;