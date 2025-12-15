import sharp from 'sharp';


function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  return [
    pad(date.getDate()),
    pad(date.getMonth() + 1),
    date.getFullYear(),
  ].join('.') + ' ' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('.');
}

export async function readExifText(
  fullPath: string,
): Promise<string | null> {
  try {
    const meta = await sharp(fullPath).metadata();

    const exif = meta.exif;
    if (!exif) return null;

    // sharp кладёт EXIF в бинарь — читаем через exif-reader
    const exifReader = (await import('exif-reader')).default;
    const data = exifReader(exif);


    const date =
      data.Photo?.DateTimeOriginal ||
      data.Photo?.CreateDate;

    const model = data.Image?.Model;
    const make = data.Image?.Make;
    const camera = `${make} ${model}`;

    const focal = data.Photo?.FocalLength;
    const aperture = data.Photo?.FNumber;
    const shutter = data.Photo?.ExposureTime;
    const iso = data.Photo?.ISOSpeedRatings;

    if (!date && !model) return null;

    const parts: string[] = [];

    if (date) {
      parts.push(date instanceof Date && !isNaN(date.getTime()) ? formatDate(date) : String(date));
    }
    parts.push('\n');

    if (camera) parts.push(`${camera}`);
    if (focal) parts.push(`${focal}mm`);
    parts.push('\n');
    if (aperture) parts.push(`f/${aperture}`);
    if (shutter) {
      parts.push(
        shutter < 1
          ? `1/${Math.round(1 / shutter)}`
          : `${shutter}s`,
      );
    }
    if (iso) parts.push(`ISO ${iso}`);

    return parts
      .join(' ')
      .split('\n')
      .map(line => line.trim())
      .join('\n');
  } catch {
    return null;
  }
}
