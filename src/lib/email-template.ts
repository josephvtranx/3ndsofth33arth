type EmailContent = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  details: [string, string][];
  note: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
const text = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br />");

// Table layout and inline styles work without remote fonts, images, or scripts.
export function renderEmail(content: EmailContent) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(content.title)}</title></head>
<body style="margin:0;padding:0;background-color:#f5f4f1;color:#171717;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(content.paragraphs[0] || content.title)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f4f1;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border:1px solid #deddd8;"><tr><td style="padding:32px 24px;">
<p style="margin:0 0 6px;font-size:26px;letter-spacing:-1px;">esther ko</p>
<p style="margin:0 0 32px;font-family:Courier New,monospace;font-size:11px;color:#686868;letter-spacing:1px;">3ndsofth33arth</p>
<p style="margin:0 0 12px;font-family:Courier New,monospace;font-size:11px;line-height:1.5;letter-spacing:1.5px;color:#686868;">${escapeHtml(content.eyebrow)}</p>
<h1 style="margin:0 0 24px;font-size:28px;line-height:1.2;font-weight:400;letter-spacing:-0.7px;">${escapeHtml(content.title)}</h1>
${content.paragraphs.map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;overflow-wrap:anywhere;">${text(p)}</p>`).join("")}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #deddd8;table-layout:fixed;">${content.details.map(([label, value]) => `<tr><td style="padding:16px 0;border-bottom:1px solid #e9e8e4;overflow-wrap:anywhere;word-break:break-word;"><p style="margin:0 0 6px;font-family:Courier New,monospace;font-size:11px;line-height:1.4;letter-spacing:1px;color:#686868;">${escapeHtml(label)}</p><p style="margin:0;font-size:15px;line-height:1.6;">${text(value)}</p></td></tr>`).join("")}</table>
<p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#686868;">${text(content.note)}</p>
<p style="margin:32px 0 0;font-size:13px;line-height:1.6;">esther ko<br /><span style="color:#686868;">tattoo · writing · mixed media</span></p>
</td></tr></table></td></tr></table></body></html>`;
}
