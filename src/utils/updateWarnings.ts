import { Section } from "../entity/Section";
import { SectionTypeList, SectionTypeEnum } from "../types/sectionTypes";

export const updateSectionWarnings = (
  courseCode: string,
  section: Section,
  requiredSectionTypes: SectionTypeList,
  isAdded: boolean,
  warnings: string[]
) => {
  // Converting warnings to warningMap
  const warningMap = new Map<
    string,
    { warningCourseSectionTypesSplit: string[] }
  >();
  for (const warning of warnings) {
    const [warningCourseCode, warningCourseSectionTypes] = warning.split("|");
    const warningCourseSectionTypesSplit = warningCourseSectionTypes.split("");
    warningMap.set(warningCourseCode, { warningCourseSectionTypesSplit });
  }

  const sectionType = section.type;
  let updatedWarnings: string[] = [];

  if (isAdded) {
    const currentWarning = warningMap.get(courseCode);
    if (!currentWarning) {
      // Since warning does not exist already, add a new warning
      const warningCourseSectionTypesList: string[] = [];
      for (const requiredSectionType of requiredSectionTypes) {
        if (requiredSectionType != sectionType) {
          warningCourseSectionTypesList.push(requiredSectionType);
        }
      }
      if (warningCourseSectionTypesList.length != 0) {
        warningCourseSectionTypesList.sort();
        warningMap.set(courseCode, {
          warningCourseSectionTypesSplit: warningCourseSectionTypesList,
        });
      }
    } else {
      // Deleting courseType from warnings after adding course
      for (const currentSectionWarning of currentWarning!
        .warningCourseSectionTypesSplit) {
        if (sectionType == currentSectionWarning) {
          const index = currentWarning!.warningCourseSectionTypesSplit.indexOf(
            currentSectionWarning
          );
          currentWarning!.warningCourseSectionTypesSplit.splice(index!, 1);
          if (currentWarning!.warningCourseSectionTypesSplit.length == 0) {
            warningMap.delete(courseCode);
          }
        }
      }
    }
  } else {
    const currentWarning = warningMap.get(courseCode);
    if (!currentWarning) {
      //No warnings currently exist, thus adding new one for this section
      if (requiredSectionTypes.length > 1) {
        warningMap.set(courseCode, {
          warningCourseSectionTypesSplit: [sectionType],
        });
      }
    } else {
      const currentWarningCourseSectionTypesSplit =
        currentWarning.warningCourseSectionTypesSplit;
      if (sectionType in currentWarningCourseSectionTypesSplit) {
        throw Error(
          "Removing a course that should not be there according to warnings"
        );
      }
      //Adding new courseType to warnings after removing course
      if (sectionType in requiredSectionTypes) {
        currentWarningCourseSectionTypesSplit.push(sectionType);
        currentWarningCourseSectionTypesSplit.sort();
        if (requiredSectionTypes.length != currentWarningCourseSectionTypesSplit.length) {
          warningMap.set(courseCode, {
            warningCourseSectionTypesSplit:
              currentWarningCourseSectionTypesSplit,
          });
        }
      }
    }
  }
  // Regenerating warnings from warningMap.
  for (const currentWarning of warningMap) {
    let combinedWarningString = currentWarning[0];
    combinedWarningString.concat(":");
    for (const courseSectionType of currentWarning[1]
      .warningCourseSectionTypesSplit) {
      if (
        combinedWarningString.charAt(combinedWarningString.length - 1) == ":"
      ) {
        combinedWarningString.concat(courseSectionType);
      } else {
        combinedWarningString.concat("|");
        combinedWarningString.concat(courseSectionType);
      }
    }
    updatedWarnings.push(combinedWarningString);
  }
  updatedWarnings.sort();
  return updatedWarnings;
};
