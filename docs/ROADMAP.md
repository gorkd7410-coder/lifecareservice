# 다음 단계 설계: 관련 기사 자동 수집과 관리자 페이지

지금 사이트는 정적 파일(`index.html`, `app.js`, `data/*.json`)만으로 Vercel에서 돌아갑니다.
아래 두 기능은 데이터 모양을 그대로 유지한 채 "어디서 데이터를 읽느냐"만 바꾸는 방식으로 붙입니다.

## 데이터 모양 (지금 JSON = 나중 DB 테이블)

| 파일 | 나중 테이블 | 핵심 필드 |
| --- | --- | --- |
| `data/products.json` | products | id, cat, name, summary, price, saleType(sale/rental/inquiry), options, stock, purchasable, smartstore, image |
| `data/posts.json` | posts | id, type(project/info), title, date, url, thumbnail, client, location, summary, **productIds** |
| `data/news.json` | news | id, title, source, date, url, **productIds**, (추가) keyword, fetchedAt |
| `data/categories.json` | categories | id, name, desc |
| `data/site.json` | settings | 연락처, 스토어·블로그 주소, 사업자 정보 |

상품과 글은 `productIds` 로 여러 개를 연결합니다. 글 하나가 전자칠판과 전자교탁 둘 다에 걸릴 수 있습니다.

## 1단계: 블로그 글 자동 가져오기

- 네이버 블로그 RSS(`https://rss.blog.naver.com/lifecareservicejoa.xml`)에서 제목, 날짜, 링크, 대표 이미지를 읽어 `posts` 에 넣습니다.
- 상품 연결은 관리자가 체크박스로 고르거나, 글 제목의 키워드(예: "전자칠판")로 자동 추천합니다.
- 요약(`summary`)과 납품처(`client`, `location`)는 관리자에서 한 줄씩 적습니다.

## 2단계: 관련 기사 자동 수집

- 네이버 검색 API의 뉴스 검색(`openapi.naver.com/v1/search/news.json`)을 상품별 키워드로 호출합니다. 무료 할당량은 하루 25,000회라 충분합니다. 기사 본문을 긁지 않고 제목·링크·언론사만 저장하므로 저작권 부담이 적습니다.
- 상품마다 `newsKeywords` 필드(예: `["전자칠판", "디지털 교실"]`)를 두고, 최근 30일 기사 중 상위 몇 건만 보여 줍니다.
- Vercel Cron Job으로 하루 1~2번 실행하는 API 라우트(`/api/cron/news`)가 수집해 DB에 저장합니다.
- 필요한 것: 네이버 개발자센터 애플리케이션 등록(Client ID/Secret), Vercel 환경 변수.

## 3단계: 관리자 페이지

- 추천 구성: **Supabase**(무료 DB + 로그인 + 이미지 저장소) + Vercel.
  - `/admin` 에서 로그인한 사람만 상품·글·기사를 추가, 수정, 숨김 처리합니다.
  - 사이트는 `data/*.json` 대신 Supabase에서 같은 모양의 데이터를 읽습니다. `app.js` 의 `load()` 한 곳만 바꾸면 됩니다.
- 관리자 화면 구성
  - 상품: 목록, 추가/수정, 사진 업로드, 노출 순서
  - 사례 글: 블로그에서 가져온 글 목록 → 상품 연결, 요약 작성, 노출 여부
  - 기사: 자동 수집된 기사 중 숨길 것 체크
  - 문의: 문의 폼 접수 내역 (문의 폼을 DB에 저장하도록 연결)

## 4단계: 결제

- 상품의 `purchasable` 을 true로 바꾸면 "바로 구매" 버튼이 켜지도록 되어 있습니다.
- 토스페이먼츠 또는 포트원(PortOne)을 붙이고, 주문 테이블과 결제 확인 API를 추가합니다.
- 결제를 붙이기 전에 이용약관, 개인정보처리방침, 환불정책, 통신판매업 신고 정보가 필요합니다.
