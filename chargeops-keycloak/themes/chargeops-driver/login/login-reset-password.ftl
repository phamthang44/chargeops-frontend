<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#if section == "header">
    <div class="co-header">
      <a href="${url.loginUrl}" class="co-header-btn" aria-label="${msg('back')}">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </a>
      <h1 class="co-header-title">${msg("emailForgotTitle")}</h1>
      <div class="co-header-right">
        <#if realm.internationalizationEnabled?? && realm.internationalizationEnabled && locale.supported?has_content && (locale.supported?size > 1)>
          <div class="co-locale-dropdown" id="co-locale-dropdown">
            <button 
              type="button" 
              class="co-locale-trigger" 
              onclick="document.getElementById('co-locale-dropdown').classList.toggle('is-open')"
              aria-haspopup="true"
              aria-expanded="false"
            >
              <span class="co-locale-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10z"></path>
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
              var dropdown = document.getElementById('co-locale-dropdown');
              if (dropdown && !dropdown.contains(e.target)) {
                dropdown.classList.remove('is-open');
              }
            });
          </script>
        <#else>
          <div class="co-header-btn-space"></div>
        </#if>
      </div>
    </div>
  <#elseif section == "form">
    <div class="co-screen-body">
      <h2 class="co-title">${msg("emailForgotTitle")}</h2>
      <p class="co-subtitle">${msg("chargeopsResetPasswordSubtitle")}</p>

      <#if message?has_content>
        <div class="co-alert co-alert-${message.type}">
          <span>${kcSanitize(message.summary)?no_esc}</span>
        </div>
      </#if>

      <form id="kc-reset-password-form" class="co-form" action="${url.loginAction}" method="post">
        <div class="co-input-group">
          <label class="co-input-label" for="username">
            <#if !realm.loginWithEmailAllowed>
              ${msg("username")}
            <#elseif !realm.registrationEmailAsUsername>
              ${msg("usernameOrEmail")}
            <#else>
              ${msg("loginEmailLabel")}
            </#if>
          </label>
          <div class="co-input-field <#if messagesPerField.existsError('username')>is-error</#if>">
            <span class="co-input-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <input
              id="username"
              name="username"
              type="text"
              class="co-input"
              value="${(auth.attemptedUsername!'')}"
              placeholder="${msg('loginEmailPlaceholder')}"
              autocomplete="username"
              autofocus
              aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
            />
          </div>
          <#if messagesPerField.existsError('username')>
            <span class="co-field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
          </#if>
        </div>
      </form>
    </div>

    <div class="co-screen-footer">
      <button class="co-cta-btn" type="submit" form="kc-reset-password-form">${msg("resetPasswordCta")}</button>
      <div class="co-switch-row">
        <a href="${url.loginUrl}" class="co-switch-link">${msg("backToLogin")}</a>
      </div>
    </div>
  </#if>
</@layout.registrationLayout>
