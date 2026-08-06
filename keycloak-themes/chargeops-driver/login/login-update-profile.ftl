<#import "template.ftl" as layout>
<#import "user-profile-commons.ftl" as userProfileCommons>
<@layout.registrationLayout displayMessage=false displayRequiredFields=true; section>
  <#if section == "header">
    <div class="co-header">
      <div class="co-header-btn-space"></div>
      <h1 class="co-header-title">${msg("profileHeaderTitle")}</h1>
      <div class="co-header-btn-space"></div>
    </div>
  <#elseif section == "form">
    <div class="co-screen-body">
      <h2 class="co-title">${msg("profileTitle")}</h2>
      <p class="co-subtitle">${msg("profileSubtitle")}</p>

      <#if message?has_content>
        <div class="co-alert co-alert-${message.type}">
          <span>${kcSanitize(message.summary)?no_esc}</span>
        </div>
      </#if>

      <form id="kc-update-profile-form" class="co-form" action="${url.loginAction}" method="post">
        <@userProfileCommons.userProfileFormFields />
      </form>

      <div class="co-security-badge">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="co-security-icon">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
        <span class="co-security-text">${msg("profileSecurityNote")}</span>
      </div>
    </div>

    <div class="co-screen-footer">
      <button class="co-cta-btn" type="submit" form="kc-update-profile-form">${msg("doSubmit")}</button>
      <#if isAppInitiatedAction??>
        <button class="co-secondary-btn" type="submit" name="cancel-aia" value="true" form="kc-update-profile-form">${msg("doCancel")}</button>
      </#if>
    </div>
  </#if>
</@layout.registrationLayout>
