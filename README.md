# TOKYO / SHOPPING GUIDE

도쿄 여행 중 가고 싶은 쇼핑 장소를 지도 위에 모아 두고, 지역과 카테고리로 찾아보는 개인용 웹앱입니다. 로그인과 서버 없이 브라우저에서만 동작합니다.

**Editorial city guide · Warm minimal**

## 기능

- 도쿄 지도와 카테고리별 매장 핀
- 지역, 카테고리, 이름 검색 필터
- 매장 미리보기와 상세
- 즐겨찾기, 방문 전 / 방문 완료
- Google Maps 도보 길찾기
- 매장 직접 추가, 수정, 삭제
- JSON 내보내기 / 가져오기, 기본 목록으로 되돌리기
- 현재 위치 표시
- 모바일 지도 / 목록 전환, 데스크톱은 왼쪽 패널 + 오른쪽 지도

## 실행

Node.js 18 이상이 필요합니다.

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:5173/](http://localhost:5173/) 을 엽니다.

```bash
npm run build
npm run preview
```

`npm run build` 결과물 `dist`는 Cloudflare Pages 같은 정적 호스팅에 올리면 됩니다. 주소는 해시 라우팅(`#/explore`)을 쓰므로 별도 SPA 리다이렉트 설정은 필요 없습니다.

## 데이터

- 처음 열리는 매장 목록은 `src/data/seed.ts` 입니다.
- 추가, 수정, 즐겨찾기, 방문 기록은 이 브라우저의 `localStorage`에만 저장됩니다.
- 브라우저 데이터를 지우거나 기기를 바꾸면 자동으로 따라오지 않습니다. 저장 화면에서 JSON으로 내보낸 뒤 다른 기기에서 가져오면 됩니다.
- 지도는 인터넷 연결이 필요합니다.

## 지도

지도 타일은 [OpenFreeMap](https://openfreemap.org/) 과 OpenStreetMap 데이터를 사용합니다. 지명은 한국어를 우선하고, 한국어가 없으면 영어나 현지 표기로 남습니다.

## 기술

- React, TypeScript, Vite, Tailwind CSS
- MapLibre GL
- OpenFreeMap / OpenStreetMap

## 라이선스

개인 여행용 프로젝트입니다. 지도 데이터는 OpenStreetMap 기여자에게 귀속됩니다.
