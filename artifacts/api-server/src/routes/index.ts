import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import customersRouter from "./customers";
import invoicesRouter from "./invoices";
import debtsRouter from "./debts";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/transactions", transactionsRouter);
router.use("/customers", customersRouter);
router.use("/invoices", invoicesRouter);
router.use("/debts", debtsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportsRouter);

export default router;
