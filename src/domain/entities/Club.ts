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
  description: string;
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
  description: string = '',
): ClubInfo => ({ id, name, category, activityType, room, instagram, aliases, description, fees, feeNote, recruitmentPeriod: null, activityDays: null, openingMeeting: null });

const fee = (amount: string, label: string | null = null): ClubFeeEntry => ({ label, amount });

export const CLUBS: ClubInfo[] = [
  club('hema', 'HEMA', '예술', '밴드', '412호', 'hema_1991_', [fee('15,000원', '신규'), fee('40,000원', '재가입')], null, ['헤마', '일렉', '기타', '밴드', '음악'], "에리카 유일 락 밴드동아리입니다!!! 락을 포함해서 JPOP, 인디, 펑크, 메탈 등등 여러 장르를 좋아하는 사람들이 모여 노는 동아리입니다!"),
  club('typhoon', '타이푼', '체육', '농구', '427호', 'typhoon_hanyang', [fee('20,000원', '신규'), fee('25,000원', '재가입')], null, [], "농구를 좋아하는 사람들, 술을 좋아하는 사람들을 위한 중앙농구동아리 타이푼!"),
  club('weflix', 'WEFLIX', '예술', '영화 관람', '430호', 'weflix2026', [fee('15,000원', '신규'), fee('10,000원', '재가입')], null, ['위플릭스'], "영화를 매개로 사람들과 다양한 소통을 하는 중앙동아리 입니다!"),
  club('moonge-cloud', '뭉게구름', '예술', '밴드', '420호', 'moonge_cloud', [fee('25,000원', '신규'), fee('20,000원', '재가입')], null, ['인디', '인디밴드', '노래', '음악', '기타'], "한양대 ERICA의 언플러그드 밴드 동아리 뭉게구름, 우리 같이 합주해요!"),
  club('martini', '마티니', '학술교양', '칵테일', '502호', 'hy_martini', [fee('35,000원', '신규'), fee('30,000원', '재가입')], null, [], "직접 만들고 함께 즐기는 칵테일 동아리 마티니입니다."),
  club('grim-ul', '그림얼', '예술', '만화·서브컬처', '442호', 'grimul_erica', [fee('20,000원', '신규'), fee('25,000원', '재가입')], null, [], "만화, 그림 동아리이자 교내 유일한 서브컬쳐 동아리, 그림얼입니다!"),
  club('viva', 'VIVA', '예술', '뮤지컬', '414호', 'viva.erica', [fee('20,000원')], null, ['비바', '노래', '음악', '춤', '댄스'], "한양대학교 ERICA 유일무이 뮤지컬 동아리 VIVA입니다! 혹시 뮤지컬 좋아하세요?"),
  club('e-rica', 'E-리카', '학술교양', 'e스포츠', '423호', 'esports_erica', [fee('15,000원')], null, ['이리카'], "즐거운 E스포츠 문화를 선도하는 E스포츠 동아리"),
  club('manchwi', '만취', '예술', '종합예술댄스', '422호', 'maaaaaaanchui', [fee('20,000원', '신규'), fee('15,000원', '재가입')], null, [], "만가지를 취하다 라는 뜻으로 다양한 장르의 춤을 추는 댄스동아리 만취입니다."),
  club('ccc', 'CCC', '종교', '기독교', '405호', 'hyuerica_ccc', [fee('20,000원', '신규')], null, ['씨씨씨'], "캠퍼스 안에서 그리스도의 사랑을 전하는 동아리"),
  club('tal', '탈', '예술', '풍물패', '410호', 'tal_pungmul', [fee('10,000원', '신규'), fee('15,000원', '재가입')], null, [], "사물놀이, 탈춤, 풍물놀이 등을 매개로 화합하고 모두가 즐길 수 있는 동아리"),
  club('pin', 'PIN', '체육', '볼링', '434호', null, [fee('20,000원', '신규'), fee('15,000원', '재가입')], null, ['핀', '볼링동아리', '운동'], "혼자 하면 어려운 볼링, 다 같이 즐겨요"),
  club('doh', 'DOH', '예술', '댄스', '448호', 'doh.official', [fee('10,000원', '신규'), fee('15,000원', '재가입')], null, ['디오에이치', '댄스'], "Dance Of Hanyang! 에리카 대표 댄스 동아리 DOH입니다!"),
  club('muppy', '무삐', '예술', '연극', '416호', 'muppy_hy', [fee('20,000원', '신규'), fee('15,000원', '재가입')], null, ['무대밖의삐에로', '연극동아리'], "실제 공연작을 우리만의 색으로 각색해 무대에 올립니다."),
  club('hy-pass', 'HY-PASS', '체육', '축구', '435호', 'hy__pass', [fee('20,000원', '남자'), fee('15,000원', '여자')], null, ['하이패스', '축구동아리', '운동'], "한양대 ERICA 유일 중앙 축구동아리"),
  club('hyu-hiba', '하이바', '체육', '야구', '421호', 'hyu_hiba', [fee('30,000원', '신규'), fee('40,000원', '선수'), fee('10,000원', '매니저')], null, [], "야구 직관과 대회출전 야구동아리 하이바입니다!"),
  club('mcpc', 'MCPC', '학술교양', '유학·교환학생', '443호', 'mcpc_hanyang', [fee('10,000원')], null, ['엠씨피씨', '유학', '교환학생', '국제교류', '영어', '영어회화'], "한양대 ERICA 국제교류 동아리"),
  club('herc', 'HERC', '체육', '러닝', '447호', 'herc.official', [fee('8,000원')], null, ['헐크', '달리기', '러닝크루', '런닝', '운동'], "웃고 떠들며 함께 달리는 HERC"),
  club('hycora', '하이코라', '학술교양', '코딩', '425호', 'hycora_hanyang', [fee('20,000원', '신규'), fee('10,000원', '재가입')], null, ['개발', 'AI', '컴퓨터'], "AI와 코딩을 이용한 공부하는 동아리!"),
  club('husa', 'HUSA', '봉사', '봉사', '417호', 'hy_husa_official', [fee('9,000원')], null, ['후사'], "봉사로 온기를, 인연으로 낭만을. HUSA와 함께!"),
  club('hyco', 'HYCO', '학술교양', '천문관측', '441호', 'hyco_erica', [fee('20,000원', '신입생'), fee('15,000원', '재학생')], null, ['하이코'], "같이 별보러 갈래"),
  club('salpan', '살판', '예술', '창작극', '438호', 'salpan_hyu', [fee('20,000원')], null, [], "생각을 공연으로 잇는 창작극 동아리 살판입니다."),
  club('pichinyang', '피치냥', '예술', '피아노', '413호', null, [fee('20,000원')], null, [], "피아노를 사랑하는 학생들이 모인 동아리입니다!"),
  club('sonagi', '소나기', '예술', '영화 감상·제작', '428호', 'sonagi_1985', [fee('20,000원', '신규'), fee('15,000원', '재가입')], null, [], "한양대 에리카의 유일무이 영화제작, 감상 중앙동아리"),
  club('hiclear', '하이클리어', '체육', '배드민턴', '433호', null, [], '미정', ['배드민턴동아리', '운동'], "실력 상관없이 누구나 즐길 수 있습니다!"),
  club('ourim', '어우림', '예술', '합창·아카펠라', '431호', 'ourim2026', [fee('15,000원', '신규'), fee('10,000원', '재가입')], null, [], "사람이 좋고 음악이 좋은 합창&아카펠라 동아리 어우림입니다."),
  club('kusa', 'KUSA', '학술교양', '토론', '445호', 'kusa.hy', [fee('5,000원', '신규'), fee('7,000원', '재가입')], null, ['쿠사'], "다양한 사람들과 토론하며 의견교류하고, 다양한 학교와 연합하는 연합토론동아리 KUSA입니다!"),
  club('hy-climb', 'HY-CLIMB', '체육', '클라이밍', '409호', 'hyc_hy_climb', [fee('15,000원', '신규'), fee('10,000원', '재가입')], null, ['하이클라임', '암벽', '볼더링', '클라이밍'], "실내 볼더링부터 자연 암벽까지, 클라이밍의 모든 것!"),
  club('rotaract', '로타랙트', '봉사', '봉사', '432호', 'hy_rotaract', [fee('10,000원')], null, [], "다양한 봉사활동과 즐거운 친목도모를 한 번에 하는 동아리"),
  club('hany-baram', '하늬바람', '예술', '밴드', '404호', 'hany__baram', [fee('25,000원', '신규'), fee('20,000원', '재가입')], null, ['노래', '음악', '밴드'], "장르불문 밴드 동아리 하늬바람입니다."),
  club('scuba', '스킨스쿠버', '체육', '스쿠버다이빙', '444호', 'hyu.scuba', [], '미정', [], "우리 바다를 탐험하며 바다의 가치를 배우는 스쿠버"),
  club('joy', 'JOY', '예술', '핑거스타일 기타', '424호', 'joy_official.ac', [fee('20,000원')], null, [], "에리카 유일, 낭만 핑거스타일 기타동아리 JOY입니다!"),
  club('giwoo', '기우회', '학술교양', '보드게임', '429호', 'hyuboardgame', [fee('20,000원')], null, [], "다양한 장르 보드게임을 통해 새로운 만남과 경험을 할 수 있는 동아리 기우회입니다!"),
  club('blue-sound', '파랑소래', '예술', '클래식 기타', '504호', 'hyu_bluesound_e', [fee('15,000원', '신규'), fee('10,000원', '재가입')], null, [], "하나되어 연주하는 클래식 기타 동아리"),
  club('arori', '아로리', '학술교양', '독서', '437호', 'arori_story', [fee('15,000원', '신규'), fee('10,000원', '재가입')], null, [], "독서를 하고 싶은 사람들이 모여 자유롭게 소통할 수 있는 독서 토론동아리"),
  club('hyride', 'HYRIDE', '체육', '자전거', '402호', 'hy_ride', [fee('15,000원')], '자전거 거치·보관비 10,000원 (희망자)', ['하이라이드'], "두 바퀴로 함께 달리는 즐거움, 자전거 동아리 HYRIDE입니다."),
  club('arosaegim', '아로새김', '예술', '전시예술기획', '426호', 'aro__saegim', [fee('18,000원', '신규'), fee('14,000원', '재가입')], null, [], "전시로 사람과 사람을 연결하는 동아리"),
  club('hytec', '하이텍', '체육', '테니스', '407호', 'hytec_tennis', [fee('40,000원', '신규'), fee('30,000원', '재가입')], null, ['하이텍', 'HY-TeC', '테니스'], "평소 접하기 쉽지않은 테니스를 재밌게 배우고 함께 경기해볼 수 있는 동아리"),
  club('hacs', 'HACS', '봉사', '봉사', '436호', 'hacs_hyu', [fee('8,000원')], null, [], "봉사도 진심! 노는 것도 진심!"),
  club('maha', 'MAHA', '체육', '보드', '449호', 'maha_hanyang', [fee('25,000원', '신규'), fee('15,000원', '재가입')], null, [], "한양대 ERICA 유일무이한 보드동아리, MAHA! 보드 위에서 느낄 짜릿함과 설렘을 기대하는 마음 하나로, 다 함께 어울려 즐기는 동아리입니다."),
  club('powderive', '탁우회', '체육', '탁구', '411호', 'powerdrive_hanyang', [fee('25,000원')], null, ['핑퐁', 'pingpong'], "탁구공보다 가볍게 들어와 인생을 스매시 당하는 곳 ♡"),
  club('feel-so-good', '필소굿', '예술', '흑인음악', '415호', 'feelsooooooooooogood', [fee('15,000원', '신규'), fee('20,000원', '재가입')], null, ['힙합', 'R&B', '랩'], "교내 유일무이 흑인음악동아리 필소굿입니다."),
  club('ebs', 'EBS', '종교', '영어 성경 공부', '408호', 'hyu_ebs_erica', [fee('5,000원', '신규')], null, ['이비에스'], "EBS 동아리는 English bible study로 영어로 성경 공부하는 동아리입니다"),
  club('yacht', '요트부', '체육', '요트', '403호', 'hyyc_official', [fee('60,000원')], null, [], "요트를 타면서 바람을 읽고 팀워크를 맞추며, 넓은 바다에서 도전정신과 리더십을 키우는 요트부입니다"),
  club('hy-focus', 'HY-FOCUS', '예술', '사진', '505호', 'hy_focus', [fee('28,000원', '신규'), fee('20,000원', '재가입(재학생)'), fee('10,000원', '재가입(휴학생)')], '1년 이상 활동한 4학년은 무료', ['하이포커스'], "사진과 카메라를 사랑하는 사람들"),
  club('navigator', '네비게이토', '종교', '기독교', '440호', null, [fee('무료')], null, [], "성경을 공부하는 기독교 동아리입니다."),
  club('uniform', '유니폼', '예술', '패션', '406호', 'uniform_erica', [fee('10,000원', '신규'), fee('8,000원', '재가입')], null, [], "패션이라는 언어로 타인과 교류하는 패션 커뮤니티"),
  club('hy-fly', 'HY-FLY', '학술교양', '드론', null, null, [], null, [], "드론 자격증 준비 및 드론을 제작하고 날려보는 드론 동아리입니다."),
  club('hanya', '한야', '체육', '야구부 서포터즈', null, 'hy_hanya', [], null, ['야구응원', '라이온즈', '야구'], "마운드 위의 열정을 프레임에 담는 곳, 한양대학교 야구부 서포터즈 HANYA"),
  club('sfc', '학생신앙운동(SFC)', '종교', '기독교', null, 'hanyang_erica_sfc', [], null, [], "하나님, 성경, 교회 중심의 삶을 실천하는 기독교 대학생들의 모임이에요!"),
  club('lux-mundi', 'LUX-MUNDI', '종교', '가톨릭', null, null, [], null, [], "한양대 에리카 천주교 동아리로, 신앙을 나누고 봉사하는 동아리입니다!"),
];

export const CLUB_CATEGORIES: ClubCategory[] = ['예술', '체육', '학술교양', '봉사', '종교'];
