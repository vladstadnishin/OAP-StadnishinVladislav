import { z } from "zod";

// DTO відповіді користувача.
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime()
});

// DTO створення користувача з базовою валідацією імені та email.
export const createUserRequestSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Ім'я користувача повинно містити від 2 до 80 символів")
      .max(80, "Ім'я користувача повинно містити від 2 до 80 символів"),
    email: z
      .string()
      .trim()
      .email("Вкажіть коректний email")
      .max(120, "Email не може бути довшим за 120 символів")
  })
  .strict();

export const updateUserRequestSchema = createUserRequestSchema;

export const patchUserRequestSchema = createUserRequestSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: "Потрібно передати хоча б одне поле"
  });

export const userParamsSchema = z.object({
  id: z.string().uuid("Некоректний id")
});

export const usersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).max(80).optional(),
    sortDir: z.enum(["asc", "desc"]).default("desc")
  })
  .strict();

export type UserDto = z.infer<typeof userResponseSchema>;
export type CreateUserRequestDto = z.infer<typeof createUserRequestSchema>;
export type UpdateUserRequestDto = z.infer<typeof updateUserRequestSchema>;
export type PatchUserRequestDto = z.infer<typeof patchUserRequestSchema>;
export type UsersQueryDto = z.infer<typeof usersQuerySchema>;
