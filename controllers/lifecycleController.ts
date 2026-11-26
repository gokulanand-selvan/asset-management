import { Request, Response } from 'express';
import { Op } from 'sequelize';
import {
  Asset,
  AssetCategory,
  AssetTransaction,
  Employee,
  sequelize,
} from '../models';
import {
  calculateAssetUtilization,
  DEFAULT_BRANCHES,
  redirectWithAlert,
  todayISO,
  toNumber,
} from '../utils/helpers';

export async function getIssuePage(req: Request, res: Response): Promise<void> {
  const [availableAssets, activeEmployees, issuedAssets] = await Promise.all([
    Asset.findAll({
      where: { status: 'in_stock' },
      include: [{ model: AssetCategory, as: 'category' }],
      order: [['assetTag', 'ASC']],
    }),
    Employee.findAll({
      where: { status: 'active' },
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    }),
    Asset.findAll({
      where: { status: 'issued' },
      include: [
        { model: AssetCategory, as: 'category' },
        { model: Employee, as: 'currentEmployee' },
      ],
      order: [['updatedAt', 'DESC']],
    }),
  ]);

  res.render('lifecycle/issue', {
    title: 'Issue Asset',
    activePage: 'issue',
    availableAssets,
    activeEmployees,
    issuedAssets,
    today: todayISO(),
    preselectedAssetId: req.query.assetId ? Number(req.query.assetId) : null,
  });
}

export async function postIssueAsset(req: Request, res: Response): Promise<void> {
  const t = await sequelize.transaction();
  try {
    const { assetId, employeeId, issueDate, condition, remarks } = req.body;
    if (!assetId || !employeeId || !issueDate) {
      await t.rollback();
      redirectWithAlert(res, '/issue', 'danger', 'Asset, employee, and issue date are required.');
      return;
    }

    const [asset, employee] = await Promise.all([
      Asset.findByPk(Number(assetId), { transaction: t }),
      Employee.findByPk(Number(employeeId), { transaction: t }),
    ]);

    if (!asset || asset.status !== 'in_stock') {
      await t.rollback();
      redirectWithAlert(res, '/issue', 'danger', 'Selected asset is not in stock.');
      return;
    }

    if (!employee || employee.status !== 'active') {
      await t.rollback();
      redirectWithAlert(res, '/issue', 'danger', 'Assets can only be issued to active employees.');
      return;
    }

    await asset.update(
      {
        status: 'issued',
        currentEmployeeId: employee.id,
        branch: employee.branch,
      },
      { transaction: t }
    );

    await AssetTransaction.create(
      {
        assetId: asset.id,
        employeeId: employee.id,
        branch: employee.branch,
        actionType: 'ISSUED',
        transactionDate: String(issueDate),
        reason: 'Assigned to Employee',
        condition: condition ? String(condition) : 'Good',
        costImpact: 0,
        remarks: remarks ? String(remarks).trim() : null,
      },
      { transaction: t }
    );

    await t.commit();
    redirectWithAlert(
      res,
      '/issue',
      'success',
      `Asset ${asset.assetTag} issued to ${employee.fullName} (${employee.employeeCode}).`
    );
  } catch (err: unknown) {
    await t.rollback();
    const message = err instanceof Error ? err.message : 'Unable to issue asset.';
    redirectWithAlert(res, '/issue', 'danger', message);
  }
}

export async function getReturnPage(req: Request, res: Response): Promise<void> {
  const [issuedAssets, recentReturns] = await Promise.all([
    Asset.findAll({
      where: { status: 'issued' },
      include: [
        { model: AssetCategory, as: 'category' },
        { model: Employee, as: 'currentEmployee' },
      ],
      order: [['assetTag', 'ASC']],
    }),
    AssetTransaction.findAll({
      where: { actionType: 'RETURNED' },
      include: [
        {
          model: Asset,
          as: 'asset',
          required: true,
          where: { status: { [Op.ne]: 'scrapped' } },
          include: [{ model: AssetCategory, as: 'category' }],
        },
        { model: Employee, as: 'employee' },
      ],
      order: [
        ['transactionDate', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: 15,
    }),
  ]);

  res.render('lifecycle/return', {
    title: 'Return Asset',
    activePage: 'return',
    issuedAssets,
    recentReturns,
    branches: DEFAULT_BRANCHES,
    today: todayISO(),
    preselectedAssetId: req.query.assetId ? Number(req.query.assetId) : null,
  });
}

export async function postReturnAsset(req: Request, res: Response): Promise<void> {
  const t = await sequelize.transaction();
  try {
    const {
      assetId,
      returnDate,
      reason,
      customReason,
      condition,
      branch,
      remarks,
    } = req.body;

    if (!assetId || !returnDate || !reason) {
      await t.rollback();
      redirectWithAlert(
        res,
        '/return',
        'danger',
        'Asset, return date, and return reason are required.'
      );
      return;
    }

    const asset = await Asset.findByPk(Number(assetId), { transaction: t });
    if (!asset || asset.status !== 'issued') {
      await t.rollback();
      redirectWithAlert(res, '/return', 'danger', 'Selected asset is not currently issued.');
      return;
    }

    const previousEmployeeId = asset.currentEmployeeId;
    const resolvedBranch = branch ? String(branch).trim() : asset.branch;
    const resolvedReason =
      reason === 'Other' && customReason
        ? `Other: ${String(customReason).trim()}`
        : String(reason).trim();

    await asset.update(
      {
        status: 'in_stock',
        currentEmployeeId: null,
        branch: resolvedBranch,
      },
      { transaction: t }
    );

    await AssetTransaction.create(
      {
        assetId: asset.id,
        employeeId: previousEmployeeId,
        branch: resolvedBranch,
        actionType: 'RETURNED',
        transactionDate: String(returnDate),
        reason: resolvedReason,
        condition: condition ? String(condition) : 'Good',
        costImpact: 0,
        remarks: remarks ? String(remarks).trim() : null,
      },
      { transaction: t }
    );

    await t.commit();
    redirectWithAlert(
      res,
      '/return',
      'success',
      `Asset ${asset.assetTag} returned (${resolvedReason}) back to stock.`
    );
  } catch (err: unknown) {
    await t.rollback();
    const message = err instanceof Error ? err.message : 'Unable to return asset.';
    redirectWithAlert(res, '/return', 'danger', message);
  }
}

export async function getScrapPage(req: Request, res: Response): Promise<void> {
  // Never display already-scrapped assets
  const [eligibleAssets, issuedCount] = await Promise.all([
    Asset.findAll({
      where: { status: 'in_stock' },
      include: [{ model: AssetCategory, as: 'category' }],
      order: [['assetTag', 'ASC']],
    }),
    Asset.count({ where: { status: 'issued' } }),
  ]);

  res.render('lifecycle/scrap', {
    title: 'Scrap Asset',
    activePage: 'scrap',
    eligibleAssets,
    issuedCount,
    today: todayISO(),
    preselectedAssetId: req.query.assetId ? Number(req.query.assetId) : null,
  });
}

export async function postScrapAsset(req: Request, res: Response): Promise<void> {
  const t = await sequelize.transaction();
  try {
    const { assetId, scrapDate, reason, salvageValue, remarks } = req.body;
    if (!assetId || !scrapDate || !reason) {
      await t.rollback();
      redirectWithAlert(
        res,
        '/scrap',
        'danger',
        'Asset, scrap date, and obsolescence reason are required.'
      );
      return;
    }

    const asset = await Asset.findByPk(Number(assetId), { transaction: t });
    if (!asset || asset.status === 'scrapped') {
      await t.rollback();
      redirectWithAlert(res, '/scrap', 'danger', 'Active asset not found.');
      return;
    }
    if (asset.status === 'issued') {
      await t.rollback();
      redirectWithAlert(
        res,
        '/scrap',
        'warning',
        `Asset ${asset.assetTag} is currently issued. Return it before scrapping.`
      );
      return;
    }

    const salvage = toNumber(salvageValue, 0);

    await asset.update(
      {
        status: 'scrapped',
        currentEmployeeId: null,
        scrappedAt: String(scrapDate),
        scrapReason: String(reason).trim(),
        scrapValue: salvage,
      },
      { transaction: t }
    );

    await AssetTransaction.create(
      {
        assetId: asset.id,
        branch: asset.branch,
        actionType: 'SCRAPPED',
        transactionDate: String(scrapDate),
        reason: String(reason).trim(),
        condition: 'Obsolete',
        costImpact: salvage,
        remarks: remarks ? String(remarks).trim() : null,
      },
      { transaction: t }
    );

    await t.commit();
    redirectWithAlert(
      res,
      '/scrap',
      'success',
      `Asset ${asset.assetTag} marked as obsolete/scrapped and hidden from active pages.`
    );
  } catch (err: unknown) {
    await t.rollback();
    const message = err instanceof Error ? err.message : 'Unable to scrap asset.';
    redirectWithAlert(res, '/scrap', 'danger', message);
  }
}

export async function getHistoryPage(req: Request, res: Response): Promise<void> {
  const assets = await Asset.findAll({
    include: [
      { model: AssetCategory, as: 'category' },
      { model: Employee, as: 'currentEmployee' },
    ],
    order: [['assetTag', 'ASC']],
  });

  const selectedId = req.params.id ? Number(req.params.id) : null;
  if (!selectedId) {
    res.render('lifecycle/history', {
      title: 'Asset History',
      activePage: 'history',
      assets,
      selectedAsset: null,
      transactions: [],
      metrics: null,
    });
    return;
  }

  const selectedAsset = await Asset.findByPk(selectedId, {
    include: [
      { model: AssetCategory, as: 'category' },
      { model: Employee, as: 'currentEmployee' },
    ],
  });

  if (!selectedAsset) {
    redirectWithAlert(res, '/history', 'danger', 'Asset not found.');
    return;
  }

  const transactions = await AssetTransaction.findAll({
    where: { assetId: selectedAsset.id },
    include: [{ model: Employee, as: 'employee' }],
    order: [
      ['transactionDate', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  const metrics = calculateAssetUtilization(selectedAsset, transactions);

  res.render('lifecycle/history', {
    title: `Asset History - ${selectedAsset.assetTag}`,
    activePage: 'history',
    assets,
    selectedAsset,
    transactions,
    metrics,
  });
}
