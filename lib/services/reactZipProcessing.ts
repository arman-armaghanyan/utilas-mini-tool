import AdmZip from "adm-zip";
import { fetchZipFromBlob } from "./blobStorage";

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

export async function getZipFileEntryByUrl(url: string, requestedPath: string = "index.html"): Promise<ZipEntry | Record<string, never>> {
  console.log(`[React App] Fetching zip from URL: ${url}`);
  const zipFile = await fetchZipFromBlob(url);
  if (zipFile === undefined) {
    console.error(`[React App] Failed to fetch zip from URL: ${url}`);
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
