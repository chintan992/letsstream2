#!/usr/bin/env node
/**
 * Generates a local development certificate authority plus a `localhost` leaf
 * certificate, and prints how to trust them.
 *
 * Why not @vitejs/plugin-basic-ssl: that plugin mints a brand-new self-signed
 * certificate every 30 days, so every browser reports
 * NET::ERR_CERT_AUTHORITY_INVALID and any trust you granted stops matching.
 * A stable local CA fixes it once; rotating the leaf later does not need a new
 * trust decision.
 *
 * Usage: node scripts/gen-dev-cert.mjs [extra.host.name ...]
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import path from "node:path";

const outDir = path.join(process.cwd(), ".certs");
const caKey = path.join(outDir, "dev-ca.key");
const caCrt = path.join(outDir, "dev-ca.crt");
const leafKey = path.join(outDir, "localhost.key");
const leafCrt = path.join(outDir, "localhost.crt");

const run = args =>
  execFileSync("openssl", args, { stdio: ["ignore", "pipe", "inherit"] });

const localAddresses = () =>
  Object.values(networkInterfaces())
    .flat()
    .filter(entry => entry && entry.family === "IPv4" && !entry.internal)
    .map(entry => entry.address);

const extraHosts = process.argv.slice(2);
const sanEntries = [
  "DNS:localhost",
  "IP:127.0.0.1",
  "IP:::1",
  ...[...new Set(localAddresses())].map(ip => `IP:${ip}`),
  ...extraHosts.map(host => (host.includes(":") ? host : `DNS:${host}`)),
].join(",");

mkdirSync(outDir, { recursive: true });

if (!existsSync(caKey) || !existsSync(caCrt)) {
  console.log("Generating local development CA (10 years)...");
  run([
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    caKey,
    "-out",
    caCrt,
    "-days",
    "3650",
    "-subj",
    "/CN=Lets Stream Local Dev CA/O=Lets Stream/OU=Development",
    "-addext",
    "basicConstraints=critical,CA:TRUE,pathlen:0",
    "-addext",
    "keyUsage=critical,keyCertSign,cRLSign",
  ]);
} else {
  console.log("Local development CA already present.");
}

const leafIsFresh = () => {
  if (!existsSync(leafKey) || !existsSync(leafCrt)) return false;
  try {
    run([
      "x509",
      "-in",
      leafCrt,
      "-noout",
      "-checkend",
      String(60 * 60 * 24 * 30),
    ]);
    return true;
  } catch {
    return false;
  }
};

if (!leafIsFresh()) {
  console.log("Issuing localhost certificate (825 days)...");
  const csr = path.join(outDir, "localhost.csr");
  const extFile = path.join(outDir, "localhost.ext");

  run([
    "req",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    leafKey,
    "-out",
    csr,
    "-subj",
    "/CN=localhost/O=Lets Stream/OU=Development",
  ]);

  writeFileSync(
    extFile,
    [
      "basicConstraints=critical,CA:FALSE",
      "keyUsage=critical,digitalSignature,keyEncipherment",
      "extendedKeyUsage=serverAuth",
      `subjectAltName=${sanEntries}`,
      "",
    ].join("\n")
  );

  run([
    "x509",
    "-req",
    "-in",
    csr,
    "-CA",
    caCrt,
    "-CAkey",
    caKey,
    "-CAcreateserial",
    "-out",
    leafCrt,
    "-days",
    "825",
    "-sha256",
    "-extfile",
    extFile,
  ]);
} else {
  console.log("Localhost certificate already fresh.");
}

// Browsers need the full chain for the leaf.
const chain = readFileSync(leafCrt, "utf8") + readFileSync(caCrt, "utf8");
writeFileSync(path.join(outDir, "localhost.chain.crt"), chain);

console.log(`\nCertificates in ${outDir}`);
console.log(`  hosts: ${sanEntries}`);
console.log("\nTrust the CA once (then restart the browser):");
console.log(`  Windows:  certutil -addstore -user Root "${caCrt}"`);
console.log(
  `  macOS:    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${caCrt}"`
);
console.log(
  "  Linux:    copy to /usr/local/share/ca-certificates/ and run update-ca-certificates"
);
console.log("\nRemove it later:");
console.log(`  Windows:  certutil -delstore -user Root "${caCrt}"`);
