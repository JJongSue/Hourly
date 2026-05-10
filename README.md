# Hourly

매 시간 영감과 메모를 기록하는 앱. 1시간마다 알람을 통해 현재 생각을 캡처합니다.

## 주요 기능

- **메모 캡처**: 현재 시각 기준으로 즉시 기록
- **자동 분류**: 키워드 기반으로 8개 카테고리 자동 분류 (Diary, Idea, Inspiration, Schedule 등)
- **5개 화면**: Hourly / Daily / Library / Favorites / Settings
- **1시간 알람**: 플랫폼별 네이티브 알림 (Web · iOS · Android · Windows · macOS)
- **조용한 시간**: 시간대 설정으로 알람 억제
- **내보내기**: Markdown / JSON

---

## 개발 환경 설정

```bash
git clone https://github.com/JJongSue/Hourly.git
cd Hourly
npm install
```

---

## 플랫폼별 실행 방법

### 웹 브라우저 (즉시 실행)

```bash
npm run dev
# http://localhost:5173 접속
```

### Windows / macOS — Electron

```bash
npm run electron:dev          # 개발 실행 (빌드 후 바로 실행)
npm run electron:build:win    # Windows .exe 인스톨러 생성
npm run electron:build:mac    # macOS .dmg 생성
```

빌드 결과물은 `release/` 폴더에 생성됩니다.

### iOS — Capacitor (macOS + Xcode 필요)

```bash
# 최초 1회
npx cap add ios

# 이후 빌드할 때마다
npm run cap:ios
# → Xcode 자동 실행 → 기기/시뮬레이터 선택 후 ▶ Run
```

> **무료 테스트**: Apple Developer Program 없이도 Xcode 무료 계정으로 본인 기기에 설치 가능 (7일마다 재서명)
> **TestFlight**: Apple Developer Program($99/년) 가입 후 Archive → App Store Connect 업로드

### Android — Capacitor

```bash
# 최초 1회
npm i @capacitor/android
npx cap add android

# 이후 빌드할 때마다
npm run cap:android
# → Android Studio 자동 실행 → 에뮬레이터 또는 실기기 선택 후 Run
```

---

## 알람 기능 구조

### Settings 화면 옵션

| 항목 | 설명 | 기본값 |
|---|---|---|
| Hourly Alarm | 알람 전체 on/off | off |
| Message | 알림에 표시할 텍스트 | "Hourly check-in" |
| Quiet Hours Start | 알람 억제 시작 시각 | — |
| Quiet Hours End | 알람 재개 시각 | — |
| Debug Interval | 테스트용 단축 간격 | Off (hourly) |

> **디버그 팁**: Debug Interval을 "Every 1 min"으로 설정하면 1분마다 알람 발화 → 기능 빠르게 확인 가능

### 플랫폼별 알람 동작 방식

| 플랫폼 | 구현 방식 | 특이사항 |
|---|---|---|
| Web | `Notification API` + `setTimeout` 루프 | 탭이 열려있을 때만 동작 |
| Electron | Electron `Notification` + `setTimeout` 루프 | 트레이 최소화 상태에서도 동작 |
| iOS | `@capacitor/local-notifications` | 앱 열 때마다 다음 24시간 예약 갱신 (iOS 64개 한도 대응) |
| Android | `@capacitor/local-notifications` | `hourly-tick` 채널 자동 생성 |

### 모듈 구조

```
src/
├── storage.js                         # localStorage 읽기/쓰기 (notifications 설정 포함)
└── notifications/
    ├── NotificationManager.js         # 플랫폼 감지 + 공개 API
    ├── schedule.js                    # nextFireTime · buildBatch · 조용한 시간 계산
    ├── init.js                        # Settings UI 바인딩
    └── adapters/
        ├── web.js                     # Notification API
        ├── capacitor.js              # @capacitor/local-notifications
        └── electron.js               # Electron IPC 브릿지
```

**플랫폼 감지 순서** (`NotificationManager.js`):
```
Capacitor.isNativePlatform() → capacitor 어댑터
window.hourlyBridge          → electron 어댑터
default                      → web 어댑터
```

### iOS 64개 예약 한도 대응

iOS는 앱당 로컬 알림을 최대 64개까지 예약 가능. 앱 실행 시마다 다음 24시간분(24개)만 예약하고 기존 예약을 교체합니다. 알림 ID는 시간 기반으로 결정적으로 생성되어 중복 예약이 발생하지 않습니다.

---

## 파일 구조

```
Hourly/
├── index.html                 # 앱 전체 (HTML · CSS · 기존 JS 통합)
├── src/
│   ├── storage.js
│   └── notifications/         # 알람 모듈
├── electron/
│   ├── main.js                # Electron 메인 프로세스 (BrowserWindow · Tray · IPC)
│   └── preload.cjs            # contextBridge (hourlyBridge 노출)
├── capacitor.config.ts        # Capacitor 설정 (iOS · Android 공용)
├── electron-builder.yml       # Electron 패키징 설정
├── vite.config.js             # 빌드 설정
└── package.json
```

---

## 배포 로드맵

| Phase | 플랫폼 | 상태 | 비고 |
|---|---|---|---|
| 0 | Web + 알람 모듈 | ✅ 완료 | 정적 호스팅 그대로 유지 |
| 1 | iOS | 🔧 진행 중 | TestFlight 내부 테스트 → 추후 App Store |
| 2 | Windows | ✅ 완료 | Electron `npm run electron:build:win` |
| 3 | Android | 🔲 예정 | `npx cap add android` |
| 4 | macOS | 🔲 예정 | Electron `npm run electron:build:mac` + 노타리제이션 |

### iOS App Store 정식 배포 시 추가 작업

1. Apple Developer Program 가입 ($99/년)
2. App Store Connect 앱 레코드 생성 (Bundle ID: `com.yourname.hourly`)
3. `capacitor.config.ts`의 `appId` 실제 값으로 변경
4. 앱 아이콘 준비: `assets/icon.png` (1024×1024) → `npx capacitor-assets generate --ios`
5. Xcode → Archive → Distribute → App Store Connect → TestFlight 업로드

---

## 데이터 저장

- 모든 데이터는 **기기 로컬**에만 저장 (`localStorage`)
- 기기 간 동기화 없음 (v1 범위 외)
- 저장 키: `hourly_v5` (메모), `hourly_prefs_v5` (설정)
