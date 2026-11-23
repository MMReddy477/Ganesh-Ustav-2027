import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { zipSync } from "fflate";

const imageDirectory = join(process.cwd(), "public", "images");
const downloadDirectory = join(process.cwd(), "public", "downloads");
const manifestPath = join(process.cwd(), "lib", "intro-sequence.generated.ts");
const archivePath = join(downloadDirectory, "ganesh-utsav-intro-frames.zip");
const framePattern = /^intro-sequence-(\d+)\.(?:png|jpe?g|webp|avif)$/i;

const entries = await readdir(imageDirectory, { withFileTypes: true });
const frames = entries.flatMap((entry) => {
  if (!entry.isFile()) return [];
  const match = framePattern.exec(entry.name);
  return match ? [{ fileName: entry.name, order: Number(match[1]) }] : [];
});
frames.sort((first, second) => first.order - second.order || first.fileName.localeCompare(second.fileName));

if (!frames.length) {
  throw new Error("No intro frames found. Add intro-sequence-<number>.webp, .png, .jpg, .jpeg, or .avif files to public/images.");
}

const introSequenceFrames = frames.map(({ fileName }) => ({
  fileName,
  src: `/images/${encodeURIComponent(fileName)}`,
}));
const manifest = [
  "type IntroSequenceFrame = { fileName: string; src: string };",
  `export const introSequenceFrames: IntroSequenceFrame[] = ${JSON.stringify(introSequenceFrames, null, 2)};`,
  "",
].join("\n");
const zipEntries = Object.fromEntries(
  await Promise.all(
    frames.map(async ({ fileName }) => [
      fileName,
      await readFile(join(imageDirectory, fileName)),
    ]),
  ),
);

await mkdir(downloadDirectory, { recursive: true });
await Promise.all([
  writeFile(manifestPath, manifest),
  writeFile(archivePath, zipSync(zipEntries, { level: 6 })),
]);

console.log(`Prepared ${frames.length} intro frames and the ZIP download.`);
