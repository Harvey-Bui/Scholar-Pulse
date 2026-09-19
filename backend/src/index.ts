import { createApp } from './app';
import { env } from './env';
import { startNotificationsJob } from './jobs/notifications.job';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Study Planner API listening on port ${env.port}`);
  startNotificationsJob();
});
