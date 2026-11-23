export const TIME_ZONE = "Asia/Tehran";

const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

function partsAt(date: Date, timeZone: string): Record<string, number> {
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

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

function offsetAt(instant: number, timeZone: string): number {
  const parts = partsAt(new Date(instant), timeZone);
  const localAsUtc = Date.UTC(
    parts["year"]!,
    parts["month"]! - 1,
    parts["day"]!,
    parts["hour"]!,
    parts["minute"]!,
    parts["second"]!,
  );
  return localAsUtc - instant;
}

export function dayBoundsInTimeZone(date = new Date(), timeZone = TIME_ZONE): { start: number; end: number } {
  const local = partsAt(date, timeZone);
  const localMidnight = Date.UTC(local["year"]!, local["month"]! - 1, local["day"]!);
  const nextLocalMidnight = Date.UTC(local["year"]!, local["month"]! - 1, local["day"]! + 1);

  return {
    start: localMidnight - offsetAt(localMidnight, timeZone),
    end: nextLocalMidnight - offsetAt(nextLocalMidnight, timeZone),
  };
}

export function localizeDate(date: Date): string {
  return dateFormatter.format(date);
}
