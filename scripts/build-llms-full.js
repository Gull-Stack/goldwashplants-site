// Writes _site/llms-full.txt from the pages Eleventy just rendered — the long
// form of /llms.txt for answer engines. Generated from the built HTML so it can
// never say something a page does not. Runs after `eleventy` in `npm run build`.
const fs = require("fs");
const path = require("path");

const SITE = "https://goldwashplants.com";
const OUT = path.join(__dirname, "..", "_site");

const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, c) => {
  const map = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
  const l = c.toLowerCase();
  if (l.startsWith("#x")) return String.fromCodePoint(parseInt(l.slice(2), 16));
  if (l.startsWith("#")) return String.fromCodePoint(parseInt(l.slice(1), 10));
  return map[l] ?? m;
});

function textOf(html) {
  let m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  let body = m ? m[1] : html.replace(/<header\b[\s\S]*?<\/header>/i, "").replace(/<footer\b[\s\S]*?<\/footer>/i, "");
  body = body.replace(/<(script|style|nav|form|svg|noscript)\b[\s\S]*?<\/\1>/gi, " ");
  body = body.replace(/<(h[1-6])\b[^>]*>/gi, (_, h) => "\n\n" + "#".repeat(Number(h[1])) + " ");
  body = body.replace(/<summary\b[^>]*>/gi, "\n\n**Q: ").replace(/<\/summary>/gi, "**\n");
  body = body.replace(/<li\b[^>]*>/gi, "\n- ").replace(/<\/(p|li|h[1-6]|tr|div|section|article|details)>/gi, "\n");
  body = decode(body.replace(/<[^>]+>/g, " "));
  return body.replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function titleOf(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decode(m[1]).replace(/\s+/g, " ").trim() : "";
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === "index.html") acc.push(p);
  }
  return acc;
}

const wanted = [/^\/$/, /^\/how-it-works\/$/, /^\/compare\/$/, /^\/examples\/$/, /^\/faq\/$/, /^\/locations\//, /^\/blog\//, /^\/contact\/$/];
const pages = walk(OUT)
  .map((p) => ({ url: p.slice(OUT.length).replace(/index\.html$/, "").replace(/\\/g, "/"), file: p }))
  .filter((p) => wanted.some((re) => re.test(p.url)))
  .sort((a, b) => a.url.localeCompare(b.url));

const parts = [fs.readFileSync(path.join(OUT, "llms.txt"), "utf8").trim(), "", "---", "", "# Full page text", "", `Everything below is the text of the public pages at ${SITE}, in full. Each section names its page.`, ""];
for (const p of pages) {
  const html = fs.readFileSync(p.file, "utf8");
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) continue;
  parts.push(`\n## ${titleOf(html) || p.url}\nSource: ${SITE}${p.url}\n\n${textOf(html)}\n`);
}
fs.writeFileSync(path.join(OUT, "llms-full.txt"), parts.join("\n").replace(/\n{3,}/g, "\n\n") + "\n");
console.log(`llms-full.txt: ${pages.length} pages`);
