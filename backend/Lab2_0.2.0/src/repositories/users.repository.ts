
import { UserResponseDto } from "../dtos/users.dto";

export class UsersRepository {

  private users: UserResponseDto[] = [
    {
      id: "demo-user",
      name: "Demo User",
      email: "demo@test.com"
    }
  ];

  findAll() {
    return this.users;
  }

  findById(id: string) {
    return this.users.find(u => u.id === id);
  }

  create(user: UserResponseDto) {
    this.users.push(user);
    return user;
  }

}

export const usersRepository = new UsersRepository();
