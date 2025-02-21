import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

export default async function Sidebar() {
    return (
        <div className="uk-width-1-6@l uk-section sidebar uk-padding uk-box-shadow-medium">
            <Link href={`/`}>
            <div className="uk-panel uk-padding uk-light uk-logo">
                <Image src="/garge.jpg" width="130" height="70" alt="" />
            </div>
            </Link>
            <ul className="uk-nav uk-nav-default tm-nav ">
                <li className="uk-nav-header">foobar</li>
                <li><Link className="uk-button uk-button-link" href={`/sensors`}>Sensors</Link></li>
            </ul>
        </div>
    );
};
