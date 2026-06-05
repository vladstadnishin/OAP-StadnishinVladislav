import { z } from "zod";

// DTO відповіді для нотатки.
export const noteResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  createdAt: z.string().datetime()
});

// userId не приймаємо з body: власник береться тільки з X-Demo-UserId на бекенді.
export const createNoteRequestSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(3, "Нотатка повинна містити від 3 до 200 символів")
      .max(200, "Нотатка повинна містити від 3 до 200 символів")
  })
  .strict();

export const updateNoteRequestSchema = createNoteRequestSchema;

// PATCH для нотаток працює тільки якщо прийшло хоча б одне поле.
export const patchNoteRequestSchema = createNoteRequestSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: "Потрібно передати хоча б одне поле"
  });

export const noteParamsSchema = z.object({
  id: z.string().uuid("Некоректний id")
});

export const notesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    sortDir: z.enum(["asc", "desc"]).default("desc")
  })
  .strict();

export type NoteDto = z.infer<typeof noteResponseSchema>;
export type CreateNoteRequestDto = z.infer<typeof createNoteRequestSchema>;
export type UpdateNoteRequestDto = z.infer<typeof updateNoteRequestSchema>;
export type PatchNoteRequestDto = z.infer<typeof patchNoteRequestSchema>;
export type NotesQueryDto = z.infer<typeof notesQuerySchema>;
