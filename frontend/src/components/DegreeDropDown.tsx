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
}: {
  firstDegree: string | null;
  secondDegree: string | null;
  setFirstDegree: React.Dispatch<React.SetStateAction<string | null>>;
  setSecondDegree: React.Dispatch<React.SetStateAction<string | null>>;
  year: number | undefined;
}) => {
  return (
    <>
      <Select onValueChange={setFirstDegree} value={firstDegree ?? undefined}>
        <SelectTrigger className="w-84 bg-muted border-primary-foreground focus:ring-muted focus:ring-offset-muted text-foreground mt-2">
          <SelectValue placeholder="Select a degree" />
        </SelectTrigger>
        <SelectContent className="bg-primary-foreground border-muted text-foreground">
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
            <SelectItem value="AD">AD: B.E. Mathematics & Computing</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Dual Degrees</SelectLabel>
            <SelectItem value="B1">B1: M.Sc. Biology</SelectItem>
            <SelectItem value="B2">B2: M.Sc. Chemistry</SelectItem>
            <SelectItem value="B3">B3: M.Sc. Economics</SelectItem>
            <SelectItem value="B4">B4: M.Sc. Mathematics</SelectItem>
            <SelectItem value="B5">B5: M.Sc. Physics</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {firstDegree?.includes("B") && (year === undefined || year > 2) && (
        <Select
          onValueChange={setSecondDegree}
          value={secondDegree ?? undefined}
        >
          <SelectTrigger className="w-84 sm:mx-4 bg-muted border-primary-foreground focus:ring-muted focus:ring-offset-muted text-foreground mt-2">
            <SelectValue placeholder="Select a degree" />
          </SelectTrigger>
          <SelectContent className="bg-primary-foreground border-muted text-foreground">
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
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </>
  );
};

export default DegreeDropDown;
