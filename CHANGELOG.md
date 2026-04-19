# Changelog

## [1.8.2](https://github.com/sondresjolyst/garge-app/compare/v1.8.1...v1.8.2) (2026-04-19)


### Bug Fixes

* **electricity:** filter monthly chart to first-of-month entries only ([#178](https://github.com/sondresjolyst/garge-app/issues/178)) ([8de5167](https://github.com/sondresjolyst/garge-app/commit/8de516738b1717c3e4962954389c41e5e4a711d5))

## [1.8.1](https://github.com/sondresjolyst/garge-app/compare/v1.8.0...v1.8.1) (2026-04-18)


### Bug Fixes

* add missing error message on registrer ([#175](https://github.com/sondresjolyst/garge-app/issues/175)) ([#176](https://github.com/sondresjolyst/garge-app/issues/176)) ([4a85338](https://github.com/sondresjolyst/garge-app/commit/4a853386489a3c2e4b921fd36c69cc13a9d186c7))

## [1.8.0](https://github.com/sondresjolyst/garge-app/compare/v1.7.0...v1.8.0) (2026-04-18)


### Features

* **automations:** show custom name for sockets, fallback to default name ([#173](https://github.com/sondresjolyst/garge-app/issues/173)) ([a1165e3](https://github.com/sondresjolyst/garge-app/commit/a1165e37635aae7631730d918a7b441d7824d197))

## [1.7.0](https://github.com/sondresjolyst/garge-app/compare/v1.6.1...v1.7.0) (2026-04-14)


### Features

* **automations:** timed auto-off UI ([#164](https://github.com/sondresjolyst/garge-app/issues/164)) ([c0dd4dc](https://github.com/sondresjolyst/garge-app/commit/c0dd4dc5bcc7546ef7426fdef70f18bcbce26578))
* electricity price conditions in automations UI and kr/kWh chart ([#163](https://github.com/sondresjolyst/garge-app/issues/163)) ([cb94c31](https://github.com/sondresjolyst/garge-app/commit/cb94c31da7c130497af5feb4409fd206cb48ca56))
* electricity stats, toast notifications, button locking ([#166](https://github.com/sondresjolyst/garge-app/issues/166)) ([ed16e17](https://github.com/sondresjolyst/garge-app/commit/ed16e17cfe1306506ad4383472fc87d8a6525a5b))


### Bug Fixes

* add char counter to drawer rename input ([#168](https://github.com/sondresjolyst/garge-app/issues/168)) ([6ed532b](https://github.com/sondresjolyst/garge-app/commit/6ed532b60b96a7f9304297ce727b54f41cd20d57))
* **electricity:** mobile-friendly chart with line on small screens ([#165](https://github.com/sondresjolyst/garge-app/issues/165)) ([9ef9298](https://github.com/sondresjolyst/garge-app/commit/9ef9298c47bd40597b11f4a592a02e2806f623ba))
* humidity 1 decimal, rename char counter, unified timeline tooltip ([#167](https://github.com/sondresjolyst/garge-app/issues/167)) ([709e375](https://github.com/sondresjolyst/garge-app/commit/709e375b36e3ddc979cbef80cc4e979335e44b43))

## [1.6.1](https://github.com/sondresjolyst/garge-app/compare/v1.6.0...v1.6.1) (2026-04-13)


### Bug Fixes

* prevent spam URL indexing via middleware refactor ([#159](https://github.com/sondresjolyst/garge-app/issues/159)) ([8c54eae](https://github.com/sondresjolyst/garge-app/commit/8c54eae7ee52ccb1ec1b7df692afbb1a7c6d6b63))
* use 14d window for stale sensor check instead of 1d data window ([0635d1f](https://github.com/sondresjolyst/garge-app/commit/0635d1fbdfffed3a7120c41fc3e409ea3a735270))

## [1.6.0](https://github.com/sondresjolyst/garge-app/compare/v1.5.0...v1.6.0) (2026-04-11)


### Features

* add footer ([#20](https://github.com/sondresjolyst/garge-app/issues/20)) ([8f772a8](https://github.com/sondresjolyst/garge-app/commit/8f772a8714281394b93fba3546bea143f406bad4))
* add socket support and update endpoints to match new api ([#41](https://github.com/sondresjolyst/garge-app/issues/41)) ([f134237](https://github.com/sondresjolyst/garge-app/commit/f134237019d6e85a342632d30aa099436f5ddd09))
* add vat for NO ([#12](https://github.com/sondresjolyst/garge-app/issues/12)) ([0396c08](https://github.com/sondresjolyst/garge-app/commit/0396c0857a71e5b04048a54fbf3a369e793c97c8))
* automations ([#74](https://github.com/sondresjolyst/garge-app/issues/74)) ([68e121e](https://github.com/sondresjolyst/garge-app/commit/68e121ef8aae4378c7cb982339815045ba985b07))
* claim sensor and set custom name ([#50](https://github.com/sondresjolyst/garge-app/issues/50)) ([9b0d080](https://github.com/sondresjolyst/garge-app/commit/9b0d080e25135b9863d9a1dcaef12d6660cafc4f))
* default date range to 7 days ([b9a671d](https://github.com/sondresjolyst/garge-app/commit/b9a671d131a6652e0529e32a5c2d3e510ac3319c))
* Electricity page ([228b5a1](https://github.com/sondresjolyst/garge-app/commit/228b5a1b85ccc1b16165410389288236d38a862a))
* email verification ([#13](https://github.com/sondresjolyst/garge-app/issues/13)) ([b7aaed2](https://github.com/sondresjolyst/garge-app/commit/b7aaed251fac73543d42031aac7dfa8b1a0b8f6d))
* **groups:** vehicle grouping with setup wizard ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **groups:** vehicle grouping with setup wizard ([#140](https://github.com/sondresjolyst/garge-app/issues/140)) ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* homepage text and garge images ([#54](https://github.com/sondresjolyst/garge-app/issues/54)) ([6b52ee9](https://github.com/sondresjolyst/garge-app/commit/6b52ee91539482740102f1e66f953c17ec3444ff))
* **legal:** add contact, terms of service, privacy policy and cookie policy pages ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* login and register ([ffcce0b](https://github.com/sondresjolyst/garge-app/commit/ffcce0b437b6268a958b70a0c9709f57bf33529c))
* login, profile and layout ([e30da5b](https://github.com/sondresjolyst/garge-app/commit/e30da5b7cd6fcc645319c75071dd5b4e5a8976f1))
* **nav:** remove sensors and sockets pages, simplify nav to 3 items ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **nav:** replace sidebar with floating bottom navigation pill ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* paging ([#52](https://github.com/sondresjolyst/garge-app/issues/52)) ([b50e507](https://github.com/sondresjolyst/garge-app/commit/b50e5075df1fc506192ee5312c6fcd68bca5602f))
* PWA ([#19](https://github.com/sondresjolyst/garge-app/issues/19)) ([389ddc2](https://github.com/sondresjolyst/garge-app/commit/389ddc20a03ee83faee6284a53cdb92babf0ae43))
* redirect to login page when cookie is expired ([#49](https://github.com/sondresjolyst/garge-app/issues/49)) ([763e0e6](https://github.com/sondresjolyst/garge-app/commit/763e0e6a5461716a5497a1e1ddf80ced9901e348))
* refresh token ([#48](https://github.com/sondresjolyst/garge-app/issues/48)) ([a3a9d4f](https://github.com/sondresjolyst/garge-app/commit/a3a9d4fd8acbd6249e2cb2b44603a99f519e8212))
* reset password ([#45](https://github.com/sondresjolyst/garge-app/issues/45)) ([d131217](https://github.com/sondresjolyst/garge-app/commit/d1312173a5e93d967b8a5066b3aea64572d7e0ef))
* sensors ([1482a6e](https://github.com/sondresjolyst/garge-app/commit/1482a6e19e7ab75344975b32c7b42ad96e220df0))
* **sensors:** replace battery health badge with icon tooltip showing status and last charged date ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* show battery health badge and last charged date on sensors page ([#113](https://github.com/sondresjolyst/garge-app/issues/113)) ([3e557c4](https://github.com/sondresjolyst/garge-app/commit/3e557c4b9d89464cd4498e695eca4a7e2f3da2a7))
* show localtime on electricity page instead of UTC ([6b2d5eb](https://github.com/sondresjolyst/garge-app/commit/6b2d5eb37832036668173e2998edc5671eb7fd58))
* socket self-claim, profile add-device for sockets, JWT cleanup ([#151](https://github.com/sondresjolyst/garge-app/issues/151)) ([a5d662d](https://github.com/sondresjolyst/garge-app/commit/a5d662dc87a8de943051e1afc2f333352d2d42c9))
* UX improvements batch ([#141](https://github.com/sondresjolyst/garge-app/issues/141)) ([6ce1745](https://github.com/sondresjolyst/garge-app/commit/6ce17459da39b36b6e50027e6dff28bce541b5da))


### Bug Fixes

* **auth:** redirect to devices page after login instead of profile ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **auth:** use unoptimized responsive icon on login, register and reset-password ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **deps:** bump next in the npm_and_yarn group across 1 directory ([#91](https://github.com/sondresjolyst/garge-app/issues/91)) ([1961374](https://github.com/sondresjolyst/garge-app/commit/1961374242974c9ac4b8cc9b00a111d1ec4bdeca))
* fetch battery health via voltage sensor name, remove battery sensor references ([b0680db](https://github.com/sondresjolyst/garge-app/commit/b0680db6d7250c7907579e44a38f41b7f6f8cece))
* fetch battery health via voltage sensor name, remove battery sensor references ([7af92cb](https://github.com/sondresjolyst/garge-app/commit/7af92cb451c0a1726cf70b3aeac70c0a996c2781))
* log battery health fetch errors instead of silently dropping them ([#116](https://github.com/sondresjolyst/garge-app/issues/116)) ([4670c3f](https://github.com/sondresjolyst/garge-app/commit/4670c3ff4970c9c72a3beac935734e557695aa90))
* refresh serveside component after login ([11be74a](https://github.com/sondresjolyst/garge-app/commit/11be74afe00b3e08789d0002a3b9babd5d59d77a))
* sensor request loop ([bac6b6f](https://github.com/sondresjolyst/garge-app/commit/bac6b6fd50a6278a7c6e9dab198101dc6295950b))
* sidebar redirecting not working after login ([a077138](https://github.com/sondresjolyst/garge-app/commit/a07713897b6c0d5271c8483408488354746d62ac))
* sidebar redirecting not working after login ([#79](https://github.com/sondresjolyst/garge-app/issues/79)) ([015565c](https://github.com/sondresjolyst/garge-app/commit/015565c35c425ebd3db8039ed762c3efb9237105))
* **ui:** mobile polish, inactive devices, and UX improvements ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **ui:** remove unoptimized from navbar-sized icons to prevent oversizing ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* update date filtering logic in ElectricityPage to handle timezone correctly ([7462b32](https://github.com/sondresjolyst/garge-app/commit/7462b321394ea32f406d20d1deefc8fa5ca1dc80))
* use 14d window for stale sensor check instead of 1d data window ([a5d662d](https://github.com/sondresjolyst/garge-app/commit/a5d662dc87a8de943051e1afc2f333352d2d42c9))
* use result.error.issues instead of deprecated .errors (Zod v4) ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* use result.error.issues instead of deprecated .errors (Zod v4) ([#137](https://github.com/sondresjolyst/garge-app/issues/137)) ([5b66c77](https://github.com/sondresjolyst/garge-app/commit/5b66c77fe34f706f1514dc1fb3b2547363c3f333))


### Performance Improvements

* sensor data performance improvements ([#126](https://github.com/sondresjolyst/garge-app/issues/126)) ([592e281](https://github.com/sondresjolyst/garge-app/commit/592e281ca7e9aa528daecbf814d8dd2a752b130a))

## [1.5.0](https://github.com/sondresjolyst/garge-app/compare/v1.4.2...v1.5.0) (2026-04-10)


### Features

* **groups:** vehicle grouping with setup wizard ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **groups:** vehicle grouping with setup wizard ([#140](https://github.com/sondresjolyst/garge-app/issues/140)) ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **legal:** add contact, terms of service, privacy policy and cookie policy pages ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **nav:** remove sensors and sockets pages, simplify nav to 3 items ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **nav:** replace sidebar with floating bottom navigation pill ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **sensors:** replace battery health badge with icon tooltip showing status and last charged date ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* UX improvements batch ([#141](https://github.com/sondresjolyst/garge-app/issues/141)) ([6ce1745](https://github.com/sondresjolyst/garge-app/commit/6ce17459da39b36b6e50027e6dff28bce541b5da))


### Bug Fixes

* **auth:** redirect to devices page after login instead of profile ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **auth:** use unoptimized responsive icon on login, register and reset-password ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **ui:** mobile polish, inactive devices, and UX improvements ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* **ui:** remove unoptimized from navbar-sized icons to prevent oversizing ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))
* use result.error.issues instead of deprecated .errors (Zod v4) ([7a02781](https://github.com/sondresjolyst/garge-app/commit/7a027816100aa61cc0fb09b4a4c46a6da734b7da))

## [1.4.2](https://github.com/sondresjolyst/garge-app/compare/v1.4.1...v1.4.2) (2026-04-08)


### Bug Fixes

* use result.error.issues instead of deprecated .errors (Zod v4) ([#137](https://github.com/sondresjolyst/garge-app/issues/137)) ([5b66c77](https://github.com/sondresjolyst/garge-app/commit/5b66c77fe34f706f1514dc1fb3b2547363c3f333))

## [1.4.1](https://github.com/sondresjolyst/garge-app/compare/v1.4.0...v1.4.1) (2026-04-08)


### Bug Fixes

* fetch battery health via voltage sensor name, remove battery sensor references ([b0680db](https://github.com/sondresjolyst/garge-app/commit/b0680db6d7250c7907579e44a38f41b7f6f8cece))
* fetch battery health via voltage sensor name, remove battery sensor references ([7af92cb](https://github.com/sondresjolyst/garge-app/commit/7af92cb451c0a1726cf70b3aeac70c0a996c2781))

## [1.4.0](https://github.com/sondresjolyst/garge-app/compare/v1.3.1...v1.4.0) (2026-04-06)


### Features

* default date range to 7 days ([b9a671d](https://github.com/sondresjolyst/garge-app/commit/b9a671d131a6652e0529e32a5c2d3e510ac3319c))


### Bug Fixes

* update date filtering logic in ElectricityPage to handle timezone correctly ([7462b32](https://github.com/sondresjolyst/garge-app/commit/7462b321394ea32f406d20d1deefc8fa5ca1dc80))


### Performance Improvements

* sensor data performance improvements ([#126](https://github.com/sondresjolyst/garge-app/issues/126)) ([592e281](https://github.com/sondresjolyst/garge-app/commit/592e281ca7e9aa528daecbf814d8dd2a752b130a))

## [1.3.1](https://github.com/sondresjolyst/garge-app/compare/v1.3.0...v1.3.1) (2026-03-27)


### Bug Fixes

* log battery health fetch errors instead of silently dropping them ([#116](https://github.com/sondresjolyst/garge-app/issues/116)) ([4670c3f](https://github.com/sondresjolyst/garge-app/commit/4670c3ff4970c9c72a3beac935734e557695aa90))

## [1.3.0](https://github.com/sondresjolyst/garge-app/compare/v1.2.2...v1.3.0) (2026-03-26)


### Features

* show battery health badge and last charged date on sensors page ([#113](https://github.com/sondresjolyst/garge-app/issues/113)) ([3e557c4](https://github.com/sondresjolyst/garge-app/commit/3e557c4b9d89464cd4498e695eca4a7e2f3da2a7))

## [1.2.2](https://github.com/sondresjolyst/garge-app/compare/v1.2.1...v1.2.2) (2025-12-12)


### Bug Fixes

* **deps:** bump next in the npm_and_yarn group across 1 directory ([#91](https://github.com/sondresjolyst/garge-app/issues/91)) ([1961374](https://github.com/sondresjolyst/garge-app/commit/1961374242974c9ac4b8cc9b00a111d1ec4bdeca))

## [1.2.1](https://github.com/sondresjolyst/garge-app/compare/v1.2.0...v1.2.1) (2025-08-10)


### Bug Fixes

* sidebar redirecting not working after login ([#79](https://github.com/sondresjolyst/garge-app/issues/79)) ([015565c](https://github.com/sondresjolyst/garge-app/commit/015565c35c425ebd3db8039ed762c3efb9237105))

## [1.2.0](https://github.com/sondresjolyst/garge-app/compare/v1.1.0...v1.2.0) (2025-08-10)


### Features

* automations ([#74](https://github.com/sondresjolyst/garge-app/issues/74)) ([68e121e](https://github.com/sondresjolyst/garge-app/commit/68e121ef8aae4378c7cb982339815045ba985b07))

## [1.1.0](https://github.com/sondresjolyst/garge-app/compare/v1.0.0...v1.1.0) (2025-07-21)


### Features

* add socket support and update endpoints to match new api ([#41](https://github.com/sondresjolyst/garge-app/issues/41)) ([f134237](https://github.com/sondresjolyst/garge-app/commit/f134237019d6e85a342632d30aa099436f5ddd09))
* claim sensor and set custom name ([#50](https://github.com/sondresjolyst/garge-app/issues/50)) ([9b0d080](https://github.com/sondresjolyst/garge-app/commit/9b0d080e25135b9863d9a1dcaef12d6660cafc4f))
* homepage text and garge images ([#54](https://github.com/sondresjolyst/garge-app/issues/54)) ([6b52ee9](https://github.com/sondresjolyst/garge-app/commit/6b52ee91539482740102f1e66f953c17ec3444ff))
* paging ([#52](https://github.com/sondresjolyst/garge-app/issues/52)) ([b50e507](https://github.com/sondresjolyst/garge-app/commit/b50e5075df1fc506192ee5312c6fcd68bca5602f))
* redirect to login page when cookie is expired ([#49](https://github.com/sondresjolyst/garge-app/issues/49)) ([763e0e6](https://github.com/sondresjolyst/garge-app/commit/763e0e6a5461716a5497a1e1ddf80ced9901e348))
* refresh token ([#48](https://github.com/sondresjolyst/garge-app/issues/48)) ([a3a9d4f](https://github.com/sondresjolyst/garge-app/commit/a3a9d4fd8acbd6249e2cb2b44603a99f519e8212))
* reset password ([#45](https://github.com/sondresjolyst/garge-app/issues/45)) ([d131217](https://github.com/sondresjolyst/garge-app/commit/d1312173a5e93d967b8a5066b3aea64572d7e0ef))

## 1.0.0 (2025-03-25)


### Features

* add footer ([#20](https://github.com/sondresjolyst/garge-app/issues/20)) ([8f772a8](https://github.com/sondresjolyst/garge-app/commit/8f772a8714281394b93fba3546bea143f406bad4))
* add vat for NO ([#12](https://github.com/sondresjolyst/garge-app/issues/12)) ([0396c08](https://github.com/sondresjolyst/garge-app/commit/0396c0857a71e5b04048a54fbf3a369e793c97c8))
* Electricity page ([228b5a1](https://github.com/sondresjolyst/garge-app/commit/228b5a1b85ccc1b16165410389288236d38a862a))
* email verification ([#13](https://github.com/sondresjolyst/garge-app/issues/13)) ([b7aaed2](https://github.com/sondresjolyst/garge-app/commit/b7aaed251fac73543d42031aac7dfa8b1a0b8f6d))
* login and register ([ffcce0b](https://github.com/sondresjolyst/garge-app/commit/ffcce0b437b6268a958b70a0c9709f57bf33529c))
* login, profile and layout ([e30da5b](https://github.com/sondresjolyst/garge-app/commit/e30da5b7cd6fcc645319c75071dd5b4e5a8976f1))
* PWA ([#19](https://github.com/sondresjolyst/garge-app/issues/19)) ([389ddc2](https://github.com/sondresjolyst/garge-app/commit/389ddc20a03ee83faee6284a53cdb92babf0ae43))
* sensors ([1482a6e](https://github.com/sondresjolyst/garge-app/commit/1482a6e19e7ab75344975b32c7b42ad96e220df0))


### Bug Fixes

* sensor request loop ([bac6b6f](https://github.com/sondresjolyst/garge-app/commit/bac6b6fd50a6278a7c6e9dab198101dc6295950b))
