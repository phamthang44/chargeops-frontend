<#macro registrationLayout displayMessage=true displayRequiredFields=false displayInfo=false displayWide=false showAnotherWayIfPresent=true>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}" lang="${locale.currentLanguageTag!'vi'}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>${msg("loginTitle",(realm.displayName!'ChargeOps'))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
</head>

<body id="keycloak-bg" class="co-app-body">
  <div class="co-main-container">
    <!-- Desktop Top Brand Header Bar -->
    <header class="co-desktop-header">
      <div class="co-brand" aria-label="ChargeOps">
        <span class="co-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M13 2 4 14h7l-1 8L20 9h-7l0-7Z" />
          </svg>
        </span>
        <span>ChargeOps</span>
      </div>

      <#if realm.internationalizationEnabled?? && realm.internationalizationEnabled && locale.supported?has_content && (locale.supported?size > 1)>
        <div class="co-locale-dropdown" id="co-locale-dropdown-desktop">
          <button 
            type="button" 
            class="co-locale-trigger" 
            onclick="document.getElementById('co-locale-dropdown-desktop').classList.toggle('is-open')"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <span class="co-locale-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10z"></path>
              </svg>
            </span>
            <span class="co-locale-label">${locale.current}</span>
            <span class="co-locale-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>

          <ul class="co-locale-menu" role="menu">
            <#list locale.supported as l>
              <li role="none">
                <a 
                  href="${l.url}" 
                  class="co-locale-item <#if l.label == locale.current>is-active</#if>" 
                  role="menuitem"
                >
                  <span>${l.label}</span>
                  <#if l.label == locale.current>
                    <svg class="co-locale-check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </#if>
                </a>
              </li>
            </#list>
          </ul>
        </div>
        <script>
          document.addEventListener('click', function(e) {
            var dropdown = document.getElementById('co-locale-dropdown-desktop');
            if (dropdown && !dropdown.contains(e.target)) {
              dropdown.classList.remove('is-open');
            }
          });
        </script>
      </#if>
    </header>

    <!-- Shell Container: 2-column on desktop, 1-column mobile app on mobile -->
    <div class="co-shell">
      <!-- Desktop Hero Banner Column -->
      <section class="co-panel co-copy">
        <div class="co-kicker">${msg("chargeopsClient")}</div>
        <h1>${msg("chargeopsHeroTitle")}</h1>
        <p>${msg("chargeopsHeroBody")}</p>
        <div class="co-feature-grid">
          <div><strong>QR</strong><span>${msg("chargeopsFeatureQr")}</span></div>
          <div><strong>10m</strong><span>${msg("chargeopsFeatureHold")}</span></div>
          <div><strong>100%</strong><span>${msg("chargeopsFeatureRefund")}</span></div>
        </div>
      </section>

      <!-- Auth Screen Card (1-to-1 RN screen mirror) -->
      <section class="co-panel co-card-wrapper">
        <#nested "header">
        <div class="co-app-content">
          <#nested "form">
        </div>
      </section>
    </div>
  </div>
</body>
</html>
</#macro>
