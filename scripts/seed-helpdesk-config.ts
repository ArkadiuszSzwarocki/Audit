import { prisma } from '@/config/db';

async function seedHelpDeskConfig() {
  try {
    const existingConfig = await prisma.helpDeskConfig.findUnique({
      where: { id: 'singleton' }
    });

    if (!existingConfig) {
      await prisma.helpDeskConfig.create({
        data: {
          id: 'singleton',
          helpDeskEmail: process.env.HELPDESK_EMAIL || 'arkadiusz.szwarocki@wp.pl',
          senderEmail: process.env.EMAIL_FROM || 'dacklowicz@wp.pl',
          notifyOnNewTicket: true,
          notifyOnStatusChange: false,
          notifyOnAssignment: false,
          isEmailEnabled: false // Start disabled - admin must enable
        }
      });

      console.log('✅ Help Desk Config initialized');
    } else {
      console.log('✅ Help Desk Config already exists');
    }
  } catch (error) {
    console.error('Error seeding Help Desk Config:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedHelpDeskConfig();
