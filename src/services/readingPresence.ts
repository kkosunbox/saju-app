/**
 * 지금 화면에 띄워 둔 유료 콘텐츠 (풀이 완성 안내를 띄울지 정할 때 쓴다).
 * 그 화면을 보고 있으면 풀이가 화면에 바로 채워지니 따로 알리지 않는다.
 * 같은 키를 두 화면이 함께 띄울 수 있어서 개수로 센다.
 */
const viewing = new Map<string, number>();

/** 화면이 포커스를 얻을 때 부른다. 돌려준 함수를 포커스를 잃을 때 부른다 */
export function markViewing(key: string): () => void {
  viewing.set(key, (viewing.get(key) ?? 0) + 1);
  return () => {
    const n = (viewing.get(key) ?? 1) - 1;
    if (n > 0) viewing.set(key, n);
    else viewing.delete(key);
  };
}

export const isViewing = (key: string): boolean => viewing.has(key);
