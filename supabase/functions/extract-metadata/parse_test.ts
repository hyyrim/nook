// 실행: deno test supabase/functions/extract-metadata/parse_test.ts
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { parseOgMetadata, getDomain } from './parse.ts';

Deno.test('og 태그 우선 + 상대 이미지 절대화 + 엔티티 디코드', () => {
  const html = `<html><head>
    <title>무시될 제목</title>
    <meta property="og:title" content="진짜 &amp; 제목" />
    <meta property="og:description" content="설명" />
    <meta property="og:image" content="/thumb.png" />
  </head></html>`;
  const m = parseOgMetadata(html, 'https://ex.com/a/b');
  assertEquals(m.title, '진짜 & 제목');
  assertEquals(m.description, '설명');
  assertEquals(m.thumbnail_url, 'https://ex.com/thumb.png');
});

Deno.test('og 없으면 <title>로 폴백', () => {
  const m = parseOgMetadata('<title>  제목만  </title>', 'https://ex.com');
  assertEquals(m.title, '제목만');
  assertEquals(m.thumbnail_url, undefined);
});

Deno.test('getDomain은 www 제거', () => {
  assertEquals(getDomain('https://www.example.com/x'), 'example.com');
});
