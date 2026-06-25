import { config } from './config';
import { createSlackApp } from './slack/app';
import { createWebServer } from './web/server';
import { initUserNameCache } from './web/server';
import { seedAdminsFromEnv } from './db/support';

async function main(): Promise<void> {
  console.log('Starting Heist Support Bot...');

  const slackApp = createSlackApp();
  await slackApp.start();
  console.log('Slack bot is running (Socket Mode)');

  seedAdminsFromEnv();
  console.log('Admins seeded from env');

  const webApp = createWebServer(slackApp);
  webApp.listen(config.web.port, () => {
    console.log(`Web server running on port ${config.web.port}`);
  });

  setTimeout(() => initUserNameCache(), 3000);

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await slackApp.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    await slackApp.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
