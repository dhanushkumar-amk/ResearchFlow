/** Inline styles and tables keep the app's theme consistent in email clients. */
export function verificationEmail({ code, title, description }: {
  code: string; title: string; description: string;
}): string {
  const escape = (value: string) => value.replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background-color:#f4f6fc;color:#151f3b;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your ResearchMind verification code expires in 10 minutes.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fc;"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
<tr><td align="center" style="padding:0 0 28px;font-size:22px;font-weight:700;letter-spacing:-1px;color:#151f3b;"><span style="color:#2449bf;">&#10022;</span>&nbsp; ResearchMind</td></tr>
<tr><td style="background-color:#ffffff;border:1px solid #dce2f2;border-radius:18px;padding:36px 28px;">
<img src="cid:researchmind-art" width="462" alt="A pixel art research observatory" style="display:block;width:100%;max-width:462px;height:auto;border:0;border-radius:12px;margin:0 0 28px;">
<p style="margin:0 0 14px;color:#2449bf;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your research workspace</p>
<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.2;font-weight:400;letter-spacing:-1px;color:#151f3b;">${escape(title)}</h1>
<p style="margin:0 0 26px;color:#4f5871;font-size:15px;line-height:1.7;">${escape(description)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="background-color:#e8edff;border:1px solid #dce2f2;border-radius:12px;padding:22px 8px;">
<p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:2px;color:#4f5871;">VERIFICATION CODE</p>
<p style="margin:0;font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:8px;color:#2449bf;">${escape(code)}</p>
</td></tr></table>
<p style="margin:18px 0 28px;text-align:center;color:#4f5871;font-size:12px;">Valid for 10 minutes &middot; Never share this code</p>
<div style="border-top:1px solid #dce2f2;padding-top:20px;"><p style="margin:0;color:#4f5871;font-size:12px;line-height:1.7;">If you didn&rsquo;t request this code, you can safely ignore this email.</p></div>
</td></tr>
<tr><td align="center" style="padding:24px 12px;color:#4f5871;font-size:12px;line-height:1.8;">ResearchMind<br>Your autonomous research workspace</td></tr>
</table></td></tr></table></body></html>`;
}
