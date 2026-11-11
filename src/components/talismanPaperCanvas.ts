import { ImageSourcePropType } from 'react-native';
import { Asset } from 'expo-asset';

/**
 * 웹 전용: 부적 종이를 html2canvas 없이 캔버스에 직접 그린다.
 * html2canvas는 배경 그림을 화면 크기(263px)로 줄였다가 늘려 흐려지고,
 * 사파리에서는 큰 한자를 복제 DOM에서 다시 재다 작게 · 잘리게 그렸다.
 * 위치 · 글자 크기는 TalismanPaper(View 버전)와 같은 수치를 쓴다 (단위: 화면 px).
 */

export interface PaperText {
  text: string;
  top: number;
  color: string;
  size: number;
  weight: '500' | '600' | '700';
  letterSpacing: number;
  lineHeight: number;
  /** 넘치면 줄일 수 있는 가장 작은 크기 (없으면 말줄임) */
  minSize?: number;
}

export interface PaperDrawing {
  bg: ImageSourcePropType;
  date: PaperText;
  hanja: { text: string; color: string; top: number };
  lines: PaperText[];
  chip?: { text: string; color: string; top: number };
}

export const CANVAS_W = 1080;
const PAPER_W = 263, PAPER_H = 412, RADIUS = 32;
const SIDE = 16; // 글줄 · 칩의 좌우 여백
const CHARM = { left: 57, width: 149, height: 115 };
const FONT = "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

const font = (weight: string, size: number) => `${weight} ${size}px ${FONT}`;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 글자 사이 간격을 넣은 폭 — CSS처럼 마지막 글자 뒤에도 간격이 붙는다 */
function measure(ctx: CanvasRenderingContext2D, text: string, ls: number) {
  return Array.from(text).reduce((w, ch) => w + ctx.measureText(ch).width + ls, 0);
}

/** 줄 높이 안에서 CSS처럼 글자 상자를 가운데 두는 기준선 */
function baseline(ctx: CanvasRenderingContext2D, top: number, lineHeight: number, size: number) {
  const m = ctx.measureText('가');
  const asc = m.fontBoundingBoxAscent ?? size * 0.95;
  const desc = m.fontBoundingBoxDescent ?? size * 0.25;
  return top + (lineHeight - (asc + desc)) / 2 + asc;
}

function drawSpaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, ls: number) {
  let left = x;
  for (const ch of Array.from(text)) {
    ctx.fillText(ch, left, y);
    left += ctx.measureText(ch).width + ls;
  }
}

/** 상자(left~left+width) 가운데에 한 줄로 쓴다 — 넘치면 minSize까지 줄이고, 그래도 넘치면 말줄임 */
function centerLine(ctx: CanvasRenderingContext2D, t: PaperText, left: number, width: number) {
  let size = t.size;
  let ls = t.letterSpacing;
  let text = t.text;
  ctx.font = font(t.weight, size);
  let w = measure(ctx, text, ls);
  if (w > width && t.minSize) {
    size = Math.max(t.minSize, size * (width / w));
    ls = t.letterSpacing * (size / t.size);
    ctx.font = font(t.weight, size);
    w = measure(ctx, text, ls);
  }
  while (w > width && text.length > 1) {
    text = text.slice(0, -2) + '…';
    w = measure(ctx, text, ls);
  }
  ctx.fillStyle = t.color;
  drawSpaced(ctx, text, left + (width - w) / 2, baseline(ctx, t.top, t.lineHeight, size), ls);
  return w;
}

async function loadImage(src: ImageSourcePropType) {
  const asset = Asset.fromModule(src as number);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = asset.uri;
  await img.decode();
  return img;
}

/** 쓰일 글자의 웹 글꼴 조각(Pretendard dynamic subset)을 미리 받아 둔다 */
async function loadFonts(d: PaperDrawing) {
  const fonts = (document as any).fonts as FontFaceSet | undefined;
  if (!fonts) return;
  const texts = [d.date, ...d.lines].map(t => [font(t.weight, t.size), t.text] as const);
  texts.push([font('700', 96), d.hanja.text]);
  if (d.chip) texts.push([font('600', 12), d.chip.text]);
  await Promise.all(texts.map(([f, text]) => fonts.load(f, text).catch(() => [])));
}

export async function drawPaperCanvas(d: PaperDrawing): Promise<HTMLCanvasElement> {
  const scale = CANVAS_W / PAPER_W;
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = Math.round(PAPER_H * scale);
  const ctx = canvas.getContext('2d')!;
  const [img] = await Promise.all([loadImage(d.bg), loadFonts(d)]);
  ctx.scale(scale, canvas.height / PAPER_H);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // 종이 (둥근 모서리 바깥은 투명)
  ctx.save();
  roundRect(ctx, 0, 0, PAPER_W, PAPER_H, RADIUS);
  ctx.clip();
  ctx.fillStyle = '#FFF3D6';
  ctx.fillRect(0, 0, PAPER_W, PAPER_H);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, PAPER_W, PAPER_H);

  centerLine(ctx, d.date, 0, PAPER_W);

  // 한자: 149×115 칸 가운데, 넘치면 줄인다
  const multi = d.hanja.text.length > 1;
  const size = multi ? 56 : 96;
  centerLine(ctx, { text: d.hanja.text, top: d.hanja.top, color: d.hanja.color, size, weight: '700', letterSpacing: -size * 0.05, lineHeight: CHARM.height, minSize: 24 }, CHARM.left, CHARM.width);

  d.lines.forEach(t => centerLine(ctx, t, SIDE, PAPER_W - SIDE * 2));

  if (d.chip) {
    const { text, color, top } = d.chip;
    ctx.font = font('600', 12);
    const max = PAPER_W - SIDE * 2 - 17;
    const textW = Math.min(measure(ctx, text, 0), max);
    const w = textW + 17, h = 23; // 좌우 8 · 위아래 4 여백 + 0.5 테두리
    const x = (PAPER_W - w) / 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    roundRect(ctx, x + 0.25, top + 0.25, w - 0.5, h - 0.5, 11.25);
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    centerLine(ctx, { text, top: top + 4.5, color, size: 12, weight: '600', letterSpacing: 0, lineHeight: 14 }, x + 8.5, textW);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // 흰 테두리 3px
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  roundRect(ctx, 1.5, 1.5, PAPER_W - 3, PAPER_H - 3, RADIUS - 1.5);
  ctx.stroke();
  return canvas;
}
