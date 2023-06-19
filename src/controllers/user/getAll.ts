import { Request, Response } from "express";
import { userRepository } from "../../repositories/userRepository";

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await userRepository.find({});
  console.log(users);

  if (!users) {
    return res.json({ message: "no users" });
  }
  return res.json(users);
};
