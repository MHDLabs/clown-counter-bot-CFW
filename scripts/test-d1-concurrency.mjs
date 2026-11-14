import { spawn } from "node:child_process";

const voter = "9007199254740993";
const clown = "9007199254740995";
const group = "-9007199254740993";
const otherGroup = "-9007199254740995";
const now = Date.now();
const cooldown = 600000;

/** @param {string} sql @returns {Promise<any>} */
function command(sql, retry = 0) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["exec", "wrangler", "d1", "execute", "DB", "--local", "--json", "--command", sql], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => (out += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (err += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve(JSON.parse(out));
      const details = err || out || `Wrangler exited ${code}`;

      if (retry < 8 && details.includes("SQLITE_BUSY")) {
        return setTimeout(() => resolve(command(sql, retry + 1)), 25 * 2 ** retry);
      }

      return reject(new Error(details));
    });
  });
}

const seed = async () => {
  await command(`INSERT OR IGNORE INTO groups(id,name) VALUES('${group}','integration test')`);
  await command(`INSERT OR IGNORE INTO groups(id,name) VALUES('${otherGroup}','isolation test')`);
  await command(`UPDATE groups SET name='integration test',reset_at=NULL,cooldown=NULL WHERE id='${group}'`);
  await command(`UPDATE groups SET name='isolation test',reset_at=NULL,cooldown=NULL WHERE id='${otherGroup}'`);
  await command(`INSERT OR IGNORE INTO users(id,name) VALUES('${voter}','voter')`);
  await command(`INSERT OR IGNORE INTO users(id,name) VALUES('${clown}','clown')`);
  await command(`DELETE FROM clown_votes WHERE voter_id='${voter}' AND group_id IN ('${group}','${otherGroup}')`);
  await command(`DELETE FROM clown_votes WHERE voter_id IS NULL AND group_id='${group}'`);
};

/** @param {string} targetGroup @param {number} timestamp */
const voteInsert = (targetGroup, timestamp) => `INSERT INTO clown_votes(voter_id,clown_id,group_id,voted_at,quantity)
  SELECT '${voter}','${clown}','${targetGroup}',${timestamp},1 WHERE NOT EXISTS (
    SELECT 1 FROM clown_votes WHERE voter_id='${voter}' AND group_id='${targetGroup}' AND voted_at>${timestamp - cooldown}
  )`;

async function countVotes() {
  const response = await command(`SELECT COUNT(*) AS total FROM clown_votes WHERE voter_id='${voter}'`);
  return response[0].results[0].total;
}

await seed();
await Promise.all(Array.from({ length: 8 }, () => command(voteInsert(group, now))));
if ((await countVotes()) !== 1)
  throw new Error("Concurrent votes bypassed cooldown; expected exactly one accepted vote");
await command(voteInsert(group, now + cooldown));
if ((await countVotes()) !== 2) throw new Error("Vote was not accepted at the exact cooldown boundary");
await command(voteInsert(otherGroup, now + cooldown));
if ((await countVotes()) !== 3) throw new Error("Cooldown leaked across group boundaries");

const dayStart = Math.floor(now / 86_400_000) * 86_400_000;

/** @param {number} timestamp */
const dailyInsert = (timestamp) => {
  const start = Math.floor(timestamp / 86_400_000) * 86_400_000;
  return `INSERT INTO clown_votes(group_id,voter_id,clown_id,voted_at,quantity)
    SELECT '${group}',NULL,'${clown}',${timestamp},5 WHERE NOT EXISTS (
      SELECT 1 FROM clown_votes WHERE group_id='${group}' AND voter_id IS NULL
        AND voted_at >= ${start} AND voted_at < ${start + 86_400_000}
    )`;
};

await Promise.all(Array.from({ length: 8 }, () => command(dailyInsert(now))));

/** @param {number} start @param {number} end @returns {Promise<number>} */
const countDaily = async (start, end) => {
  const response = await command(
    `SELECT COUNT(*) AS total FROM clown_votes WHERE group_id='${group}' AND voter_id IS NULL AND voted_at >= ${start} AND voted_at < ${end}`,
  );
  return response[0].results[0].total;
};

if ((await countDaily(dayStart, dayStart + 86_400_000)) !== 1)
  throw new Error("Concurrent clown-of-the-day awards were not serialized");
await command(dailyInsert(dayStart + 86_400_000));
if ((await countDaily(dayStart + 86_400_000, dayStart + 172_800_000)) !== 1)
  throw new Error("Clown-of-the-day did not reset at UTC midnight");

const aggregate = await command(`SELECT users.name, coalesce(sum(clown_votes.quantity),0) AS count
  FROM clown_votes LEFT JOIN users ON users.id=clown_votes.clown_id
  WHERE clown_votes.group_id='${group}' GROUP BY users.id ORDER BY coalesce(sum(clown_votes.quantity),0) DESC`);
if (aggregate[0].results[0].count !== 12) throw new Error("Statistics aggregate returned an unexpected total");
await command(`UPDATE groups SET reset_at=${dayStart + 86_400_000} WHERE id='${group}'`);
const resetAggregate = await command(`SELECT coalesce(sum(quantity),0) AS count FROM clown_votes
  WHERE group_id='${group}' AND voted_at >= ${dayStart + 86_400_000}`);
if (resetAggregate[0].results[0].count !== 5) throw new Error("Statistics reset cutoff returned an unexpected total");

await command(`INSERT INTO clown_votes(voter_id,clown_id,group_id,voted_at,quantity)
  VALUES('${voter}','${clown}','${group}',${dayStart + 86_400_000 + 1_000},-2)`);
const personalAggregate = await command(`SELECT
    coalesce(sum(quantity),0) AS score,
    coalesce(sum(case when quantity > 0 then quantity else 0 end),0) AS received,
    coalesce(-sum(case when quantity < 0 then quantity else 0 end),0) AS removed
  FROM clown_votes
  WHERE group_id='${group}' AND clown_id='${clown}' AND voted_at >= ${dayStart + 86_400_000}`);
const personalStats = personalAggregate[0].results[0];
if (personalStats.score !== 3 || personalStats.received !== 5 || personalStats.removed !== 2)
  throw new Error("Personal statistics did not match current group period and vote direction");

console.log(
  "D1 vote/daily-award concurrency, cooldown boundary, group isolation, UTC day boundary, group/personal statistics, and 64-bit text IDs passed.",
);
