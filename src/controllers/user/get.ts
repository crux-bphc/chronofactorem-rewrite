import { AppDataSource } from "../../db";
import { Request, Response } from "express";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";

export const getUserByName = async (req: Request, res: Response) => {
  const name = req.params.name;

  console.log(name);

  const user = await userRepository.findOne({
    where: { name },
  });
  console.log(user);

  if (!user) {
    return res.json({ message: "unregistered user" });
  }
  return res.json(user);
};
