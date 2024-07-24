import { Request, Response } from "express";
import { announcementRepository } from "../../repositories/announcementRepository.js";

export const getAllAnnouncements = async (req: Request, res: Response) => {
  const logger = req.log;
  try {
    const announcements = await announcementRepository
      .createQueryBuilder("announcement")
      .getMany();

    return res.status(200).json(announcements);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
