import { Request, Response } from 'express';
import { Asset, Employee } from '../models';
import { DEFAULT_BRANCHES, redirectWithAlert } from '../utils/helpers';

export async function listEmployees(req: Request, res: Response): Promise<void> {
  const statusFilter = (req.query.status as string) || 'all';
  const where: Record<string, unknown> = {};
  if (statusFilter === 'active' || statusFilter === 'inactive') {
    where.status = statusFilter;
  }

  const employees = await Employee.findAll({
    where,
    include: [
      {
        model: Asset,
        as: 'heldAssets',
        required: false,
        where: { status: 'issued' },
      },
    ],
    order: [['employeeCode', 'ASC']],
  });

  res.render('employees/index', {
    title: 'Employee Master',
    activePage: 'employees',
    employees,
    branches: DEFAULT_BRANCHES,
    filters: { status: statusFilter },
  });
}

export async function createEmployee(req: Request, res: Response): Promise<void> {
  try {
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      branch,
      status,
      joinedDate,
    } = req.body;

    if (!employeeCode || !firstName || !lastName || !email || !department || !branch) {
      redirectWithAlert(res, '/employees', 'danger', 'Please fill in all required employee fields.');
      return;
    }

    await Employee.create({
      employeeCode: String(employeeCode).trim().toUpperCase(),
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : null,
      department: String(department).trim(),
      designation: designation ? String(designation).trim() : null,
      branch: String(branch).trim(),
      status: status === 'inactive' ? 'inactive' : 'active',
      joinedDate: joinedDate || null,
    });

    redirectWithAlert(
      res,
      '/employees',
      'success',
      `Employee ${String(employeeCode).trim().toUpperCase()} added.`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to create employee.';
    redirectWithAlert(res, '/employees', 'danger', message);
  }
}

export async function updateEmployee(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const employee = await Employee.findByPk(id);
    if (!employee) {
      redirectWithAlert(res, '/employees', 'danger', 'Employee not found.');
      return;
    }

    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      branch,
      status,
      joinedDate,
    } = req.body;

    const nextStatus = status === 'inactive' ? 'inactive' : 'active';
    if (nextStatus === 'inactive') {
      const heldCount = await Asset.count({
        where: { currentEmployeeId: employee.id, status: 'issued' },
      });
      if (heldCount > 0) {
        redirectWithAlert(
          res,
          '/employees',
          'warning',
          `Cannot mark ${employee.fullName} as inactive while holding ${heldCount} issued asset(s). Return assets first.`
        );
        return;
      }
    }

    await employee.update({
      employeeCode: String(employeeCode).trim().toUpperCase(),
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : null,
      department: String(department).trim(),
      designation: designation ? String(designation).trim() : null,
      branch: String(branch).trim(),
      status: nextStatus,
      joinedDate: joinedDate || null,
    });

    redirectWithAlert(res, '/employees', 'success', `Employee ${employee.employeeCode} updated.`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update employee.';
    redirectWithAlert(res, '/employees', 'danger', message);
  }
}
