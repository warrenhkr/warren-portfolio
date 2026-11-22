export type Lang = "fr" | "en";
export type L = { fr: string; en: string };
export type Category = "hardware" | "software";
export const l = (fr: string, en: string): L => ({ fr, en });
