import type { ImageSource } from 'expo-image';
import { STEMS, type Element } from '../../data/sajuData';
import type { User } from '../../types';

type Portrait = { full: ImageSource | number; preview: ImageSource | number };

// Metro resolves bundled images from literal paths.
const PORTRAITS: Record<string, Record<User['gender'], Portrait>> = {
  甲: {
    male: {
      full: require('../../../assets/figma/spouse/portraits/gap-male.webp'),
      preview: require('../../../assets/figma/spouse/portraits/gap-male-preview.webp'),
    },
    female: {
      full: require('../../../assets/figma/spouse/portraits/gap-female.webp'),
      preview: require('../../../assets/figma/spouse/portraits/gap-female-preview.webp'),
    },
  },
  乙: {
    male: {
      full: require('../../../assets/figma/spouse/portraits/eul-male.webp'),
      preview: require('../../../assets/figma/spouse/portraits/eul-male-preview.webp'),
    },
    female: {
      full: require('../../../assets/figma/spouse/portraits/eul-female.webp'),
      preview: require('../../../assets/figma/spouse/portraits/eul-female-preview.webp'),
    },
  },
  丙: {
    male: {
      full: require('../../../assets/figma/spouse/portraits/byeong-male.webp'),
      preview: require('../../../assets/figma/spouse/portraits/byeong-male-preview.webp'),
    },
    female: {
      full: require('../../../assets/figma/spouse/portraits/byeong-female.webp'),
      preview: require('../../../assets/figma/spouse/portraits/byeong-female-preview.webp'),
    },
  },
  丁: {
    male: {
      full: require('../../../assets/figma/spouse/portraits/jeong-male.webp'),
      preview: require('../../../assets/figma/spouse/portraits/jeong-male-preview.webp'),
    },
    female: {
      full: require('../../../assets/figma/spouse/portraits/jeong-female.webp'),
      preview: require('../../../assets/figma/spouse/portraits/jeong-female-preview.webp'),
    },
  },
  戊: {
    male: {
      full: require('../../../assets/figma/spouse/portraits/mu-male.webp'),
      preview: require('../../../assets/figma/spouse/portraits/mu-male-preview.webp'),
    },
    female: {
      full: require('../../../assets/figma/spouse/portraits/mu-female.webp'),
      preview: require('../../../assets/figma/spouse/portraits/mu-female-preview.webp'),
    },
  },
  己: {
    male: {
      full: require('../../../assets/figma/spouse/portraits/gi-male.webp'),
      preview: require('../../../assets/figma/spouse/portraits/gi-male-preview.webp'),
    },
    female: {
      full: require('../../../assets/figma/spouse/portraits/gi-female.webp'),
      preview: require('../../../assets/figma/spouse/portraits/gi-female-preview.webp'),
    },
  },
  庚: {
    male: {
      full: require('../../../assets/figma/spouse/portraits/gyeong-male.webp'),
      preview: require('../../../assets/figma/spouse/portraits/gyeong-male-preview.webp'),
    },
    female: {
      full: require('../../../assets/figma/spouse/portraits/gyeong-female.webp'),
      preview: require('../../../assets/figma/spouse/portraits/gyeong-female-preview.webp'),
    },
  },
  辛: {
    male: {
      full: require('../../../assets/figma/spouse/portraits/sin-male.webp'),
      preview: require('../../../assets/figma/spouse/portraits/sin-male-preview.webp'),
    },
    female: {
      full: require('../../../assets/figma/spouse/portraits/sin-female.webp'),
      preview: require('../../../assets/figma/spouse/portraits/sin-female-preview.webp'),
    },
  },
  壬: {
    male: {
      full: require('../../../assets/figma/spouse/portraits/im-male.webp'),
      preview: require('../../../assets/figma/spouse/portraits/im-male-preview.webp'),
    },
    female: {
      full: require('../../../assets/figma/spouse/portraits/im-female.webp'),
      preview: require('../../../assets/figma/spouse/portraits/im-female-preview.webp'),
    },
  },
  癸: {
    male: {
      full: require('../../../assets/figma/spouse/portraits/gye-male.webp'),
      preview: require('../../../assets/figma/spouse/portraits/gye-male-preview.webp'),
    },
    female: {
      full: require('../../../assets/figma/spouse/portraits/gye-female.webp'),
      preview: require('../../../assets/figma/spouse/portraits/gye-female-preview.webp'),
    },
  },
};

export function spousePortraitFor(profile: Pick<User, 'gender' | 'natal'>, element: Element, reportStem?: string) {
  const dayStem = STEMS[profile.natal?.chart.day.stem ?? -1];
  // The preview supplies the spouse element. The engine pairs it with the opposite
  // polarity of the profile's day stem. Prefer the saved report stem after unlock.
  const previewStem = dayStem && STEMS.find(stem => stem.element === element && stem.yang !== dayStem.yang);
  const portraits = PORTRAITS[reportStem ?? ''] ?? PORTRAITS[previewStem?.hanja ?? ''];
  return portraits?.[profile.gender === 'female' ? 'male' : 'female'];
}
