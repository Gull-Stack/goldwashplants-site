// Refresh the SEO numbers in src/_data/hq.js from the SEMrush API.
//
//   SEMRUSH_API_KEY=xxx node scripts/seo-sync.mjs
//
// Prints a ready-to-paste `seo` block. Deliberately does not rewrite the
// data file automatically — the roadmap prose is hand-written and reads
// against these numbers, so a human should look before pasting.
//
// Cost: ~10 API units for the overview, ~10 per keyword row returned.

const KEY = process.env.SEMRUSH_API_KEY;
if (!KEY) {
  console.error("SEMRUSH_API_KEY not set (SEMrush → Profile → API units).");
  process.exit(1);
}

const DOMAIN = "goldwashplants.com";
const DB = "us";

async function api(base, params) {
  const res = await fetch(base + "?" + new URLSearchParams({ key: KEY, ...params }));
  const text = (await res.text()).trim();
  if (text.startsWith("ERROR")) {
    if (text.includes("NOTHING FOUND")) return [];
    throw new Error(text);
  }
  const [header, ...rows] = text.split("\n");
  const cols = header.split(";");
  return rows.map(r => Object.fromEntries(r.split(";").map((v, i) => [cols[i], v])));
}

const [ranks] = await api("https://api.semrush.com/", {
  type: "domain_ranks", domain: DOMAIN, database: DB,
  export_columns: "Dn,Rk,Or,Ot,Oc",
});

const [links] = await api("https://api.semrush.com/analytics/v1/", {
  type: "backlinks_overview", target: DOMAIN, target_type: "root_domain",
  export_columns: "ascore,total,domains_num,follows_num",
});

const organic = await api("https://api.semrush.com/", {
  type: "domain_organic", domain: DOMAIN, database: DB,
  display_limit: "60", display_sort: "tr_desc",
  export_columns: "Ph,Po,Pp,Nq,Cp,Ur,Tr,Kd",
});

const rel = u => (u || "").replace(`https://${DOMAIN}`, "") || "/";
const num = v => Number(v) || 0;

// Same phrase on more than one URL = Google splitting the signal.
const byPhrase = new Map();
for (const r of organic) {
  const p = r.Keyword;
  if (!byPhrase.has(p)) byPhrase.set(p, []);
  byPhrase.get(p).push({ pos: num(r.Position), url: rel(r.Url) });
}
const cannibal = [...byPhrase.entries()]
  .filter(([, rows]) => rows.length > 1)
  .map(([kw, rows]) => {
    rows.sort((a, b) => a.pos - b.pos);
    return { kw, urls: rows.length, positions: rows.map(r => r.pos), keep: rows[0].url };
  })
  .sort((a, b) => b.urls - a.urls);

const seen = new Set();
const top = organic
  .filter(r => num(r["Traffic (%)"]) > 0)
  .filter(r => !seen.has(r.Keyword) && seen.add(r.Keyword))
  .map(r => ({ kw: r.Keyword, pos: num(r.Position), vol: num(r["Search Volume"]),
               kd: num(r["Keyword Difficulty"]), url: rel(r.Url) }));

const striking = organic
  .filter(r => num(r.Position) > 10 && num(r.Position) <= 40)
  .filter(r => !seen.has(r.Keyword) && seen.add(r.Keyword))
  .map(r => ({ kw: r.Keyword, pos: num(r.Position), vol: num(r["Search Volume"]),
               kd: num(r["Keyword Difficulty"]) }))
  .sort((a, b) => b.vol - a.vol);

const moved = organic.filter(r => r.Position !== r["Previous Position"]).length;

console.log(`// pulled ${new Date().toISOString().slice(0, 10)}`);
console.log(`// Authority ${links.ascore} · ${ranks["Organic Keywords"]} keywords · ` +
            `${ranks["Organic Traffic"]} traffic/mo · ${links.domains_num} ref domains`);
console.log(`// ${moved} of ${organic.length} tracked positions moved since last check\n`);
console.log(JSON.stringify({
  overview: [
    { label: "Authority Score", value: links.ascore, note: "scale 0-100" },
    { label: "Organic keywords", value: ranks["Organic Keywords"], note: "terms ranking in Google top 100" },
    { label: "Monthly organic traffic", value: ranks["Organic Traffic"], note: "estimated visits/mo from search" },
    { label: "Referring domains", value: links.domains_num, note: `${links.total} total backlinks · ${links.follows_num} follow` },
  ],
  keywords: top.slice(0, 12),
  strikingDistance: striking.slice(0, 8),
  cannibalization: cannibal.slice(0, 6),
}, null, 2));
