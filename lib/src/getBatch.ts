// batch is set to 0000 if it's a non-student email, like hpc@hyderabad.bits-hyderabad.ac.in
// or undefined
export const getBatchFromEmail = (email: undefined | string) => {
  if (email !== undefined) {
    return email.match(/^f\d{8}@hyderabad\.bits-pilani\.ac\.in$/)
      ? email.slice(1, 5)
      : "0000";
  }
  return "0000";
};
