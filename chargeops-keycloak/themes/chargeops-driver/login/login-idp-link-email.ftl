<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#if section == "header">
    <div class="co-header">
      <div class="co-header-btn-space"></div>
      <h1 class="co-header-title">${msg("brokerLinkHeaderTitle", idpDisplayName)}</h1>
      <div class="co-header-btn-space"></div>
    </div>
  <#elseif section == "form">
    <div class="co-screen-body">
      <h2 class="co-title">${msg("brokerLinkEmailTitle")}</h2>
      <p class="co-subtitle">${msg("brokerLinkEmailSubtitle")}</p>

      <#if message?has_content>
        <div class="co-alert co-alert-${message.type}">
          <span>${kcSanitize(message.summary)?no_esc}</span>
        </div>
      </#if>

      <div class="co-info-panel">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" class="co-security-icon" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2"/>
          <path d="m3 7 9 6 9-6"/>
        </svg>
        <span>${kcSanitize(msg("brokerLinkEmailInfo", brokerContext.username, idpDisplayName))?no_esc}</span>
      </div>

      <p class="co-helper-text">${msg("brokerLinkMailpitHint")}</p>
    </div>

    <div class="co-screen-footer">
      <a class="co-cta-link" href="http://localhost:8025" target="_blank" rel="noopener noreferrer">${msg("brokerLinkOpenMailpit")}</a>
      <a class="co-secondary-link" href="${url.loginAction}">${msg("brokerLinkContinueAfterEmail")}</a>
      <p class="co-footer-hint">
        ${msg("brokerLinkEmailMissing")}
        <a class="co-link" href="${url.loginAction}">${msg("brokerLinkResendAction")}</a>
      </p>
    </div>
  </#if>
</@layout.registrationLayout>
