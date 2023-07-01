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
  const warningMap = new Map<string, { warningSectionTypes: string[] }>();
  for (const warning of warnings) {
    const [warningCourseCode, warningSectionTypeString] = warning.split(":");
    const warningSectionTypes = warningSectionTypeString.split("");
    warningMap.set(warningCourseCode, { warningSectionTypes });
  }

  const sectionType = section.type;
  let updatedWarnings: string[] = [];

  if (isAdded) {
    const currentWarning = warningMap.get(courseCode);
    if (!currentWarning) {
      // Since warning does not exist already, add a new warning
      const warningSectionTypesList: string[] = requiredSectionTypes.filter(
        (requiredSectionType) => {
          return requiredSectionType !== sectionType;
        }
      );
      if (warningSectionTypesList.length !== 0) {
        warningMap.set(courseCode, {
          warningSectionTypes: warningSectionTypesList,
        });
      }
    } else {
      // Deleting courseType from warnings after adding course
      for (const currentSectionWarning of currentWarning.warningSectionTypes) {
        if (sectionType === currentSectionWarning) {
          const index = currentWarning.warningSectionTypes.indexOf(
            currentSectionWarning
          );
          currentWarning.warningSectionTypes.splice(index!, 1);
          if (currentWarning.warningSectionTypes.length === 0) {
            warningMap.delete(courseCode);
          }
        }
      }
    }
  } else {
    const currentWarning = warningMap.get(courseCode);
    if (!currentWarning) {
      // No warnings currently exist, thus adding new one for this section
      if (requiredSectionTypes.length > 1) {
        warningMap.set(courseCode, {
          warningSectionTypes: [sectionType],
        });
      }
    } else {
      const currentWarningSectionTypes = currentWarning.warningSectionTypes;
      if (sectionType in currentWarningSectionTypes) {
        throw Error(
          "Removing a course that should not be there according to warnings"
        );
      }
      // Adding new courseType to warnings after removing course
      if (sectionType in requiredSectionTypes) {
        currentWarningSectionTypes.push(sectionType);
        if (requiredSectionTypes.length !== currentWarningSectionTypes.length) {
          warningMap.set(courseCode, {
            warningSectionTypes: currentWarningSectionTypes,
          });
        }
      }
    }
  }
  // Regenerating warnings from warningMap.
  for (const currentWarning of warningMap) {
    let combinedWarningString = currentWarning[0];
    combinedWarningString = combinedWarningString.concat(":");
    for (const courseSectionType of currentWarning[1].warningSectionTypes) {
      combinedWarningString = combinedWarningString.concat(courseSectionType);
    }
    updatedWarnings.push(combinedWarningString);
  }
  return updatedWarnings;
};
