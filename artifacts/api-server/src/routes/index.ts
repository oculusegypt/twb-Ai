import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tawbahRouter from "./tawbah";
import ttsRouter from "./tts";
import zakiyRouter from "./zakiy";
import hadiTasksRouter from "./hadi-tasks";
import journeyRouter from "./journey";
import dhikrRoomsRouter from "./dhikr-rooms";
import adminRouter from "./admin";
import heroRouter from "./hero";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(heroRouter);
router.use(tawbahRouter);
router.use(ttsRouter);
router.use(zakiyRouter);
router.use(hadiTasksRouter);
router.use(journeyRouter);
router.use(dhikrRoomsRouter);
router.use("/admin", adminRouter);
router.use("/push", pushRouter);

export default router;
