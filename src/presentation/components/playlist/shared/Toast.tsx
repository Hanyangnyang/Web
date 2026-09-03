interface ToastProps {
  message: string;
}

// 화면 하단에 잠깐 떴다 사라지는 토스트 — 신고 접수 완료/링크 복사 완료 등 여러 화면이 공유하는 스타일
export function Toast({ message }: ToastProps) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-[200] whitespace-pre-line text-center copy-toast">
      {message}
    </div>
  );
}
