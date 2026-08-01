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

The theme declares `vi` and `en` as supported locales. To make Vietnamese the
realm default, enable internationalization in `Realm settings -> Localization`
and set `Default locale` to `Vietnamese` (or set the realm property
`defaultLocale` to `vi` through the Admin REST API). The theme itself cannot
choose the realm default from `theme.properties`.
