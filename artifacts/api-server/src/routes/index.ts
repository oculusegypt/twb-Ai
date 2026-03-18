import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tawbahRouter from "./tawbah";
import ttsRouter from "./tts";
import zakiyRouter from "./zakiy";
import hadiTasksRouter from "./hadi-tasks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tawbahRouter);
router.use(ttsRouter);
router.use(zakiyRouter);
router.use(hadiTasksRouter);

export default router;
