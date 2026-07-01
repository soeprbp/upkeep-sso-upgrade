import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

function splitParagraphs(xml) {
  const paragraphs = [];
  const regex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let match;
  while ((match = regex.exec(xml))) {
    const textRuns = [...match[1].matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(
      (entry) =>
        entry[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
    );
    const text = textRuns.join("").trim();
    if (text) {
      paragraphs.push(text);
    }
  }
  return paragraphs;
}

function detectPhaseBuckets(paragraphs) {
  const buckets = [];
  const headings = [
    "Planning & Prerequisites",
    "Technical Integration Setup",
    "Communications Plan & User Readiness",
    "Pilot Rollout",
    "Phased Full Rollout",
    "Final Cutover",
    "Training & Support",
    "Risk Mitigation & Best Practices"
  ];

  for (const heading of headings) {
    const idx = paragraphs.findIndex((line) =>
      line.toLowerCase().includes(heading.toLowerCase())
    );
    if (idx !== -1) {
      const end = headings
        .map((candidate) =>
          candidate === heading
            ? -1
            : paragraphs.findIndex((line) =>
                line.toLowerCase().includes(candidate.toLowerCase())
              )
        )
        .filter((value) => value > idx)
        .sort((a, b) => a - b)[0];
      buckets.push({
        heading,
        lines: paragraphs.slice(idx, end === undefined ? paragraphs.length : end)
      });
    }
  }

  return buckets;
}

async function main() {
  const input = process.argv[2];
  const output = process.argv[3];

  if (!input) {
    throw new Error("Usage: npm run extract:plan -- <docx-path> [output.json]");
  }

  const docxPath = path.resolve(input);
  const buffer = await fs.readFile(docxPath);
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file("word/document.xml")?.async("string");

  if (!documentXml) {
    throw new Error("Could not find word/document.xml in the provided .docx file");
  }

  const paragraphs = splitParagraphs(documentXml);
  const buckets = detectPhaseBuckets(paragraphs);
  const payload = {
    source: path.basename(docxPath),
    paragraphCount: paragraphs.length,
    extractedAt: new Date().toISOString(),
    paragraphs,
    phaseBuckets: buckets
  };

  if (output) {
    await fs.writeFile(path.resolve(output), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  } else {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
