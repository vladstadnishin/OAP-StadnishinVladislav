import express from "express";
import { createNamesRepository } from "./src/repositories/names.repository";
import { createTeachersRepository } from "./src/repositories/teachers.repository";
import { createNotesRepository } from "./src/repositories/notes.repository";
import { createUsersRepository } from "./src/repositories/users.repository";
import { createNamesService } from "./src/services/names.services";
import { createTeachersService } from "./src/services/teachers.services";
import { createNotesService } from "./src/services/notes.services";
import { createUsersService } from "./src/services/users.services";
import { createNamesController } from "./src/controllers/names.controllers";
import { createTeachersController } from "./src/controllers/teachers.controllers";
import { createNotesController } from "./src/controllers/notes.controllers";
import { createUsersController } from "./src/controllers/users.controllers";
import { createNamesRouter } from "./src/routes/names.routes";
import { createTeachersRouter } from "./src/routes/teachers.routes";
import { createNotesRouter } from "./src/routes/notes.routes";
import { createUsersRouter } from "./src/routes/users.routes";
import { errorHandlerMiddleware } from "./src/middleware/error-handler.middleware";
import { requestLoggingMiddleware } from "./src/middleware/request-logging.middleware";
import { ApiError } from "./src/middleware/error-handler.middleware";
import { migrate } from "./src/db/migrate";
import { seedDatabase } from "./src/db/seed";

const app = express();
const port = Number(process.env.PORT ?? 3000);

// Repository layer: only talks to SQLite and returns data objects.
const usersRepository = createUsersRepository();
const namesRepository = createNamesRepository();
const teachersRepository = createTeachersRepository();
const notesRepository = createNotesRepository();

// Service layer: business rules, 404/400 decisions, FK checks before writes.
const usersService = createUsersService(usersRepository);
const namesService = createNamesService(
  namesRepository,
  usersRepository,
  teachersRepository,
  notesRepository
);
const teachersService = createTeachersService(teachersRepository, namesRepository);
const notesService = createNotesService(notesRepository, usersRepository, namesRepository);

// Controller layer: adapts HTTP handlers to the service methods.
const usersController = createUsersController(usersService);
const namesController = createNamesController(namesService);
const teachersController = createTeachersController(teachersService);
const notesController = createNotesController(notesService);

// Простий CORS, щоб фронтенд, відкритий через file://, міг звертатися до сервера.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }

  next();
});

app.use(requestLoggingMiddleware);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API server is running" });
});

// CRUD-маршрути для всіх сутностей.
app.use("/api/names", createNamesRouter(namesController));
app.use("/api/teachers", createTeachersRouter(teachersController));
app.use("/api/notes", createNotesRouter(notesController));
app.use("/api/users", createUsersRouter(usersController));

// Якщо маршрут не знайдено, повертаємо єдиний формат 404.
app.use((_req, _res, next) => {
  next(new ApiError(404, "NOT_FOUND", "Route not found"));
});
app.use(errorHandlerMiddleware);

try {
  // A lab requirement: initialize schema before the server starts accepting requests.
  migrate();
  // If the DB file was recreated from scratch, seed inserts the demo rows once.
  seedDatabase();

  app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
  });
} catch (error) {
  console.error("Fatal startup error:", error);
  process.exit(1);
}
