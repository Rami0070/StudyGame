/* 학생 식별 및 게임 기록 전송 */
(() => {
  const SUPABASE_URL = 'https://rlxqzyeimgvtltodvkju.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9JTgqy_Utpn2GPv-qKfs1w_gn8r_r5N';
  const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/submit-game-result`;
  const STORAGE_KEY = 'studywords.student.v1';
  let currentIdentity = null;

  const style = document.createElement('style');
  style.textContent = `
    #studentIdentityGate{position:fixed;inset:0;z-index:99999;background:linear-gradient(180deg,#8ED8FF,#D9F3FF);display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;color:#3B3355}
    #studentIdentityGate .sig-card{width:min(560px,100%);background:#FFFBF2;border-radius:28px;padding:28px;box-shadow:0 10px 0 #E9DFC8,0 24px 50px rgba(59,51,85,.2)}
    #studentIdentityGate h2{font-size:clamp(25px,5vw,36px);margin:0 0 8px;text-align:center}
    #studentIdentityGate p{font-size:18px;text-align:center;margin:0 0 22px}
    #studentIdentityGate label{display:block;font-size:17px;margin:12px 0 6px}
    #studentIdentityGate input,#studentIdentityGate select{box-sizing:border-box;width:100%;font:inherit;font-size:19px;padding:13px 14px;border:2px solid #DCD3C0;border-radius:13px;background:white;color:#3B3355}
    #studentIdentityGate .sig-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    #studentIdentityGate button{width:100%;margin-top:22px;border:0;border-radius:16px;background:#FF6F59;color:white;font:inherit;font-size:22px;padding:15px;cursor:pointer;box-shadow:0 5px 0 #D9483A}
    #studentIdentityGate .sig-error{color:#C62828;min-height:22px;margin-top:10px;font-size:15px;text-align:center}
    @media(max-width:460px){#studentIdentityGate .sig-card{padding:20px}#studentIdentityGate .sig-grid{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);

  function readIdentity() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) { return null; }
  }
  function mountGate() {
    currentIdentity = readIdentity();
    if (currentIdentity) return;
    const overlay = document.createElement('div');
    overlay.id = 'studentIdentityGate';
    overlay.innerHTML = `
      <form class="sig-card" id="studentIdentityForm">
        <h2>🎒 먼저 이름표를 만들어요!</h2>
        <p>학교와 학급 정보를 입력해 주세요.</p>
        <label for="sig-school">학교명</label>
        <input id="sig-school" name="school" maxlength="100" autocomplete="organization" required placeholder="예: 행복초등학교">
        <div class="sig-grid">
          <div><label for="sig-grade">학년</label><select id="sig-grade" name="grade" required><option value="">선택</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">${n}학년</option>`).join('')}</select></div>
          <div><label for="sig-class">반</label><input id="sig-class" name="classNumber" type="number" min="1" max="20" step="1" required placeholder="예: 2"></div>
          <div><label for="sig-number">번호</label><input id="sig-number" name="studentNumber" type="number" min="1" max="50" step="1" required placeholder="예: 15"></div>
        </div>
        <div class="sig-error" id="sig-error" role="alert"></div>
        <button type="submit">게임 시작하기</button>
      </form>`;
    document.body.appendChild(overlay);
    document.getElementById('studentIdentityForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const identity = {
        schoolName: String(form.get('school') || '').trim(),
        grade: Number(form.get('grade')),
        classNumber: Number(form.get('classNumber')),
        studentNumber: Number(form.get('studentNumber'))
      };
      if (!identity.schoolName || !Number.isInteger(identity.grade) || identity.grade < 1 || identity.grade > 6 || !Number.isInteger(identity.classNumber) || identity.classNumber < 1 || identity.classNumber > 20 || !Number.isInteger(identity.studentNumber) || identity.studentNumber < 1 || identity.studentNumber > 50) {
        document.getElementById('sig-error').textContent = '학교명과 학년·반·번호를 정확히 입력해 주세요.';
        return;
      }
      currentIdentity = identity;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
      overlay.remove();
    });
  }

  window.submitStudyGameRecord = async function ({ gameSlug, score, durationSeconds, attempts = 0, details = {} }) {
    const identity = currentIdentity || readIdentity();
    if (!identity) return { ok: false, reason: 'student_identity_missing' };
    const payload = {
      ...identity,
      gameSlug,
      score: Math.max(0, Math.round(Number(score) || 0)),
      durationSeconds: Math.max(0, Math.round(Number(durationSeconds) || 0)),
      attempts: Math.max(0, Math.round(Number(attempts) || 0)),
      details
    };
    try {
      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      console.info('[StudyWords] 게임 기록 저장 완료');
      return { ok: true, data: result };
    } catch (error) {
      console.error('[StudyWords] 게임 기록 저장 실패:', error);
      return { ok: false, reason: String(error.message || error) };
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountGate);
  else mountGate();
})();
