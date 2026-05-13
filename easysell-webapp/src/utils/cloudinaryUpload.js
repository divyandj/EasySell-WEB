export async function uploadImageToCloudinary(file, uploadPreset = 'easysell_unsigned') {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', uploadPreset);

  const res = await fetch('https://api.cloudinary.com/v1_1/dqplhh4y3/image/upload', {
    method: 'POST',
    body: data,
  });

  const json = await res.json();
  if (json.secure_url) return json.secure_url;
  throw new Error(json.error?.message || 'Image upload failed');
}
