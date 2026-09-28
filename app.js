/* 라이프케어서비스 홈페이지
   데이터는 data/*.json 에 있고, 이 파일은 그걸 읽어 화면을 그립니다.
   - products.json : 상품. 결제를 나중에 붙일 수 있게 saleType, price, options, stock, purchasable 필드를 둡니다.
   - posts.json    : 블로그 글. productIds 로 상품과 연결되고, type 이 "project" 면 납품·설치 사례로 보여 줍니다.
   - news.json     : 관련 기사. 지금은 예시이고, 나중에 크롤러가 자동으로 채웁니다 (docs/ROADMAP.md).
   관리자 페이지가 생기면 이 JSON 대신 DB/API 에서 같은 모양의 데이터를 받으면 됩니다. */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const won = n => n.toLocaleString("ko-KR") + "원";
const dot = d => d.replaceAll("-", ".");

let site, categories, products, posts, news;
const catOf = id => categories.find(c => c.id === id);
const inCat = id => products.filter(p => p.cat === id);
const byDate = (a, b) => b.date.localeCompare(a.date);
const postsFor = id => posts.filter(x => x.productIds.includes(id)).sort(byDate);
const newsFor = id => news.filter(x => x.productIds.includes(id)).sort(byDate);

async function load(){
  const get = f => fetch(`data/${f}.json`, {cache:"no-cache"}).then(r => { if (!r.ok) throw new Error(f); return r.json(); });
  [site, categories, products, posts, news] = await Promise.all(["site","categories","products","posts","news"].map(get));
}

/* ── 조각들 ─────────────────────────── */
function priceHTML(p){
  if (p.saleType === "inquiry") return `<span class="price">견적 문의</span>`;
  if (p.saleType === "rental") return `<span class="price">월 ${won(p.price)} <small>${p.rentalMonths}개월</small></span>`;
  return `<span class="price">${won(p.price)}</span>`;
}
function badgesHTML(p){
  const out = [];
  if (p.saleType === "rental") out.push(`<span class="badge rental">렌탈</span>`);
  if (p.stock === "out") out.push(`<span class="badge muted">품절</span>`);
  else if (p.stock === "low") out.push(`<span class="badge rental">재고 적음</span>`);
  if (p.tags.includes("인기")) out.push(`<span class="badge">인기</span>`);
  return out.join("");
}
const tileHTML = (p, label) => p.image
  ? `<div class="thumb"><img src="${esc(p.image)}" alt="" loading="lazy"></div>`
  : `<div class="thumb" style="background:var(${catOf(p.cat).tone})"><span class="glyph">${label}</span></div>`;

function caseHTML(x){
  const tone = catOf(products.find(p => p.id === x.productIds[0])?.cat || "edu")?.tone || "--t1";
  const cover = x.thumbnail
    ? `<div class="cover"><img src="${esc(x.thumbnail)}" alt="" loading="lazy"></div>`
    : `<div class="cover" style="background:var(${tone})"><span class="glyph">블로그 대표 사진</span></div>`;
  const meta = [dot(x.date), x.client, x.location].filter(Boolean).map(esc).join(" · ");
  return `<a class="case" href="${esc(x.url)}" target="_blank" rel="noopener">
    ${cover}
    <div class="body">
      <div class="meta">${x.type === "project" ? `<span class="badge">납품 사례</span>` : `<span class="badge muted">정보</span>`}<span>${meta}</span></div>
      <h3>${esc(x.title)}</h3>
      <p>${esc(x.summary)}</p>
      <span class="more">블로그에서 자세히 보기 →</span>
    </div></a>`;
}

/* 상품 바로 아래에 붙는 납품 사례 줄: 썸네일과 제목만 간단히 */
function stripHTML(p){
  const list = postsFor(p.id).filter(x => x.type === "project");
  if (!list.length) return "";
  const tone = catOf(p.cat).tone;
  return `<div class="strip">
    <div class="strip-head"><span>납품 현장 ${list.length}곳</span>${list.length > 2 ? `<a href="#${p.id}">모두 보기</a>` : ""}</div>
    <div class="strip-row">${list.map(x => `
      <a class="mini" href="${esc(x.url)}" target="_blank" rel="noopener">
        ${x.thumbnail ? `<div class="mini-cover"><img src="${esc(x.thumbnail)}" alt="" loading="lazy"></div>`
                      : `<div class="mini-cover" style="background:var(${tone})"><span class="glyph">현장 사진</span></div>`}
        <b>${esc(x.title)}</b>
        <span>${esc([x.client, dot(x.date)].filter(Boolean).join(" · "))}</span>
      </a>`).join("")}
    </div></div>`;
}

/* ── 홈 ─────────────────────────────── */
function homeHTML(){
  const projects = posts.filter(x => x.type === "project").sort(byDate).slice(0, 6);
  return `
  <section class="intro">
    <h1>필요한 곳에 필요한 장비와 상품을<br><em>직접 납품하고 설치해요</em></h1>
    <p>전자칠판 같은 교육·사무기기부터 헬스케어기기, 시니어케어 용품까지. 상품마다 실제로 납품하고 설치한 현장을 함께 보여 드려요.</p>
    <div class="facts">
      <span class="fact"><b>${products.length}</b>개 품목</span>
      <span class="fact"><b>${categories.length}</b>개 분야</span>
      <span class="fact">납품 사례 <b>${posts.filter(x => x.type === "project").length}</b>건</span>
    </div>
  </section>
  <nav class="tabs" aria-label="상품 분야"><div class="tabs-inner" id="tabs">
    ${categories.map(c => `<button class="tab" data-target="cat-${c.id}">${esc(c.name)}<span class="n">${inCat(c.id).length}</span></button>`).join("")}
    <button class="tab" data-target="cases">납품 사례</button>
    <button class="tab" data-target="contact">문의</button>
  </div></nav>
  ${categories.map(c => `
    <section class="cat-sec" id="cat-${c.id}">
      <div class="cat-head"><h2>${esc(c.name)}</h2><span>${esc(c.desc)}</span></div>
      <div class="list">${inCat(c.id).map(p => `
        <div class="prod">
          <a class="item" href="#${p.id}">
            ${tileHTML(p, "상품 사진")}
            <div class="info">
              <h3>${esc(p.name)}</h3>
              <span class="sum">${esc(p.summary)}</span>
              <div class="row">${priceHTML(p)}${badgesHTML(p)}</div>
            </div>
          </a>
          ${stripHTML(p)}
        </div>`).join("")}
      </div>
    </section>`).join("")}
  <section class="sec" id="cases">
    <div class="sec-head"><h2>최근 납품 사례</h2><a href="${esc(site.blogUrl)}" target="_blank" rel="noopener">블로그 전체 보기</a></div>
    <div class="hscroll">${projects.map(caseHTML).join("")}</div>
  </section>`;
}

/* ── 상품 상세 ─────────────────────────── */
function productHTML(p){
  const c = catOf(p.cat);
  const related = postsFor(p.id);
  const rel = newsFor(p.id);
  let actions;
  if (p.saleType === "sale") {
    actions = (p.stock === "out"
        ? `<button class="btn" disabled>품절</button>`
        : p.smartstore ? `<a class="btn store" href="${esc(p.smartstore)}" target="_blank" rel="noopener">스마트스토어에서 구매</a>` : "")
      + `<button class="btn" data-ask="${p.id}">문의하기</button>`;
  } else {
    actions = `<button class="btn primary" data-ask="${p.id}">${p.saleType === "rental" ? "렌탈 상담 신청" : "설치·납품 견적 문의"}</button>`;
  }
  return `
  <button class="back" data-home>← 목록으로</button>
  <section class="p-hero">
    ${tileHTML(p, "상품 사진")}
    <div>
      <span class="sum">${esc(c.name)}</span>
      <h1>${esc(p.name)}</h1>
      <p class="sum" style="margin:4px 0 8px;font-size:14px">${esc(p.summary)}</p>
      ${priceHTML(p)}
    </div>
    <dl class="spec">
      <dt>판매 단위</dt><dd>${esc(p.unit)}</dd>
      <dt>판매 방식</dt><dd>${{sale:"일반 판매", rental:"렌탈 (방문 관리 포함)", inquiry:"상담 후 견적"}[p.saleType]}</dd>
      <dt>상태</dt><dd>${{in:"판매 중", low:"재고 적음", out:"품절"}[p.stock]}</dd>
    </dl>
    ${p.options.length ? `<div class="opt"><label for="opt">옵션</label><select id="opt">${p.options.map(o => `<option>${esc(o)}</option>`).join("")}</select></div>` : ""}
    <div class="actions">${actions}</div>
  </section>

  <section class="sec" id="cases">
    <div class="sec-head"><h2>이런 프로젝트를 진행했어요</h2><a href="${esc(site.blogUrl)}" target="_blank" rel="noopener">블로그</a></div>
    ${related.length
      ? `<p class="sec-sub">이 상품을 실제로 납품하고 설치한 기록이에요. 누르면 블로그 글로 이동해요.</p><div class="cases">${related.map(caseHTML).join("")}</div>`
      : `<p class="empty">아직 등록된 사례가 없어요. 블로그에 글이 올라오면 여기에 모아 보여 드려요.</p>`}
  </section>

  ${rel.length ? `
  <section class="sec">
    <div class="sec-head"><h2>관련 소식</h2><span class="auto-note">자동 업데이트 예정</span></div>
    <div class="news">${rel.map(n => `<a href="${esc(n.url)}" target="_blank" rel="noopener"><b>${esc(n.title)}</b><span>${esc(n.source)} · ${dot(n.date)}</span></a>`).join("")}</div>
  </section>` : ""}`;
}

/* ── 라우팅: #p101 처럼 상품 id 가 주소에 붙으면 상세 페이지 ── */
let homeScroll = 0;
function route(){
  const id = location.hash.slice(1);
  const p = products.find(x => x.id === id);
  if (p) {
    $("#view").innerHTML = productHTML(p);
    document.title = `${p.name} | ${site.name}`;
    scrollTo({top:0});
  } else if (!$("#tabs")) {
    $("#view").innerHTML = homeHTML();
    document.title = site.name;
    watchedAt = null;
    requestAnimationFrame(() => { scrollTo({top:homeScroll}); onScroll(); });
  }
}
function goHome(){
  if (location.hash && products.some(x => "#" + x.id === location.hash)) history.back();
  else { history.replaceState(null, "", location.pathname); route(); scrollTo({top:0, behavior:"smooth"}); }
}

/* ── 탭 ↔ 스크롤 연동 ─────────────────── */
let watchedAt = null;
function onScroll(){
  const tabs = $("#tabs");
  if (!tabs) return;
  const ids = [...tabs.querySelectorAll(".tab")].map(t => t.dataset.target);
  const line = $(".tabs").getBoundingClientRect().bottom + 12;
  let current = ids[0];
  for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= line) current = id; }
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = ids[ids.length - 1];
  if (current === watchedAt) return;
  watchedAt = current;
  tabs.querySelectorAll(".tab").forEach(t => {
    const on = t.dataset.target === current;
    t.setAttribute("aria-current", on);
    if (on) tabs.scrollTo({left: t.offsetLeft - tabs.clientWidth / 2 + t.clientWidth / 2, behavior:"smooth"});
  });
}

/* ── 문의 ─────────────────────────────── */
function askAbout(id){
  const p = products.find(x => x.id === id);
  $("#f-type").value = p.saleType === "rental" ? "렌탈 상담" : p.saleType === "inquiry" ? "설치·납품 견적" : "상품 문의";
  $("#f-msg").value = `[${p.name}] 문의드립니다.\n`;
  $("#contact").scrollIntoView({behavior:"smooth"});
  setTimeout(() => $("#f-name").focus({preventScroll:true}), 500);
}
let toastTimer;
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, 1800); }
function copy(v){
  if (navigator.clipboard) navigator.clipboard.writeText(v).then(() => toast("복사했어요: " + v), () => toast(v));
  else toast(v);
}

/* ── 이벤트 ─────────────────────────────── */
document.addEventListener("click", e => {
  const t = e.target;
  const tab = t.closest(".tab");
  if (tab) return document.getElementById(tab.dataset.target)?.scrollIntoView({behavior:"smooth"});
  if (t.closest("[data-home]")) { e.preventDefault(); return goHome(); }
  if (t.closest("[data-contact]")) { e.preventDefault(); return $("#contact").scrollIntoView({behavior:"smooth"}); }
  const ask = t.closest("[data-ask]");
  if (ask) return askAbout(ask.dataset.ask);
  const item = t.closest("a.item");
  if (item && $("#tabs")) homeScroll = scrollY;
});
addEventListener("scroll", onScroll, {passive:true});
addEventListener("hashchange", route);
$("#inq").addEventListener("submit", e => { e.preventDefault(); $("#f-ok").hidden = false; });

load().then(() => {
  $("#brand-name").textContent = site.name;
  for (const id of ["#blog-link"]) $(id).href = site.blogUrl;
  for (const id of ["#store-link", "#bar-store"]) $(id).href = site.storeUrl;
  $("#phone").textContent = site.phone;
  $("#kakao").textContent = site.kakao;
  $("#copy-phone").onclick = () => copy(site.phone);
  $("#copy-kakao").onclick = () => copy(site.kakao);
  $("#business").textContent = site.business;
  route();
}).catch(() => {
  $("#view").innerHTML = `<p class="loading">상품 정보를 불러오지 못했어요. 새로고침해 주세요.</p>`;
});
