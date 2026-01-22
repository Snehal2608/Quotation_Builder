export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    // 🔒 Size limit (200 KB)
    if (file.size > 200 * 1024) {
      return reject("Image must be under 200KB");
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // data:image/...base64
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
