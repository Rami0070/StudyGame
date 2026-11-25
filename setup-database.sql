-- ==============================================================
-- 3D 학습 게임: Supabase 데이터베이스 설정 및 RLS 권한 부여 SQL
-- Supabase 대시보드(Dashboard) > SQL Editor에서 실행하세요.
-- ==============================================================

-- 1. games 테이블 생성 및 기본 데이터 삽입 (없을 경우)
CREATE TABLE IF NOT EXISTS public.games (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.games (slug, title, is_active)
VALUES
  ('word-island', '낱말 탐험섬', true),
  ('knowledge-maze', '지식 탐험대', true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, is_active = true;

-- 2. game_records 테이블 컬럼 보완 (필요 시)
ALTER TABLE public.game_records
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::JSONB;

-- 3. [핵심 원인 해결] RLS(Row Level Security) 설정 및 SELECT 권한 허용
-- Supabase에서 RLS가 켜져 있으면 SELECT 정책이 없을 경우 조회 시 빈 배열([])이 반환됩니다.
-- 관리자 페이지(admin.html)에서 기록을 조회할 수 있도록 public(anon 포함)에 SELECT 정책을 허용합니다.

ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Allow anon read game_records" ON public.game_records;
DROP POLICY IF EXISTS "Allow public read access on game_records" ON public.game_records;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.game_records;

-- 게임 기록 조회(SELECT) 권한 허용
CREATE POLICY "Allow public read access on game_records"
ON public.game_records
FOR SELECT
TO public
USING (true);

-- (참고) games 테이블도 누구나 조회할 수 있도록 RLS 정책 확인
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read games" ON public.games;
CREATE POLICY "Allow public read games"
ON public.games
FOR SELECT
TO public
USING (true);
