module.exports = function(eleventyConfig) {
  // Copy static assets to output directory
  eleventyConfig.addPassthroughCopy({"images": "images"});
  eleventyConfig.addPassthroughCopy({"js": "js"});
  eleventyConfig.addPassthroughCopy({"styles.css": "styles.css"});
  eleventyConfig.addPassthroughCopy({"robots.txt": "robots.txt"});
  eleventyConfig.addPassthroughCopy({"video-sitemap.xml": "video-sitemap.xml"});
  eleventyConfig.addPassthroughCopy({"favicon.ico": "favicon.ico"});
  eleventyConfig.addPassthroughCopy({"vercel.json": "vercel.json"});
  
  // Copy api directory (Vercel serverless functions) as-is
  eleventyConfig.addPassthroughCopy({"api": "api"});

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