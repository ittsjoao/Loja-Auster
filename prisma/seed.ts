import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { hashSync } from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const PROTECTED_ADMIN = {
  email: "ti@austercontabil.com.br",
  password: "Gere1288246@",
  name: "TI Auster",
  role: "admin",
};

async function main() {
  const hashedPassword = hashSync(PROTECTED_ADMIN.password, 10);

  await prisma.user.upsert({
    where: { email: PROTECTED_ADMIN.email },
    update: {
      role: PROTECTED_ADMIN.role,
      name: PROTECTED_ADMIN.name,
    },
    create: {
      email: PROTECTED_ADMIN.email,
      password: hashedPassword,
      name: PROTECTED_ADMIN.name,
      role: PROTECTED_ADMIN.role,
    },
  });

  console.log(`Protected admin user ensured: ${PROTECTED_ADMIN.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
