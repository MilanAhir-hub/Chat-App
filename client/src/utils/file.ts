export const MAX_UPLOAD_BYTES = 2000000;

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read this file.'));
    reader.readAsDataURL(file);
  });

export const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
};
