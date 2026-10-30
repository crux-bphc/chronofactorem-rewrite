import { useTimetableState } from "@/context";

// `all` (export: both lists, no switch) is a pass-through until the restyle.
const ExamTab = (_props: { all?: boolean }) => {
  const {
    state: { timetable },
  } = useTimetableState();
  if (timetable === undefined) return;
  return (
    <div className="flex flex-col pt-2">
      <span className="text-xl font-bold pl-4 flex mb-2">Midsems</span>
      {timetable.examTimes
        .filter((e) => e.includes("|MIDSEM|"))
        .map((e) => {
          return {
            code: e.split("|")[0],
            midsemStartTime: e.split("|")[2],
            midsemEndTime: e.split("|")[3],
          };
        })
        .sort(
          (a, b) =>
            Date.parse(a.midsemStartTime) - Date.parse(b.midsemStartTime),
        )
        .map((course) => (
          <div
            className="px-4 ease-in-out py-2 items-center flex"
            key={course.code}
          >
            <span className="w-fit text-sm font-bold pr-4">{course.code}</span>
            <span className="text-sm">
              {`${new Date(course.midsemStartTime).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })} — ${new Date(course.midsemEndTime).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                },
              )}`}
            </span>
          </div>
        ))}
      <span className="text-xl font-bold pl-4 flex mb-2 pt-4 mt-4 border-t-2">
        Compres
      </span>
      {timetable.examTimes
        .filter((e) => e.includes("|COMPRE|"))
        .map((e) => {
          return {
            code: e.split("|")[0],
            compreStartTime: e.split("|")[2],
            compreEndTime: e.split("|")[3],
          };
        })
        .sort(
          (a, b) =>
            Date.parse(a.compreStartTime) - Date.parse(b.compreStartTime),
        )
        .map((course) => (
          <div
            className="px-4 ease-in-out py-2 items-center flex"
            key={course.code}
          >
            <span className="w-fit text-sm font-bold pr-4">{course.code}</span>
            <span className="text-sm">
              {`${new Date(course.compreStartTime).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })} — ${new Date(course.compreEndTime).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                },
              )}`}
            </span>
          </div>
        ))}
    </div>
  );
};

export default ExamTab;
