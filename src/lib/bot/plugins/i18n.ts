import type { FluentVariable } from "@fluent/bundle";

import { FluentBundle, FluentResource } from "@fluent/bundle";

import type { BotContext } from "..";

import en from "../../../../locales/en.ftl";
import fa from "../../../../locales/fa.ftl";

export interface I18nFlavor {
  locale: "en" | "fa";
  t: (key: string, variables?: Record<string, FluentVariable>) => string;
}
const bundles = {
  fa: new FluentBundle("fa"),
  en: new FluentBundle("en"),
};
bundles.fa.addResource(new FluentResource(fa));
bundles.en.addResource(new FluentResource(en));

export function translate(locale: "en" | "fa", key: string, variables?: Record<string, FluentVariable>): string {
  const message = bundles[locale].getMessage(key);
  const text = message?.value ? bundles[locale].formatPattern(message.value, variables) : key;
  if (locale !== "fa") return text;

  const rightToLeftMark = "\u200f";
  return text
    .split("\n")
    .map((line) => `${rightToLeftMark}${line.replace(/^\u200f+/, "")}`)
    .join("\n");
}

export function i18nMiddleware() {
  return async (ctx: BotContext, next: () => Promise<void>) => {
    let saved: { locale: "en" | "fa" } | undefined;
    if (ctx.from) {
      try {
        saved = await ctx.db.query.userPreferences.findFirst({
          columns: { locale: true },
          where: (fields, operators) => operators.eq(fields.userId, String(ctx.from?.id)),
        });
      } catch (error) {
        const reason = error instanceof Error ? error.name : "UnknownError";
        console.warn(`Could not load language preference for update ${ctx.update.update_id} (${reason}); using the Telegram language.`);
      }
    }
    const locale = saved?.locale ?? (ctx.from?.language_code?.toLowerCase().startsWith("en") ? "en" : "fa");
    // Each update has its own context; the saved preference is only known after the awaited D1 lookup.
    // eslint-disable-next-line require-atomic-updates
    ctx.locale = locale;
    ctx.t = (key, variables) => translate(locale, key, variables);
    await next();
  };
}
