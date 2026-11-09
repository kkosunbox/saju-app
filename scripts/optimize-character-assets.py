"""Resize generated background plates into app WebP assets."""

import argparse
import json
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    encoding = manifest['encoding']
    dimensions = (encoding['width'], encoding['height'])
    args.output_dir.mkdir(parents=True, exist_ok=True)
    total = 0
    for asset in manifest['assets']:
        source = args.source_dir / asset['generated_source']
        target = args.output_dir / asset['file']
        with Image.open(source) as original:
            image = original.convert('RGB')
            if image.width * dimensions[1] != image.height * dimensions[0]:
                raise ValueError(f'{source.name}: unexpected aspect ratio {image.size}')
            image = image.resize(dimensions, Image.Resampling.LANCZOS)
            image.save(target, 'WEBP', quality=encoding['quality'], method=encoding['method'])
        size = target.stat().st_size
        total += size
        print(f'{target.name}: {size:,} bytes')
    print(f'{len(manifest["assets"])} assets: {total:,} bytes total')


if __name__ == '__main__':
    main()
