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
      <h2 class="co-title">${msg("brokerLinkOverrideTitle")}</h2>
      <p class="co-subtitle">${msg("brokerLinkOverrideSubtitle", idpDisplayName)}</p>

      <#if message?has_content>
        <div class="co-alert co-alert-${message.type}">
          <span>${kcSanitize(message.summary)?no_esc}</span>
        </div>
      </#if>

      <div class="co-alert co-alert-warning">
        <span>${msg("brokerLinkOverrideInfo")}</span>
      </div>

      <form id="kc-idp-link-override-form" action="${url.loginAction}" method="post"></form>
    </div>

    <div class="co-screen-footer">
      <button class="co-cta-btn" type="submit" form="kc-idp-link-override-form" name="submitAction" id="confirmOverride" value="confirmOverride">
        ${msg("brokerLinkOverrideAction", idpDisplayName)}
      </button>
      <a class="co-secondary-link" id="loginRestartLink" href="${url.loginRestartFlowUrl}">${msg("brokerLinkRestartAction")}</a>
    </div>
  </#if>
</@layout.registrationLayout>
