const IMAGE_BUCKET = "reflection-images";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_IMAGE_COUNT = 6;

function getExtension(file) {
  const fromName = file.name?.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  const fromType = file.type?.split("/").pop()?.toLowerCase();
  return fromType && /^[a-z0-9]+$/.test(fromType) ? fromType : "png";
}

export async function ensureImageBucket(supabase) {
  const { error } = await supabase.storage.createBucket(IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_SIZE,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"]
  });

  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

export function getImagePaths(imageUrls) {
  return (imageUrls || [])
    .map((url) => {
      try {
        const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
        const index = url.indexOf(marker);
        return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export async function uploadReflectionImages(supabase, files) {
  const imageUrls = [];

  if (!files.length) {
    return imageUrls;
  }

  if (files.length > MAX_IMAGE_COUNT) {
    throw new Error(`一次最多上传 ${MAX_IMAGE_COUNT} 张图片。`);
  }

  await ensureImageBucket(supabase);

  for (const file of files) {
    if (!file.type?.startsWith("image/")) {
      throw new Error("只能上传图片文件。");
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("单张图片不能超过 8MB。");
    }

    const extension = getExtension(file);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const bytes = await file.arrayBuffer();

    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, bytes, {
      contentType: file.type,
      upsert: false
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }

  return imageUrls;
}

export { IMAGE_BUCKET, MAX_IMAGE_COUNT };
