#!/bin/bash
# Generate sitemap.xml from all HTML files
# Outputs extensionless URLs (Vercel clean URLs)
# Usage: ./generate-sitemap.sh

DOMAIN="https://www.goldwashplants.com"
TODAY=$(date +%Y-%m-%d)
OUTPUT="sitemap.xml"

cat > "$OUTPUT" << 'HEADER'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
HEADER

# Priority mapping
get_priority() {
  case "$1" in
    "") echo "1.0" ;;                    # index (homepage)
    products/*|pricing/*|wash-plant-pricing/*) echo "0.9" ;;
    contact/*) echo "0.9" ;;
    how-it-works|compare|faq|examples) echo "0.8" ;;
    blog/index) echo "0.7" ;;
    blog/*) echo "0.8" ;;
    locations/*) echo "0.7" ;;
    privacy|terms) echo "0.3" ;;
    *) echo "0.5" ;;
  esac
}

get_changefreq() {
  case "$1" in
    "") echo "weekly" ;;
    blog/index) echo "weekly" ;;
    blog/*) echo "monthly" ;;
    privacy|terms) echo "yearly" ;;
    *) echo "monthly" ;;
  esac
}

find . -name "*.html" -not -path "./.git/*" -not -path "./.vercel/*" | sort | while read -r file; do
  # Strip leading ./ and .html
  path="${file#./}"
  path="${path%.html}"
  
  # index.html in subdirs → just the dir path
  if [[ "$path" == */index ]]; then
    path="${path%/index}"
  elif [[ "$path" == "index" ]]; then
    path=""
  fi

  url="${DOMAIN}/${path}"
  # Clean trailing slash for homepage
  [[ "$path" == "" ]] && url="${DOMAIN}/"

  priority=$(get_priority "$path")
  changefreq=$(get_changefreq "$path")
  lastmod="$TODAY"

  cat >> "$OUTPUT" << ENTRY
  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority><changefreq>${changefreq}</changefreq></url>
ENTRY
done

echo "</urlset>" >> "$OUTPUT"
echo "✅ Generated $OUTPUT with $(grep -c '<url>' "$OUTPUT") URLs"
