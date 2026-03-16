import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tawbahRouter from "./tawbah";
import ttsRouter from "./tts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tawbahRouter);
router.use(ttsRouter);

export default router;
