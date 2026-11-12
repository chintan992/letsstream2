const fs = require("node:fs");
const path = require("node:path");

const assetsDir = path.join("dist", "assets");
const files = fs
  .readdirSync(assetsDir)
  .filter(file => file.endsWith(".js"))
  .map(file => {
    const bytes = fs.statSync(path.join(assetsDir, file)).size;
    return { file, bytes };
  })
  .sort((a, b) => b.bytes - a.bytes);

const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const report = {
  generatedAt: new Date().toISOString(),
  totalBytes,
  files,
};

fs.writeFileSync("bundle-size.json", JSON.stringify(report, null, 2));

console.log(
  `Total JavaScript: ${(totalBytes / 1024).toFixed(1)} KiB across ${files.length} files`
);
for (const file of files.slice(0, 10)) {
  console.log(
    `${(file.bytes / 1024).toFixed(1).padStart(8)} KiB  ${file.file}`
  );
}
