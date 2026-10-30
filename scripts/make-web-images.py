"""홈 화면 아이콘(apple-touch-icon · manifest 아이콘)을 public/ 에 만든다. 공유 미리보기는 디자인한 public/og-v5.png.
실행: /usr/bin/python3 -E scripts/make-web-images.py"""
from PIL import Image

icon = Image.open('assets/icon.png').convert('RGB')
for size, name in [(180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')]:
    icon.resize((size, size), Image.LANCZOS).save(f'public/{name}', optimize=True)
