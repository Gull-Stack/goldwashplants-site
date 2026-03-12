module.exports = function(eleventyConfig) {
  // Copy static assets to output directory
  eleventyConfig.addPassthroughCopy({"images": "images"});
  eleventyConfig.addPassthroughCopy({"js": "js"});
  eleventyConfig.addPassthroughCopy({"styles.css": "styles.css"});
  eleventyConfig.addPassthroughCopy({"robots.txt": "robots.txt"});
  eleventyConfig.addPassthroughCopy({"sitemap.xml": "sitemap.xml"});
  eleventyConfig.addPassthroughCopy({"video-sitemap.xml": "video-sitemap.xml"});
  eleventyConfig.addPassthroughCopy({"favicon.ico": "favicon.ico"});
  eleventyConfig.addPassthroughCopy({"vercel.json": "vercel.json"});
  
  // Copy api directory (Vercel serverless functions) as-is
  eleventyConfig.addPassthroughCopy({"api": "api"});
  
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