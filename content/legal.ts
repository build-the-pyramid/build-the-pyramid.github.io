import { integrations } from "@/config/integrations";
import type { SeoPageDefinition } from "@/config/types";

const services: string[] = [];
if (integrations.analytics.provider === "google-analytics") services.push("Google Analytics 4 is enabled to understand aggregate page usage. Google may process technical visit information under its own privacy terms.");
if (integrations.ads.provider === "adsterra-native") services.push("Adsterra Native advertising is enabled. Adsterra may process technical request information under its own privacy policy.");

function legal(slug: string, label: string, heading: string, lead: string, sections: SeoPageDefinition["sections"], relatedSlugs: string[]): SeoPageDefinition {
  return { enabled: true, slug, pageType: "legal", navLabel: label, title: `${heading} | Build the Pyramid! Guide`, description: lead, keywords: [], primaryKeyword: heading.toLowerCase(), secondaryKeywords: [], searchIntent: lead, priority: "P2", navVisible: false, hero: { heading, lead }, sections, relatedSlugs, lastReviewed: "2026-10-01" };
}

export const legalPages: SeoPageDefinition[] = [
  legal("about", "About", "About This Guide", "An independent fan-made guide for Build the Pyramid! on Roblox.", [
    { id: "about", heading: "A Guide for Players", paragraphs: ["This site helps players find codes, learn the building loop and understand upgrades, training, optional gamepasses and community links for Build the Pyramid!."] },
    { id: "independence", heading: "Independent Fan Guide", paragraphs: ["This is an independent fan-made guide for Build the Pyramid! on Roblox. It is not affiliated with Roblox or Janitors Studios."] },
    { id: "dates", heading: "Changing Game Information", paragraphs: ["Codes, rewards, pass prices and invites can change. Dated lists describe the information available at that date; the live game and Roblox checkout provide the current requirements and prices."] },
  ], ["copyright", "terms"]),
  legal("privacy", "Privacy", "Privacy Policy", "How this guide and its enabled services handle visitor information.", [
    { id: "data", heading: "Site Data", paragraphs: ["This static website does not provide accounts, comments or forms for storing visitor submissions. GitHub Pages hosts the site and may process technical request information under its own privacy practices."] },
    { id: "services", heading: "Third-Party Services", paragraphs: services.length ? services : ["No audience measurement or advertising service is currently enabled."] },
    { id: "external", heading: "External Links", paragraphs: ["Roblox and Discord links open other services. Their own terms and privacy practices apply when you use them. This guide does not ask for your account passwords."] },
    { id: "changes", heading: "Policy Changes", paragraphs: ["This page’s date reflects the latest review. Changes to the site’s measurement or advertising services will be reflected here."] },
  ], ["terms", "about"]),
  legal("terms", "Terms", "Terms of Use", "Terms for using this independent Build the Pyramid! guide.", [
    { id: "information", heading: "Information for Players", paragraphs: ["Guides are provided for general game information. Mechanics and offers may change after an update, so check the live game before relying on a reward, requirement or price."] },
    { id: "availability", heading: "Accuracy and Availability", paragraphs: ["We aim to provide useful, accurate information, but cannot guarantee uninterrupted availability or that every detail remains current. Roblox purchases and community access are governed by the relevant service’s terms."] },
    { id: "use", heading: "Acceptable Use", paragraphs: ["Do not interfere with access to this website or reproduce substantial original content without permission. Game names and media remain the property of their respective owners."] },
  ], ["privacy", "copyright"]),
  legal("copyright", "Copyright", "Copyright and Attribution", "Ownership and attribution for guide content, game names and media.", [
    { id: "content", heading: "Guide Content", paragraphs: ["Original explanations and page organization are protected unless a separate license applies."] },
    { id: "rights", heading: "Game and Platform Rights", paragraphs: ["Build the Pyramid! is a Roblox experience by Janitors Studios. Game names, logos and related media belong to their respective owners. Use in this fan guide does not imply endorsement."] },
  ], ["about", "terms"]),
];
