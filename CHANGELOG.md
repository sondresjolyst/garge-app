# Changelog

## [1.17.0](https://github.com/sondresjolyst/garge-app/compare/v1.16.0...v1.17.0) (2026-05-20)


### Features

* deterministic sort for automation rules ([#299](https://github.com/sondresjolyst/garge-app/issues/299)) ([e44fd70](https://github.com/sondresjolyst/garge-app/commit/e44fd7002dfaa206e677953b1ecdca30f980e12f))
* gate claim UI by subscription status before submit ([#317](https://github.com/sondresjolyst/garge-app/issues/317)) ([28b5d75](https://github.com/sondresjolyst/garge-app/commit/28b5d75fc1a3b60455cefe63909de5a596e4b328))


### Bug Fixes

* lift cart FAB and hide nav when cart drawer open ([#298](https://github.com/sondresjolyst/garge-app/issues/298)) ([929b176](https://github.com/sondresjolyst/garge-app/commit/929b1762ef9bdfc89b74f40da6a719e2f8054dd9))
* make offline alert toggle reflect this device only ([#300](https://github.com/sondresjolyst/garge-app/issues/300)) ([fb4a6fc](https://github.com/sondresjolyst/garge-app/commit/fb4a6fc5fba03a881be3fa843f2e7829d1cf4595))
* prevent description text from collapsing on profile page rows ([#301](https://github.com/sondresjolyst/garge-app/issues/301)) ([294aa77](https://github.com/sondresjolyst/garge-app/commit/294aa773de4e45c78e999ea431d1e470225ff55d))
* resolve subscription on billing return by id ([#321](https://github.com/sondresjolyst/garge-app/issues/321)) ([0968346](https://github.com/sondresjolyst/garge-app/commit/096834658b58c856c4c3a51486b526aa36f71840))
* surface backend message when claim is forbidden ([#314](https://github.com/sondresjolyst/garge-app/issues/314)) ([eaf2a6e](https://github.com/sondresjolyst/garge-app/commit/eaf2a6ee455ac71958f8e4434f1903827a8bcf37))
* surface backend validation errors on register ([#313](https://github.com/sondresjolyst/garge-app/issues/313)) ([dbdf14b](https://github.com/sondresjolyst/garge-app/commit/dbdf14b11000379db091b25ebf69bf438d286917))

## [1.16.0](https://github.com/sondresjolyst/garge-app/compare/v1.15.0...v1.16.0) (2026-05-19)


### Features

* trust API gross price and fix current-hour slot picker ([#295](https://github.com/sondresjolyst/garge-app/issues/295)) ([a378d8a](https://github.com/sondresjolyst/garge-app/commit/a378d8a8219e1934c9d51e2a7aacc54567aad078))

## [1.15.0](https://github.com/sondresjolyst/garge-app/compare/v1.14.2...v1.15.0) (2026-05-17)


### Features

* **admin:** bulk reanalyze battery health from admin page ([#285](https://github.com/sondresjolyst/garge-app/issues/285)) ([c3c3892](https://github.com/sondresjolyst/garge-app/commit/c3c38920c71fa02ea2ce292b308d11a6cc5ffb79))


### Bug Fixes

* **battery-ui:** rename resting voltage rows to 3d / 90d, show difference ([#286](https://github.com/sondresjolyst/garge-app/issues/286)) ([1bb5d80](https://github.com/sondresjolyst/garge-app/commit/1bb5d80cf9adb1d5cca6abb6ea4e2dc116f92ebb))

## [1.14.2](https://github.com/sondresjolyst/garge-app/compare/v1.14.1...v1.14.2) (2026-05-17)


### Bug Fixes

* **battery-ui:** handle null weekly decline (cycle-anchored slope) ([#282](https://github.com/sondresjolyst/garge-app/issues/282)) ([1227290](https://github.com/sondresjolyst/garge-app/commit/1227290b2eabd5de831ece5e87f5cc68f3e9ec1a))
* **battery-ui:** handle null weekly decline (cycle-anchored slope) (#… ([aee2149](https://github.com/sondresjolyst/garge-app/commit/aee2149f5e3bc79b28a53080db0e3ed3538e8927))

## [1.14.1](https://github.com/sondresjolyst/garge-app/compare/v1.14.0...v1.14.1) (2026-05-17)


### Bug Fixes

* **battery-ui:** clarify resting voltage tooltip ([#279](https://github.com/sondresjolyst/garge-app/issues/279)) ([e6609a4](https://github.com/sondresjolyst/garge-app/commit/e6609a4612f12973ee7fe224044bda90e4ce693a))

## [1.14.0](https://github.com/sondresjolyst/garge-app/compare/v1.13.1...v1.14.0) (2026-05-16)


### Features

* **battery:** consume server-side health analyzer fields + add calibration ([#274](https://github.com/sondresjolyst/garge-app/issues/274)) ([f4345ed](https://github.com/sondresjolyst/garge-app/commit/f4345ed9884ba4ee456259e79b0bfc9ef3c36b86))
* **shop:** item images with shared photo uploader/service ([#269](https://github.com/sondresjolyst/garge-app/issues/269)) ([d1bb4e6](https://github.com/sondresjolyst/garge-app/commit/d1bb4e69d5c6b7649d11982c9222893670efce30))
* **shop:** markdown descriptions with sanitized renderer + admin editor ([#271](https://github.com/sondresjolyst/garge-app/issues/271)) ([7b601d6](https://github.com/sondresjolyst/garge-app/commit/7b601d68e0b594c3692bf21d789e4ca672c881b8))
* **shop:** multi-item cart with single Vipps checkout ([#268](https://github.com/sondresjolyst/garge-app/issues/268)) ([8d2eeb7](https://github.com/sondresjolyst/garge-app/commit/8d2eeb7369cd866578682038350520624406265e))


### Bug Fixes

* **shop:** hide empty Subscription plans section, add overall empty state ([#270](https://github.com/sondresjolyst/garge-app/issues/270)) ([f055465](https://github.com/sondresjolyst/garge-app/commit/f055465979de60d711881d797c8c5a59b31b6d0d))

## [1.13.1](https://github.com/sondresjolyst/garge-app/compare/v1.13.0...v1.13.1) (2026-05-10)


### Bug Fixes

* **csp:** allow wss:// to api host for SignalR ([#251](https://github.com/sondresjolyst/garge-app/issues/251)) ([#252](https://github.com/sondresjolyst/garge-app/issues/252)) ([4feba65](https://github.com/sondresjolyst/garge-app/commit/4feba652b6dcfbc3bb96770d8625d9ce4d666cbe))

## [1.13.0](https://github.com/sondresjolyst/garge-app/compare/v1.12.1...v1.13.0) (2026-05-10)


### Features

* /admin/subscriptions page with invoice drilldown ([#240](https://github.com/sondresjolyst/garge-app/issues/240)) ([a4ea3df](https://github.com/sondresjolyst/garge-app/commit/a4ea3dfab257878e56dc08b2a8cf7106249e3e5e))
* admin can download invoices from /admin/orders ([#234](https://github.com/sondresjolyst/garge-app/issues/234)) ([38f6a3d](https://github.com/sondresjolyst/garge-app/commit/38f6a3d4916db54f73217f79da87b5bf655b7d14))
* admin can refund paid orders, capture relabeled to Charge & ship ([#243](https://github.com/sondresjolyst/garge-app/issues/243)) ([d0147a4](https://github.com/sondresjolyst/garge-app/commit/d0147a4f92a8767ee19f6d8bc21e79b4471f668a))
* drop checkout shipping form and surface address in admin orders ([#232](https://github.com/sondresjolyst/garge-app/issues/232)) ([daad48f](https://github.com/sondresjolyst/garge-app/commit/daad48f1d4502faad098eebcc23156ff4b1be70b))
* grey out AddOn plans when user has no active core subscription ([#238](https://github.com/sondresjolyst/garge-app/issues/238)) ([b852a9b](https://github.com/sondresjolyst/garge-app/commit/b852a9b9242d46029dbf052fb2fe05b313004090))
* live / test toggle for admin commerce stats ([#237](https://github.com/sondresjolyst/garge-app/issues/237)) ([ea1d20e](https://github.com/sondresjolyst/garge-app/commit/ea1d20ef571c8c3b426ceeeaed572e4b4b235f74))
* render order + subscription stats on /admin landing ([#235](https://github.com/sondresjolyst/garge-app/issues/235)) ([3022a06](https://github.com/sondresjolyst/garge-app/commit/3022a065ab9f5f8a71c1ba1436bb5e3728ff6213))
* shop and billing pages for Vipps payments ([#231](https://github.com/sondresjolyst/garge-app/issues/231)) ([29f4934](https://github.com/sondresjolyst/garge-app/commit/29f4934dff257ccabd4c5a9ce2b4b095ca425c1a))


### Bug Fixes

* **admin:** fetch role list from api instead of hardcoding ([#247](https://github.com/sondresjolyst/garge-app/issues/247)) ([68b59df](https://github.com/sondresjolyst/garge-app/commit/68b59dfcb690b3aca8d855e3ff3b2f5e9477305c))
* defensive optional chaining on admin stats ([#236](https://github.com/sondresjolyst/garge-app/issues/236)) ([d96aee1](https://github.com/sondresjolyst/garge-app/commit/d96aee10b54e5fb20768500dd663d1fd0d16c9ef))
* drop phone hint, show error only on invalid input ([#233](https://github.com/sondresjolyst/garge-app/issues/233)) ([8478d55](https://github.com/sondresjolyst/garge-app/commit/8478d55c04124a074ed1554ef5c6407deb169f6e))
* **security+gdpr:** security audit + GDPR compliance pass ([#244](https://github.com/sondresjolyst/garge-app/issues/244)) ([0f48a88](https://github.com/sondresjolyst/garge-app/commit/0f48a88ab8801ad1ad7d3c994e5c79601a78928c))
* **signalr:** strip trailing /api from hub URL ([#249](https://github.com/sondresjolyst/garge-app/issues/249)) ([3bb902d](https://github.com/sondresjolyst/garge-app/commit/3bb902df957f88556bd1bd0a3b2fe2adae0ff8d4))

## [1.12.1](https://github.com/sondresjolyst/garge-app/compare/v1.12.0...v1.12.1) (2026-05-03)


### Bug Fixes

* make push notification toggle per-device ([#220](https://github.com/sondresjolyst/garge-app/issues/220)) ([ad5ddbd](https://github.com/sondresjolyst/garge-app/commit/ad5ddbd7700fdabe58659fcdd26c339681a0bcfb))
* prevent notification toggle from shrinking on mobile ([#221](https://github.com/sondresjolyst/garge-app/issues/221)) ([222a5f6](https://github.com/sondresjolyst/garge-app/commit/222a5f64ac623968af58f7ac0c7e17afcb3274fd))

## [1.12.0](https://github.com/sondresjolyst/garge-app/compare/v1.11.0...v1.12.0) (2026-05-03)


### Features

* add Brevo email stats section to admin page ([#212](https://github.com/sondresjolyst/garge-app/issues/212)) ([b44c037](https://github.com/sondresjolyst/garge-app/commit/b44c0379169505c05c17c78a5a1ba6d5e744979f))
* add cookie banner toggle to admin site settings ([#216](https://github.com/sondresjolyst/garge-app/issues/216)) ([1e11894](https://github.com/sondresjolyst/garge-app/commit/1e11894b4c0d6c77aa08675e856ab6c14b11c3bf))
* add PWA push notifications with service worker and profile UI ([#214](https://github.com/sondresjolyst/garge-app/issues/214)) ([7d3b7d5](https://github.com/sondresjolyst/garge-app/commit/7d3b7d5e2ab153679ec603f0ef4074df7f51991d))
* declutter profile page with device sub-pages ([#215](https://github.com/sondresjolyst/garge-app/issues/215)) ([c96f0ae](https://github.com/sondresjolyst/garge-app/commit/c96f0ae97129426d7259cf058ce56bcabc488b6e))
* persist device sort/filter and remove automations subtitle ([#210](https://github.com/sondresjolyst/garge-app/issues/210)) ([8c134b0](https://github.com/sondresjolyst/garge-app/commit/8c134b0e038953d837b51264c13cf0c53b2f1f78))
* UX and GDPR improvements ([#213](https://github.com/sondresjolyst/garge-app/issues/213)) ([4091667](https://github.com/sondresjolyst/garge-app/commit/4091667e4cb12212a5b42019dd07536c21ac47a0))
* UX improvements across dashboard, automations, admin, and profile ([#211](https://github.com/sondresjolyst/garge-app/issues/211)) ([94ac76f](https://github.com/sondresjolyst/garge-app/commit/94ac76ff562dcce4baab50d9e8e9ee11ce6aaa0f))


### Bug Fixes

* use standalone output to reduce inotify watchers in k8s ([#217](https://github.com/sondresjolyst/garge-app/issues/217)) ([38ca579](https://github.com/sondresjolyst/garge-app/commit/38ca579b2cfff66edb1f5073db68f11f34e9bb35))

## [1.11.0](https://github.com/sondresjolyst/garge-app/compare/v1.10.0...v1.11.0) (2026-05-02)


### Features

* add Vitest unit tests and Playwright E2E tests ([#208](https://github.com/sondresjolyst/garge-app/issues/208)) ([7e1fcfe](https://github.com/sondresjolyst/garge-app/commit/7e1fcfe8473a7bbe30f6e771db53bbe92cdb5195))
* design refresh — fonts, animations, scroll reveals ([#201](https://github.com/sondresjolyst/garge-app/issues/201)) ([f8cf7f5](https://github.com/sondresjolyst/garge-app/commit/f8cf7f58818045757965f85d0167aeacc321efe3))
* redesign automations and electricity pages ([#203](https://github.com/sondresjolyst/garge-app/issues/203)) ([b5d1f76](https://github.com/sondresjolyst/garge-app/commit/b5d1f7635b6a87c4a980b3a945b610acf24a14ec))


### Bug Fixes

* exclude vitest and playwright configs from Next.js typecheck ([c07c360](https://github.com/sondresjolyst/garge-app/commit/c07c36068909f857dfd528fdc5d00e7f3d34beb0))
* replace all any types with proper TypeScript types ([#200](https://github.com/sondresjolyst/garge-app/issues/200)) ([4c75c84](https://github.com/sondresjolyst/garge-app/commit/4c75c841a163f513a5519ebdef4429c2a3300539))
* replace native datetime-local input with DatePicker and fix dark theme time list ([#204](https://github.com/sondresjolyst/garge-app/issues/204)) ([cdb7207](https://github.com/sondresjolyst/garge-app/commit/cdb720748bb73d0b8bfd1a5f3eef5c399257cb71))
* resolve security advisory GHSA-7gff-xmf6-56c5 ([#205](https://github.com/sondresjolyst/garge-app/issues/205)) ([20430d7](https://github.com/sondresjolyst/garge-app/commit/20430d76736e243ed364dd9ca986ed2332934c5a))

## [1.10.0](https://github.com/sondresjolyst/garge-app/compare/v1.9.0...v1.10.0) (2026-04-29)


### Features

* GDPR compliance improvements ([#194](https://github.com/sondresjolyst/garge-app/issues/194)) ([55d5f2e](https://github.com/sondresjolyst/garge-app/commit/55d5f2eafe24a75295435cc16552bfb29dddaf8b))

## [1.9.0](https://github.com/sondresjolyst/garge-app/compare/v1.8.2...v1.9.0) (2026-04-27)


### Features

* add activities to sensor sidebar ([#191](https://github.com/sondresjolyst/garge-app/issues/191)) ([5bc3b18](https://github.com/sondresjolyst/garge-app/commit/5bc3b18779920c02d88c3a92c172a4af37a66876))
* admin page, activities section, and session roles ([#189](https://github.com/sondresjolyst/garge-app/issues/189)) ([b4108f5](https://github.com/sondresjolyst/garge-app/commit/b4108f505844f78297f2837f62a71316376ef4a7))
* **sensor:** photo upload for device drawer ([#190](https://github.com/sondresjolyst/garge-app/issues/190)) ([c2cdfe7](https://github.com/sondresjolyst/garge-app/commit/c2cdfe76dff71ad2232f80eb5ba62e3cbdea9066))

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
