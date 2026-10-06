type InvitationEmailInput = {
  parentName: string;
  childName: string;
  code: string;
};

export function buildInvitationEmail({
  parentName,
  childName,
  code,
}: InvitationEmailInput): { subject: string; html: string } {
  const subject = "Te invitaron a OpenDayCare";
  const firstName = parentName.trim().split(/\s+/)[0] || parentName;
  const childFirstName = childName.trim().split(/\s+/)[0] || childName;
  const baseUrl = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const activateUrl = `${baseUrl}/activate?code=${encodeURIComponent(code)}`;

  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#F6ECDF;font-family:Arial,Helvetica,sans-serif;color:#3F362E;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6ECDF;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FBF4EC;border:1px solid #ECE0D0;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 8px 28px;">
                <div style="font-size:13px;font-weight:700;letter-spacing:1px;color:#C5503A;text-transform:uppercase;">OpenDayCare</div>
                <h1 style="margin:12px 0 8px 0;font-size:22px;line-height:1.3;color:#3F362E;">Hola ${escapeHtml(firstName)},</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.5;color:#6E6359;">
                  Fuiste invitado/a al feed de <strong>${escapeHtml(childFirstName)}</strong> en OpenDayCare.
                  Usá el código de abajo para activar tu cuenta.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px;">
                <div style="background:#FBF1D6;border:1.5px dashed #E6D08A;border-radius:16px;padding:20px;text-align:center;">
                  <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#A88526;margin-bottom:10px;">CÓDIGO DE INVITACIÓN</div>
                  <div style="font-family:Georgia,serif;font-size:34px;font-weight:700;letter-spacing:8px;color:#8A7234;">${escapeHtml(code)}</div>
                  <div style="margin-top:10px;font-size:13px;color:#A88526;">Vence en 7 días</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 8px 28px;">
                <a href="${escapeHtml(activateUrl)}" style="display:block;text-align:center;text-decoration:none;background:linear-gradient(180deg,#F4977E,#EE8164);color:#ffffff;font-weight:700;font-size:15px;border-radius:14px;padding:14px 18px;">
                  Activar mi cuenta
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px 28px;">
                <p style="margin:0;font-size:12.5px;line-height:1.5;color:#94887B;">
                  Si no solicitaste esta invitación, podés ignorar este correo.
                  Solo verás el feed de ${escapeHtml(childFirstName)}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
