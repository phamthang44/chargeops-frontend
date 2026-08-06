<#macro userProfileFormFields>
  <#assign currentGroup="">
  <#assign termsHref=properties.chargeopsTermsUrl!''>
  <#assign privacyHref=properties.chargeopsPrivacyUrl!''>
  <#list profile.attributes as attribute>
    <#assign attrName=attribute.name>
    <#assign attrValue=(attribute.value!'')>
    <#assign inputType=(attribute.annotations.inputType!'')>

    <#assign groupName=attribute.group!"">
    <#if groupName != currentGroup>
      <#assign currentGroup=groupName>
      <#if currentGroup != "">
        <div class="co-profile-group">
          <#assign groupDisplayHeader=attribute.groupDisplayHeader!"">
          <#assign groupDisplayDescription=attribute.groupDisplayDescription!"">
          <#if groupDisplayHeader != "">
            <div class="co-profile-group-title">${advancedMsg(groupDisplayHeader)}</div>
          <#else>
            <div class="co-profile-group-title">${groupName}</div>
          </#if>
          <#if groupDisplayDescription != "">
            <p class="co-helper-text">${advancedMsg(groupDisplayDescription)}</p>
          </#if>
        </div>
      </#if>
    </#if>

    <#if attrName == "termsAccepted">
      <@consentCheckbox attribute=attribute labelKey="termsOfService" href=termsHref textKey="profileTermsConsentText" />
    <#elseif attrName == "privacyAccepted">
      <@consentCheckbox attribute=attribute labelKey="privacyPolicy" href=privacyHref textKey="profilePrivacyConsentText" />
    <#else>
      <div class="co-input-group <#if attribute.required?? && attribute.required>required<#else>optional</#if>">
        <label class="co-input-label" for="${attrName}">${advancedMsg(attribute.displayName!'')}</label>

        <#if attribute.annotations.inputHelperTextBefore??>
          <p class="co-helper-text" id="form-help-text-before-${attrName}">${kcSanitize(advancedMsg(attribute.annotations.inputHelperTextBefore))?no_esc}</p>
        </#if>

        <#if inputType == "textarea">
          <textarea
            id="${attrName}"
            name="${attrName}"
            class="co-input co-textarea <#if messagesPerField.existsError(attrName)>is-error</#if>"
            aria-invalid="<#if messagesPerField.existsError(attrName)>true</#if>"
            <#if attribute.readOnly?? && attribute.readOnly>readonly</#if>
            <#if attribute.annotations.inputTypeRows??>rows="${attribute.annotations.inputTypeRows}"</#if>
            <#if attribute.annotations.inputTypeMaxlength??>maxlength="${attribute.annotations.inputTypeMaxlength}"</#if>
          >${attrValue}</textarea>
        <#elseif inputType == "select" || inputType == "multiselect">
          <@selectField attribute=attribute />
        <#else>
          <div class="co-input-field <#if messagesPerField.existsError(attrName)>is-error</#if>">
            <span class="co-input-icon">
              <@fieldIcon name=attrName />
            </span>
            <input
              id="${attrName}"
              name="${attrName}"
              type="<@inputTagType attribute=attribute />"
              class="co-input"
              value="${attrValue}"
              aria-invalid="<#if messagesPerField.existsError(attrName)>true</#if>"
              <#if attribute.readOnly?? && attribute.readOnly>readonly</#if>
              <#if attribute.autocomplete??>autocomplete="${attribute.autocomplete}"</#if>
              <#if attribute.annotations.inputTypePlaceholder??>placeholder="${advancedMsg(attribute.annotations.inputTypePlaceholder)}"</#if>
              <#if attribute.annotations.inputTypePattern??>pattern="${attribute.annotations.inputTypePattern}"</#if>
              <#if attribute.annotations.inputTypeMaxlength??>maxlength="${attribute.annotations.inputTypeMaxlength}"</#if>
              <#if attribute.annotations.inputTypeMinlength??>minlength="${attribute.annotations.inputTypeMinlength}"</#if>
              <#if attribute.annotations.inputTypeMax??>max="${attribute.annotations.inputTypeMax}"</#if>
              <#if attribute.annotations.inputTypeMin??>min="${attribute.annotations.inputTypeMin}"</#if>
              <#if attribute.annotations.inputTypeStep??>step="${attribute.annotations.inputTypeStep}"</#if>
            />
          </div>
        </#if>

        <#if messagesPerField.existsError(attrName)>
          <span id="input-error-${attrName}" class="co-field-error" aria-live="polite">
            ${kcSanitize(messagesPerField.get(attrName))?no_esc}
          </span>
        </#if>

        <#if attribute.annotations.inputHelperTextAfter??>
          <p class="co-helper-text" id="form-help-text-after-${attrName}">${kcSanitize(advancedMsg(attribute.annotations.inputHelperTextAfter))?no_esc}</p>
        </#if>
      </div>
    </#if>
  </#list>
</#macro>

<#macro consentCheckbox attribute labelKey href textKey>
  <#assign attrName=attribute.name>
  <#assign checked=(attribute.value!'') == "true">
  <#if attribute.values?? && attribute.values?seq_contains("true")>
    <#assign checked=true>
  </#if>
  <label class="co-checkbox-label <#if messagesPerField.existsError(attrName)>is-error</#if>">
    <input
      id="${attrName}"
      name="${attrName}"
      value="true"
      type="checkbox"
      class="co-checkbox-input"
      <#if checked>checked</#if>
      <#if attribute.required?? && attribute.required>required</#if>
      <#if attribute.readOnly?? && attribute.readOnly>disabled</#if>
    />
    <span class="co-checkbox-custom">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </span>
    <span class="co-checkbox-text">
      ${msg(textKey)} <a href="${href}" target="_blank" rel="noopener noreferrer" class="co-link">${msg(labelKey)}</a>.
    </span>
  </label>
  <#if messagesPerField.existsError(attrName)>
    <span id="input-error-${attrName}" class="co-field-error" aria-live="polite">
      ${kcSanitize(messagesPerField.get(attrName))?no_esc}
    </span>
  </#if>
</#macro>

<#macro selectField attribute>
  <#assign attrName=attribute.name>
  <#assign inputType=(attribute.annotations.inputType!'')>
  <#if attribute.annotations.inputOptionsFromValidation?? && attribute.validators[attribute.annotations.inputOptionsFromValidation]?? && attribute.validators[attribute.annotations.inputOptionsFromValidation].options??>
    <#assign options=attribute.validators[attribute.annotations.inputOptionsFromValidation].options>
  <#elseif attribute.validators.options?? && attribute.validators.options.options??>
    <#assign options=attribute.validators.options.options>
  </#if>
  <select
    id="${attrName}"
    name="${attrName}"
    class="co-select <#if messagesPerField.existsError(attrName)>is-error</#if>"
    aria-invalid="<#if messagesPerField.existsError(attrName)>true</#if>"
    <#if attribute.readOnly?? && attribute.readOnly>disabled</#if>
    <#if inputType == "multiselect">multiple</#if>
  >
    <#if inputType == "select">
      <option value=""></option>
    </#if>
    <#if options??>
      <#list options as option>
        <option value="${option}" <#if attribute.values?? && attribute.values?seq_contains(option)>selected</#if>>
          <@selectOptionLabelText attribute=attribute option=option />
        </option>
      </#list>
    </#if>
  </select>
</#macro>

<#macro inputTagType attribute>
  <#compress>
    <#assign rawType=(attribute.annotations.inputType!'')>
    <#if rawType?starts_with("html5-")>
      ${rawType[6..]}
    <#elseif rawType == "password" || rawType == "email" || rawType == "tel" || rawType == "number" || rawType == "date">
      ${rawType}
    <#elseif attribute.name?contains("email")>
      email
    <#elseif attribute.name?contains("phone")>
      tel
    <#else>
      text
    </#if>
  </#compress>
</#macro>

<#macro selectOptionLabelText attribute option>
  <#compress>
    <#if attribute.annotations.inputOptionLabels??>
      ${advancedMsg(attribute.annotations.inputOptionLabels[option]!option)}
    <#elseif attribute.annotations.inputOptionLabelsI18nPrefix??>
      ${msg(attribute.annotations.inputOptionLabelsI18nPrefix + "." + option)}
    <#else>
      ${option}
    </#if>
  </#compress>
</#macro>

<#macro fieldIcon name>
  <#if name?contains("email")>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  <#elseif name?contains("phone")>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.61a2 2 0 0 1-.45 2.11L8 9.7a16 16 0 0 0 6.3 6.3l1.26-1.26a2 2 0 0 1 2.11-.45c.84.28 1.71.48 2.61.6A2 2 0 0 1 22 16.92z"/>
    </svg>
  <#else>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  </#if>
</#macro>
