import Link from "next/link";
import { COMPANY, formatOrgNumber } from "@/lib/company";

export default function TermsPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
            <h1 className="text-3xl font-display font-bold text-gray-100">Terms of Service</h1>
            <p className="text-xs text-gray-500">Last updated: May 2026</p>

            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-6 shadow-lg space-y-6 text-sm text-gray-400 leading-relaxed">
                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">1. About us (seller)</h2>
                    <p>The seller is:</p>
                    <ul className="list-none space-y-0.5 pl-2">
                        <li><span className="text-gray-300">Company name:</span> {COMPANY.legalName}</li>
                        <li><span className="text-gray-300">Organisation number:</span> {formatOrgNumber()}</li>
                        <li><span className="text-gray-300">Address:</span> {COMPANY.address}</li>
                        <li><span className="text-gray-300">Email:</span> {COMPANY.email}</li>
                    </ul>
                    <p>By placing an order or activating a subscription you confirm that you are a private consumer and that you have read and accepted these terms.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">2. Acceptance of terms</h2>
                    <p>By using Garge you agree to these terms. If you do not agree, please do not use the service.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">3. Use of the service</h2>
                    <p>Garge provides a platform for monitoring sensor data from devices registered to your account. You are responsible for keeping your login credentials secure.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">4. Device ownership</h2>
                    <p>You may only register devices you own or have been given explicit permission to register. Registering a device does not transfer hardware ownership.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">5. Data and privacy</h2>
                    <p>Sensor readings are stored and associated with your account. We do not sell your data to third parties. See our <Link href="/privacy" className="text-sky-400 hover:text-sky-300">Privacy Policy</Link> for full details on how we collect, use, and protect your personal data.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">6. Availability</h2>
                    <p>We aim for high availability but do not guarantee uninterrupted access. The service may be updated or taken offline for maintenance at any time.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">7. Subscription service</h2>
                    <p>A Garge subscription gives you access to all platform features: live sensor monitoring, automation rules, socket control, push notifications, and historical data. Without an active subscription you can log in but cannot access sensor data or other features.</p>
                    <p>Subscriptions are available on a monthly or yearly basis. Access begins immediately upon confirmation in Vipps.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">8. Subscription pricing and billing</h2>
                    <p>Prices are shown in NOK. Recurring charges are processed through Vipps at the start of each billing period. We will give you at least 30 days&apos; notice by email before any price change takes effect.</p>
                    <p>Your current plan and next charge date are shown on the <Link href="/profile/billing" className="text-sky-400 hover:text-sky-300">Billing page</Link>.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">9. Subscription cancellation</h2>
                    <p>You may cancel your subscription at any time from the Billing page. Cancellation takes effect at the end of the current billing period — you retain full access until that date and will not be charged again. No partial refunds are issued for unused time in the current period.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">10. Right of withdrawal — subscription</h2>
                    <p>Under the Norwegian Right of Withdrawal Act (angrerettloven §22 letter n), consumers generally have a 14-day right of withdrawal from digital service agreements. Because Garge subscriptions grant immediate access upon activation, we ask you to explicitly waive this right during checkout. By checking the confirmation box at checkout you acknowledge that the service has started and that the right of withdrawal is waived accordingly.</p>
                    <p>If you prefer not to waive this right, do not activate the service during the 14-day period and <Link href="/contact" className="text-sky-400 hover:text-sky-300">contact us</Link> to cancel before first use.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">11. Physical products — purchase agreement</h2>
                    <p>A binding purchase agreement for physical products is formed when you receive an order confirmation. Payment is reserved via Vipps at checkout and only captured when we ship your order — you are not charged before dispatch.</p>
                    <p>We reserve the right to cancel or refuse an order in whole or in part for any reason, including but not limited to: the item being out of stock or discontinued; a pricing or product description error; inability to verify payment; suspected fraudulent or abusive activity; or other circumstances that make fulfilment impossible or unlawful. If we cancel your order we will notify you promptly and issue a full refund of any reserved or captured amount.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">12. Pricing</h2>
                    <p>All prices are shown in NOK. Prices include or exclude VAT as indicated at checkout. No additional fees are added beyond the total shown at the time of purchase.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">13. Delivery</h2>
                    <p>We aim to ship physical orders within 5 business days. Delivery will always occur within 30 days of the order date unless otherwise agreed in writing. If we cannot deliver within 30 days we will notify you promptly, and you may cancel the order for a full refund. Risk of loss transfers to you once the goods are delivered to your address.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">14. Right of withdrawal — physical goods</h2>
                    <p>You have a 14-day right of withdrawal for physical products under the Norwegian Right of Withdrawal Act (angrerettloven), starting from the day you receive the item. You do not need to give a reason. To exercise this right, <Link href="/contact" className="text-sky-400 hover:text-sky-300">contact us</Link> within 14 days of receipt. Return shipping costs are at your expense. We will issue a full refund within 14 days of receiving the returned goods in acceptable condition.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">15. Defects and complaints</h2>
                    <p>Physical products carry a statutory complaints period of at least 2 years from delivery under the Norwegian Consumer Purchases Act (forbrukerkjøpsloven). For goods expected to last significantly longer this period may extend to 5 years. If your product has a defect, <Link href="/contact" className="text-sky-400 hover:text-sky-300">contact us</Link> as soon as possible after discovery — a complaint must be raised within a reasonable time (generally within 2 months of discovering the defect) and no later than the end of the applicable complaints period. We will offer repair, replacement, or a refund as appropriate.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">16. Non-payment</h2>
                    <p>If a subscription payment fails, access may be suspended until the outstanding amount is settled. If payment is reversed fraudulently, Garge reserves the right to recover the outstanding amount through appropriate means.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">17. Dispute resolution</h2>
                    <p>If a complaint cannot be resolved directly with us, you may contact the Norwegian Consumer Authority (Forbrukertilsynet) or the Consumer Council of Norway (Forbrukerrådet) for assistance. EU-based consumers may also use the European Commission&apos;s Online Dispute Resolution platform at <a href="https://ec.europa.eu/consumers/odr" className="text-sky-400 hover:text-sky-300" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>. Norwegian law applies to these terms.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">18. Changes to terms</h2>
                    <p>We may update these terms from time to time. We will notify you of material changes by email. Continued use of Garge after notification constitutes acceptance of the updated terms.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">19. Contact</h2>
                    <p>Questions about these terms? <Link href="/contact" className="text-sky-400 hover:text-sky-300">Contact us</Link>.</p>
                </section>
            </div>

            <p className="text-xs text-gray-600">
                <Link href="/" className="hover:text-gray-400 transition-colors">← Back to home</Link>
            </p>
        </div>
    );
}
