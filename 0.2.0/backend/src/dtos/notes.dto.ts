
export type Priority = "Low" | "Medium" | "High";

export interface CreatePersonalNoteRequestDto {
  userId: string;
  title: string;
  teacher: string;
  course: string;
  priority: Priority;
}

export interface UpdatePersonalNoteRequestDto {
  title?: string;
  teacher?: string;
  course?: string;
  priority?: Priority;
}

export interface PersonalNoteResponseDto {
  id: string;
  userId: string;
  title: string;
  teacher: string;
  course: string;
  priority: Priority;
  createdAt: string;
}
