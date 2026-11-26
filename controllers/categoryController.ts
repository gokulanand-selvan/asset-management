import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Asset, AssetCategory } from '../models';
import { redirectWithAlert } from '../utils/helpers';

export async function listCategories(req: Request, res: Response): Promise<void> {
  const categories = await AssetCategory.findAll({
    include: [
      {
        model: Asset,
        as: 'assets',
        required: false,
        where: { status: { [Op.ne]: 'scrapped' } },
        attributes: ['id', 'status', 'purchaseCost'],
      },
    ],
    order: [['name', 'ASC']],
  });

  res.render('categories/index', {
    title: 'Asset Category Master',
    activePage: 'categories',
    categories,
  });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const { code, name, description, isActive } = req.body;
    if (!code || !name) {
      redirectWithAlert(res, '/categories', 'danger', 'Category code and name are required.');
      return;
    }

    await AssetCategory.create({
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      isActive: isActive !== 'false' && isActive !== 'off',
    });

    redirectWithAlert(res, '/categories', 'success', `Category "${name}" created.`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to create category.';
    redirectWithAlert(res, '/categories', 'danger', message);
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const category = await AssetCategory.findByPk(id);
    if (!category) {
      redirectWithAlert(res, '/categories', 'danger', 'Category not found.');
      return;
    }

    const { code, name, description, isActive } = req.body;
    await category.update({
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      isActive: isActive === 'true' || isActive === 'on' || isActive === true,
    });

    redirectWithAlert(res, '/categories', 'success', `Category "${category.name}" updated.`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update category.';
    redirectWithAlert(res, '/categories', 'danger', message);
  }
}
