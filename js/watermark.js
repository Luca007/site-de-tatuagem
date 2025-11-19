export async function addWatermark(file, text = 'PREVIEW – © Tattooer') {
  const image = await loadImage(file);
  const { canvas, ctx } = prepareCanvas(image);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  paintPattern(ctx, canvas, text);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  return new File([blob], stampedName(file.name), { type: 'image/jpeg' });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function prepareCanvas(image) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(1600 / image.width, 1600 / image.height, 1);
  canvas.width = Math.floor(image.width * scale);
  canvas.height = Math.floor(image.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

function paintPattern(ctx, canvas, text) {
  const fontSize = Math.floor(canvas.width * 0.05);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#fff';
  const step = Math.floor(fontSize * 3);
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = -canvas.width; x < canvas.width * 2; x += step) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

function stampedName(name) {
  const base = name.replace(/\.[^.]+$/, '');
  return `${base}_wm.jpg`;
}
