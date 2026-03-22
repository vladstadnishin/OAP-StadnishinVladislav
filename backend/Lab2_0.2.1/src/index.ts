
import express from "express";
import cors from "cors";
import usersRoutes from "./routes/users.routes";
import notesRoutes from "./routes/notes.routes";
import { requestLoggingMiddleware } from "./middleware/request-logging.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";

const app = express();

app.use(cors()); //Запити з браузера
app.use(express.json());//апрсинг json
app.use(requestLoggingMiddleware);//Логування

app.use("/api/users", usersRoutes);//маршрути для користувача
app.use("/api/personal-notes", notesRoutes); //маршрути для полів
app.use(errorHandler);

const PORT = 3000;

app.get("/health", (req, res) => res.status(200).json({ ok: true })); //стан сервера

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/health`);
});
