import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });

  try {
    const body = await req.json();
    const schoolName = String(body.schoolName ?? '').trim();
    const grade = Number(body.grade);
    const classNumber = Number(body.classNumber);
    const studentNumber = Number(body.studentNumber);
    const gameSlug = String(body.gameSlug ?? '');
    const score = Number(body.score);
    const durationSeconds = Number(body.durationSeconds);
    const attempts = Number(body.attempts ?? 0);
    const allowedGames = new Set(['word-island', 'knowledge-maze']);

    if (schoolName.length < 1 || schoolName.length > 100) throw new Error('학교명을 확인해 주세요.');
    if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new Error('학년 값이 올바르지 않습니다.');
    if (!Number.isInteger(classNumber) || classNumber < 1 || classNumber > 20) throw new Error('반 값이 올바르지 않습니다.');
    if (!Number.isInteger(studentNumber) || studentNumber < 1 || studentNumber > 50) throw new Error('번호 값이 올바르지 않습니다.');
    if (!allowedGames.has(gameSlug)) throw new Error('등록되지 않은 게임입니다.');
    if (!Number.isFinite(score) || score < 0 || score > 100000) throw new Error('점수 값이 올바르지 않습니다.');
    if (!Number.isFinite(durationSeconds) || durationSeconds < 0 || durationSeconds > 14400) throw new Error('플레이 시간이 올바르지 않습니다.');
    if (!Number.isFinite(attempts) || attempts < 0 || attempts > 10000) throw new Error('시도 횟수가 올바르지 않습니다.');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: game, error: gameError } = await supabase.from('games').select('id').eq('slug', gameSlug).eq('is_active', true).single();
    if (gameError || !game) throw new Error('게임 등록이 아직 완료되지 않았습니다.');

    const { error } = await supabase.from('game_records').insert({
      school_name: schoolName,
      grade,
      class_number: classNumber,
      student_number: studentNumber,
      game_id: game.id,
      score: Math.round(score),
      duration_seconds: Math.round(durationSeconds),
      attempts: Math.round(attempts),
      details: body.details && typeof body.details === 'object' ? body.details : {},
    });
    if (error) throw error;
    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : '기록 저장 중 오류가 발생했습니다.' }, { status: 400, headers: corsHeaders });
  }
});
