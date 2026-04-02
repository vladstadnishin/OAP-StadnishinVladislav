
import { Request, Response, NextFunction } from "express";
import { usersService } from "../services/users.service";

export class UsersController {

  getAll(req: Request, res: Response) {
    res.json({ items: usersService.getAll() });
  }

  getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(usersService.getById(req.params.id));
    } catch (e) {
      next(e);
    }
  }

  create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = usersService.create(req.body);
      res.status(201).json(user);
    } catch (e) {
      next(e);
    }
  }

}

export const usersController = new UsersController();
