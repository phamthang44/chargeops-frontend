<#macro emailLayout>
<!doctype html>
<html lang="${(locale.currentLanguageTag)!'vi'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body, table, td, p, a {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }

    body {
      margin: 0;
      padding: 0;
      background: #f4f6f8;
      color: #16171a;
    }

    .co-email-content p {
      margin: 0 0 16px;
      color: #43464d;
      font-size: 15px;
      line-height: 1.65;
    }

    .co-email-content a {
      color: #047857;
      font-weight: 700;
      text-decoration: none;
    }

    .co-email-content p a[href^="http"] {
      display: inline-block;
      margin: 8px 0 4px;
      border-radius: 8px;
      background: #10b981;
      color: #ffffff !important;
      padding: 12px 18px;
      text-decoration: none;
    }

    @media (max-width: 620px) {
      .co-shell {
        width: 100% !important;
      }

      .co-card {
        border-radius: 0 !important;
        border-left: 0 !important;
        border-right: 0 !important;
      }

      .co-inner {
        padding: 24px !important;
      }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${msg("chargeopsEmailPreheader")}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f4f6f8;margin:0;padding:28px 0;">
    <tr>
      <td align="center" style="padding:0 16px;">
        <table class="co-shell" role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;margin:0 auto;">
          <tr>
            <td class="co-card" style="overflow:hidden;border:1px solid #e1e6eb;border-radius:8px;background:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background:#10251f;padding:22px 28px;color:#ffffff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <div style="display:inline-block;width:38px;height:38px;border-radius:8px;background:#10b981;text-align:center;line-height:38px;font-size:18px;font-weight:800;color:#ffffff;">C</div>
                          <span style="display:inline-block;margin-left:10px;vertical-align:middle;font-size:18px;font-weight:800;letter-spacing:0;color:#ffffff;">ChargeOps</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;color:#d7f7e7;font-size:13px;line-height:1.5;">${msg("chargeopsEmailHeader")}</p>
                  </td>
                </tr>
                <tr>
                  <td class="co-inner" style="padding:32px 34px 28px;">
                    <div class="co-email-content">
                      <#nested>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e6e8ec;background:#f9fafb;padding:20px 34px;">
                    <p style="margin:0 0 8px;color:#62656e;font-size:13px;line-height:1.55;">${msg("chargeopsEmailFooter")}</p>
                    <p style="margin:0;color:#8a8f98;font-size:12px;line-height:1.55;">${msg("chargeopsEmailSignature")}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
</#macro>
