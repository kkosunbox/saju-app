"""
풀이 로딩 마스코트: 스프라이트 시트(PNG, 진짜 반투명 알파) → 애니메이션 WebP.
GIF(256색 · 1비트 투명)를 거치지 않아 테두리가 매끈하고 색이 뭉개지지 않는다.

  /usr/bin/python3 -E scripts/build-loading-mascot.py [시트.png] [결과.webp] [--gamma 1] [--sat 1] [--bright 1]

기본은 원본 색 그대로. 탁해 보이면 gamma < 1 (중간 톤을 밝게), sat > 1 (채도를 올림)로 조정한다.
"""
import argparse
from PIL import Image, ImageEnhance

p = argparse.ArgumentParser()
p.add_argument('src', nargs='?', default='output/loading-mascot/source/scroll-original-v6.png')
p.add_argument('dst', nargs='?', default='assets/images/loading-scroll.webp')
p.add_argument('--cols', type=int, default=6)
p.add_argument('--rows', type=int, default=4)
p.add_argument('--size', type=int, default=256)
p.add_argument('--fps', type=float, default=12)
p.add_argument('--gamma', type=float, default=1.0)
p.add_argument('--sat', type=float, default=1.0)
p.add_argument('--bright', type=float, default=1.0)
o = p.parse_args()

sheet = Image.open(o.src).convert('RGBA')
cw, ch = sheet.width // o.cols, sheet.height // o.rows
lut = [min(255, round(255 * (i / 255) ** o.gamma)) for i in range(256)]

frames = []
for i in range(o.cols * o.rows):
    x, y = (i % o.cols) * cw, (i // o.cols) * ch
    f = sheet.crop((x, y, x + cw, y + ch))
    if (cw, ch) != (o.size, o.size):
        f = f.resize((o.size, o.size), Image.LANCZOS)
    r, g, b, a = f.split()
    rgb = Image.merge('RGB', (r, g, b)).point(lut * 3)
    rgb = ImageEnhance.Color(rgb).enhance(o.sat)
    if o.bright != 1:
        rgb = ImageEnhance.Brightness(rgb).enhance(o.bright)
    # 시트의 알파 최댓값이 253~254라 몸이 아주 살짝 비친다 → 255로 펴 준다
    a = a.point(lambda v: min(255, round(v * 255 / 253)))
    frames.append(Image.merge('RGBA', (*rgb.split(), a)))

frames[0].save(o.dst, save_all=True, append_images=frames[1:], duration=round(1000 / o.fps), loop=0,
               quality=92, method=6, alpha_quality=100)
print(o.dst, len(frames), 'frames')
