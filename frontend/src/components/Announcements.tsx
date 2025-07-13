import { DialogTrigger } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import type { announcementWithIDType } from "../../../lib/src";
import { Button } from "./ui/button";

const fetchAnnouncements = async (): Promise<
  z.infer<typeof announcementWithIDType>[]
> => {
  const response = await axios.get<z.infer<typeof announcementWithIDType>[]>(
    "/api/user/announcements",
  );
  return response.data;
};

function Announcements() {
  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

  const { toast } = useToast();

  const [readAnnouncements, setReadAnnouncements] = useState<string[]>(() => {
    const storedReadAnnouncements = localStorage.getItem("readAnnouncements");
    return storedReadAnnouncements ? JSON.parse(storedReadAnnouncements) : [];
  });

  useEffect(() => {
    localStorage.setItem(
      "readAnnouncements",
      JSON.stringify(readAnnouncements),
    );
  }, [readAnnouncements]);

  useEffect(() => {
    const unreadAnnouncements = announcements?.filter(
      (announcement) => !readAnnouncements.includes(announcement.id),
    );

    if (unreadAnnouncements && unreadAnnouncements.length > 0) {
      toast({
        title: "New Announcements",
        description: `You have ${
          unreadAnnouncements.length
        } unread announcement${unreadAnnouncements.length > 1 ? "s" : ""}.`,
      });
    }
  }, [announcements, readAnnouncements, toast]);

  const markAsRead = (id: string) => {
    setReadAnnouncements((prev) => [...prev, id]);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mr-1 md:mr-9" variant="outline" size="icon">
          <Megaphone className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[400px] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="text-xl -mt-1">Announcements</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="flex flex-col-reverse mx-3 mt-1 gap-3 divide-y divide-y-reverse">
            {Array.isArray(announcements) && announcements?.length ? (
              announcements
                ?.sort((a, b) => {
                  const isUnreadA = !readAnnouncements.includes(a.id);
                  const isUnreadB = !readAnnouncements.includes(b.id);

                  if (isUnreadA !== isUnreadB) {
                    return isUnreadA ? -1 : 1;
                  }

                  return (
                    new Date(b.createdAt as string).getTime() -
                    new Date(a.createdAt as string).getTime()
                  );
                })
                .reverse()
                .map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`flex gap-1 flex-col ${
                      readAnnouncements.includes(announcement.id)
                        ? "opacity-50"
                        : ""
                    }`}
                  >
                    <h1 className="font-bold text-base">
                      {announcement.title}
                    </h1>
                    <p className="opacity-70 text-xs">
                      {new Date(
                        announcement.createdAt as string,
                      ).toLocaleString()}
                    </p>
                    <p className="opacity-90 mb-3">{announcement.message}</p>
                    {!readAnnouncements.includes(announcement.id) && (
                      <Button
                        onClick={() => markAsRead(announcement.id)}
                        className="mb-3"
                        size="sm"
                        variant="outline"
                      >
                        Mark as Read
                      </Button>
                    )}
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
