import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propId = searchParams.get("propId") ?? "";
  const urlId  = searchParams.get("urlId")  ?? "";
  const seq    = searchParams.get("seq")    ?? "";
  const by     = searchParams.get("by")     ?? "";

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>ระบุรายละเอียดห้อง #${seq}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .card { background: white; border-radius: 20px; width: 100%; max-width: 380px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #112240; padding: 16px 20px; }
    .header-seq { color: #C8A951; font-weight: 700; font-size: 15px; }
    .header-by { color: rgba(255,255,255,0.55); font-size: 12px; margin-top: 4px; }
    .body { padding: 16px 20px 8px; }
    .section-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
    .option-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid #f3f4f6; cursor: pointer; user-select: none; -webkit-user-select: none; }
    .option-label { font-size: 16px; font-weight: 500; color: #1f2937; }
    .track { width: 56px; height: 30px; border-radius: 999px; background: #e5e7eb; position: relative; transition: background 0.2s; flex-shrink: 0; border: 2px solid #d1d5db; }
    .track.on { background: #16a34a; border-color: #16a34a; }
    .knob { position: absolute; top: 2px; left: 2px; width: 22px; height: 22px; border-radius: 50%; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.25); transition: left 0.2s; pointer-events: none; }
    .track.on .knob { left: 28px; }
    .remark-section { padding: 16px 20px 8px; border-top: 1px solid #f3f4f6; }
    .remark-label { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; display: block; }
    .remark-input { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; font-size: 14px; font-family: inherit; resize: vertical; min-height: 80px; outline: none; color: #1f2937; }
    .remark-input:focus { border-color: #C8A951; }
    .footer { padding: 12px 20px 20px; }
    .btn-submit { width: 100%; background: #C8A951; color: white; border: none; border-radius: 14px; padding: 15px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-submit:active { background: #b8993f; }
    .btn-submit:disabled { background: #d9bb74; cursor: not-allowed; }
    .success { text-align: center; padding: 40px 20px; }
    .success-icon { font-size: 52px; margin-bottom: 12px; }
    .success-title { font-size: 18px; font-weight: 700; color: #111; }
    .success-sub { font-size: 14px; color: #888; margin-top: 6px; }
    .error-msg { color: #ef4444; font-size: 12px; padding: 0 20px 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
  </style>
</head>
<body>
  <div class="card" id="card">
    <div class="header">
      <div class="header-seq">🔗 #${seq}</div>
      ${by ? `<div class="header-by">By ${by}</div>` : ""}
    </div>

    <div class="body">
      <div class="section-label">ระบุสถานะห้อง</div>
      <div class="option-row" onclick="toggle('furnished')">
        <span class="option-label">🛋 Fully Furnished</span>
        <div class="track" id="track-furnished"><div class="knob"></div></div>
      </div>
      <div class="option-row" onclick="toggle('electric')">
        <span class="option-label">⚡ Fully Electric</span>
        <div class="track" id="track-electric"><div class="knob"></div></div>
      </div>
      <div class="option-row" onclick="toggle('ready')">
        <span class="option-label">✅ Ready to move in</span>
        <div class="track" id="track-ready"><div class="knob"></div></div>
      </div>
    </div>

    <div class="remark-section">
      <label class="remark-label" for="remark">📝 Remark <span style="font-weight:400;color:#9ca3af;">(ไม่บังคับ)</span></label>
      <textarea id="remark" class="remark-input" placeholder="เช่น No TV, No Washing Machine..."></textarea>
    </div>

    <div id="error-msg" class="error-msg" style="display:none"></div>

    <div class="footer">
      <button class="btn-submit" id="btn-submit" onclick="submit()">บันทึก</button>
    </div>
  </div>

  <script>
    var state = { furnished: false, electric: false, ready: false };

    function toggle(key) {
      state[key] = !state[key];
      var track = document.getElementById('track-' + key);
      if (state[key]) track.classList.add('on');
      else track.classList.remove('on');
    }

    function submit() {
      var btn = document.getElementById('btn-submit');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก...';
      var err = document.getElementById('error-msg');
      err.style.display = 'none';
      var remark = document.getElementById('remark').value.trim();

      fetch('/api/scanlink/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propId: '${propId}',
          urlId:  '${urlId}',
          seq:    '${seq}',
          by:     '${by.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}',
          fullyFurnished: state.furnished,
          fullyElectric:  state.electric,
          readyToMoveIn:  state.ready,
          remark:         remark,
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          document.getElementById('card').innerHTML =
            '<div class="success">' +
            '<div class="success-icon">✅</div>' +
            '<div class="success-title">บันทึกสำเร็จ</div>' +
            '<div class="success-sub">สามารถปิดหน้านี้ได้เลย</div>' +
            '</div>';
        } else {
          err.textContent = data.error || 'เกิดข้อผิดพลาด';
          err.style.display = 'block';
          btn.disabled = false;
          btn.innerHTML = 'บันทึก';
        }
      })
      .catch(function() {
        err.textContent = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        err.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = 'บันทึก';
      });
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
