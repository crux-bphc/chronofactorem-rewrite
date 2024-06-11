import { Request, Response } from "express";
import { announcementRepository } from "../../repositories/anouncementRepository.js";

export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await announcementRepository
      .createQueryBuilder("announcement")
      .getMany();

    return res.status(200).json(announcements);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
