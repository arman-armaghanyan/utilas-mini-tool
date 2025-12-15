import { promises as fs } from "fs";
import AdmZip from "adm-zip";
import path from "path";

interface ZipEntry {
  entryName: string;
  isDirectory: boolean;
  getData(): Buffer;
}

interface NormalizedEntry {
  entry: ZipEntry;
  name: string;
}

export function getZipFileEntryByBuffer(buffer: Buffer): ZipEntry[] {
  const zip = new AdmZip(buffer);
  return zip.getEntries();
}

async function readZipFile(filePath: string): Promise<Buffer | undefined> {
  try {
    const zipBuffer = await fs.readFile(filePath);
    return zipBuffer;
  } catch (error) {
    console.error(`[React App] Error reading zip file from disk:`, error);
    console.error(`[React App] File path: ${filePath}`);
    return undefined;
  }
}

async function getEntriesAsync(zipFile: Buffer): Promise<ZipEntry[] | undefined> {
  let zip: AdmZip;
  try {
    zip = new AdmZip(zipFile);
  } catch (error) {
    console.error(`[React App] Error creating zip from buffer:`, error);
    return undefined;
  }

  const entries = zip.getEntries();
  console.log(`[React App] Zip has ${entries.length} entries`);
  if (entries.length > 0) {
    console.log(`[React App] First few entries:`, entries.slice(0, 5).map(e => e.entryName));
  }
  return entries;
}

function getNormalizedEntries(entries: ZipEntry[]): NormalizedEntry[] {
  return entries
    .filter(entry => !entry.isDirectory
      && !entry.entryName.includes('__MACOSX')
      && !entry.entryName.includes('.DS_Store'))
    .map(entry => {
      let name = entry.entryName.replace(/\\/g, "/");
      // Strip common folder prefixes (dist/, build/, etc.)
      if (name.startsWith("dist/")) {
        name = name.substring(5); // Remove "dist/" prefix
      } else if (name.startsWith("build/")) {
        name = name.substring(6); // Remove "build/" prefix
      }
      return { entry, name };
    });
}

function findEntryFile(normalizedEntries: NormalizedEntry[], normalizedPath: string): ZipEntry | undefined {
  let fileEntry = normalizedEntries.find(
    ({ name }) => name === normalizedPath
  )?.entry;

  // If not found, try as directory with index.html
  if (!fileEntry && !normalizedPath.includes(".")) {
    fileEntry = normalizedEntries.find(
      ({ name }) => name === `${normalizedPath}/index.html` || name === `${normalizedPath}index.html`
    )?.entry;
  }

  // If still not found and path is empty or looks like a route, serve index.html (React Router support)
  if (!fileEntry && (normalizedPath === "index.html" || !normalizedPath.includes("."))) {
    fileEntry = normalizedEntries.find(
      ({ name }) => name === "index.html" || name.endsWith("/index.html")
    )?.entry;
  }

  if (!fileEntry || fileEntry.isDirectory) {
    console.error(`File not found: ${normalizedPath}. Available entries:`, normalizedEntries.map(e => e.name).slice(0, 10));
    return undefined;
  }
  return fileEntry;
}

export async function getZipFileEntryByPath(filePath: string, requestedPath: string = "index.html"): Promise<ZipEntry | Record<string, never>> {
  const zipFile = await readZipFile(filePath);
  if (zipFile === undefined) {
    return {};
  }

  const entries = await getEntriesAsync(zipFile);
  if (entries === undefined) {
    return {};
  }

  const normalizedEntries = getNormalizedEntries(entries);
  console.log(`[React App] Normalized entries (first 5):`, normalizedEntries.slice(0, 5).map(e => e.name));
  console.log(`[React App] Looking for file: ${requestedPath}`);

  const fileEntry = findEntryFile(normalizedEntries, requestedPath);
  if (fileEntry === undefined) {
    return {};
  }
  return fileEntry;
}

export async function storeZipFileOnDiskAsync(toolId: string, buffer: Buffer, bufferLength: number): Promise<string> {
  const storageDir = path.join(process.cwd(), "storage", "react-apps");
  await fs.mkdir(storageDir, { recursive: true });

  const zipFileName = `${toolId}-${Date.now()}.zip`;
  const zipFilePath = path.join(storageDir, zipFileName);

  console.log(`[Upload] Saving zip file to: ${zipFilePath}`);
  console.log(`[Upload] Buffer size: ${bufferLength} bytes`);

  await fs.writeFile(zipFilePath, buffer);
  return zipFilePath;
}

export async function deletZilpFileAsync(filePath: string): Promise<void> {
  await fs.unlink(filePath);
}

