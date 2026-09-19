import cron from 'node-cron';
import { generateNotificationsForAllUsers } from '../services/notifications.service';

export function startNotificationsJob(): void {
  cron.schedule('*/15 * * * *', async () => {
    try {
      await generateNotificationsForAllUsers();
    } catch (err) {
      console.error('[notifications job] failed', err);
    }
  });
}
