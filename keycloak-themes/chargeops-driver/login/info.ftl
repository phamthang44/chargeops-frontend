<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#if section == "header">
    <div class="co-header">
      <div class="co-header-btn-space"></div>
      <h1 class="co-header-title"><#if messageHeader??>${messageHeader}<#else>${message.summary}</#if></h1>
      <div class="co-header-btn-space"></div>
    </div>
  <#elseif section == "form">
    <div class="co-screen-body">
      <h2 class="co-title"><#if messageHeader??>${messageHeader}<#else>${msg("infoTitle")}</#if></h2>

      <div class="co-alert co-alert-${message.type}">
        <span>
          ${kcSanitize(message.summary)?no_esc}
          <#if requiredActions??>
            <#list requiredActions>
              <strong><#items as reqActionItem>${msg("requiredAction.${reqActionItem}")}<#sep>, </#items></strong>
            </#list>
          </#if>
        </span>
      </div>
    </div>

    <#if !(skipLink??)>
      <div class="co-screen-footer">
        <#if pageRedirectUri?has_content>
          <a class="co-cta-link" href="${pageRedirectUri}">${kcSanitize(msg("backToApplication"))?no_esc}</a>
        <#elseif actionUri?has_content>
          <a class="co-cta-link" href="${actionUri}">${kcSanitize(msg("doContinue"))?no_esc}</a>
        <#elseif client?? && client.baseUrl?has_content>
          <a class="co-cta-link" href="${client.baseUrl}">${kcSanitize(msg("backToApplication"))?no_esc}</a>
        <#elseif url.loginUrl??>
          <a class="co-cta-link" href="${url.loginUrl}">${msg("backToLogin")}</a>
        </#if>
      </div>
    </#if>
  </#if>
</@layout.registrationLayout>
