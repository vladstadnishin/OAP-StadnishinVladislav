import { z } from "zod";

export const priorities = ["Низький", "Середній", "Високий"] as const;

export const nameResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  teacher: z.string(),
  course: z.enum(["1", "2", "3", "4", "5", "6"]),
  priority: z.enum(priorities),
  note: z.string(),
  createdAt: z.string().datetime()
});

export const createNameRequestSchema = z
  .object({
    userId: z.string().uuid("Некоректний userId"),
    title: z
      .string()
      .trim()
      .min(2, "Назва повинна містити від 2 до 80 символів")
      .max(80, "Назва повинна містити від 2 до 80 символів")
      .refine(value => !/\d/.test(value), "Назва не може містити цифри"),
    teacher: z
      .string()
      .trim()
      .min(2, "Ім'я викладача повинно містити від 2 до 80 символів")
      .max(80, "Ім'я викладача повинно містити від 2 до 80 символів")
      .refine(value => !/\d/.test(value), "Ім'я викладача не може містити цифри"),
    course: z.enum(["1", "2", "3", "4", "5", "6"], {
      message: "Курс має бути від 1 до 6"
    }),
    priority: z.enum(priorities, {
      message: "Пріоритет має бути одним із дозволених значень"
    }),
    note: z
      .string()
      .trim()
      .min(3, "Коментар повинен містити від 3 до 200 символів")
      .max(200, "Коментар повинен містити від 3 до 200 символів")
  })
  .strict();

export const updateNameRequestSchema = createNameRequestSchema;

export const patchNameRequestSchema = createNameRequestSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: "Потрібно передати хоча б одне поле"
  });

export const nameParamsSchema = z.object({
  id: z.string().uuid("Некоректний id")
});

export const namesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    priority: z.enum(priorities).optional(),
    userId: z.string().uuid().optional(),
    sortDir: z.enum(["asc", "desc"]).default("desc")
  })
  .strict();

export const namesStatsQuerySchema = z
  .object({
    userId: z.string().uuid().optional()
  })
  .strict();

export const nameWithUserResponseSchema = nameResponseSchema.extend({
  userFullName: z.string(),
  userEmail: z.string().email()
});

export const namePriorityStatResponseSchema = z.object({
  priority: z.enum(priorities),
  total: z.number().int().nonnegative()
});

export type NameDto = z.infer<typeof nameResponseSchema>;
export type CreateNameRequestDto = z.infer<typeof createNameRequestSchema>;
export type UpdateNameRequestDto = z.infer<typeof updateNameRequestSchema>;
export type PatchNameRequestDto = z.infer<typeof patchNameRequestSchema>;
export type NamesQueryDto = z.infer<typeof namesQuerySchema>;
export type NamesStatsQueryDto = z.infer<typeof namesStatsQuerySchema>;
export type NameWithUserDto = z.infer<typeof nameWithUserResponseSchema>;
export type NamePriorityStatDto = z.infer<typeof namePriorityStatResponseSchema>;
