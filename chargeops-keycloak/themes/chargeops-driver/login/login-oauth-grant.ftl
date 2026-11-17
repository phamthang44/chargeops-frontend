<#import "template.ftl" as layout>
<@layout.registrationLayout bodyClass="oauth"; section>
  <#if section == "header">
    <div class="co-oauth-client-bar">
      <div class="co-oauth-client-identity">
        <#if client.attributes.logoUri??>
          <img class="co-oauth-client-logo" src="${client.attributes.logoUri}" alt="" />
        <#else>
          <span class="co-oauth-app-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M13 2 4 14h7l-1 8L20 9h-7l0-7Z" />
            </svg>
          </span>
        </#if>
        <span class="co-oauth-client-copy">
          <span class="co-oauth-client-caption">${msg("mcpGrantClientLabel")}</span>
          <strong class="co-oauth-client-name">
            <#if client.name?has_content>${advancedMsg(client.name)}<#else>${client.clientId}</#if>
          </strong>
        </span>
      </div>

      <#if realm.internationalizationEnabled?? && realm.internationalizationEnabled && locale.supported?has_content && (locale.supported?size > 1)>
        <nav class="co-oauth-mobile-languages" aria-label="${msg('language')}">
          <#list locale.supported as l>
            <a href="${l.url}" <#if l.label == locale.current>class="is-active" aria-current="page"</#if>>${l.label}</a>
          </#list>
        </nav>
      </#if>
    </div>
  <#elseif section == "form">
    <div id="kc-oauth" class="co-screen-body co-oauth-body">
      <div class="co-oauth-intro">
        <span class="co-oauth-eyebrow">${msg("mcpGrantEyebrow")}</span>
        <h1 class="co-title co-oauth-title">${msg("mcpGrantTitle")}</h1>
        <p class="co-subtitle co-oauth-subtitle">${msg("mcpGrantSubtitle")}</p>
      </div>

      <#if oauth.clientScopesRequested?? && oauth.clientScopesRequested?has_content>
        <section class="co-oauth-permissions" aria-labelledby="co-oauth-permissions-title">
          <div class="co-oauth-permission-heading">
            <h2 id="co-oauth-permissions-title">${msg("mcpGrantPermissionsTitle")}</h2>
            <span class="co-oauth-permission-count">${msg("mcpGrantPermissionCount", oauth.clientScopesRequested?size)}</span>
          </div>
          <ul class="co-oauth-permission-list">
            <#list oauth.clientScopesRequested as clientScope>
              <#assign scopeDescription = advancedMsg(clientScope.consentScreenText)>
              <li>
                <span class="co-oauth-permission-check" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 8 3.2 3.2L13 4.5" />
                  </svg>
                </span>
                <span class="co-oauth-permission-text">
                  <#if (locale.currentLanguageTag!'en')?starts_with('vi') && scopeDescription == 'Offline Access'>
                    ${msg("mcpScopeOfflineAccess")}
                  <#elseif (locale.currentLanguageTag!'en')?starts_with('vi') && scopeDescription == 'Email address'>
                    ${msg("mcpScopeEmailAddress")}
                  <#elseif (locale.currentLanguageTag!'en')?starts_with('vi') && scopeDescription == 'Read station and equipment status in ChargeOps.'>
                    ${msg("mcpScopeStationEquipmentRead")}
                  <#elseif (locale.currentLanguageTag!'en')?starts_with('vi') && scopeDescription == 'User roles'>
                    ${msg("mcpScopeUserRoles")}
                  <#elseif (locale.currentLanguageTag!'en')?starts_with('vi') && scopeDescription == 'User profile'>
                    ${msg("mcpScopeUserProfile")}
                  <#else>
                    ${scopeDescription}
                  </#if><#if clientScope.dynamicScopeParameter??>: <strong>${clientScope.dynamicScopeParameter}</strong></#if>
                </span>
              </li>
            </#list>
          </ul>
        </section>
      </#if>

      <#if client.attributes.policyUri?? || client.attributes.tosUri??>
        <p class="co-oauth-client-policy">
          ${msg("mcpGrantClientPolicyIntro")}
          <#if client.attributes.tosUri??>
            <a href="${client.attributes.tosUri}" target="_blank" rel="noopener noreferrer">${msg("oauthGrantTos")}</a>
          </#if>
          <#if client.attributes.policyUri??>
            <a href="${client.attributes.policyUri}" target="_blank" rel="noopener noreferrer">${msg("oauthGrantPolicy")}</a>
          </#if>
        </p>
      </#if>

      <p class="co-oauth-security-note">
        <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 2.5 16 5v4.4c0 3.7-2.5 6.4-6 8.1-3.5-1.7-6-4.4-6-8.1V5l6-2.5Z" />
          <path d="m7.5 9.8 1.7 1.7 3.4-3.6" />
        </svg>
        <span>${msg("mcpGrantSecurityHint")}</span>
      </p>

      <form id="kc-form-oauth-grant" class="co-oauth-form" action="${url.oauthAction}" method="POST">
        <input type="hidden" name="code" value="${oauth.code}">
        <div class="co-oauth-actions">
          <button id="kc-login" class="co-oauth-allow" name="accept" type="submit">${msg("mcpGrantAccept")}</button>
          <button id="kc-cancel" class="co-oauth-deny" name="cancel" type="submit">${msg("mcpGrantDeny")}</button>
        </div>
      </form>

      <div class="co-oauth-legal">
        <span>${msg("mcpGrantLegalNotice")}</span>
        <span class="co-oauth-legal-links">
          <#if properties.chargeopsTermsUrl?? && properties.chargeopsTermsUrl?has_content>
            <a href="${properties.chargeopsTermsUrl}" target="_blank" rel="noopener noreferrer">${msg("termsOfService")}</a>
          </#if>
          <#if properties.chargeopsPrivacyUrl?? && properties.chargeopsPrivacyUrl?has_content>
            <a href="${properties.chargeopsPrivacyUrl}" target="_blank" rel="noopener noreferrer">${msg("privacyPolicy")}</a>
          </#if>
        </span>
      </div>
    </div>
  </#if>
</@layout.registrationLayout>
