module.exports = function(eleventyConfig) {
  // Copy static assets to output directory
  eleventyConfig.addPassthroughCopy({"images": "images"});
  eleventyConfig.addPassthroughCopy({"js": "js"});
  eleventyConfig.addPassthroughCopy({"styles.css": "styles.css"});
  eleventyConfig.addPassthroughCopy({"robots.txt": "robots.txt"});
  eleventyConfig.addPassthroughCopy("src/brand-facts.json");
  eleventyConfig.addPassthroughCopy("src/.well-known");
  eleventyConfig.addPassthroughCopy("src/llms.txt");
  eleventyConfig.addPassthroughCopy({"video-sitemap.xml": "video-sitemap.xml"});
  eleventyConfig.addPassthroughCopy({"favicon.ico": "favicon.ico"});
  eleventyConfig.addPassthroughCopy({"vercel.json": "vercel.json"});
  
  // Copy api directory (Vercel serverless functions) as-is
  eleventyConfig.addPassthroughCopy({"api": "api"});

  // BreadcrumbList JSON-LD for an inner page, from its URL. Home is always
  // first; the last crumb takes the page title, the ones between take their
  // URL segment title-cased. A JS filter because Nunjucks cannot carry a
  // variable across loop iterations.
  eleventyConfig.addFilter("breadcrumbs", function(url, title) {
    var parts = String(url || "").split("/").filter(Boolean);
    var items = [{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://goldwashplants.com/" }];
    var path = "";
    parts.forEach(function(part, i) {
      path += "/" + part;
      var last = i === parts.length - 1;
      var name = last && title ? String(title).split("|")[0].trim() : part.replace(/-/g, " ").replace(/\b\w/g, function(c) { return c.toUpperCase(); });
      items.push({ "@type": "ListItem", "position": i + 2, "name": name, "item": "https://goldwashplants.com" + path + "/" });
    });
    return JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items });
  });

  // Human-readable date filter (e.g. "March 2, 2026") for blog post bylines
  eleventyConfig.addFilter("readableDate", function(value) {
    if (!value) return "";
    var d = new Date(value + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  });

  // ISO date (YYYY-MM-DD) for sitemap <lastmod>
  eleventyConfig.addFilter("htmlDate", function(value) {
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) d = new Date();
    return d.toISOString().slice(0, 10);
  });

  // Configure input and output directories
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};