(async () => {
  try {
    const seed = require('../backend/src/seed-demo-users');
    await seed();
    console.log('Seed script finished.');
    process.exit(0);
  } catch (err) {
    console.error('Seed script error:', err);
    process.exit(1);
  }
})();