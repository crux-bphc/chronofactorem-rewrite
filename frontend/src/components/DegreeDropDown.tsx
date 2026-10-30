import { useId } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const DegreeDropDown = ({
  firstDegree,
  secondDegree,
  setFirstDegree,
  setSecondDegree,
  year,
  showLabels = false,
}: {
  firstDegree: string | null;
  secondDegree: string | null;
  setFirstDegree: React.Dispatch<React.SetStateAction<string | null>>;
  setSecondDegree: React.Dispatch<React.SetStateAction<string | null>>;
  year: number | undefined;
  showLabels?: boolean;
}) => {
  const firstId = useId();
  const secondId = useId();
  const showSecond =
    firstDegree?.includes("B") && (year === undefined || year > 2);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        {showLabels && <Label htmlFor={firstId}>First degree</Label>}
        <Select onValueChange={setFirstDegree} value={firstDegree ?? undefined}>
          <SelectTrigger
            id={firstId}
            aria-label={showLabels ? undefined : "First degree"}
            className="w-full"
          >
            <SelectValue placeholder="Select a degree" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Single Degrees</SelectLabel>
              <SelectItem value="A1">A1: B.E. Chemical</SelectItem>
              <SelectItem value="A2">A2: B.E. Civil</SelectItem>
              <SelectItem value="A3">
                A3: B.E. Electrical & Electronics
              </SelectItem>
              <SelectItem value="A4">A4: B.E. Mechanical</SelectItem>
              <SelectItem value="A5">A5: B. Pharmacy</SelectItem>
              <SelectItem value="A7">A7: B.E. Computer Science</SelectItem>
              <SelectItem value="A8">
                A8: B.E. Electronics & Instrumentation
              </SelectItem>
              <SelectItem value="AA">
                AA: B.E. Electronics & Communication
              </SelectItem>
              <SelectItem value="AD">
                AD: B.E. Mathematics & Computing
              </SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Dual Degrees</SelectLabel>
              <SelectItem value="B1">B1: M.Sc. Biology</SelectItem>
              <SelectItem value="B2">B2: M.Sc. Chemistry</SelectItem>
              <SelectItem value="B3">B3: M.Sc. Economics</SelectItem>
              <SelectItem value="B4">B4: M.Sc. Mathematics</SelectItem>
              <SelectItem value="B5">B5: M.Sc. Physics</SelectItem>
              <SelectItem value="B7">
                B7: M.Sc. Semiconductor and Nanoscience
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-(--d-2) ease-(--e-out)",
          showSecond
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
        inert={!showSecond}
        aria-hidden={!showSecond}
      >
        <div className="min-h-0 overflow-hidden -m-1 p-1">
          <div className="flex flex-col gap-1.5">
            {showLabels && <Label htmlFor={secondId}>Second degree</Label>}
            <Select
              onValueChange={setSecondDegree}
              value={secondDegree ?? undefined}
            >
              <SelectTrigger
                id={secondId}
                aria-label={showLabels ? undefined : "Second degree"}
                className="w-full"
              >
                <SelectValue placeholder="Select a degree" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Single Degrees</SelectLabel>
                  {/* A0 is used for single degree MSc people since empty string denotes no selection */}
                  <SelectItem value="A0">None (Single degree M.Sc.)</SelectItem>
                  <SelectItem value="A1">A1: B.E. Chemical</SelectItem>
                  <SelectItem value="A2">A2: B.E. Civil</SelectItem>
                  <SelectItem value="A3">
                    A3: B.E. Electrical & Electronics
                  </SelectItem>
                  <SelectItem value="A4">A4: B.E. Mechanical</SelectItem>
                  <SelectItem value="A7">A7: B.E. Computer Science</SelectItem>
                  <SelectItem value="A8">
                    A8: B.E. Electronics & Instrumentation
                  </SelectItem>
                  <SelectItem value="AA">
                    AA: B.E. Electronics & Communication
                  </SelectItem>
                  <SelectItem value="AD">
                    AD: B.E. Mathematics & Computing
                  </SelectItem>
                  <SelectItem value="AJ">
                    AJ: B.E. Environmental and Sustainability
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DegreeDropDown;
