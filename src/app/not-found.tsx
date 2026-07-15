import Link from "next/link";

export default function NotFound() {
  return (
    <main className="empty-page page-wrap">
      <p className="eyebrow">404 / MAP NOT FOUND</p>
      <h1>아직 그려지지 않은 지도입니다.</h1>
      <p>주소를 다시 확인하거나, 라이브러리에서 다른 가이드를 골라보세요.</p>
      <Link className="button button-primary" href="/">라이브러리로 돌아가기</Link>
    </main>
  );
}
