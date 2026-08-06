<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#if section == "header">
    <div class="co-header">
      <a href="${url.loginUrl}" class="co-header-btn" aria-label="${msg('back')}">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </a>
      <h1 class="co-header-title">${msg("registerHeaderTitle")}</h1>
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
      <h2 class="co-title">${msg("registerTitle")}</h2>
      <p class="co-subtitle">${msg("registerSubtitle")}</p>

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

      <form id="kc-register-form" class="co-form" action="${url.registrationAction}" method="post">
        <!-- Email Field -->
        <div class="co-input-group">
          <label class="co-input-label" for="email">${msg("registerEmailLabel")}</label>
          <div class="co-input-field <#if messagesPerField.existsError('email')>is-error</#if>">
            <span class="co-input-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <input
              id="email"
              name="email"
              type="email"
              class="co-input"
              value="${(register.formData.email!'')}"
              placeholder="${msg('registerEmailPlaceholder')}"
              autocomplete="email"
              autofocus
              aria-invalid="<#if messagesPerField.existsError('email')>true</#if>"
            />
          </div>
          <#if messagesPerField.existsError('email')>
            <span class="co-field-error">${kcSanitize(messagesPerField.get('email'))?no_esc}</span>
          </#if>
        </div>

        <#if !realm.registrationEmailAsUsername>
          <div class="co-input-group">
            <label class="co-input-label" for="username">${msg("username")}</label>
            <div class="co-input-field <#if messagesPerField.existsError('username')>is-error</#if>">
              <span class="co-input-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                id="username"
                name="username"
                type="text"
                class="co-input"
                value="${(register.formData.username!'')}"
                autocomplete="username"
                aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
              />
            </div>
          </div>
        </#if>

        <#if passwordRequired??>
          <!-- Password Field -->
          <div class="co-input-group">
            <label class="co-input-label" for="password">${msg("registerPasswordLabel")}</label>
            <div class="co-input-field <#if messagesPerField.existsError('password','password-confirm')>is-error</#if>">
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
                placeholder="${msg('registerPasswordPlaceholder')}"
                autocomplete="new-password"
                aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"
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
            <#if messagesPerField.existsError('password')>
              <span class="co-field-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
            </#if>
          </div>

          <!-- Password Confirm Field -->
          <div class="co-input-group">
            <label class="co-input-label" for="password-confirm">${msg("registerConfirmLabel")}</label>
            <div class="co-input-field <#if messagesPerField.existsError('password-confirm')>is-error</#if>">
              <span class="co-input-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                id="password-confirm"
                name="password-confirm"
                type="password"
                class="co-input"
                placeholder="${msg('registerConfirmPlaceholder')}"
                autocomplete="new-password"
                aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
              />
              <button 
                type="button" 
                class="co-password-toggle" 
                onclick="togglePasswordVisibility('password-confirm', this)" 
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
            <#if messagesPerField.existsError('password-confirm')>
              <span class="co-field-error">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
            </#if>
          </div>
        </#if>

        <#if recaptchaRequired??>
          <div class="co-input-group">
            <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
          </div>
        </#if>

        <!-- These names map to the identity service profile attributes. -->
        <#if properties.chargeopsInlineConsentEnabled == 'true'>
        <label class="co-checkbox-label <#if messagesPerField.existsError('user.attributes.termsAccepted')>is-error</#if>">
          <input
            id="termsAccepted"
            name="user.attributes.termsAccepted"
            value="true"
            type="checkbox"
            class="co-checkbox-input"
            required
            aria-describedby="termsAccepted-error"
            aria-invalid="<#if messagesPerField.existsError('user.attributes.termsAccepted')>true<#else>false</#if>"
            <#if register.formData['user.attributes.termsAccepted']?has_content>checked</#if>
          />
          <span class="co-checkbox-custom">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          <span class="co-checkbox-text">
            ${msg("registerAgreePrefix")}
            <a href="${properties.chargeopsTermsUrl!}" target="_blank" rel="noopener noreferrer" class="co-link">${msg("termsOfService")}</a>
            ${msg("registerAgreeSuffix")}
          </span>
        </label>
        <span
          id="termsAccepted-error"
          class="co-field-error"
          aria-live="polite"
          <#if !messagesPerField.existsError('user.attributes.termsAccepted')>hidden</#if>
        ><#if messagesPerField.existsError('user.attributes.termsAccepted')>${kcSanitize(messagesPerField.get('user.attributes.termsAccepted'))?no_esc}<#else>${msg("termsRequiredMessage")}</#if></span>
        </#if>

        <label class="co-checkbox-label <#if messagesPerField.existsError('user.attributes.privacyAccepted')>is-error</#if>">
          <input
            id="privacyAccepted"
            name="user.attributes.privacyAccepted"
            value="true"
            type="checkbox"
            class="co-checkbox-input"
            required
            aria-describedby="privacyAccepted-error"
            aria-invalid="<#if messagesPerField.existsError('user.attributes.privacyAccepted')>true<#else>false</#if>"
            <#if register.formData['user.attributes.privacyAccepted']?has_content>checked</#if>
          />
          <span class="co-checkbox-custom">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          <span class="co-checkbox-text">
            ${msg("registerAgreePrivacyPrefix")}&#32;
            <a href="${properties.chargeopsPrivacyUrl!}" target="_blank" rel="noopener noreferrer" class="co-link">${msg("privacyPolicy")}</a>
            ${msg("registerAgreeSuffix")}
          </span>
        </label>
        <span
          id="privacyAccepted-error"
          class="co-field-error"
          aria-live="polite"
          <#if !messagesPerField.existsError('user.attributes.privacyAccepted')>hidden</#if>
        ><#if messagesPerField.existsError('user.attributes.privacyAccepted')>${kcSanitize(messagesPerField.get('user.attributes.privacyAccepted'))?no_esc}<#else>${msg("privacyRequiredMessage")}</#if></span>
      </form>

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

        (function setupConsentValidation() {
          var form = document.getElementById('kc-register-form');
          if (!form) return;

          var consentIds = ['termsAccepted', 'privacyAccepted'];
          var focusScheduled = false;

          function setConsentError(input, visible) {
            var label = input.closest('.co-checkbox-label');
            var error = document.getElementById(input.id + '-error');
            if (label) label.classList.toggle('is-error', visible);
            input.setAttribute('aria-invalid', visible ? 'true' : 'false');
            if (error) error.hidden = !visible;
          }

          consentIds.forEach(function(id) {
            var input = document.getElementById(id);
            if (!input) return;

            input.addEventListener('invalid', function(event) {
              event.preventDefault();
              setConsentError(input, true);
              if (!focusScheduled) {
                focusScheduled = true;
                window.setTimeout(function() {
                  input.focus();
                  focusScheduled = false;
                }, 0);
              }
            });

            input.addEventListener('change', function() {
              setConsentError(input, !input.checked);
            });
          });

          form.addEventListener('submit', function(event) {
            var firstMissing = null;
            consentIds.forEach(function(id) {
              var input = document.getElementById(id);
              if (!input || input.checked) return;
              setConsentError(input, true);
              if (!firstMissing) firstMissing = input;
            });

            if (firstMissing) {
              event.preventDefault();
              firstMissing.focus();
            }
          });
        })();
      </script>
    </div>

    <div class="co-screen-footer">
      <button id="kc-register-submit" class="co-cta-btn" type="submit" form="kc-register-form">${msg("registerCta")}</button>
      <div class="co-switch-row">
        <span class="co-switch-text">${msg("registerHasAccount")}</span>
        <a href="${url.loginUrl}" class="co-switch-link">${msg("registerSignIn")}</a>
      </div>
    </div>
  </#if>
</@layout.registrationLayout>
