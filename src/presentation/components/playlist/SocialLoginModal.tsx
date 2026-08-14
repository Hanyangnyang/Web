import { X } from 'lucide-react';

interface SocialLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SocialLoginModal({ isOpen, onClose }: SocialLoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-80 p-6 relative animate-slideUp">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* 제목 */}
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
          로그인이 필요해요
        </h2>

        {/* 안내문 */}
        <p className="text-center text-gray-600 text-sm mb-6">
          소셜 로그인을 통해 곡에 좋아요를 눌 수 있습니다
        </p>

        {/* 카카오 로그인 버튼 */}
        <button className="w-full bg-[#FFE812] hover:bg-[#FFD700] text-gray-900 font-bold py-3 rounded-lg transition-colors mb-3 flex items-center justify-center gap-2 active:scale-95">
          <span>🔗</span>
          카카오 로그인
        </button>

        {/* 구글 로그인 버튼 */}
        <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-95">
          <span>🔗</span>
          구글 로그인
        </button>

        {/* 하단 안내 */}
        <p className="text-center text-gray-500 text-xs mt-4">
          로그인 후에도 언제든지 취소할 수 있습니다
        </p>
      </div>
    </div>
  );
}
