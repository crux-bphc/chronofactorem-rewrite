import Sqids from "sqids";
import { env } from "./config/server.js";

const sqids = new Sqids({
  minLength: 4,
  alphabet: env.SQIDS_ALPHABET,
});

export const validSqid = (id: number[]) =>
  !(id.length !== 1 || id[0] < 0 || id[0] > 2147483647);

export default sqids;
