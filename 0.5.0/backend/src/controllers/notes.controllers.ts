import type { RequestHandler } from "express";
import type {
  CreateNoteRequestDto,
  NotesQueryDto,
  PatchNoteRequestDto,
  UpdateNoteRequestDto
} from "../dtos/notes.dtos";
import type { NotesService } from "../services/notes.services";
import { requireCurrentUserId } from "../middleware/demo-auth.middleware";

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
      res
        .status(200)
        .json(
          service.getList(
            req.query as unknown as NotesQueryDto,
            requireCurrentUserId(req)
          )
        );
    },
    getById(req, res) {
      res
        .status(200)
        .json(
          service.getById(req.params.id as string, requireCurrentUserId(req))
        );
    },
    create(req, res) {
      res
        .status(201)
        .json(
          service.create(req.body as CreateNoteRequestDto, requireCurrentUserId(req))
        );
    },
    update(req, res) {
      res
        .status(200)
        .json(
          service.update(
            req.params.id as string,
            req.body as UpdateNoteRequestDto,
            requireCurrentUserId(req)
          )
        );
    },
    patch(req, res) {
      res
        .status(200)
        .json(
          service.patch(
            req.params.id as string,
            req.body as PatchNoteRequestDto,
            requireCurrentUserId(req)
          )
        );
    },
    remove(req, res) {
      service.delete(req.params.id as string, requireCurrentUserId(req));
      res.status(204).send();
    }
  };
}

export type { NotesController };
