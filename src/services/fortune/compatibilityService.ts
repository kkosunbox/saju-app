/** 궁합(규칙 기반). 향후 AI 궁합 API로 교체 시 CompatibilityEngine 계약만 유지 */
import { CompatibilityResult, PartnerInput, User } from '../../types';
import { buildChart, relation } from './sajuService';
import { birthThaiDay } from './thaiAstrologyService';
import { STEMS, ELEMENT_INFO } from '../../data/sajuData';
import { THAI_FRIENDS } from '../../data/thaiData';
import { clamp, seededRandom } from '../../utils/seed';

export interface CompatibilityEngine { analyze(user: User, partner: PartnerInput): Promise<CompatibilityResult> }

const BLOOD_MATRIX: Record<string, number> = {
  'A-A': 8, 'A-B': -2, 'A-O': 7, 'A-AB': 4, 'B-B': 6, 'B-O': 5, 'B-AB': 7, 'O-O': 6, 'O-AB': 2, 'AB-AB': 5,
};
const bloodScore = (a: string, b: string) => BLOOD_MATRIX[`${a}-${b}`] ?? BLOOD_MATRIX[`${b}-${a}`] ?? 0;

export const ruleCompatibility: CompatibilityEngine = {
  async analyze(user, partner) {
    const rand = seededRandom([user.birthDate, partner.birthDate, user.mbti, partner.mbti].sort().join('|'));
    const meEl = STEMS[buildChart(user.birthDate, user.birthTime).day.stem].element;
    const youEl = STEMS[buildChart(partner.birthDate, partner.birthTime).day.stem].element;
    const rel = relation(meEl, youEl);
    const saju = { peer: 6, resource: 9, output: 9, wealth: 5, officer: -3 }[rel];

    const a = user.mbti, b = partner.mbti;
    const sameN = a[1] === b[1] ? 10 : -4; // 인식 방식이 같으면 대화가 잘 통함
    const diffE = a[0] !== b[0] ? 5 : 2; // 에너지 방향은 보완 관계
    const diffTF = a[2] !== b[2] ? 4 : 3;
    const sameJP = a[3] === b[3] ? 5 : 0;

    const myThai = birthThaiDay(user.birthDate, user.birthTime);
    const yourThai = birthThaiDay(partner.birthDate, partner.birthTime);
    const thai = THAI_FRIENDS[myThai].includes(yourThai) || THAI_FRIENDS[yourThai].includes(myThai) ? 7 : myThai === yourThai ? 5 : 0;

    const blood = bloodScore(user.bloodType, partner.bloodType);
    const n = () => rand() * 8 - 4;

    const love = clamp(70 + saju + thai + diffE + n(), 50, 98);
    const personality = clamp(68 + diffTF + sameJP + blood + n(), 50, 98);
    const conversation = clamp(70 + sameN + diffE + n(), 50, 98);
    const money = clamp(68 + sameJP + (rel === 'wealth' ? 8 : 2) + blood / 2 + n(), 50, 98);
    const total = clamp((love + personality + conversation + money) / 4 + 2);

    const sajuLine = {
      peer: '같은 기운을 가진 사이라 서로를 잘 이해해요. 경쟁보다 협력을 택하면 더 단단해져요.',
      resource: '한쪽이 다른 쪽을 채워주는 관계예요. 기대고 기댈 수 있는 편안함이 있어요.',
      output: '서로의 매력을 끌어내는 관계예요. 함께 있으면 표현이 풍부해져요.',
      wealth: '현실적인 호흡이 잘 맞아요. 함께 목표를 세우면 결과가 빨리 나와요.',
      officer: '서로에게 자극이 되는 긴장감이 있어요. 부딪힐 땐 하루 쉬었다 이야기하세요.',
    }[rel];

    return {
      userId: user.id,
      target: partner,
      total, love, personality, conversation, money,
      summary: total >= 85 ? '함께할수록 서로를 빛내주는 사이' : total >= 75 ? '조금씩 맞춰가며 깊어지는 사이' : '다름을 배우며 성장하는 사이',
      points: [
        { title: `命 사주 · ${ELEMENT_INFO[meEl].ko}과 ${ELEMENT_INFO[youEl].ko}`, text: sajuLine },
        { title: `性 MBTI · ${a} × ${b}`, text: a[1] === b[1] ? '세상을 보는 방식이 비슷해 대화가 자연스럽게 이어져요.' : '보는 관점이 달라 새로운 시각을 서로에게 선물해요. 설명을 조금 더 친절하게.' },
        { title: `血 혈액형 · ${user.bloodType}형 × ${partner.bloodType}형`, text: blood >= 6 ? '생활 리듬이 잘 맞는 조합이에요.' : blood >= 3 ? '무난하게 어울리는 조합이에요.' : '표현 방식이 달라요. 서운함은 바로 말로 풀어주세요.' },
      ],
      createdAt: new Date().toISOString(),
    };
  },
};

export const getCompatibilityEngine = () => ruleCompatibility;
