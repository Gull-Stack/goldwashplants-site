# Fix: goldwatchproject.com → goldwashplants.com migration redirects

## The problem
`goldwatchproject.com` (the old "Gold Watch Project" / GWP brand domain) 301-redirects
to goldwashplants.com — good — **but every old URL dumps onto the homepage**:

```
goldwatchproject.com/wash-plant-pricing  ->  goldwashplants.com/      (should be /products/)
goldwatchproject.com/m50                 ->  goldwashplants.com/      (should be /products/50-ton/)
goldwatchproject.com/blog                ->  goldwashplants.com/      (should be /blog/)
```

Google treats "redirect everything to the homepage" as soft 404s and passes **little or
no link equity** for those pages. The established GWP brand's backlinks are being wasted —
the likely reason an established brand still shows Authority Score 7. Fixing this is the
single highest-ROI SEO move available.

The redirect is configured in **Cloudflare** (the goldwatchproject.com zone — `server: cloudflare`),
NOT Vercel, so it must be fixed there.

## The fix — 1:1 redirect map

Old URLs recovered from the Wayback Machine, each mapped to its closest live equivalent
(all targets verified to exist — none redirect into a 404):

| Old (goldwatchproject.com) | New (goldwashplants.com) |
|---|---|
| /blog | /blog/ |
| /category/mining-knowledge | /blog/ |
| /gold-wash-plant-info | /how-it-works/ |
| /gold-wash-plant-maintenance-101-trouble-free-mining | /blog/gold-wash-plant-maintenance-tips/ |
| /mining-knowledge-101-what-we-have-learned | /blog/ |
| /tag/gold-mining | /blog/ |
| /tag/mining | /blog/ |
| /tag/trommel | /blog/gold-wash-plant-vs-trommel/ |
| /tag/wash-plant | /blog/ |
| /wash-plant-examples | /examples/ |
| /wash-plant-pricing | /products/ |
| /water-needs-for-gold-processing | /how-it-works/ |
| /contact, /contact.html | /contact/ |
| /examples, /examples.html | /examples/ |

Legacy paths with no better target (/about, /about-gwp, /index.html, /main, /main/*) can
keep going to the homepage — leave them to the existing catch-all rule. Junk paths
(/wp-admin/*, /cdn-cgi/*, /mail.php) need no redirect.

> If you have an Ahrefs/SEMrush backlink export for goldwatchproject.com, send it over and
> we can add any linked URL that isn't in this list. The Wayback inventory covers the
> pages that were publicly crawled.

## How to implement in Cloudflare (recommended: Bulk Redirects)

1. Cloudflare dashboard → **your account** (not a specific site) → **Bulk Redirects**.
2. **Create a Bulk Redirect List** → name it `gwp-migration` → **Upload** `goldwatchproject-redirects.csv` (in this folder). The columns map directly.
3. **Create a Bulk Redirect Rule** that deploys the list (Bulk Redirects → "Create Bulk Redirect Rule" → select `gwp-migration`).
4. The existing "everything → homepage" rule stays as the fallback for unmapped paths.
   Bulk Redirects run before zone Redirect Rules, so the specific maps take precedence —
   but **verify** (step below). If your existing rule wins instead, edit it to exclude the
   mapped paths, or move the maps into ordered **Redirect Rules** above the catch-all.

Free plan note: Bulk Redirects allow 20 URLs on Free — this list is 16, so it fits.

### Alternative: path-preserving catch-all
If you'd rather not manage a list, change the existing catch-all rule's target from the
static `https://goldwashplants.com/` to a **dynamic** expression:
`concat("https://goldwashplants.com", http.request.uri.path)`
This preserves the path for everything. Downside: old paths that don't exist on the new
site will 404, so the explicit 1:1 map above is safer.

## Verify after deploying

```
curl -sIL https://goldwatchproject.com/wash-plant-pricing -o /dev/null -w "%{url_effective}\n"
# expect: https://goldwashplants.com/products/   (NOT the homepage)

curl -sIL https://goldwatchproject.com/wash-plant-examples -o /dev/null -w "%{url_effective}\n"
# expect: https://goldwashplants.com/examples/

curl -sIL https://goldwatchproject.com/some-random-unmapped-path -o /dev/null -w "%{url_effective}\n"
# expect: https://goldwashplants.com/   (catch-all fallback — fine)
```

Then resubmit the new sitemap in Google Search Console and request re-indexing of the
homepage and /products/ to speed up re-crawl.
