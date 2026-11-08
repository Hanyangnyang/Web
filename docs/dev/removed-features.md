# 제거된 기능 (복원 참고용)

코드 복원 방법만 적습니다. 기능을 **왜** 뺐는지는 private 레포 `Hanyangnyang/Context`의 `context/history.md`, `context/ideas-backlog.md`에 적습니다.

## 도서관 로그인(인증) + QR 좌석 예약

한때 있었으나 **의도적으로 전부 제거된 기능**. 도서관 계정으로 로그인해서 입장용 QR 코드를 보고, 열람실 좌석을 조회·예약·반납하는 기능이었음.

- **제거 커밋**: `d9a0420` — "refactor: 사용하지 않는 도서관 로그인(인증) 및 QR/좌석 예약 관련 모든 기능 및 파일 제거" (2026-05-30, kdjidkr)
- **제거된 파일 20개**: `src/presentation/components/{QRView,LoginForm,ReserveForm}.jsx`, `src/presentation/hooks/useAuth.js`, `src/data/datasources/{Auth,Library}ApiDataSource.js`, `src/data/repositories/{Auth,Library}Repository.js`, `src/domain/repositories/I{Auth,Library}Repository.js`, `src/domain/usecases/{Login,Relogin,GetQRCode,GetSeat,ReserveSeat,CancelReservation,DischargeSeat}UseCase.js`, `App.jsx`/`di.js`/`BootContext.jsx`의 관련 연결부
- 이 커밋 이후에도 `domain/entities/{Room,Seat,QRCode}.js`, `presentation/hooks/{useQR,useSeat}.js`가 잔재로 남아있었는데, 2026-07-25에 마저 정리함 (di.js에 없는 `getQRCodeUseCase` 등을 import하고 있던 죽은 코드였음)
- API 쪽: `api/qr.js`, `api/seat.js`도 별도 커밋(`038939e` "도서관 좌석 예약 관련 미사용 API 7개 삭제")에서 제거됨

**복원하고 싶을 때**: 코드가 git 히스토리에 그대로 남아있으니 새로 짤 필요 없음.
```bash
# 삭제 직전 커밋(d9a0420^)에서 개별 파일 내용 확인
git show d9a0420^:src/presentation/components/QRView.jsx

# 삭제 직전 커밋에서 관련 파일 전체를 현재 워킹트리로 복원
git checkout d9a0420^ -- src/presentation/components/QRView.jsx src/presentation/components/LoginForm.jsx src/presentation/components/ReserveForm.jsx src/presentation/hooks/useAuth.js src/data/datasources/AuthApiDataSource.js src/data/datasources/LibraryApiDataSource.js src/data/repositories/AuthRepository.js src/data/repositories/LibraryRepository.js src/domain/repositories/IAuthRepository.js src/domain/repositories/ILibraryRepository.js src/domain/usecases/LoginUseCase.js src/domain/usecases/ReloginUseCase.js src/domain/usecases/GetQRCodeUseCase.js src/domain/usecases/GetSeatUseCase.js src/domain/usecases/ReserveSeatUseCase.js src/domain/usecases/CancelReservationUseCase.js src/domain/usecases/DischargeSeatUseCase.js
```
단, 이 코드는 지금(2026-07)의 클린아키텍처/DI 컨벤션 이전 스타일이라, 그대로 붙이기보단 현재 패턴(예: `PortalRepository.ts` 구조)에 맞춰 다시 짜는 셈 치는 게 나음. `api/qr.js`/`api/seat.js`는 `038939e^` 기준으로 같은 방식으로 복원 가능.
