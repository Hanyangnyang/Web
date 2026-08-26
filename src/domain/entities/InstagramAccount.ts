// 도메인 엔티티: 한양대 ERICA 공식 인스타그램 계정 목록 및 프로필 정보
export interface InstagramAccountInfo {
  username: string;
  desc: string;
  profilePicUrl: string;
}

export const INSTA_ACCOUNTS: { erica: InstagramAccountInfo[]; college: InstagramAccountInfo[] } = {
  erica: [
    { username: 'hanyang_erica',                   desc: '한양대학교 ERICA 공식 인스타그램', profilePicUrl: '/assets/insta-profiles/hanyang_erica.jpg' },
    { username: 'hanyang_erica_stu',               desc: 'ERICA 총학생회', profilePicUrl: '/assets/insta-profiles/hanyang_erica_stu.jpg' },
    { username: 'hanyang_erica_club_association',  desc: '총동아리연합회', profilePicUrl: '/assets/insta-profiles/hanyang_erica_club_association.jpg' },
    { username: 'hyuerica',                        desc: '학술정보관', profilePicUrl: '/assets/insta-profiles/hyuerica.jpg' },
    { username: 'hanyangerica',                    desc: '사랑한대', profilePicUrl: '/assets/insta-profiles/hanyangerica.jpg' },
  ],
  college: [
    { username: 'hyu_lions',                    desc: 'LIONS 칼리지 학생회', profilePicUrl: '/assets/insta-profiles/hyu_lions.jpg' },
    { username: 'hyu_soongan_',                 desc: '커뮤니케이션&컬쳐대학', profilePicUrl: '/assets/insta-profiles/hyu_soongan_.jpg' },
    { username: 'hyu_erica_eng',                desc: '공학대학', profilePicUrl: '/assets/insta-profiles/hyu_erica_eng.jpg' },
    { username: 'hypharmacy',                   desc: '약학대학', profilePicUrl: '/assets/insta-profiles/hypharmacy.jpg' },
    { username: 'design_hyu',                   desc: '디자인대학', profilePicUrl: '/assets/insta-profiles/design_hyu.jpg' },
    { username: 'hanyang_gon',                  desc: '글로벌문화통상대학', profilePicUrl: '/assets/insta-profiles/hanyang_gon.jpg' },
    { username: 'hyu_mood',                     desc: '경상대학', profilePicUrl: '/assets/insta-profiles/hyu_mood.jpg' },
    { username: 'hyu_computing',                desc: '소프트웨어융합대학', profilePicUrl: '/assets/insta-profiles/hyu_computing.jpg' },
    { username: 'hyu_e_sports_and_arts_vibe',   desc: '예체능대학', profilePicUrl: '/assets/insta-profiles/hyu_e_sports_and_arts_vibe.jpg' },
    { username: 'hyu_erica_atc',                desc: '첨단융합대학', profilePicUrl: '/assets/insta-profiles/hyu_erica_atc.jpg' },
  ],
};
