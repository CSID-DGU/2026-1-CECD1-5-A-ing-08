// 프로필 이미지를 업로드 전에 브라우저에서 줄인다.
// 가운데를 정사각형으로 잘라 256×256으로 만들고 WebP(미지원 브라우저는 JPEG)로 압축한다.
// 결과가 목표 용량을 넘으면 화질을 조금씩 낮춰 다시 압축한다.

export const PROFILE_IMAGE_SIZE = 256;
const TARGET_BYTES = 40 * 1024;
const MAX_BYTES = 100 * 1024; // 서버 제한과 동일
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 읽을 수 없어요.'));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function drawSquare(img: HTMLImageElement, fillWhite: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = PROFILE_IMAGE_SIZE;
  canvas.height = PROFILE_IMAGE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이미지를 처리할 수 없어요.');
  // JPEG는 투명 배경을 지원하지 않아 검게 나오므로 흰색으로 채운다.
  if (fillWhite) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PROFILE_IMAGE_SIZE, PROFILE_IMAGE_SIZE);
  }
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, PROFILE_IMAGE_SIZE, PROFILE_IMAGE_SIZE);
  return canvas;
}

export async function resizeProfileImage(file: File): Promise<Blob> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error('JPG, PNG, WebP 이미지만 올릴 수 있어요.');
  }
  const img = await loadImage(file);

  // WebP 인코딩을 지원하지 않는 브라우저(일부 Safari)는 toBlob이 PNG를 돌려준다. 그때는 JPEG를 쓴다.
  let canvas = drawSquare(img, false);
  const probe = await toBlob(canvas, 'image/webp', QUALITIES[0]);
  const type = probe?.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
  if (type === 'image/jpeg') canvas = drawSquare(img, true);

  let best: Blob | null = null;
  for (const q of QUALITIES) {
    const blob = type === 'image/webp' && q === QUALITIES[0] ? probe : await toBlob(canvas, type, q);
    if (!blob) break;
    best = blob;
    if (blob.size <= TARGET_BYTES) break;
  }
  if (!best || best.size > MAX_BYTES) {
    throw new Error('이미지를 충분히 줄이지 못했어요. 다른 이미지를 골라 주세요.');
  }
  return best;
}
