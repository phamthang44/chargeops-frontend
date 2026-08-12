<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#if section == "header">
    <div class="co-header">
      <div class="co-header-btn-space"></div>
      <h1 class="co-header-title">${msg("termsTitle")}</h1>
      <div class="co-header-btn-space"></div>
    </div>
  <#elseif section == "form">
    <div class="co-screen-body co-terms-screen-body">
      <h2 class="co-title">${msg("termsTitle")}</h2>
      <p class="co-subtitle">${msg("termsSubtitle")}</p>

      <div class="co-legal-links">
        <a href="${properties.chargeopsTermsUrl!}" target="_blank" rel="noopener noreferrer" class="co-link">${msg("termsOfService")}</a>
        <a href="${properties.chargeopsPrivacyUrl!}" target="_blank" rel="noopener noreferrer" class="co-link">${msg("privacyPolicy")}</a>
      </div>

      <form id="kc-terms-form" class="co-form" action="${url.loginAction}" method="post">
        <label class="co-checkbox-label">
          <input id="termsAccepted" name="termsAccepted" type="checkbox" class="co-checkbox-input" required />
          <span class="co-checkbox-custom">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          <span class="co-checkbox-text">${msg("termsConsentText")}</span>
        </label>
        <div class="co-terms-actions">
          <button class="co-cta-btn" type="submit">${msg("termsAccept")}</button>
          <button class="co-secondary-btn" type="submit" name="cancel" value="true">${msg("termsDecline")}</button>
        </div>
      </form>
    </div>
  </#if>
</@layout.registrationLayout>
