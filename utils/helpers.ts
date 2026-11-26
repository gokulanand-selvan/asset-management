import { Response } from 'express';
import { Asset, AssetTransaction } from '../models';

export const DEFAULT_BRANCHES = ['Head Office', 'Mumbai', 'Delhi', 'Hyderabad'];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function redirectWithAlert(
  res: Response,
  path: string,
  type: 'success' | 'danger' | 'warning' | 'info',
  message: string
): void {
  const separator = path.includes('?') ? '&' : '?';
  const qs = new URLSearchParams({ alertType: type, alertMsg: message }).toString();
  res.redirect(`${path}${separator}${qs}`);
}

export function toNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = toNumber(amount, 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatStatusLabel(status: string): string {
  const map: Record<string, string> = {
    in_stock: 'In Stock',
    issued: 'Issued',
    scrapped: 'Scrapped',
    active: 'Active',
    inactive: 'Inactive',
  };
  return map[status] || status;
}

export function diffDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(`${startDateStr}T00:00:00Z`).getTime();
  const end = new Date(`${endDateStr}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export interface AssetUtilizationMetrics {
  totalOwnershipDays: number;
  daysIssued: number;
  utilizationPercent: number;
  purchaseCost: number;
  salvageValue: number;
  netCost: number;
  costPerIssuedDay: number | null;
  totalAssignments: number;
}

export function calculateAssetUtilization(
  asset: Asset,
  transactions: AssetTransaction[]
): AssetUtilizationMetrics {
  const endDate =
    asset.status === 'scrapped' && asset.scrappedAt ? asset.scrappedAt : todayISO();
  const totalOwnershipDays = Math.max(1, diffDays(asset.purchaseDate, endDate));

  const sorted = [...transactions].sort((a, b) => {
    const dateCmp = a.transactionDate.localeCompare(b.transactionDate);
    return dateCmp !== 0 ? dateCmp : a.id - b.id;
  });

  let issuedStart: string | null = null;
  let daysIssued = 0;
  let totalAssignments = 0;

  for (const tx of sorted) {
    if (tx.actionType === 'ISSUED') {
      totalAssignments += 1;
      if (!issuedStart) {
        issuedStart = tx.transactionDate;
      }
    } else if (
      (tx.actionType === 'RETURNED' || tx.actionType === 'SCRAPPED') &&
      issuedStart
    ) {
      daysIssued += diffDays(issuedStart, tx.transactionDate);
      issuedStart = null;
    }
  }

  if (issuedStart) {
    daysIssued += diffDays(issuedStart, endDate);
  }

  daysIssued = Math.min(daysIssued, totalOwnershipDays);
  const utilizationPercent = Number(
    ((daysIssued / totalOwnershipDays) * 100).toFixed(1)
  );
  const purchaseCost = toNumber(asset.purchaseCost, 0);
  const salvageValue = toNumber(asset.scrapValue, 0);
  const netCost = Number((purchaseCost - salvageValue).toFixed(2));
  const costPerIssuedDay =
    daysIssued > 0 ? Number((netCost / daysIssued).toFixed(2)) : null;

  return {
    totalOwnershipDays,
    daysIssued,
    utilizationPercent,
    purchaseCost,
    salvageValue,
    netCost,
    costPerIssuedDay,
    totalAssignments,
  };
}
