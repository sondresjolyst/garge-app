import React from "react";

export default function CookiePolicyPage() {
    return (
        <div className="p-4 max-w-3xl mx-auto text-gray-200 space-y-6">
            <h1 className="text-3xl font-bold mb-4">Cookie Policy</h1>
            <p>
                <strong>What are cookies?</strong> Cookies are small text files stored on your device by your web browser.
            </p>
            <h2 className="text-xl font-semibold mt-4 mb-2">How do we use cookies?</h2>
            <ul className="list-disc list-inside space-y-1">
                <li>We use cookies only to manage logged-in user sessions and keep you authenticated while using Garge.</li>
                <li>No cookies are used for analytics, advertising, or tracking.</li>
            </ul>
            <h2 className="text-xl font-semibold mt-4 mb-2">Consent</h2>
            <p>
                By logging in, you consent to the use of session cookies for authentication. These cookies are essential for the website to function securely.
            </p>
            <h2 className="text-xl font-semibold mt-4 mb-2">Managing cookies</h2>
            <p>
                You can control or delete cookies through your browser settings. However, disabling session cookies may prevent you from logging in or using certain features of Garge.
            </p>
        </div>
    );
}
