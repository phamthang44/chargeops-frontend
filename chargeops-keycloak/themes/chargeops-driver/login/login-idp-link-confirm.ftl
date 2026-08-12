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
      <h2 class="co-title">${msg("brokerLinkConfirmTitle")}</h2>
      <p class="co-subtitle">${msg("brokerLinkConfirmSubtitle", idpDisplayName)}</p>

      <#if message?has_content>
        <div class="co-alert co-alert-${message.type}">
          <span>${kcSanitize(message.summary)?no_esc}</span>
        </div>
      </#if>

      <div class="co-info-panel">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" class="co-security-icon" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M8.5 12.5 11 15l4.5-5"/>
        </svg>
        <span>${msg("brokerLinkConfirmInfo")}</span>
      </div>

      <form id="kc-idp-link-confirm-form" action="${url.loginAction}" method="post"></form>
    </div>

    <div class="co-screen-footer">
      <button class="co-cta-btn" type="submit" form="kc-idp-link-confirm-form" name="submitAction" id="linkAccount" value="linkAccount">
        ${msg("brokerLinkContinueAction", idpDisplayName)}
      </button>
      <button class="co-secondary-btn" type="submit" form="kc-idp-link-confirm-form" name="submitAction" id="updateProfile" value="updateProfile">
        ${msg("brokerLinkReviewAction")}
      </button>
    </div>
  </#if>
</@layout.registrationLayout>
