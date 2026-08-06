<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#if section == "header">
    <div class="co-header">
      <button type="button" class="co-header-btn" onclick="window.history.back();" aria-label="${msg('back')}">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="co-header-title">${msg("loginHeaderTitle")}</h1>
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
      <h2 class="co-title">${msg("loginTitle")}</h2>
      <p class="co-subtitle">${msg("loginSubtitle")}</p>

      <#if message?has_content>
        <div class="co-alert co-alert-${message.type}">
          <span>${kcSanitize(message.summary)?no_esc}</span>
        </div>
      </#if>

      <#if social.providers?? && social.providers?has_content>
        <div class="co-social-section">
          <#list social.providers as provider>
            <a class="co-social-btn co-social-${provider.alias}" id="social-${provider.alias}" href="${provider.loginUrl}">
              <#if provider.alias == "google">
                <span class="co-social-google-mark" aria-hidden="true">G</span>
              <#else>
                <span class="co-social-generic-mark" aria-hidden="true">${(provider.displayName!provider.alias)?substring(0, 1)?upper_case}</span>
              </#if>
              <span>${msg("socialContinueWith", provider.displayName)}</span>
            </a>
          </#list>
        </div>
        <div class="co-divider"><span>${msg("socialDivider")}</span></div>
      </#if>

      <form id="kc-form-login" class="co-form" action="${url.loginAction}" method="post">
        <#if !(usernameHidden??)>
          <div class="co-input-group">
            <label class="co-input-label" for="username">${msg("loginEmailLabel")}</label>
            <div class="co-input-field <#if messagesPerField.existsError('username','password')>is-error</#if>">
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
                value="${(login.username!'')}"
                placeholder="${msg('loginEmailPlaceholder')}"
                autocomplete="username"
                autofocus
                aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
              />
            </div>
          </div>
        </#if>

        <div class="co-input-group">
          <label class="co-input-label" for="password">${msg("loginPasswordLabel")}</label>
          <div class="co-input-field <#if messagesPerField.existsError('username','password')>is-error</#if>">
            <span class="co-input-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              id="password"
              name="password"
              type="password"
              class="co-input"
              placeholder="${msg('loginPasswordPlaceholder')}"
              autocomplete="current-password"
              aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
            />
            <button 
              type="button" 
              class="co-password-toggle" 
              onclick="togglePasswordVisibility('password', this)" 
              aria-label="${msg('showPassword')}"
            >
              <!-- Eye Off (Hidden State) -->
              <svg class="co-icon-eye-off" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <!-- Eye Open (Visible State) -->
              <svg class="co-icon-eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <#if realm.rememberMe && !usernameHidden??>
          <div class="co-login-option-row">
            <label class="co-checkbox-label co-remember-label">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                class="co-checkbox-input"
                <#if login.rememberMe??>checked</#if>
              />
              <span class="co-checkbox-custom">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <span class="co-checkbox-text">${msg("rememberMe")}</span>
            </label>
          </div>
        </#if>

        <#if realm.resetPasswordAllowed>
          <div class="co-forgot-row">
            <a href="${url.loginResetCredentialsUrl}" class="co-forgot-link">${msg("loginForgot")}</a>
          </div>
        </#if>

        <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if> />
      </form>

      <div class="co-security-badge">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="co-security-icon">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
        <span class="co-security-text">${msg("loginSecurityNote")}</span>
      </div>
    </div>

    <div class="co-screen-footer">
      <button class="co-cta-btn" type="submit" form="kc-form-login">${msg("loginCta")}</button>
      <#if realm.registrationAllowed && !registrationDisabled??>
        <div class="co-switch-row">
          <span class="co-switch-text">${msg("loginNoAccount")}</span>
          <a href="${url.registrationUrl}" class="co-switch-link">${msg("loginSignUp")}</a>
        </div>
      </#if>
    </div>

    <script>
      function togglePasswordVisibility(id, btn) {
        var input = document.getElementById(id);
        if (input.type === 'password') {
          input.type = 'text';
          btn.classList.add('is-visible');
        } else {
          input.type = 'password';
          btn.classList.remove('is-visible');
        }
      }
    </script>
  </#if>
</@layout.registrationLayout>
