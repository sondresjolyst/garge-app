import Link from "next/link";
import { COMPANY } from "@/lib/company";

export default function PrivacyPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
            <h1 className="text-3xl font-display font-bold text-gray-100">Privacy Policy</h1>
            <p className="text-xs text-gray-500">Last updated: May 2026</p>

            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-6 shadow-lg space-y-6 text-sm text-gray-400 leading-relaxed">
                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">What data we collect</h2>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Account information: name, email address, phone number, hashed password, terms-acceptance record.</li>
                        <li>Sensor data: continuous readings (temperature, humidity, voltage, switch state) sent by your registered devices, with timestamps. This is recorded every few seconds while your devices are online.</li>
                        <li>Subscription &amp; billing: subscription agreement ID, billing address, consent timestamp, and a truncated IP address (last octet zeroed) used as proof of consent.</li>
                        <li>Usage data: basic server logs (opaque user IDs, request paths) for debugging and security purposes.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">How we use your data</h2>
                    <ul className="list-disc list-inside space-y-1">
                        <li>To provide the Garge dashboard and historical data views.</li>
                        <li>To send account-related emails (email confirmation, password reset).</li>
                        <li>To improve the service and diagnose technical issues.</li>
                        <li>To improve our algorithms (such as battery-health analysis) using anonymized data that can no longer be linked to you.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Legal basis for processing</h2>
                    <p>We process your personal data under the following legal bases (GDPR Article 6):</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li><span className="text-gray-300">Contract (Art. 6(1)(b))</span> — account data, sensor data, and transactional emails are necessary to deliver the service you signed up for.</li>
                        <li><span className="text-gray-300">Legitimate interests (Art. 6(1)(f))</span> — server logs are retained for security monitoring and debugging; readings of devices you still own are kept while you own them — even while suspended — so you keep your full history and can compare it year over year when you return; and fully anonymized readings (no link to you or your device) are kept to improve the service and its algorithms. Our interest does not override your rights — you can object at any time and switch this off (see <Link href="/profile" className="text-sky-400 hover:text-sky-300">your profile</Link>), and you can export or delete the underlying data at any time before it is anonymized.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Data sharing</h2>
                    <p>We do not sell or trade your personal data. The Garge platform is self-hosted on infrastructure under our direct control; there is no upstream cloud or hosting provider. We use the following third-party data processors:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>
                            <a href="https://www.brevo.com/legal/termsofuse/" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300">Brevo</a>
                            {' '}(France, EEA) — transactional email delivery (email confirmations, password resets, invoice receipts). Your email address and the email body are shared with Brevo solely for this purpose.
                        </li>
                        <li>
                            <a href="https://vipps.no" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300">Vipps Mobilepay AS</a>
                            {' '}(Norway, EEA) — payment processing, recurring subscription agreements, and capture of your billing address used on invoices. We never see or store your card details.
                        </li>
                    </ul>
                    <p>We may also disclose data when required by law.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Data retention</h2>
                    <ul className="list-disc list-inside space-y-1">
                        <li><span className="text-gray-300">Account &amp; preferences</span> — until you delete your account, after which your name, email, phone and password are scrubbed.</li>
                        <li>
                            <span className="text-gray-300">Sensor &amp; switch data</span> — kept for as long as you own the device. If you cancel or downgrade and a device exceeds your plan, we suspend your access to it but keep recording its readings so that, when you return — for example after a seasonal break — your full history is intact and you can compare it year over year. <span className="text-gray-300">If you turn off retention</span> for your data (from your <Link href="/profile" className="text-sky-400 hover:text-sky-300">profile</Link>) and then have no active subscription, your suspended devices are removed from your account after 6 months and their readings are permanently deleted or irreversibly anonymized (stripped of any link to you or the device) and kept only as aggregate data to improve the service. You can remove a device or export its data at any time. When you sell or unclaim a device, or delete your account, the same applies: your readings are anonymized or deleted, never kept linked to you and never visible to a later owner.
                        </li>
                        <li><span className="text-gray-300">Invoices &amp; orders</span> — retained for 5 years after the last invoice as required by the Norwegian Bookkeeping Act (bokføringsloven §13).</li>
                        <li><span className="text-gray-300">Server logs</span> — 90 days. <span className="text-gray-300">Metrics</span> — 60 days.</li>
                        <li><span className="text-gray-300">Database backups</span> — 3 daily, 4 weekly, 3 monthly, 1 yearly snapshots, encrypted at rest. After account deletion, residual data may persist in backups for up to 12 months until the yearly snapshot rotates; backups are not used for any processing.</li>
                    </ul>
                    <p>You can delete your account at any time from your <Link href="/profile" className="text-sky-400 hover:text-sky-300">profile page</Link>.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Your rights</h2>
                    <p>Under GDPR you have the right to:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li><span className="text-gray-300">Access &amp; portability</span> — download a copy of all your personal data in JSON format from your <Link href="/profile" className="text-sky-400 hover:text-sky-300">profile page</Link>.</li>
                        <li><span className="text-gray-300">Erasure</span> — permanently delete your account and all associated data from your <Link href="/profile" className="text-sky-400 hover:text-sky-300">profile page</Link>.</li>
                        <li><span className="text-gray-300">Correction</span> — update your name and phone number from your <Link href="/profile" className="text-sky-400 hover:text-sky-300">profile page</Link>. For email changes, <Link href="/contact" className="text-sky-400 hover:text-sky-300">contact us</Link>.</li>
                        <li><span className="text-gray-300">Object to retention</span> — turn off keeping your sensor history after your subscription ends, from your <Link href="/profile" className="text-sky-400 hover:text-sky-300">profile page</Link>. Once off, suspended devices are removed and their data deleted or anonymized 6 months after your subscription lapses.</li>
                    </ul>
                    <p>Privacy questions and data subject requests: <a href={`mailto:${COMPANY.email}`} className="text-sky-400 hover:text-sky-300">{COMPANY.email}</a>.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Cookies</h2>
                    <p>We use cookies for authentication and session management. See our <Link href="/cookies" className="text-sky-400 hover:text-sky-300">Cookie Policy</Link> for details.</p>
                </section>
            </div>

            <p className="text-xs text-gray-600">
                <Link href="/" className="hover:text-gray-400 transition-colors">← Back to home</Link>
            </p>
        </div>
    );
}
