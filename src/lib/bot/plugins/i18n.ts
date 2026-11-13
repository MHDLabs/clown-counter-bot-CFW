import type { FluentVariable } from "@fluent/bundle";

import { FluentBundle, FluentResource } from "@fluent/bundle";

import type { BotContext } from "..";

import en from "../../../../locales/en.ftl";
import fa from "../../../../locales/fa.ftl";

export interface I18nFlavor {
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
  return message?.value ? bundles[locale].formatPattern(message.value, variables) : key;
}

export function i18nMiddleware() {
  return async (ctx: BotContext, next: () => Promise<void>) => {
    const locale = ctx.from?.language_code?.toLowerCase().startsWith("en") ? "en" : "fa";
    ctx.t = (key, variables) => translate(locale, key, variables);
    await next();
  };
}
