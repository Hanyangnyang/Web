# 하냥냥 앱 초기화 아키텍처 (Boot System)

이 문서는 앱의 초기 로딩(Splash Screen) 및 데이터 준비 과정을 관리하는 중앙 집중식 시스템에 대해 설명합니다. 미래의 개발자나 AI는 기능을 추가할 때 이 규칙을 준수해야 합니다.

## 1. 개요
앱이 처음 실행될 때 여러 곳에서 데이터를 불러옵니다(인증 정보, 식단 정보 등). 모든 필수 데이터가 로드될 때까지 스플래시 스크린을 유지하기 위해 `BootContext`를 사용합니다.

## 2. 작동 원리
1.  `BootContext.jsx`의 `readyMap`에 초기화가 필요한 서비스 이름을 정의합니다.
2.  각 기능별 훅(`useAuth`, `useMenu` 등)은 로딩이 완료되면 `markReady(name)`를 호출합니다.
3.  모든 서비스가 `ready` 상태가 되면 `isAppReady`가 `true`가 됩니다.
4.  `App.jsx`는 `isAppReady`가 `true`이고 스플래시 최소 유지 시간이 지나면 화면을 전환합니다.

## 3. 새로운 기능(로딩) 추가 방법
새로운 비동기 데이터 로딩이 앱 시작 시 필수적이라면 다음 단계를 따르세요:

1.  **BootContext 수정**: `src/presentation/context/BootContext.jsx`의 `readyMap` 상태에 새로운 키를 추가합니다.
    ```javascript
    const [readyMap, setReadyMap] = useState({
      auth: false,
      menu: false,
      notice: false, // 새 기능 추가
    });
    ```
2.  **해당 훅에서 신호 전송**: 데이터를 불러오는 훅에서 `useBoot`를 가져와 `markReady`를 호출합니다.
    ```javascript
    const { markReady } = useBoot();
    useEffect(() => {
      fetchData().then(() => markReady('notice'));
    }, [markReady]);
    ```

## 4. 주의사항
- `sessionStorage`를 통해 세션당 한 번만 스플래시가 뜨도록 관리하고 있습니다.
- 이 구조를 무시하고 `App.jsx`에서 개별 로딩 상태를 직접 체크하지 마십시오.
