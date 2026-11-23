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
  await command(
    `DELETE FROM clown_cooldown_attempts WHERE voter_id='${voter}' AND group_id IN ('${group}','${otherGroup}')`,
  );
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

/** @param {string} targetGroup @param {number} timestamp @param {number} expiresAt */
const cooldownAttempt = (targetGroup, timestamp, expiresAt) =>
  command(`INSERT INTO clown_cooldown_attempts(group_id,voter_id,attempts,expires_at)
  VALUES('${targetGroup}','${voter}',1,${expiresAt})
  ON CONFLICT(group_id,voter_id) DO UPDATE SET
    attempts=CASE WHEN clown_cooldown_attempts.expires_at<=${timestamp} THEN 1 ELSE clown_cooldown_attempts.attempts+1 END,
    expires_at=excluded.expires_at
  RETURNING attempts`);

const firstCooldownAttempt = await cooldownAttempt(group, now, now + cooldown);
const secondCooldownAttempt = await cooldownAttempt(group, now + 1, now + cooldown);
const isolatedCooldownAttempt = await cooldownAttempt(otherGroup, now + 1, now + cooldown);
const resetCooldownAttempt = await cooldownAttempt(group, now + cooldown + 1, now + cooldown * 2);
if (firstCooldownAttempt[0].results[0].attempts !== 1 || secondCooldownAttempt[0].results[0].attempts !== 2)
  throw new Error("Repeated clown cooldown attempts did not reach the third-attempt threshold");
if (isolatedCooldownAttempt[0].results[0].attempts !== 1)
  throw new Error("Cooldown attempt counts leaked across group boundaries");
if (resetCooldownAttempt[0].results[0].attempts !== 1)
  throw new Error("Expired clown cooldown attempts were not reset");
await command(
  `DELETE FROM clown_cooldown_attempts WHERE voter_id='${voter}' AND group_id IN ('${group}','${otherGroup}')`,
);

/**
 * @param {Date} date
 * @param {string} timeZone
 * @returns {{ year: number, month: number, day: number, hour: number, minute: number, second: number }}
 */
function localDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values["year"]!,
    month: values["month"]!,
    day: values["day"]!,
    hour: values["hour"]!,
    minute: values["minute"]!,
    second: values["second"]!,
  };
}

/** @param {number} instant @param {string} timeZone @returns {number} */
function timezoneOffsetAt(instant, timeZone) {
  const parts = localDateParts(new Date(instant), timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return localAsUtc - instant;
}

/** @param {Date} date @param {string} timeZone @returns {{ start: number, end: number }} */
function dayBoundsInTimeZone(date, timeZone) {
  const parts = localDateParts(date, timeZone);
  const localMidnight = Date.UTC(parts.year, parts.month - 1, parts.day);
  const nextLocalMidnight = Date.UTC(parts.year, parts.month - 1, parts.day + 1);

  return {
    start: localMidnight - timezoneOffsetAt(localMidnight, timeZone),
    end: nextLocalMidnight - timezoneOffsetAt(nextLocalMidnight, timeZone),
  };
}

const timeZone = "Asia/Tehran";
const { start: dayStart, end: nextDayStart } = dayBoundsInTimeZone(new Date(now), timeZone);
const { end: followingDayStart } = dayBoundsInTimeZone(new Date(nextDayStart), timeZone);

/** @param {number} timestamp */
const dailyInsert = (timestamp) => {
  const { start, end } = dayBoundsInTimeZone(new Date(timestamp), timeZone);
  return `INSERT INTO clown_votes(group_id,voter_id,clown_id,voted_at,quantity)
    SELECT '${group}',NULL,'${clown}',${timestamp},5 WHERE NOT EXISTS (
      SELECT 1 FROM clown_votes WHERE group_id='${group}' AND voter_id IS NULL
        AND voted_at >= ${start} AND voted_at < ${end}
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

if ((await countDaily(dayStart, nextDayStart)) !== 1)
  throw new Error("Concurrent clown-of-the-day awards were not serialized");
await command(dailyInsert(nextDayStart));
if ((await countDaily(nextDayStart, followingDayStart)) !== 1)
  throw new Error("Clown-of-the-day did not reset at Tehran midnight");

const aggregate = await command(`SELECT users.name, coalesce(sum(clown_votes.quantity),0) AS count
  FROM clown_votes LEFT JOIN users ON users.id=clown_votes.clown_id
  WHERE clown_votes.group_id='${group}' GROUP BY users.id ORDER BY coalesce(sum(clown_votes.quantity),0) DESC`);
if (aggregate[0].results[0].count !== 12) throw new Error("Statistics aggregate returned an unexpected total");
await command(`UPDATE groups SET reset_at=${nextDayStart} WHERE id='${group}'`);
const resetAggregate = await command(`SELECT coalesce(sum(quantity),0) AS count FROM clown_votes
  WHERE group_id='${group}' AND voted_at >= ${nextDayStart}`);
if (resetAggregate[0].results[0].count !== 5) throw new Error("Statistics reset cutoff returned an unexpected total");

await command(`INSERT INTO clown_votes(voter_id,clown_id,group_id,voted_at,quantity)
  VALUES('${voter}','${clown}','${group}',${nextDayStart + 1_000},-2)`);
const personalAggregate = await command(`SELECT
    coalesce(sum(quantity),0) AS score,
    coalesce(sum(case when quantity > 0 then quantity else 0 end),0) AS received,
    coalesce(-sum(case when quantity < 0 then quantity else 0 end),0) AS removed
  FROM clown_votes
  WHERE group_id='${group}' AND clown_id='${clown}' AND voted_at >= ${nextDayStart}`);
const personalStats = personalAggregate[0].results[0];
if (personalStats.score !== 3 || personalStats.received !== 5 || personalStats.removed !== 2)
  throw new Error("Personal statistics did not match current group period and vote direction");

const positiveClowns = await command(`SELECT COUNT(*) AS total FROM (
  SELECT clown_votes.clown_id, sum(clown_votes.quantity) AS net_score
  FROM clown_votes INNER JOIN groups ON groups.id=clown_votes.group_id
  WHERE clown_votes.group_id='${group}' AND clown_votes.voted_at >= coalesce(groups.reset_at,0)
  GROUP BY clown_votes.group_id,clown_votes.clown_id HAVING sum(clown_votes.quantity)>0
)`);
if (positiveClowns[0].results[0].total !== 1)
  throw new Error("Current-period positive clown leaderboard returned an unexpected count");

await command(`UPDATE groups SET bot_member_status='active' WHERE id='${group}'`);
await command(`INSERT INTO bot_settings(key,value) VALUES('group_whitelist_enabled','enabled')
  ON CONFLICT(key) DO UPDATE SET value=excluded.value`);
await command(`INSERT OR REPLACE INTO allowed_groups(group_id) VALUES('${group}')`);
const membershipStatus = await command(`SELECT bot_member_status FROM groups WHERE id='${group}'`);
const whitelistMode = await command(`SELECT value FROM bot_settings WHERE key='group_whitelist_enabled'`);
const allowlistEntry = await command(`SELECT group_id FROM allowed_groups WHERE group_id='${group}'`);
if (membershipStatus[0].results[0].bot_member_status !== "active")
  throw new Error("Bot membership status was not persisted");
if (whitelistMode[0].results[0].value !== "enabled" || allowlistEntry[0].results[0].group_id !== group)
  throw new Error("Group whitelist settings were not persisted");
await command(`DELETE FROM allowed_groups WHERE group_id='${group}'`);
await command(`DELETE FROM bot_settings WHERE key='group_whitelist_enabled'`);
await command(`UPDATE groups SET bot_member_status=NULL WHERE id='${group}'`);

console.log(
  "D1 vote/daily-award concurrency, cooldown boundary, third-attempt strike counting/expiry/group isolation, UTC day boundary, group/personal/current-period statistics, membership tracking, whitelist persistence, and 64-bit text IDs passed.",
);
