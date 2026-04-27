import type { RequestHandler } from "express";
import type {
  CreateNoteRequestDto,
  NotesQueryDto,
  PatchNoteRequestDto,
  UpdateNoteRequestDto
} from "../dtos/notes.dtos";
import type { NotesService } from "../services/notes.services";

interface NotesController {
  getList: RequestHandler;
  getById: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  patch: RequestHandler;
  remove: RequestHandler;
}

export function createNotesController(
  service: NotesService
): NotesController {
  return {
    getList(req, res) {
      res.status(200).json(service.getList(req.query as unknown as NotesQueryDto));
    },
    getById(req, res) {
      res.status(200).json(service.getById(req.params.id as string));
    },
    create(req, res) {
      res.status(201).json(service.create(req.body as CreateNoteRequestDto));
    },
    update(req, res) {
      res
        .status(200)
        .json(service.update(req.params.id as string, req.body as UpdateNoteRequestDto));
    },
    patch(req, res) {
      res
        .status(200)
        .json(service.patch(req.params.id as string, req.body as PatchNoteRequestDto));
    },
    remove(req, res) {
      service.delete(req.params.id as string);
      res.status(204).send();
    }
  };
}

export type { NotesController };
