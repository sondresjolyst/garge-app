import React from "react";

export default function PrivacyPolicyPage() {
    return (
        <div className="p-4 max-w-3xl mx-auto text-gray-200 space-y-6">
            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
            <p>
                <strong>Last updated:</strong> July 21, 2025
            </p>
            <p>
                Garge respects your privacy. We do not collect analytics or tracking data.
            </p>
            <h2 className="text-xl font-semibold mt-4 mb-2">What data do we collect?</h2>
            <ul className="list-disc list-inside space-y-1">
                <li>
                    If you create an account or log in, we store the information you provide during registration: first name, last name, username, email, and password.
                </li>
                <li>
                    If you claim or manage sensors, we store the names and any custom names you assign to your sensors.
                </li>
            </ul>
            <h2 className="text-xl font-semibold mt-4 mb-2">How do we use your data?</h2>
            <ul className="list-disc list-inside space-y-1">
                <li>To provide secure access to your account and services.</li>
                <li>To allow you to manage and personalize your sensors.</li>
            </ul>
            <h2 className="text-xl font-semibold mt-4 mb-2">Cookies</h2>
            <p>
                We use cookies only to manage your login session.
            </p>
            <h2 className="text-xl font-semibold mt-4 mb-2">Data sharing</h2>
            <p>
                We do not share your personal data with third parties except as required by law.
            </p>
            <h2 className="text-xl font-semibold mt-4 mb-2">Your rights</h2>
            <p>
                You may request access, correction, or deletion of your account data. Contact us at <a className="underline">sondresjoelyst@gmail.com</a>.
            </p>
        </div>
    );
}
