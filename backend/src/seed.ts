import { AppDataSource, initializeDataSource } from "./db.js";
import {
  listScenarios,
  loadScenario,
  seedScenario,
} from "./seed/seedScenario.js";

// usage: tsx src/seed.ts <scenario>
// prints the ids of the seeded users and timetables, by key, as json on the
// last line
const name = process.argv[2];
if (!name || !listScenarios().includes(name)) {
  console.error(`pick a scenario: ${listScenarios().join(", ")}`);
  process.exit(1);
}

initializeDataSource()
  .then(() => seedScenario(loadScenario(name)))
  .then(async (seeded) => {
    await AppDataSource.destroy();
    console.log(JSON.stringify(seeded));
    // the log transport can keep the process alive, so exit explicitly
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
