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
  DEFAULT_BRANCHES,
  redirectWithAlert,
  todayISO,
  toNumber,
} from '../utils/helpers';

export async function listAssets(req: Request, res: Response): Promise<void> {
  const categoryFilter = (req.query.categoryId as string) || 'all';

  // Scrapped assets must not appear in Asset Master
  const where: Record<string, unknown> = {
    status: { [Op.ne]: 'scrapped' },
  };
  if (categoryFilter !== 'all' && Number.isInteger(Number(categoryFilter))) {
    where.categoryId = Number(categoryFilter);
  }

  const [assets, categories] = await Promise.all([
    Asset.findAll({
      where,
      include: [
        { model: AssetCategory, as: 'category' },
        { model: Employee, as: 'currentEmployee' },
      ],
      order: [['assetTag', 'ASC']],
    }),
    AssetCategory.findAll({ where: { isActive: true }, order: [['name', 'ASC']] }),
  ]);

  res.render('assets/index', {
    title: 'Asset Master',
    activePage: 'assets',
    assets,
    categories,
    branches: DEFAULT_BRANCHES,
    today: todayISO(),
    filters: { categoryId: categoryFilter },
  });
}

export async function createAsset(req: Request, res: Response): Promise<void> {
  const t = await sequelize.transaction();
  try {
    const {
      assetTag,
      serialNumber,
      categoryId,
      branch,
      make,
      model,
      purchaseDate,
      purchaseCost,
      warrantyExpiry,
      notes,
    } = req.body;

    if (
      !assetTag ||
      !serialNumber ||
      !categoryId ||
      !branch ||
      !make ||
      !model ||
      !purchaseDate ||
      purchaseCost === undefined ||
      purchaseCost === ''
    ) {
      await t.rollback();
      redirectWithAlert(res, '/assets', 'danger', 'Please fill in all required asset fields.');
      return;
    }

    const asset = await Asset.create(
      {
        assetTag: String(assetTag).trim().toUpperCase(),
        serialNumber: String(serialNumber).trim().toUpperCase(),
        categoryId: Number(categoryId),
        branch: String(branch).trim(),
        make: String(make).trim(),
        model: String(model).trim(),
        purchaseDate: String(purchaseDate),
        purchaseCost: toNumber(purchaseCost, 0),
        warrantyExpiry: warrantyExpiry || null,
        status: 'in_stock',
        notes: notes ? String(notes).trim() : null,
      },
      { transaction: t }
    );

    await AssetTransaction.create(
      {
        assetId: asset.id,
        branch: asset.branch,
        actionType: 'PURCHASED',
        transactionDate: asset.purchaseDate,
        reason: 'Initial Asset Purchase',
        condition: 'New',
        costImpact: toNumber(purchaseCost, 0),
        remarks: notes ? String(notes).trim() : 'Added to Asset Master in stock.',
      },
      { transaction: t }
    );

    await t.commit();
    redirectWithAlert(
      res,
      '/assets',
      'success',
      `Asset ${asset.assetTag} (${asset.make} ${asset.model}) added.`
    );
  } catch (err: unknown) {
    await t.rollback();
    const message = err instanceof Error ? err.message : 'Unable to create asset.';
    redirectWithAlert(res, '/assets', 'danger', message);
  }
}

export async function updateAsset(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const asset = await Asset.findByPk(id);
    if (!asset || asset.status === 'scrapped') {
      redirectWithAlert(res, '/assets', 'danger', 'Active asset not found.');
      return;
    }

    const {
      assetTag,
      serialNumber,
      categoryId,
      branch,
      make,
      model,
      purchaseDate,
      purchaseCost,
      warrantyExpiry,
      notes,
    } = req.body;

    await asset.update({
      assetTag: String(assetTag).trim().toUpperCase(),
      serialNumber: String(serialNumber).trim().toUpperCase(),
      categoryId: Number(categoryId),
      branch: String(branch).trim(),
      make: String(make).trim(),
      model: String(model).trim(),
      purchaseDate: String(purchaseDate),
      purchaseCost: toNumber(purchaseCost, 0),
      warrantyExpiry: warrantyExpiry || null,
      notes: notes ? String(notes).trim() : null,
    });

    redirectWithAlert(res, '/assets', 'success', `Asset ${asset.assetTag} updated.`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update asset.';
    redirectWithAlert(res, '/assets', 'danger', message);
  }
}

export async function getStockView(req: Request, res: Response): Promise<void> {
  const inStockAssets = await Asset.findAll({
    where: { status: 'in_stock' },
    include: [{ model: AssetCategory, as: 'category' }],
    order: [
      ['branch', 'ASC'],
      ['assetTag', 'ASC'],
    ],
  });

  const branchSummaryMap = new Map<
    string,
    { branch: string; count: number; totalValue: number }
  >();

  let grandTotalValue = 0;
  for (const asset of inStockAssets) {
    const cost = toNumber(asset.purchaseCost, 0);
    grandTotalValue += cost;

    const existing = branchSummaryMap.get(asset.branch);
    if (existing) {
      existing.count += 1;
      existing.totalValue += cost;
    } else {
      branchSummaryMap.set(asset.branch, {
        branch: asset.branch,
        count: 1,
        totalValue: cost,
      });
    }
  }

  res.render('stock/index', {
    title: 'Stock View',
    activePage: 'stock',
    assets: inStockAssets,
    branchTotals: Array.from(branchSummaryMap.values()),
    grandTotalCount: inStockAssets.length,
    grandTotalValue,
  });
}
