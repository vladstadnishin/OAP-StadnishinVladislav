import type { RequestHandler } from "express";
import type {
  CreateUserRequestDto,
  PatchUserRequestDto,
  UpdateUserRequestDto,
  UsersQueryDto
} from "../dtos/users.dtos";
import type { UsersService } from "../services/users.services";

interface UsersController {
  getList: RequestHandler;
  getById: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  patch: RequestHandler;
  remove: RequestHandler;
}

export function createUsersController(
  service: UsersService
): UsersController {
  return {
    getList(req, res) {
      res.status(200).json(service.getList(req.query as unknown as UsersQueryDto));
    },
    getById(req, res) {
      res.status(200).json(service.getById(req.params.id as string));
    },
    create(req, res) {
      res.status(201).json(service.create(req.body as CreateUserRequestDto));
    },
    update(req, res) {
      res
        .status(200)
        .json(service.update(req.params.id as string, req.body as UpdateUserRequestDto));
    },
    patch(req, res) {
      res
        .status(200)
        .json(service.patch(req.params.id as string, req.body as PatchUserRequestDto));
    },
    remove(req, res) {
      service.delete(req.params.id as string);
      res.status(204).send();
    }
  };
}

export type { UsersController };
