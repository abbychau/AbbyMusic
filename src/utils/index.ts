import type { FileEntry } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";

function extractFileName(fileUrl: string) {
  let pathParts = fileUrl.split("/");
  if (pathParts.length === 1) {
    pathParts = fileUrl.split("\\");
  }
  return pathParts[pathParts.length - 1];
}

const musicExtensions = ["mp3", "wav", "ogg", "flac", "m4a", "wma", "mid", "midi"];

function getFilesMusicMetas(files: FileEntry[]) {
  files = files.filter((file) => {
    //if file is a folder, skip
    if (file.children !== undefined) {
      return false;
    }
    const fileName = extractFileName(file.path);
    return musicExtensions.some((extension) => fileName.endsWith("." + extension));
  });

  const musicMetas = files.map((file) => {
    const fileUrl = convertFileSrc(file.path);
    const fileName = extractFileName(file.path);
    return {
      fileUrl,
      fileName,
    };
  }) as { fileUrl: string; fileName: string }[];
  return musicMetas;
}

export { extractFileName, getFilesMusicMetas, musicExtensions };
