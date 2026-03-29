
import { Request, Response, NextFunction } from "express";
import { notesService } from "../services/notes.service";

export class NotesController {

  getAll(req: Request, res: Response) {
    const result = notesService.getAll(req.query);
    res.json(result);
  }

  getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(notesService.getById(req.params.id));
    } catch (e) {
      next(e);
    }
  }

  create(req: Request, res: Response, next: NextFunction) {        //CRUD
    try {
      const note = notesService.create(req.body);
      res.status(201).json(note);
    } catch (e) {
      next(e);
    }
  }

  update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(notesService.update(req.params.id, req.body));
    } catch (e) {
      next(e);
    }
  }

  delete(req: Request, res: Response, next: NextFunction) {
    try {
      notesService.delete(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }

}

export const notesController = new NotesController();
