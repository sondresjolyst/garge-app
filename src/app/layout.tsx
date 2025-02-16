import React from 'react';
import './globals.css';
import 'uikit/dist/css/uikit.css';
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';
import Sidebar from './sidebar';
import Content from './content';
import { AuthProvider } from '@/contexts/AuthContext';

UIkit.use(Icons);

export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <title>Garge</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/uikit@3.23.0/dist/css/uikit.min.css" />
                <script src="https://cdn.jsdelivr.net/npm/uikit@3.23.0/dist/js/uikit.min.js" />
                <script src="https://cdn.jsdelivr.net/npm/uikit@3.23.0/dist/js/uikit-icons.min.js" />
            </head>
            <body>
                <AuthProvider>
                    <div className="tm-content">
                        <div className="uk-grid uk-grid-collapse uk-height-viewport">
                            <Sidebar />
                            <Content>{children}</Content>
                        </div>
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
};