import React from 'react';
import '../app/globals.css';
import Link from 'next/link';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <title>My Next.js App</title>
      </head>
      <body>
        <div className="uk-navbar-container tm-navbar-container uk-sticky uk-sticky-fixed">
          <div className="uk-container uk-container-expand">
            <nav className="uk-navbar-container">
              <div className="uk-container">
                <div className="uk-navbar">
                  <div className="uk-navbar-left">
                    <ul className="uk-navbar-nav">
                      <li className="uk-active"><Link href="/">Garge</Link></li>
                    </ul>
                  </div>
                  <div className="uk-navbar-right">
                    <ul className="uk-navbar-nav">
                      <li>
                        <a className="uk-button uk-button-link" href="/auth/register">Register</a>
                      </li>
                      <li>
                        <a className="uk-button uk-button-link" href="/auth/login">Login</a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
        <div className="tm-sidebar-left uk-visible@m">
          <h3>Test</h3>
          <ul className="uk-nav uk-nav-default tm-nav ">
            <li className="uk-nav-header">foobar</li>
            <li><a href="../docs/introduction">foo</a></li>

          </ul>
        </div>
        <div className="tm-main uk-section uk-section-default">
          <div className="uk-container uk-container-small uk-position-relative">
            {children}
          </div>
        </div>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/uikit@3.23.0/dist/css/uikit.min.css" />

        <script src="https://cdn.jsdelivr.net/npm/uikit@3.23.0/dist/js/uikit.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/uikit@3.23.0/dist/js/uikit-icons.min.js"></script>
      </body>
    </html>
  );
};

export default Layout;
