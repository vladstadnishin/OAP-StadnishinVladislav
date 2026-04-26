import type { RequestHandler } from "express";
import type {
  CreateNameRequestDto,
  NamesQueryDto,
  PatchNameRequestDto,
  UpdateNameRequestDto
} from "../dtos/names.dtos";
import type { NamesService } from "../services/names.services";

interface NamesController {
  getList: RequestHandler;
  getById: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  patch: RequestHandler;
  remove: RequestHandler;
}

export function createNamesController(
  service: NamesService
): NamesController {
  return {
    getList(req, res) {
      res.status(200).json(service.getList(req.query as unknown as NamesQueryDto));
    },
    getById(req, res) {
      res.status(200).json(service.getById(req.params.id as string));
    },
    create(req, res) {
      res.status(201).json(service.create(req.body as CreateNameRequestDto));
    },
    update(req, res) {
      res
        .status(200)
        .json(service.update(req.params.id as string, req.body as UpdateNameRequestDto));
    },
    patch(req, res) {
      res
        .status(200)
        .json(service.patch(req.params.id as string, req.body as PatchNameRequestDto));
    },
    remove(req, res) {
      service.delete(req.params.id as string);
      res.status(204).send();
    }
  };
}

export type { NamesController };
