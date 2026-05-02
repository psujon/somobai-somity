import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
prisma.user.findUnique({where: {email: 'admin@coop.com'}}).then(async user => {
   console.log(user);
   if(user) {
      const valid = await bcrypt.compare('admin123', user.password);
      console.log('isValid:', valid);
   }
});
