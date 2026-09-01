// 도메인 엔티티: 2026학년도 1학기 ERICA 중앙동아리 모집 정보
export type ClubCategory = '예술' | '체육' | '학술교양' | '봉사' | '종교';

export interface ClubFeeEntry {
  label: string | null;
  amount: string;
}

export interface ClubInfo {
  id: string;
  name: string;
  category: ClubCategory;
  activityType: string;
  room: string | null;
  instagram: string | null;
  aliases: string[];
  fees: ClubFeeEntry[];
  feeNote: string | null;
  recruitmentPeriod: null;
  activityDays: null;
  openingMeeting: null;
}

const club = (
  id: string,
  name: string,
  category: ClubCategory,
  activityType: string,
  room: string | null,
  instagram: string | null,
  fees: ClubFeeEntry[],
  feeNote: string | null = null,
  aliases: string[] = [],
): ClubInfo => ({ id, name, category, activityType, room, instagram, aliases, fees, feeNote, recruitmentPeriod: null, activityDays: null, openingMeeting: null });

const fee = (amount: string, label: string | null = null): ClubFeeEntry => ({ label, amount });

export const CLUBS: ClubInfo[] = [
  club('hema', 'HEMA', '예술', '밴드', '412호', 'hema_1991_', [fee('15,000원', '신규'), fee('40,000원', '재가입')], null, ['헤마']),
  club('typhoon', '타이푼', '체육', '농구', '427호', 'typhoon_hanyang', [fee('20,000원', '신규'), fee('25,000원', '재가입')]),
  club('weflix', 'WEFLIX', '예술', '영화 관람', '430호', 'weflix2026', [fee('15,000원', '신규'), fee('10,000원', '재가입')], null, ['위플릭스']),
  club('moonge-cloud', '뭉게구름', '예술', '밴드', '420호', 'moonge_cloud', [fee('25,000원', '신규'), fee('20,000원', '재가입')]),
  club('cracker', '크래커', '학술교양', '공모전·자기개발', '446호', 'cracker_hanyang', [fee('15,000원', '신규'), fee('11,000원', '재가입')]),
  club('martini', '마티니', '학술교양', '칵테일', '502호', null, [fee('35,000원', '신규'), fee('30,000원', '재가입')]),
  club('grim-ul', '그림얼', '예술', '만화·서브컬처', '442호', 'grimul_erica', [fee('20,000원', '신규'), fee('25,000원', '재가입')]),
  club('viva', 'VIVA', '예술', '뮤지컬', '414호', 'viva.erica', [fee('20,000원')], null, ['비바']),
  club('e-rica', 'E-리카', '학술교양', 'e스포츠', '423호', 'hyu.erica.esports', [fee('15,000원')], null, ['이리카']),
  club('manchwi', '만취', '예술', '힙합댄스', '422호', 'maaaaaaanchui', [fee('20,000원', '신규'), fee('15,000원', '재가입')]),
  club('ccc', 'CCC', '종교', '기독교', '405호', 'hyuerica_ccc', [fee('20,000원', '신규')], null, ['씨씨씨']),
  club('tal', '탈', '예술', '국악', '410호', 'tal_pungmul', [fee('10,000원', '신규'), fee('15,000원', '재가입')]),
  club('pin', 'PIN', '체육', '볼링', '434호', null, [fee('20,000원', '신규'), fee('15,000원', '재가입')], null, ['핀']),
  club('doh', 'DOH', '예술', '댄스', '448호', 'doh.official', [fee('10,000원', '신규'), fee('15,000원', '재가입')], null, ['디오에이치']),
  club('muppy', '무삐', '예술', '연극', '416호', 'muppy_hy', [fee('20,000원', '신규'), fee('15,000원', '재가입')]),
  club('hy-pass', 'HY-PASS', '체육', '축구', '435호', 'hy_pass', [fee('20,000원', '남자'), fee('15,000원', '여자')], null, ['하이패스']),
  club('hyu-hiba', '하이바', '체육', '야구', '421호', 'hyu_hiba.official', [fee('30,000원', '신규'), fee('40,000원', '선수'), fee('10,000원', '매니저')]),
  club('mcpc', 'MCPC', '학술교양', '유학·교환학생', '443호', 'mcpc_hanyang', [fee('10,000원')], null, ['엠씨피씨']),
  club('herc', 'HERC', '체육', '러닝', '447호', 'herc.official', [fee('8,000원')], null, ['헐크']),
  club('hycora', '하이코라', '학술교양', '코딩', '425호', 'hycora_hanyang', [fee('20,000원', '신규'), fee('10,000원', '재가입')]),
  club('husa', 'HUSA', '봉사', '봉사', '417호', 'hy_husa_official', [fee('9,000원')], null, ['후사']),
  club('hyco', 'HYCO', '학술교양', '천문관측', '441호', 'hyco_erica', [fee('20,000원', '신입생'), fee('15,000원', '재학생')], null, ['하이코']),
  club('salpan', '살판', '예술', '창작극', '438호', 'salpan_hyu', [fee('20,000원')]),
  club('pichinyang', '피치냥', '예술', '피아노', '413호', null, [fee('20,000원')]),
  club('sonagi', '소나기', '예술', '영화 감상·제작', '428호', 'sonagi_1985', [fee('20,000원', '신규'), fee('15,000원', '재가입')]),
  club('hiclear', '하이클리어', '체육', '배드민턴', '433호', null, [], '미정'),
  club('ourim', '어우림', '예술', '합창·아카펠라', '431호', 'ourim2026', [fee('15,000원', '신규'), fee('10,000원', '재가입')]),
  club('kusa', 'KUSA', '학술교양', '토론', '445호', 'kusa.hy', [fee('5,000원', '신규'), fee('7,000원', '재가입')], null, ['쿠사']),
  club('hy-climb', 'HY-CLIMB', '체육', '클라이밍', '409호', 'hyc_hy_climb', [fee('15,000원', '신규'), fee('10,000원', '재가입')], null, ['하이클라임']),
  club('rotaract', '로타랙트', '봉사', '봉사', '432호', 'hy_rotaract', [fee('10,000원')]),
  club('hany-baram', '하늬바람', '예술', '밴드', '404호', 'hany_baram', [fee('25,000원', '신규'), fee('20,000원', '재가입')]),
  club('scuba', '스킨스쿠버', '체육', '스쿠버다이빙', '444호', 'hyu.scuba', [], '미정'),
  club('joy', 'JOY', '예술', '핑거스타일 기타', '424호', 'joy_official.ac', [fee('20,000원')]),
  club('giwoo', '기우회', '학술교양', '보드게임', '429호', 'hyuboardgame', [fee('20,000원')]),
  club('blue-sound', '파랑소래', '예술', '클래식 기타', '504호', 'hyu_bluesound_e', [fee('15,000원', '신규'), fee('10,000원', '재가입')]),
  club('arori', '아로리', '학술교양', '독서', '437호', 'arori_story', [fee('15,000원', '신규'), fee('10,000원', '재가입')]),
  club('hyride', 'HYRIDE', '체육', '자전거', '402호', 'hy_ride', [fee('15,000원')], '자전거 거치·보관비 10,000원 (희망자)', ['하이라이드']),
  club('arosaegim', '아로새김', '예술', '전시 기획', '426호', 'aro__saegim', [fee('18,000원', '신규'), fee('14,000원', '재가입')]),
  club('hytec', '하이텍', '체육', '테니스', '407호', 'hytec_tennis', [fee('40,000원', '신규'), fee('30,000원', '재가입')], null, ['하이텍']),
  club('hacs', 'HACS', '봉사', '봉사', '436호', 'hacs_hyu', [fee('8,000원')]),
  club('maha', 'MAHA', '체육', '보드', '449호', 'maha_hanyang', [fee('25,000원', '신규'), fee('15,000원', '재가입')]),
  club('powderive', '탁우회', '체육', '탁구', '411호', 'powderive_hanyang', [fee('25,000원')]),
  club('feel-so-good', '필소굿', '예술', '흑인음악', '415호', 'feelsoooooooooogood', [fee('15,000원', '신규'), fee('20,000원', '재가입')]),
  club('ebs', 'EBS', '종교', '영어 성경 공부', '408호', 'hyu_ebs_erica', [fee('5,000원', '신규')], null, ['이비에스']),
  club('yacht', '요트부', '체육', '요트', '403호', 'hyyc_official', [fee('60,000원')]),
  club('hy-focus', 'HY-FOCUS', '예술', '사진', '505호', 'hy_focus', [fee('28,000원', '신규'), fee('20,000원', '재가입(재학생)'), fee('10,000원', '재가입(휴학생)')], '1년 이상 활동한 4학년은 무료', ['하이포커스']),
  club('navigator', '네비게이트', '종교', '기독교', '440호', null, [fee('무료')]),
  club('uniform', '유니폼', '예술', '패션', '406호', 'uniform_erica', [fee('10,000원', '신규'), fee('8,000원', '재가입')]),
];

export const CLUB_CATEGORIES: ClubCategory[] = ['예술', '체육', '학술교양', '봉사', '종교'];
