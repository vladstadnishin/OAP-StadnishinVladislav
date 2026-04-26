import { z } from "zod";

export const teacherResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  department: z.string(),
  createdAt: z.string().datetime()
});

export const createTeacherRequestSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Ім'я викладача повинно містити від 2 до 80 символів")
      .max(80, "Ім'я викладача повинно містити від 2 до 80 символів")
      .refine(value => !/\d/.test(value), "Ім'я викладача не може містити цифри"),
    email: z
      .string()
      .trim()
      .email("Вкажіть коректний email")
      .max(120, "Email не може бути довшим за 120 символів"),
    department: z
      .string()
      .trim()
      .min(2, "Кафедра повинна містити від 2 до 100 символів")
      .max(100, "Кафедра повинна містити від 2 до 100 символів")
  })
  .strict();

export const updateTeacherRequestSchema = createTeacherRequestSchema;

export const patchTeacherRequestSchema = createTeacherRequestSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: "Потрібно передати хоча б одне поле"
  });

export const teacherParamsSchema = z.object({
  id: z.string().uuid("Некоректний id")
});

export const teachersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    department: z.string().trim().min(1).max(100).optional(),
    search: z.string().trim().min(1).max(80).optional(),
    sortDir: z.enum(["asc", "desc"]).default("desc")
  })
  .strict();

export type TeacherDto = z.infer<typeof teacherResponseSchema>;
export type CreateTeacherRequestDto = z.infer<typeof createTeacherRequestSchema>;
export type UpdateTeacherRequestDto = z.infer<typeof updateTeacherRequestSchema>;
export type PatchTeacherRequestDto = z.infer<typeof patchTeacherRequestSchema>;
export type TeachersQueryDto = z.infer<typeof teachersQuerySchema>;
