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

      <form id="kc-idp-review-profile-form" class="co-form" action="${url.loginAction}" method="post">
        <@userProfileCommons.userProfileFormFields />
      </form>
    </div>

    <div class="co-screen-footer">
      <button class="co-cta-btn" type="submit" form="kc-idp-review-profile-form">${msg("doSubmit")}</button>
    </div>
  </#if>
</@layout.registrationLayout>
