# iOS Share Extension 자체 처리 도입 검토

작성: 2026-06-23
브랜치: `feat/share-extension-poc` (PoC 코드만 적용된 상태, 검증 안 됨)

## 목표

iOS Share Sheet에서 Nook을 선택했을 때 **메인 앱이 launch되지 않고** share sheet 위에서 바로 저장 완료되도록 한다 (Pocket / Instapaper / Raindrop 패턴).

> 사용자 요구: "우리 앱의 주요 목표가 빠른 저장이라서"

## 현재 동작 (변경 전 main)

- 라이브러리: `expo-share-intent` v7.0.0
- 흐름: Safari 등에서 공유 → Nook 선택 → **메인 앱 cold/warm start** → `app/_layout.tsx`의 share intent useEffect → `saveContent` → 글로벌 Toast
- 한계: 사용자가 Nook 화면이 잠깐 떴다가 사라지는 과정을 봐야 함 (앱 launch 시간 1-3초 + JS init)

## 라이브러리 옵션 비교

### `expo-share-intent` (현재)
- 디자인 의도: 받은 데이터를 메인 앱에 넘기는 모드 (저자 명시: "user is directly redirected to the main application")
- README §"iOS Custom view?": **"This project does not and will not support the iOS custom view"**
- 저자가 추천하는 대안: **`expo-share-extension`** + `disableIOS: true`

### `expo-share-extension` (MaxAst, 추천 대안)
- 디자인: Share Extension 내부에 **별도 React Native 번들**을 실행. 메인 앱이 안 열림
- Pinterest 같은 동작
- 공식 npm: 5.0.6 (SDK 54 지원)
- prerelease: 6.0.0-beta (SDK 55 지원)
- **SDK 56 (우리 프로젝트)**: 공식 지원 release 없음 → PR #119 1줄 패치 대기 중

## 호환성 이슈

우리 프로젝트는 Expo SDK 56 + RN 0.85.3, New Architecture 기본 enabled 상태(`app.json`에 명시적 disable 없음).

### 1. SDK 56 미지원 — PR #119

- 상태: open, mergeable clean
- 패치 크기: **1줄** (`IPHONEOS_DEPLOYMENT_TARGET: "15.1" → "16.4"`)
- 작성자: PierreCapo (외부 contributor)
- 적용 방법: `patch-package`

### 2. New Architecture에서 ShareExtension 크래시 — Issue #117

- 상태: open, 가장 큰 위험
- 증상: 
  ```
  NSInvalidArgumentException: attempt to insert nil object from objects[14]
  +[RCTThirdPartyComponentsProvider thirdPartyFabricComponents]
  ```
- 원인: RN codegen이 만든 `RCTThirdPartyComponentsProvider.mm`이 메인 앱 + ShareExtension에서 공유됨. ShareExtension에 linked되지 않은 Fabric component를 `NSClassFromString()`로 등록 시도 → nil → `NSDictionary` literal 크래시
- 우리 영향: `react-native-reanimated`, `react-native-screens`, `react-native-gesture-handler`, `react-native-safe-area-context` 등 Fabric component 다수 보유
- 워크어라운드: `RCTThirdPartyComponentsProvider.mm` 생성 후 후처리 스크립트로 NSMutableDictionary + nil-check로 변환 (issue #117 댓글에 patch script 게재)
- upstream 픽스 진행 중: React Native PR #51078

### 3. Keychain access group 미복사 — Issue #90

- 상태: open
- 증상: `expo-share-extension` 플러그인이 메인 앱의 `keychain-access-groups` entitlement를 share extension에 복사 안 함 → `expo-secure-store`로 저장한 데이터(Supabase 세션 토큰) 접근 불가
- 우리 영향: Supabase 인증 세션이 SecureStore 기반이라 share extension에서 인증 요청 불가능 → **저장 불가 결정적 블로커**
- 해결 방법: 코드 변경 작음 (PR로 제안 패치 있음). `patch-package`로 자체 적용 가능

## PoC 적용 상태 (이 브랜치)

코드만 작성됨. **EAS 빌드/실기기 검증 미실시.**

### 추가/변경된 파일

| 경로 | 내용 |
|---|---|
| `index.js` | 메인 앱 entry. `import 'expo-router/entry'` 위임 |
| `index.share.js` | Share Extension entry. `AppRegistry.registerComponent('shareExtension', ...)` |
| `components/ShareExtension.tsx` | PoC UI — URL 표시 + 닫기. 저장 로직 미포함 |
| `metro.config.js` | `withShareExtension` 래퍼 (신규) |
| `patches/expo-share-extension+5.0.6.patch` | PR #119 패치 적용 |
| `package.json` | `main` → `"index.js"`, `expo-share-extension`/`patch-package` 추가, `postinstall: "patch-package"` |
| `app.json` | `expo-share-intent`에 `disableIOS: true`, `expo-share-extension` 플러그인 추가 |

### 적용 안 한 항목

- Issue #90 (keychain) 패치 — Supabase 세션 공유. PoC 검증 후 진행 예정
- Issue #117 (New Arch 크래시) 워크어라운드 — PoC가 동작하면 그대로, 크래시하면 적용 필요
- Share Extension 안에서의 실제 저장 로직 (saveContent / 메타데이터 추출 / analytics / toast)

### 검증 절차

PoC가 동작하는지 확인하려면:
1. `npm run build:ios:prod` (EAS production 빌드, 15분~)
2. TestFlight 업데이트
3. Safari → 공유 → Nook 선택 → ShareExtension UI가 share sheet 위에서 뜨는지 / 메인 앱이 안 열리는지 확인
4. 2초 후 자동으로 닫히는지

### 검증 결과 분기

- **앱이 안 열리고 ShareExtension UI 정상 표시** → 운이 좋음 (New Arch + 우리 deps에서 codegen 크래시 회피). 다음 단계 진행
- **크래시 (`RCTThirdPartyComponentsProvider`)** → Issue #117 워크어라운드 적용 후 재빌드
- **빈 화면 / "shareExtension not registered" (Issue #100)** → Expo Router + index.share.js 연결 조사
- **UI는 뜨지만 close 시 메인 앱 launch** → 라이브러리 설정 재검토

## 누적 비용/리스크

| 항목 | 비용 |
|---|---|
| PR #119 패치 유지 | 작음 (1줄). SDK 57 나오면 갱신 필요할 수도 |
| Issue #90 패치 유지 | 작음 |
| Issue #117 워크어라운드 | **큼** — codegen 후처리 스크립트 + EAS build hook. 새 패키지 추가 / SDK 업그레이드 / 패키지 업그레이드마다 깨질 위험 |
| 저장/auth/메타데이터 로직 share extension 번들로 이식 | 중간 — 기존 코드 일부 분리 필요 |
| 회귀 검증 (TestFlight) | 1-2회 빌드 사이클 |

## 결정 옵션

### A. PoC 계속 진행
빈 PoC로 EAS 빌드 한 사이클 시도. 운이 좋으면 (#117에 안 걸리면) 본격 진행. 안 걸려도 #90 패치 + 저장 로직 통합 작업 필요.

### B. 보류 → 외부 베타/정식 제출 우선
Share Extension 도입은 라이브러리 상황(#119/#117/#90 머지, upstream RN #51078) 정착 후 재시도. release-readiness 트랙은 외부 베타 → App Store 정식 제출로 전진.

### C. 옵션 1로 회귀 (현재 흐름 최적화)
앱이 열리는 것 자체는 막을 수 없지만 launch 시간 + JS init 시간 최소화. 사용자 체감 1-2초 개선 가능. 본질적 해결은 아님.

## 권장 결정: B.

이유: 현재 MVP 우선순위는 배포 안정화이며, expo-share-intent 기반 저장 흐름은 이미 동작한다. expo-share-extension은 SDK 56 공식 지원 부재, New Architecture crash, SecureStore entitlement 이슈가 동시에 있어 정식 제출 전 도입하기에는 회귀 위험이 크다. PoC는 별도 브랜치에서 1회 빌드 검증까지만 허용한다.

## codex 검토 의견 요약 (2026-06-23)

- 결론: **B 보류**가 가장 합리적. 현재 변경은 "빠른 저장 UX 개선"이 아니라 "릴리즈 안정성 리스크"가 더 큼.
- Issue #117 리스크 평가는 적정 ~ 약간 과소평가. Nook 의존성(`reanimated`, `screens`, `gesture-handler`, `safe-area-context`)이 해당 조건에 잘 맞음.
- Issue #90는 조건부 블로커가 맞음. **App Group UserDefaults로 토큰 우회는 보안상 비추** — refresh token을 UserDefaults에 두는 건 Nook의 multi-user data handling 원칙과 충돌.
- Issue #117의 깨끗한 대안은 현재 없음. codegen 후처리 스크립트가 사실상 유일한 실용적 워크어라운드. `excludedPackages`는 이미 실패 사례로 보고됨.
- PoC와 release-readiness 트랙을 섞으면 실패 추적 불가. 진행 시 완전히 별도 브랜치 + 1회성 실험으로 제한해야 함.

후속 액션:
- PoC 브랜치(`feat/share-extension-poc`)는 폐기.
- MaxAst/expo-share-extension Issue #119, #117, #90 + 상류 RN PR #51078 머지 동향 모니터링.
- 정식 제출 이후 라이브러리 정착되면 재시도 검토.

## 검토 요청 포인트 (codex용)

1. **호환성 리스크 평가가 정확한가?** 특히 Issue #117의 무게를 우리가 과대평가했는지 / 과소평가했는지
2. **#117 워크어라운드 대안이 있는가?** codegen 후처리 외에 더 깨끗한 방법 (예: `excludedPackages` 활용, 별도 codegen target 분리)
3. **expo-secure-store 대신 다른 세션 공유 전략?** 메인 앱이 토큰을 App Group UserDefaults에 동기화하고 share extension에서 그쪽에서 읽기. Issue #90 우회 가능?
4. **유사 사례 (다른 Expo SDK 56 + share extension 사용 앱)** — GitHub 검색 / Reddit / Expo Forums에서 동작 보고가 있는지
5. **upstream RN PR #51078 머지 일정** — 곧 머지된다면 (#117 자동 해결), 보류 결정이 더 합리적
6. **결정 옵션 A/B/C 중 단일 사용자 MVP + iOS 단독 배포 컨텍스트에서 가장 합리적 선택은?**

## 참고 링크

- expo-share-intent: https://github.com/achorein/expo-share-intent
- expo-share-extension: https://github.com/MaxAst/expo-share-extension
- PR #119 (SDK 56): https://github.com/MaxAst/expo-share-extension/pull/119
- Issue #117 (New Arch): https://github.com/MaxAst/expo-share-extension/issues/117
- Issue #90 (keychain): https://github.com/MaxAst/expo-share-extension/issues/90
- Issue #100 (Expo Router): https://github.com/MaxAst/expo-share-extension/issues/100
- React Native upstream fix: https://github.com/facebook/react-native/pull/51078
