# ChargeOps Driver Keycloak Theme

This is a standalone Keycloak login theme inspired by the current React Native
`LoginScreen`. It does not replace the mobile screen; it is a backup-friendly
theme candidate for Keycloak hosted login.

Local Docker idea:

```bash
docker run \
  -v ./keycloak-themes/chargeops-driver:/opt/keycloak/themes/chargeops-driver \
  quay.io/keycloak/keycloak:26.0 start-dev
```

Then in Keycloak admin:

```text
Realm settings -> Themes -> Login theme -> chargeops-driver
Realm settings -> Themes -> Account theme -> chargeops-driver
Realm settings -> Themes -> Email theme -> chargeops-driver
```

For your existing `docker-compose.yml`, mount this folder into the Keycloak
container under `/opt/keycloak/themes/chargeops-driver`.

## Email theme coverage

Current source split:

```text
chargeops-backend
  No custom mail sender/service is present. The backend validates Keycloak JWTs
  and keeps email only as user profile data.

docker-compose.yml
  Keycloak is mounted with this theme and Mailpit is available locally at
  http://localhost:8025 for email testing.

keycloak-themes/chargeops-driver/email
  theme.properties                     Selects Keycloak email parent theme.
  html/template.ftl                    ChargeOps HTML wrapper for all email HTML templates.
  messages/messages_vi.properties      Vietnamese subjects, text bodies, HTML bodies.
  messages/messages_en.properties      English subjects, text bodies, HTML bodies.
```

Customized Keycloak email flows:

```text
emailVerification*          Register / Verify Email required action / resend verification.
passwordReset*              Forgot password and reset credentials emails.
executeActions*             Admin-triggered required actions such as verify email,
                            update password, update profile, configure OTP.
emailUpdateConfirmation*    Confirm a new account email address.
identityProviderLink*       Confirm linking an external identity provider account.
emailTest*                  SMTP test message from Realm settings.
eventLoginError*            Failed login event notification.
eventRemoveTotp*            OTP removed event notification.
eventUpdatePassword*        Password changed event notification.
eventUpdateTotp*            OTP changed event notification.
eventUpdateEmail*           Email changed event notification.
eventDeleteAccount*         Account deleted event notification.
orgInvite*                  Organization invite email, kept for Keycloak org features.
```

The theme declares `vi` and `en` as supported locales. To make Vietnamese the
realm default, enable internationalization in `Realm settings -> Localization`
and set `Default locale` to `Vietnamese` (or set the realm property
`defaultLocale` to `vi` through the Admin REST API). The theme itself cannot
choose the realm default from `theme.properties`.

## Consent and login options

The login page renders Keycloak's native `rememberMe` field only when the
realm's `Remember Me` option is enabled. Registration is intentionally minimal:
Keycloak collects only account credentials such as email/username and password.
ChargeOps collects domain profile fields such as display name and phone after
login and stores them in `user_profiles`.

The registration page still submits two real Keycloak user attributes for
consent:

```text
user.attributes.termsAccepted=true
user.attributes.privacyAccepted=true
```

To make the inline consent checkboxes server-enforced, add `termsAccepted`
and `privacyAccepted` as String attributes in `Realm settings -> User profile`,
and mark both as required for users. The HTML `required` flag is only a
browser convenience; the User Profile requirement is the server-side
validation.

The theme also includes `login/terms.ftl` for Keycloak's native Terms and
Conditions required action. Choose one consent mode to avoid asking for Terms
twice:

```text
Inline mode (default): chargeopsInlineConsentEnabled=true
  - Require termsAccepted and privacyAccepted in User Profile.
  - Do not make Terms and Conditions Required in the registration flow.

Native Terms mode: chargeopsInlineConsentEnabled=false
  - Require privacyAccepted in User Profile.
  - Enable Terms and Conditions under Authentication -> Required actions.
  - Set Terms and Conditions to Required in the registration flow.
```

Native Terms mode records Keycloak's `terms_and_conditions` acceptance. Keep
the separate `privacyAccepted` attribute if privacy consent must be captured
independently.

Legal links default to the local marketing routes in `login/theme.properties`:

```properties
chargeopsTermsUrl=http://localhost:3000/dieu-khoan
chargeopsPrivacyUrl=http://localhost:3000/chinh-sach-bao-mat
```

Replace these two values with the public HTTPS marketing URL before deploying.

## Required actions

The login theme customizes the common required-action screens so they keep the
same ChargeOps mobile-auth look:

```text
login-update-profile.ftl      Update Profile / Verify Profile
idp-review-user-profile.ftl   First broker-login profile review
login-update-password.ftl     Update Password / password reset completion
login-verify-email.ftl        Verify Email
info.ftl                      Provider info, sent-email, and completion notices
terms.ftl                     Native Terms and Conditions action
```

Recommended local realm setup:

```text
Authentication -> Required actions
  Verify Email:          Enabled; set default only if all new users must verify email.
  Verify Profile:        Enabled; prefer this for User Profile compliance checks.
  Update Profile:        Enabled; do not set default unless every new user must review profile.
  Update Password:       Enabled; assign per user for temporary/expired passwords.
  Terms and Conditions:  Disabled as default when chargeopsInlineConsentEnabled=true.
```

Use `Realm settings -> User profile` for server-side requirements. For the
default inline consent mode, define `termsAccepted` and `privacyAccepted` as
required String attributes for registration. If you switch to native Terms,
set `chargeopsInlineConsentEnabled=false`, keep `privacyAccepted` required,
and enable `Terms and Conditions` as the default required action.

The browser favicon is served from `login/resources/img/favicon.svg` through
`login/template.ftl`. This affects the hosted login and required-action pages;
the Keycloak admin console favicon would need a separate admin theme.

## Client wiring

Use the same responsive theme for the browser console and the mobile system
browser. Create two public clients in the `chargeops` realm:

```text
chargeops-web
  Valid redirect URI: http://localhost:5173/*
  Web origin:         http://localhost:5173

chargeops-driver-mobile
  Valid redirect URI: chargeops://auth/callback
  Valid redirect URI: http://localhost:8082/*
  Web origin:         http://localhost:8082
```

For both clients enable Standard Flow, disable Direct Access Grants and
Implicit Flow, and set Proof Key for Code Exchange (PKCE) to `S256`. The web
app uses `VITE_KEYCLOAK_*` variables; the mobile app uses
`EXPO_PUBLIC_KEYCLOAK_*` variables. The `localhost:8082` entries are required
when the mobile app is demoed through Expo Web. Android emulators must reach
the host via `10.0.2.2`, while physical devices need the computer's LAN IP.

## Google sign-in

The login and registration pages render Keycloak identity providers from
`social.providers`. To show the Google button, configure a Google identity
provider in the `chargeops` realm and keep its alias as `google`. Keycloak owns
the Google OAuth redirect and account-linking flow; the apps still receive only
the normal Keycloak tokens.

In Google Cloud, register Keycloak's broker callback as an authorized redirect
URI, for example:

```text
http://localhost:8080/realms/chargeops/broker/google/endpoint
```

For driver self-registration, assign the `DRIVER` realm role through a default
realm role, group, or post-login provisioning rule so backend RBAC receives the
same role claim as password-based accounts.
