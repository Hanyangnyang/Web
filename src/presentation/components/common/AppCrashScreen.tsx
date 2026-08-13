// 앱 루트 ErrorBoundary의 대체 화면.
export function AppCrashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-text-main text-base font-bold">앱에 문제가 생겼어요</p>
      <p className="text-text-sub text-sm font-medium">잠시 후 다시 시도해 주세요.</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-6 py-2 rounded-full bg-primary text-white text-sm font-bold active:scale-95 transition-transform"
      >
        다시 불러오기
      </button>
    </div>
  );
}
