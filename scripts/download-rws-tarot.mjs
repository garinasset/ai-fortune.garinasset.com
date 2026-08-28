#!/usr/bin/env node
/**
 * 下载 Rider-Waite-Smith (1909) 公有领域牌面
 * 主来源：Wikimedia Commons (RWS1909 系列)
 * 备用：petaloverflow/tarot-api（同套 RWS 公版图，GitHub Pages）
 */

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../public/tarot");
const PROXY = process.env.http_proxy || process.env.HTTP_PROXY || "http://127.0.0.1:7890";
const UA = "ai-fortune-tarot-downloader/1.0 (local dev; garinasset)";
const MIN_BYTES = 10000;
const FALLBACK_BASE = "https://petaloverflow.github.io/tarot-api/cards";

const MAJOR_NAMES = [
  "00 Fool", "01 Magician", "02 High Priestess", "03 Empress", "04 Emperor",
  "05 Hierophant", "06 Lovers", "07 Chariot", "08 Strength", "09 Hermit",
  "10 Wheel of Fortune", "11 Justice", "12 Hanged Man", "13 Death", "14 Temperance",
  "15 Devil", "16 Tower", "17 Star", "18 Moon", "19 Sun", "20 Judgement", "21 World",
];

const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const SUIT_KEYS = ["wands", "cups", "swords", "pentacles"];
const SUIT_CODES = ["wa", "cu", "sw", "pe"];

function buildMap() {
  const map = {};
  MAJOR_NAMES.forEach((name, i) => {
    map[`major-${i}`] = {
      wiki: `RWS1909 - ${name}.jpeg`,
      fallback: `${FALLBACK_BASE}/ar${String(i).padStart(2, "0")}.jpg`,
    };
  });
  for (let s = 0; s < SUITS.length; s++) {
    for (let n = 1; n <= 14; n++) {
      map[`${SUIT_KEYS[s]}-${n}`] = {
        wiki: `RWS1909 - ${SUITS[s]} ${String(n).padStart(2, "0")}.jpeg`,
        fallback: `${FALLBACK_BASE}/${SUIT_CODES[s]}${String(n).padStart(2, "0")}.jpg`,
      };
    }
  }
  return map;
}

function curl(args) {
  return execFileSync("curl", ["-x", PROXY, "-sL", "-A", UA, ...args], {
    encoding: args.includes("-o") ? undefined : "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function sleep(sec) {
  execFileSync("sleep", [String(sec)]);
}

function resolveBatch(filenames) {
  const titles = filenames.map((f) => `File:${f}`).join("|");
  const params = new URLSearchParams({
    action: "query",
    titles,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
  });
  for (let attempt = 0; attempt < 5; attempt++) {
    const raw = curl(["--connect-timeout", "45", `https://commons.wikimedia.org/w/api.php?${params}`]);
    if (typeof raw === "string" && (raw.startsWith("You are") || raw.startsWith("<!"))) {
      sleep(8 + attempt * 3);
      continue;
    }
    const data = JSON.parse(raw);
    const out = {};
    for (const page of Object.values(data.query?.pages ?? {})) {
      const name = page.title?.replace(/^File:/, "");
      const url = page.imageinfo?.[0]?.url;
      if (name && url) out[name] = url;
    }
    return out;
  }
  return {};
}

function downloadUrl(url, dest) {
  curl(["--connect-timeout", "90", "--retry", "2", "--retry-delay", "3", url, "-o", dest]);
  if (!fs.existsSync(dest)) throw new Error("missing file");
  const size = fs.statSync(dest).size;
  if (size < MIN_BYTES) {
    const head = fs.readFileSync(dest, { encoding: "utf8", start: 0, end: 20 });
    fs.unlinkSync(dest);
    throw new Error(head.startsWith("<!") ? "HTML error page" : `too small (${size}b)`);
  }
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const map = buildMap();
  const entries = Object.entries(map);

  console.log("Resolving Wikimedia URLs…");
  const wikiFiles = entries.map(([, m]) => m.wiki);
  const urlMap = {};
  for (let i = 0; i < wikiFiles.length; i += 50) {
    Object.assign(urlMap, resolveBatch(wikiFiles.slice(i, i + 50)));
    if (i + 50 < wikiFiles.length) sleep(3);
  }

  let ok = 0;
  let wikiOk = 0;
  let fallbackOk = 0;

  for (const [id, meta] of entries) {
    const dest = path.join(OUT_DIR, `${id}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > MIN_BYTES) {
      console.log(`skip ${id}`);
      ok++;
      continue;
    }
    if (fs.existsSync(dest)) fs.unlinkSync(dest);

    process.stdout.write(`${id} … `);
    const wikiUrl = urlMap[meta.wiki];
    let source = "wiki";

    try {
      if (wikiUrl) {
        downloadUrl(wikiUrl, dest);
        wikiOk++;
      } else {
        throw new Error("no wiki URL");
      }
    } catch {
      try {
        downloadUrl(meta.fallback, dest);
        source = "fallback";
        fallbackOk++;
      } catch (e) {
        console.log(`FAIL (${e.message})`);
        continue;
      }
    }

    console.log(`OK [${source}]`);
    ok++;
    sleep(source === "wiki" ? 2 : 0.5);
  }

  console.log(`\nDone: ${ok}/${entries.length} (wiki: ${wikiOk}, fallback: ${fallbackOk})`);
  console.log(OUT_DIR);
  process.exit(ok < entries.length ? 1 : 0);
}

main();
