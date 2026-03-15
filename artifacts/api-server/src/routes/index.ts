import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tawbahRouter from "./tawbah";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tawbahRouter);

export default router;
