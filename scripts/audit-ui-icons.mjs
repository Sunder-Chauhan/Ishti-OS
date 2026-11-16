import fs from "fs";
import path from "path";

// Regex covering all Unicode emoji blocks
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk("apps/web/app");
let found = 0;
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (emojiRegex.test(line)) {
      console.log(`EMOJI at ${file}:${idx + 1}: ${line.trim()}`);
      found++;
    }
  });
}

console.log("==============================================================================");
console.log(`EMOJI SCAN COMPLETE: ${found} UI emoji(s) found in apps/web/app`);
console.log("==============================================================================");
process.exit(found === 0 ? 0 : 1);
