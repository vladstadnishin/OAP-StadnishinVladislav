import type { RequestHandler } from "express";
import type {
  CreateTeacherRequestDto,
  PatchTeacherRequestDto,
  TeachersQueryDto,
  UpdateTeacherRequestDto
} from "../dtos/teachers.dtos";
import type { TeachersService } from "../services/teachers.services";

interface TeachersController {
  getList: RequestHandler;
  getById: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  patch: RequestHandler;
  remove: RequestHandler;
}

export function createTeachersController(
  service: TeachersService
): TeachersController {
  return {
    getList(req, res) {
      res.status(200).json(service.getList(req.query as unknown as TeachersQueryDto));
    },
    getById(req, res) {
      res.status(200).json(service.getById(req.params.id as string));
    },
    create(req, res) {
      res.status(201).json(service.create(req.body as CreateTeacherRequestDto));
    },
    update(req, res) {
      res
        .status(200)
        .json(
          service.update(req.params.id as string, req.body as UpdateTeacherRequestDto)
        );
    },
    patch(req, res) {
      res
        .status(200)
        .json(
          service.patch(req.params.id as string, req.body as PatchTeacherRequestDto)
        );
    },
    remove(req, res) {
      service.delete(req.params.id as string);
      res.status(204).send();
    }
  };
}

export type { TeachersController };
