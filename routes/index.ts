import { NextFunction, Request, Response, Router } from "express";
import {
  createEmployee,
  listEmployees,
  updateEmployee,
} from "../controllers/employeeController";
import {
  createCategory,
  listCategories,
  updateCategory,
} from "../controllers/categoryController";
import {
  createAsset,
  getStockView,
  listAssets,
  updateAsset,
} from "../controllers/assetController";
import {
  getHistoryPage,
  getIssuePage,
  getReportsPage,
  getReturnPage,
  getScrapPage,
  postIssueAsset,
  postReturnAsset,
  postScrapAsset,
} from "../controllers/lifecycleController";

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Home redirects straight to Employee Master (Requirement 1)
router.get("/", (_req: Request, res: Response) => {
  res.redirect("/employees");
});

// 1. Employee Master
router.get("/employees", asyncHandler(listEmployees));
router.post("/employees", asyncHandler(createEmployee));
router.post("/employees/:id", asyncHandler(updateEmployee));

// 2. Asset Master
router.get("/assets", asyncHandler(listAssets));
router.post("/assets", asyncHandler(createAsset));
router.post("/assets/:id", asyncHandler(updateAsset));

// 3. Asset Category Master
router.get("/categories", asyncHandler(listCategories));
router.post("/categories", asyncHandler(createCategory));
router.post("/categories/:id", asyncHandler(updateCategory));

// 4. Stock View
router.get("/stock", asyncHandler(getStockView));

// 5. Issue Asset
router.get("/issue", asyncHandler(getIssuePage));
router.post("/issue", asyncHandler(postIssueAsset));

// 6. Return Asset
router.get("/return", asyncHandler(getReturnPage));
router.post("/return", asyncHandler(postReturnAsset));

// 7. Scrap Asset
router.get("/scrap", asyncHandler(getScrapPage));
router.post("/scrap", asyncHandler(postScrapAsset));

// 8. Asset History & Reports
router.get("/history", asyncHandler(getHistoryPage));
router.get("/history/:id", asyncHandler(getHistoryPage));
router.get("/reports", asyncHandler(getReportsPage));
router.get("/reports/history/:id", asyncHandler(getHistoryPage));

export default router;
