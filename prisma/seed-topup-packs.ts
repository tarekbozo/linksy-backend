import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const topupPacks = [
  { id: 'pack_200',  nameAr: '200 رصيد',   nameEn: '200 Credits',  priceSYP: 5000,  credits: 200,  validDays: 90 },
  { id: 'pack_600',  nameAr: '600 رصيد',   nameEn: '600 Credits',  priceSYP: 10000, credits: 600,  validDays: 90 },
  { id: 'pack_1400', nameAr: '1,400 رصيد', nameEn: '1400 Credits', priceSYP: 20000, credits: 1400, validDays: 90 },
];

async function main() {
  for (const pack of topupPacks) {
    const result = await prisma.topUpPack.upsert({
      where: { id: pack.id },
      update: {},
      create: pack,
    });
    console.log(`Upserted: ${result.id} — ${result.nameEn} (${result.credits} credits, ${result.priceSYP} SYP)`);
  }
  console.log('Done. 3 top-up packs seeded.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
