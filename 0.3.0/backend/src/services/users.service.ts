
import { v4 as uuid } from "uuid";
import { usersRepository } from "../repositories/users.repository";
import { CreateUserRequestDto } from "../dtos/users.dto";

export class UsersService {

  getAll() {
    return usersRepository.findAll();
  }

  getById(id: string) {
    const user = usersRepository.findById(id);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    return user;
  }

  create(data: CreateUserRequestDto) {

    if (!data.name || !data.email) {
      throw { status: 400, message: "name and email required" };
    }

    const user = {
      id: uuid(),
      name: data.name,
      email: data.email
    };

    return usersRepository.create(user);
  }

}

export const usersService = new UsersService();
