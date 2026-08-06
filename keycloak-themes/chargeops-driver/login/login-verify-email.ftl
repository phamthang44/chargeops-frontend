<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#if section == "header">
    <div class="co-header">
      <div class="co-header-btn-space"></div>
      <h1 class="co-header-title">${msg("verifyEmailHeaderTitle")}</h1>
      <div class="co-header-btn-space"></div>
    </div>
  <#elseif section == "form">
    <div class="co-screen-body">
      <h2 class="co-title">${msg("verifyEmailTitle")}</h2>
      <p class="co-subtitle">${msg("verifyEmailSubtitle")}</p>

      <#if message?has_content>
        <div class="co-alert co-alert-${message.type}">
          <span>${kcSanitize(message.summary)?no_esc}</span>
        </div>
      </#if>

      <div class="co-info-panel">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" class="co-security-icon">
          <path d="M4 4h16v16H4z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <span>${msg("emailVerifyInstruction1", user.email)}</span>
      </div>

      <p class="co-helper-text">${msg("emailVerifyInstruction2")}</p>
    </div>

    <div class="co-screen-footer">
      <a class="co-cta-link" href="${url.loginAction}">${msg("verifyEmailResendCta")}</a>
    </div>
  </#if>
</@layout.registrationLayout>
