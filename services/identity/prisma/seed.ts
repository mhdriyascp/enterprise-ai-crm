import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { TenantService } from '../src/application/services/tenant.service';

// =============================================================================
// Development seed — creates a demo tenant with an admin user.
//   Email:    admin@demo.test
//   Password: ChangeMe123!
//   Tenant slug: demo
// =============================================================================

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tenantService = new TenantService(prisma);

  const existing = await prisma.tenant.findUnique({ where: { slug: 'demo' } });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log('Demo tenant already exists — skipping seed.');
    return;
  }

  const tenant = await tenantService.create({ name: 'Demo Company', slug: 'demo', plan: 'enterprise' });

  const adminRole = await prisma.role.findFirst({
    where: { tenantId: tenant.id, name: 'admin' },
  });

  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@demo.test',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Admin',
      emailVerified: true,
      roles: adminRole ? { create: [{ roleId: adminRole.id }] } : undefined,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seeded demo tenant and admin user (admin@demo.test / ChangeMe123!).');
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
