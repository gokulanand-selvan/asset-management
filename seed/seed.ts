import 'dotenv/config';
import {
  Asset,
  AssetCategory,
  AssetTransaction,
  Employee,
  sequelize,
} from '../models';

export async function seedDatabase(forceReset = false): Promise<void> {
  await sequelize.authenticate();
  if (forceReset) {
    await sequelize.sync({ force: true });
  } else {
    await sequelize.sync();
  }

  const existingCategories = await AssetCategory.count();
  if (existingCategories > 0) {
    console.log('Database already contains data. Skipping seed.');
    return;
  }

  const categories = await AssetCategory.bulkCreate([
    {
      code: 'LAP',
      name: 'Laptop',
      description: 'Company-issued laptops',
      isActive: true,
    },
    {
      code: 'MOB',
      name: 'Mobile Phone',
      description: 'Corporate smartphones',
      isActive: true,
    },
    {
      code: 'MOD',
      name: 'Modem / Router',
      description: '4G/5G portable modems and branch routers',
      isActive: true,
    },
    {
      code: 'SCR',
      name: 'Screw Driver Kit',
      description: 'Maintenance screwdriver kits',
      isActive: true,
    },
    {
      code: 'DRL',
      name: 'Drill Machine',
      description: 'Cordless and hammer drill machines',
      isActive: true,
    },
  ]);

  const [lap, mob, mod, scr, drl] = categories;

  const employees = await Employee.bulkCreate([
    {
      employeeCode: 'EMP-001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'aarav.sharma@company.com',
      phone: '+91-9876500101',
      department: 'Engineering',
      designation: 'Senior Software Engineer',
      branch: 'Head Office',
      status: 'active',
      joinedDate: '2024-02-12',
    },
    {
      employeeCode: 'EMP-002',
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya.nair@company.com',
      phone: '+91-9876500102',
      department: 'Operations',
      designation: 'Operations Lead',
      branch: 'Mumbai',
      status: 'active',
      joinedDate: '2023-08-01',
    },
    {
      employeeCode: 'EMP-003',
      firstName: 'Rohan',
      lastName: 'Verma',
      email: 'rohan.verma@company.com',
      phone: '+91-9876500103',
      department: 'Field Maintenance',
      designation: 'Field Technician',
      branch: 'Delhi',
      status: 'active',
      joinedDate: '2024-06-15',
    },
    {
      employeeCode: 'EMP-004',
      firstName: 'Sneha',
      lastName: 'Reddy',
      email: 'sneha.reddy@company.com',
      phone: '+91-9876500104',
      department: 'Sales',
      designation: 'Account Executive',
      branch: 'Hyderabad',
      status: 'active',
      joinedDate: '2025-01-10',
    },
    {
      employeeCode: 'EMP-005',
      firstName: 'Vikram',
      lastName: 'Kulkarni',
      email: 'vikram.kulkarni@company.com',
      phone: '+91-9876500105',
      department: 'Engineering',
      designation: 'QA Engineer',
      branch: 'Head Office',
      status: 'inactive',
      joinedDate: '2023-03-20',
    },
  ]);

  const [aarav, priya, rohan, sneha, vikram] = employees;

  const a1 = await Asset.create({
    assetTag: 'AST-1001',
    serialNumber: 'SN-MBP-88210',
    categoryId: lap.id,
    branch: 'Head Office',
    make: 'Apple',
    model: 'MacBook Pro 14 M3',
    purchaseDate: '2025-01-15',
    purchaseCost: 165000,
    warrantyExpiry: '2028-01-14',
    status: 'issued',
    currentEmployeeId: aarav.id,
  });

  const a2 = await Asset.create({
    assetTag: 'AST-1002',
    serialNumber: 'SN-DELL-54409',
    categoryId: lap.id,
    branch: 'Head Office',
    make: 'Dell',
    model: 'Latitude 5440',
    purchaseDate: '2025-04-10',
    purchaseCost: 88000,
    warrantyExpiry: '2028-04-09',
    status: 'in_stock',
  });

  const a3 = await Asset.create({
    assetTag: 'AST-1003',
    serialNumber: 'SN-SAM-S2401',
    categoryId: mob.id,
    branch: 'Mumbai',
    make: 'Samsung',
    model: 'Galaxy S24',
    purchaseDate: '2025-03-05',
    purchaseCost: 74000,
    warrantyExpiry: '2027-03-04',
    status: 'issued',
    currentEmployeeId: priya.id,
  });

  const a4 = await Asset.create({
    assetTag: 'AST-1004',
    serialNumber: 'SN-TPL-MR600',
    categoryId: mod.id,
    branch: 'Mumbai',
    make: 'TP-Link',
    model: 'Archer MR600 4G+',
    purchaseDate: '2025-05-20',
    purchaseCost: 9500,
    status: 'in_stock',
  });

  const a5 = await Asset.create({
    assetTag: 'AST-1005',
    serialNumber: 'SN-BSH-GSB18',
    categoryId: drl.id,
    branch: 'Delhi',
    make: 'Bosch',
    model: 'GSB 18V-50 Cordless Drill',
    purchaseDate: '2024-09-12',
    purchaseCost: 14500,
    status: 'issued',
    currentEmployeeId: rohan.id,
  });

  const a6 = await Asset.create({
    assetTag: 'AST-1006',
    serialNumber: 'SN-STN-SD032',
    categoryId: scr.id,
    branch: 'Delhi',
    make: 'Stanley',
    model: '32-Piece Precision Kit',
    purchaseDate: '2025-02-18',
    purchaseCost: 2400,
    status: 'in_stock',
  });

  const a7 = await Asset.create({
    assetTag: 'AST-1007',
    serialNumber: 'SN-HP-PRO440',
    categoryId: lap.id,
    branch: 'Hyderabad',
    make: 'HP',
    model: 'ProBook 440 G10',
    purchaseDate: '2025-07-05',
    purchaseCost: 78500,
    status: 'in_stock',
  });

  const a8 = await Asset.create({
    assetTag: 'AST-1009',
    serialNumber: 'SN-APP-IP13X',
    categoryId: mob.id,
    branch: 'Hyderabad',
    make: 'Apple',
    model: 'iPhone 13',
    purchaseDate: '2022-05-10',
    purchaseCost: 69900,
    status: 'scrapped',
    scrappedAt: '2026-10-15',
    scrapReason: 'Motherboard failure beyond economical repair',
    scrapValue: 5500,
    notes: 'Disposed through certified e-waste vendor',
  });

  await AssetTransaction.bulkCreate([
    {
      assetId: a1.id,
      branch: 'Head Office',
      actionType: 'PURCHASED',
      transactionDate: '2025-01-15',
      reason: 'Initial Asset Purchase',
      condition: 'New',
      costImpact: 165000,
    },
    {
      assetId: a1.id,
      employeeId: vikram.id,
      branch: 'Head Office',
      actionType: 'ISSUED',
      transactionDate: '2025-02-01',
      reason: 'Assigned to Employee',
      condition: 'New',
      costImpact: 0,
    },
    {
      assetId: a1.id,
      employeeId: vikram.id,
      branch: 'Head Office',
      actionType: 'RETURNED',
      transactionDate: '2026-10-05',
      reason: 'Resignation',
      condition: 'Good',
      costImpact: 0,
      remarks: 'Wiped and inspected after exit',
    },
    {
      assetId: a1.id,
      employeeId: aarav.id,
      branch: 'Head Office',
      actionType: 'ISSUED',
      transactionDate: '2026-10-12',
      reason: 'Assigned to Employee',
      condition: 'Good',
      costImpact: 0,
    },
    {
      assetId: a2.id,
      branch: 'Head Office',
      actionType: 'PURCHASED',
      transactionDate: '2025-04-10',
      reason: 'Initial Asset Purchase',
      condition: 'New',
      costImpact: 88000,
    },
    {
      assetId: a3.id,
      branch: 'Mumbai',
      actionType: 'PURCHASED',
      transactionDate: '2025-03-05',
      reason: 'Initial Asset Purchase',
      condition: 'New',
      costImpact: 74000,
    },
    {
      assetId: a3.id,
      employeeId: priya.id,
      branch: 'Mumbai',
      actionType: 'ISSUED',
      transactionDate: '2025-03-10',
      reason: 'Assigned to Employee',
      condition: 'New',
      costImpact: 0,
    },
    {
      assetId: a4.id,
      branch: 'Mumbai',
      actionType: 'PURCHASED',
      transactionDate: '2025-05-20',
      reason: 'Initial Asset Purchase',
      condition: 'New',
      costImpact: 9500,
    },
    {
      assetId: a5.id,
      branch: 'Delhi',
      actionType: 'PURCHASED',
      transactionDate: '2024-09-12',
      reason: 'Initial Asset Purchase',
      condition: 'New',
      costImpact: 14500,
    },
    {
      assetId: a5.id,
      employeeId: rohan.id,
      branch: 'Delhi',
      actionType: 'ISSUED',
      transactionDate: '2024-09-20',
      reason: 'Assigned to Employee',
      condition: 'New',
      costImpact: 0,
    },
    {
      assetId: a6.id,
      branch: 'Delhi',
      actionType: 'PURCHASED',
      transactionDate: '2025-02-18',
      reason: 'Initial Asset Purchase',
      condition: 'New',
      costImpact: 2400,
    },
    {
      assetId: a7.id,
      branch: 'Hyderabad',
      actionType: 'PURCHASED',
      transactionDate: '2025-07-05',
      reason: 'Initial Asset Purchase',
      condition: 'New',
      costImpact: 78500,
    },
    {
      assetId: a8.id,
      branch: 'Hyderabad',
      actionType: 'PURCHASED',
      transactionDate: '2022-05-10',
      reason: 'Initial Asset Purchase',
      condition: 'New',
      costImpact: 69900,
    },
    {
      assetId: a8.id,
      employeeId: sneha.id,
      branch: 'Hyderabad',
      actionType: 'ISSUED',
      transactionDate: '2022-06-01',
      reason: 'Assigned to Employee',
      condition: 'New',
      costImpact: 0,
    },
    {
      assetId: a8.id,
      employeeId: sneha.id,
      branch: 'Hyderabad',
      actionType: 'RETURNED',
      transactionDate: '2026-10-01',
      reason: 'Repair',
      condition: 'Damaged',
      costImpact: 0,
      remarks: 'Device failed to power on',
    },
    {
      assetId: a8.id,
      branch: 'Hyderabad',
      actionType: 'SCRAPPED',
      transactionDate: '2026-10-15',
      reason: 'Motherboard failure beyond economical repair',
      condition: 'Obsolete',
      costImpact: 5500,
      remarks: 'Disposed through certified e-waste vendor',
    },
  ]);

  console.log('Seed completed successfully.');
}

if (require.main === module) {
  const forceReset = process.argv.includes('--reset');
  seedDatabase(forceReset)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
