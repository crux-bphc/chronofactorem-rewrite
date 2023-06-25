import { z } from "zod";
import { validate } from "../../utils/zodValidateBody";

const dataSchema = z.object({
  body: z.object({
    // auth temp replacement
    email: z
      .string({
        invalid_type_error: "email not a string",
        required_error: "email is a required path parameter",
      })
      .min(0, {
        message: "email must be a non-empty string",
      })
      .regex(
        /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
        {
          message: "email must be a valid email",
        }
      ),
    courseCode: z
      .string({
        invalid_type_error: "courseCode not a string",
        required_error: "courseCode is a required path parameter",
      })
      .min(0, {
        message: "courseCode must be a non-empty string",
      }),
    type: z
      .string({
        invalid_type_error: "type not a string",
        required_error: "type is a required path parameter",
      })
      .min(0, {
        message: "type must be a non-empty string",
      }),
    section: z
      .string({
        invalid_type_error: "section not a string",
        required_error: "section is a required path parameter",
      })
      .min(0, {
        message: "section must be a non-empty string",
      }),
  }),
});

export const addSectionValidator = validate(dataSchema);
