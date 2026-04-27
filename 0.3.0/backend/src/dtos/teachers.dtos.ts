import { z } from "zod";

export const teacherResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  createdAt: z.string().datetime()
});

export const createTeacherRequestSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Ім'я викладача повинно містити від 2 до 80 символів")
      .max(80, "Ім'я викладача повинно містити від 2 до 80 символів")
      .refine(value => !/\d/.test(value), "Ім'я викладача не може містити цифри")
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
    search: z.string().trim().min(1).max(80).optional(),
    sortDir: z.enum(["asc", "desc"]).default("desc")
  })
  .strict();

export const unsafeTeacherSearchQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(120)
  })
  .strict();

export type TeacherDto = z.infer<typeof teacherResponseSchema>;
export type CreateTeacherRequestDto = z.infer<typeof createTeacherRequestSchema>;
export type UpdateTeacherRequestDto = z.infer<typeof updateTeacherRequestSchema>;
export type PatchTeacherRequestDto = z.infer<typeof patchTeacherRequestSchema>;
export type TeachersQueryDto = z.infer<typeof teachersQuerySchema>;
export type UnsafeTeacherSearchQueryDto = z.infer<
  typeof unsafeTeacherSearchQuerySchema
>;
