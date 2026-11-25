import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getTopicCard, TAROT_REVERSED_RATE, TAROT_TOPICS, type TarotTopic } from '../../data/topicTarot';
import { todayISO } from '../../utils/date';
import { LOCAL_TOOLS } from '../../utils/devTools';
import { deviceKey } from '../storage/storageService';

type TopicKey = TarotTopic['key'];
/** 주제마다 오늘 뽑은 카드와 방향 (역방향을 넣기 전 기록은 정방향) */
export interface TopicDraw { cardId: number; reversed: boolean }
type Draws = Partial<Record<TopicKey, TopicDraw>>;
const drawPrefix = (userId: string) => deviceKey(`topic-tarot:v1:${userId}:`);
const drawKey = (userId: string, topic: TopicKey) => `${drawPrefix(userId)}${topic}`;

async function readDraw(key: string, date: string): Promise<TopicDraw | undefined> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return undefined;
  try {
    const saved: { date?: string; cardId?: number; reversed?: boolean } = JSON.parse(raw);
    if (saved?.date === date && typeof saved.cardId === 'number' && getTopicCard(saved.cardId)) {
      return { cardId: saved.cardId, reversed: saved.reversed === true };
    }
  } catch {
    // A corrupt record can be replaced by the next completed draw.
  }
}

export async function loadTopicTarotDraws(userId: string, date: string): Promise<Draws> {
  const draws = await Promise.all(TAROT_TOPICS.map(async ({ key }) => [
    key, await readDraw(drawKey(userId, key), date),
  ] as const));
  return Object.fromEntries(draws.filter(([, draw]) => draw !== undefined));
}

export function subscribeToTopicTarotDraws(userId: string, onChange: () => void) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return () => {};
  const prefix = drawPrefix(userId);
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(prefix)) onChange();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

let writeQueue: Promise<unknown> = Promise.resolve();

function updateDraw<T>(key: string, commit: () => Promise<T>) {
  // Web Locks also serialize concurrent draws between tabs on the same origin.
  const locks = Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (locks) return locks.request(key, commit);
  const operation = writeQueue.then(commit);
  writeQueue = operation.catch(() => {});
  return operation;
}

/** Return the first confirmed choice (card and direction) for this topic and day, including after a concurrent draw. */
export function saveTopicTarotDraw(userId: string, topic: TopicKey, date: string, chosenId: number) {
  const key = drawKey(userId, topic);
  return updateDraw(key, async () => {
    if (date !== todayISO()) return undefined;
    const saved = await readDraw(key, date);
    if (date !== todayISO()) return undefined;
    if (saved !== undefined) return { ...saved, newlySaved: false };
    // 방향은 카드를 고른 순간 정해 함께 남긴다 (다시 열어도 같은 방향)
    const reversed = Math.random() < TAROT_REVERSED_RATE;
    await AsyncStorage.setItem(key, JSON.stringify({ date, cardId: chosenId, reversed }));
    return { cardId: chosenId, reversed, newlySaved: true };
  });
}

export function resetTopicTarotDraw(userId: string, topic: TopicKey, date: string) {
  if (!LOCAL_TOOLS) return Promise.resolve(false);
  const key = drawKey(userId, topic);
  return updateDraw(key, async () => {
    if (date !== todayISO()) return false;
    if (await readDraw(key, date) !== undefined && date === todayISO()) await AsyncStorage.removeItem(key);
    return date === todayISO();
  });
}
