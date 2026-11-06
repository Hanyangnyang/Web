// 프린터 가격 문자열 ↔ 서비스별(복사·인쇄·스캔·팩스) × 흑백/컬러 입력값 변환.
// 서버의 price는 숫자가 아닌 자유 문자열이라, 제보 폼은 칸별로 받아 아래 형식으로 합쳐 보낸다:
//   '복사 흑백 100원, 컬러 500원 / 인쇄 흑백 100원 / 스캔 흑백 0원'
//  - 서비스끼리는 ' / ', 한 서비스 안의 흑백·컬러는 ', ' (API 문서의 A4·A3 예시와 같은 구분자)
//  - 비운 칸·고르지 않은 서비스는 문자열에서 뺀다, 무료는 '0원'
// 조회한 가격은 옛 자유 형식도 섞여 있으므로 화면 표시는 서버 문자열을 그대로 쓰고, 이 파서는 수정 폼을 미리 채울 때만 쓴다.

export const PRINT_SERVICES = ['복사', '인쇄', '스캔', '팩스'] as const;
export type PrintService = (typeof PRINT_SERVICES)[number];

export interface ColorPrices {
  mono: string;  // 흑백 가격 (숫자만, 빈 문자열 = 모름)
  color: string; // 컬러 가격
}

export type ServicePrices = Record<PrintService, ColorPrices>;

export const EMPTY_SERVICE_PRICES: ServicePrices = {
  복사: { mono: '', color: '' },
  인쇄: { mono: '', color: '' },
  스캔: { mono: '', color: '' },
  팩스: { mono: '', color: '' },
};

// 고른 서비스 중 값이 하나라도 있는 것만, PRINT_SERVICES 순서대로 합친다. 아무것도 없으면 ''
export function composePrice(selected: readonly PrintService[], prices: ServicePrices): string {
  return PRINT_SERVICES
    .filter((s) => selected.includes(s))
    .map((s) => {
      const { mono, color } = prices[s];
      const parts = [mono !== '' && `흑백 ${mono}원`, color !== '' && `컬러 ${color}원`].filter(Boolean);
      return parts.length > 0 ? `${s} ${parts.join(', ')}` : '';
    })
    .filter(Boolean)
    .join(' / ');
}

export interface ParsedPrice {
  selected: PrintService[];
  prices: ServicePrices;
  // 문자열의 모든 부분을 칸으로 옮겼는지 — false면 칸에 다 못 담은 옛 자유 형식(예: 'A3 가능')이 섞여 있다.
  // 이때 폼은 원래 문자열을 따로 보여줘서 사용자가 빠진 정보를 알 수 있게 한다
  complete: boolean;
}

const amount = (segment: string, tag: '흑백' | '컬러'): string => {
  const m = segment.match(new RegExp(`${tag}\\s*([\\d,]+)\\s*원`));
  return m ? m[1].replace(/,/g, '') : '';
};

// 위 형식의 문자열을 칸 값으로 되돌린다.
// 서비스 이름 없이 '흑백 50원 · 컬러 300원'처럼 흑백/컬러만 있는 옛 형식은 가장 흔한 '인쇄'로 본다
export function parsePrice(price: string | null): ParsedPrice {
  const prices: ServicePrices = structuredClone(EMPTY_SERVICE_PRICES);
  const selected: PrintService[] = [];
  let complete = true;

  for (const raw of (price ?? '').split('/')) {
    const segment = raw.trim();
    if (!segment) continue;
    const named = PRINT_SERVICES.find((s) => segment.startsWith(s));
    const mono = amount(segment, '흑백');
    const color = amount(segment, '컬러');
    if (!mono && !color) { complete = false; continue; }

    const service: PrintService = named ?? '인쇄';
    // 같은 서비스가 두 번 나오면(예: 서비스 이름 없는 조각이 여러 개) 앞의 값을 지키고 나머지는 '못 옮김'으로 둔다
    if (selected.includes(service)) { complete = false; continue; }
    selected.push(service);
    prices[service] = { mono, color };

    // 금액 표기 말고 남은 글자(예: '(A3 가능)')가 있으면 칸에 못 담은 정보가 있는 것
    const leftover = segment
      .replace(named ?? '', '')
      .replace(/(흑백|컬러)\s*[\d,]+\s*원/g, '')
      .replace(/[,·\s]/g, '');
    if (leftover) complete = false;
  }

  return { selected, prices, complete };
}
