import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

const root = process.cwd();
const output = join(root, "out");
const publicDir = join(root, "public");

writeFileSync(join(output, ".nojekyll"), "", "utf8");

const customDomain = process.env.NEXT_PUBLIC_CUSTOM_DOMAIN?.trim();
if (customDomain) writeFileSync(join(output, "CNAME"), `${customDomain}\n`, "utf8");

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const absolute = join(directory, name);
    return statSync(absolute).isDirectory() ? walk(absolute) : [absolute];
  });
}

/** Ensure technical verification files from public/ are present at the build output root. */
function ensureTechnicalPublicFiles() {
  if (!existsSync(publicDir) || !existsSync(output)) return [];
  const copied = [];
  for (const absolute of walk(publicDir)) {
    const local = relative(publicDir, absolute).split(sep).join("/");
    const base = local.split("/").pop() || "";
    const technical = /^google[a-z0-9_-]*\.html$/i.test(base)
      || /^(robots\.txt|ads\.txt)$/i.test(base)
      || local.startsWith(".well-known/");
    if (!technical) continue;
    const target = join(output, local);
    mkdirSync(dirname(target), { recursive: true });
    if (!existsSync(target)) {
      copyFileSync(absolute, target);
      copied.push(local);
    }
  }
  return copied;
}

/** Keep the Google tag at the opening of each exported head for verification. */
function placeGoogleTagFirst() {
  for (const file of walk(output).filter((file) => file.endsWith(".html"))) {
    const original = readFileSync(file, "utf8");
    const result = original.replace(/<head>([\s\S]*?)<\/head>/, (head, contents) => {
      const loader = contents.match(/<script\b(?=[^>]*\bsrc="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+")[^>]*>[\s\S]*?<\/script>/);
      const setup = contents.match(/<script\b(?=[^>]*\bid="google-analytics")[^>]*>[\s\S]*?<\/script>/);
      if (!loader || !setup) return head;
      const rest = contents.replace(loader[0], "").replace(setup[0], "");
      return `<head><!-- Google tag (gtag.js) -->${loader[0]}${setup[0]}${rest}</head>`;
    });
    if (result !== original) writeFileSync(file, result, "utf8");
  }
}

placeGoogleTagFirst();

const ensured = ensureTechnicalPublicFiles();
console.log(
  customDomain
    ? `Static output prepared with CNAME ${customDomain}.`
    : "Static output prepared for GitHub Pages.",
);
if (ensured.length) {
  console.log(`Ensured technical public files in out/: ${ensured.join(", ")}`);
}
