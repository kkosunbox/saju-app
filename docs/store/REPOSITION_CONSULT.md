# 운알톡 중심 개편안 (4.3(b) 재심사 대응)

> 2026-11-19 · 거절 사유: Guideline 4.3(b) Design – Spam (포화 카테고리 = 운세 앱)
> 방향: "사주·MBTI·타로를 겹쳐 보는 운세 앱" → **"사주로 나를 이해하는 AI 고민상담 앱"**
> 원칙: 기능을 심사 때만 숨기지 않는다(2.3.1). 구조와 정체성을 실제로 바꾸고, 기능은 상담 아래로 재배치한다.

---

## 1. 화면 구조

### 하단 탭: 5개 → 4개

| 지금 | 개편 후 | 내용 |
|---|---|---|
| 홈(오늘의 운세) | **운알톡** ← 앱 첫 화면 | 고민 입력창 + 오늘의 기운 한 줄 + 이어서 하던 대화 |
| 콘텐츠 | **대화 기록** | 지금의 `consult/history`를 탭으로 승격. 고민별 타임라인 ("마음 기록") |
| 운알톡 | **리포트** | 콘텐츠 + 궁합 + 프리미엄을 한 탭에 묶음. "깊이 보기" |
| 궁합 | (리포트로 합침) | |
| 마이 | **마이** | 그대로 |

- 가운데 강조 탭(지금의 `ChatItem`)은 없앤다. 운알톡이 첫 탭이자 기본 화면이 되므로 따로 강조할 필요가 없음
- `(tabs)/_layout.tsx`의 첫 화면을 운알톡으로, `BottomNavigation`의 `ITEMS` 재구성

### 운알톡 홈 (새 첫 화면)

위에서부터:
1. 인사 + 입력창: "○○님, 요즘 마음에 걸리는 일이 있나요?" (지금의 `ConsultHomeScreen` 입력부를 맨 위로)
2. 고민 주제 칩: 연애 · 관계 · 일·진로 · 육아 · 돈 · 나 자신 → 누르면 예시 문장이 입력창에 채워짐
3. 이어서 대화하기: 최근 대화 1~2개
4. 오늘의 기운 (작은 카드 한 줄): 일일 운세는 별도 탭 없이 여기서 진입. "오늘 ○○님은 이런 날이에요 ›"
5. 다른 분들의 고민 (`WorryMarquee`): 맨 아래로

### 대화에서 리포트로 이어지기 (핵심 차별점)

운알톡 답변 끝에, 고민 주제와 맞는 심층 리포트를 카드 하나로 추천한다.

| 고민 주제 | 추천 리포트 |
|---|---|
| 아이·육아 | 우리 아이 사주 |
| 연애·짝사랑 | 그 사람의 속마음 / 미래 배우자 |
| 특정 상대와의 관계 | 궁합 |
| 일·진로·돈 | 직업·재물 테마 / 평생운 |
| 올해 흐름 | 신년운세 / 월별운세 |

- 서버: `consult.schema.ts` 출력에 `suggestedReport` (enum, 없으면 null) 추가, 프롬프트에 "꼭 필요할 때만" 조건
- 앱: `ConsultChatScreen` 답변 말풍선 아래 카드 1장. 이미 산 리포트면 "다시 보기"
- 심사관에게 "운세 목록이 아니라 상담이 리포트로 이어지는 흐름"으로 보이게 하는 장치

### 리포트 탭

- 위: **깊이 보기** (유료 리포트: 우리 아이, 배우자, 속마음, 상세 사주, 평생운, 신년·월별, 테마)
- 가운데: **함께 보기** (궁합, 찰떡 MBTI)
- 아래: **가볍게 보기** (전생, 부적, 사주 캐릭터). 운세 앱 인상이 가장 강한 것들이라 맨 아래로

### 온보딩

- 지금: 프로필 입력 → 오늘의 운세 뽑기
- 개편: 프로필 입력 → "운알이에게 처음 고민을 들려주세요" (첫 대화 무료 강조)
- 출생 정보 입력 화면 문구도 "운세를 보려면"이 아니라 "운알이가 ○○님을 더 잘 이해하도록"

### 심사 대비 필수 보완

| 항목 | 지금 상태 | 할 일 |
|---|---|---|
| 5.1.2(i) 제3자 AI 공유 동의 | 가입 약관 개인정보 항목에 OpenAI 전달 고지 있음 | **운알톡 첫 사용 시 별도 동의 모달** ("고민 글은 답변 작성을 위해 OpenAI(미국)로 전송돼요" + 동의/취소). 가입 약관만으로는 심사에서 지적받는 사례가 많음 |
| 1.4.1 건강 표현 | 위기 분류(crisis/concern)와 상담전화 안내가 프롬프트에 있음 | 운알톡 홈 하단에 고정 안내: "운알톡은 전문 심리상담을 대신하지 않아요. 힘든 순간엔 109(자살예방) · 1577-0199로 연락해 주세요." crisis 분류 시 답변 위에 상담전화 카드 고정 노출 |
| 표현 | | "심리상담·치료·진단" 단어 금지. "고민 대화", "마음 이야기"로 |
| 연령 등급 | 12+ | 설문의 AI 챗봇·무제한 콘텐츠 문항에 정확히 응답. 12+ 유지 또는 17+ 검토 |
| 심사 메모 | "Anthropic AI 사용"으로 적혀 있음 | **OpenAI로 수정** (실제와 다르면 신뢰를 잃음) |

---

## 2. 스토어 문구 (App Store)

### 이름 (30자) — 후보

1. **운Pick - 사주로 푸는 AI 고민상담** (22자) ← 추천. 브랜드 유지, 상담이 주어
2. 운Pick - 고민을 듣는 AI 운알톡
3. 운알톡 - 사주로 듣는 고민 대화 (브랜드를 운알톡으로 바꾸는 안. 마케팅 비용이 들지만 정체성은 가장 선명)

### 부제 (30자) — 후보

1. **말 못 할 고민, 사주로 함께 풀어요** (20자) ← 추천
2. 나를 아는 AI와 나누는 고민 대화
3. 연애·관계·육아 고민, 운알이에게

### 카테고리

라이프스타일 (보조 카테고리 엔터테인먼트는 **빼기**. 엔터테인먼트가 붙으면 운세 앱 분류가 강해짐)

### 키워드 (100자)

```
고민상담,AI상담,연애고민,육아고민,진로고민,인간관계,직장고민,사주,MBTI,성격분석,자기이해,궁합,사주상담,운알톡,운픽,마음
```
(70자. "운세·타로·띠운세·전생"은 뺌)

### 프로모션 문구 (170자)

```
혼자 품고 있던 고민, 운알이에게 털어놔 보세요. 사주와 MBTI로 ○○님을 이해한 AI가 대화로 함께 답을 찾아요.
```

### 설명

```
말 못 할 고민, 누구에게 털어놓으세요?

운Pick의 운알톡은 사주와 MBTI로 나를 먼저 이해한 뒤
내 고민에 맞춰 대화로 답해 주는 AI 고민상담이에요.
뻔한 오늘의 운세가 아니라, 지금 내 상황에 대한 이야기를 나눠요.

■ 나를 아는 AI, 운알이와 대화
· 연애 · 인간관계 · 일과 진로 · 육아 · 돈, 어떤 고민이든
· 내 타고난 성향(사주 · MBTI)을 바탕으로 한 맞춤 답변
· 답을 받은 뒤에도 이어서 더 물어볼 수 있어요
· 대화는 나만 볼 수 있고, 1년 뒤 자동으로 지워져요

■ 대화가 쌓이는 마음 기록
· 지난 고민과 답을 한곳에서 다시 보기
· 같은 고민이 어떻게 달라졌는지 돌아보기

■ 더 깊이 알고 싶을 때, 리포트
· 우리 아이 사주 – 아이의 기질, 재능, 공부 방식, 보호자와의 관계
· 그 사람의 속마음 · 미래 배우자 리포트
· 궁합 – 링크 하나로 상대와 함께
· 상세 사주 해석 · 평생운 · 신년 · 월별 흐름
대화 중 필요한 리포트를 운알이가 먼저 추천해 줘요.

■ 매일 가볍게
· 오늘의 기운 한 줄과 하루 조언

■ 이런 분께
· 주변에 말하기 어려운 고민이 있는 분
· 내가 왜 이런 선택을 반복하는지 알고 싶은 분
· 아이를 더 잘 이해하고 싶은 보호자

운알톡은 전문 심리상담이나 의료·법률·금전 상담을 대신하지 않아요.
힘든 순간에는 자살예방 상담전화 109, 정신건강 위기상담 1577-0199로 연락해 주세요.
고민 글은 답변 작성을 위해 OpenAI(미국)로 전송되며, 처음 사용할 때 동의를 받아요.
```

### 스크린샷 (6장, 순서가 곧 인상)

| # | 화면 | 상단 문구 |
|---|---|---|
| 1 | 운알톡 홈 (입력창 + 주제 칩) | 말 못 할 고민, 운알이에게 |
| 2 | 대화 화면 (고민 → 맞춤 답변) | 나를 아는 AI가 대화로 답해요 |
| 3 | 이어 묻기 (후속 질문과 답) | 궁금한 건 이어서 더 물어봐요 |
| 4 | 답변 끝 리포트 추천 카드 → 우리 아이 리포트 | 필요한 리포트는 운알이가 먼저 |
| 5 | 대화 기록 탭 | 고민과 답이 마음 기록으로 쌓여요 |
| 6 | 궁합 / 리포트 탭 | 그 사람과의 관계도 깊이 있게 |

- 오늘의 운세 화면, 타로 카드, 부적 화면은 **스크린샷에서 제외**
- 1번 스크린샷만 보고도 "채팅 앱"으로 보여야 함

### 이번 버전 새 기능

```
운Pick이 운알톡 중심으로 새로워졌어요. 혼자 품은 고민을 운알이에게 들려주세요.
```

---

## 3. 해결 센터 답장 (영문, 재제출 시)

```
Hello App Review Team,

Thank you for your feedback regarding Guideline 4.3(b).

We have redesigned the app so that its core experience is an AI conversation
for personal concerns, not daily fortune telling.

What is different from fortune-telling apps:

1. Conversational support as the main screen
   The app now opens directly to "Unaltalk", where users describe a personal
   concern (relationships, work, parenting) in their own words and receive a
   tailored reply they can follow up on. Fortune lists and tarot are no longer
   part of the main navigation.

2. Personalized context, not generic horoscopes
   Replies are grounded in the user's own profile (Korean Saju birth chart and
   MBTI) and the specific concern they wrote, so no two answers are alike.

3. Conversation-to-report flow
   When relevant, the conversation recommends one in-depth report — for
   example, a parenting guide describing a child's temperament and learning
   style and the relationship with each guardian.

4. Safety and privacy
   - Messages that indicate crisis or mental-health concerns are detected,
     and the app shows Korean crisis hotlines (109, 1577-0199).
   - The app states it does not replace professional counseling.
   - Users explicitly consent before their message is sent to our AI provider
     (OpenAI), and conversations are deleted automatically after one year.

A demo video of the main flow is available here: [링크]
Review account: provided in App Review Information (free credits included).

We would be happy to schedule a call if that would help.

Best regards,
Woonpick Team
```

---

## 4. 작업 순서 (제안)

1. 서버: 운알톡 출력에 `suggestedReport` 추가, crisis 분류 결과를 앱에 내려 주기 (이미 내려 주면 생략)
2. 앱: 탭 재구성 + 운알톡 홈 개편 + 리포트 탭 묶기
3. 앱: 운알톡 첫 사용 AI 동의 모달, 하단 안내 문구, crisis 상담전화 카드
4. 앱: 답변 아래 리포트 추천 카드
5. 온보딩 문구·흐름 변경
6. 스크린샷 6장 촬영, 메타데이터 교체, 심사 메모 수정(OpenAI), 데모 영상 녹화
7. 재제출 + 해결 센터 답장
