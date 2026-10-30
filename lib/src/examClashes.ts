type ExamCourse = {
  code: string;
  midsemStartTime: string | Date | null;
  midsemEndTime: string | Date | null;
  compreStartTime: string | Date | null;
  compreEndTime: string | Date | null;
};

export function getClashingExamTimes(course: ExamCourse, examTimes: string[]) {
  const intervals = [
    [course.midsemStartTime, course.midsemEndTime],
    [course.compreStartTime, course.compreEndTime],
  ];
  const clashes = examTimes.filter((examTime) => {
    const [code, , start, end] = examTime.split("|");
    if (code === course.code) return false;
    return intervals.some(
      ([from, to]) =>
        from !== null &&
        to !== null &&
        new Date(from).getTime() < Date.parse(end) &&
        new Date(to).getTime() > Date.parse(start),
    );
  });
  return clashes.length ? clashes : null;
}
