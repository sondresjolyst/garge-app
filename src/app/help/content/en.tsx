import Link from 'next/link';
import type { HelpContent } from '../helpContent';
import { DoThis, Go, LightTable, Steps, Ui } from './Ui';

export const content: HelpContent = {
    lang: 'en',
    path: '/en/help',
    switchLabel: 'Norsk',
    switchPath: '/no/help',
    switchLang: 'nb',
    title: 'Help',
    metaDescription: 'Setup, buttons, light and troubleshooting for Garge Sensor and Garge Voltmeter.',
    download: {
        label: 'Download the short print version (PDF)',
    },
    contentsLabel: 'Contents',
    linkLabel: 'Link to',
    sections: [
        {
            id: 'setup',
            title: 'Set up a new sensor',
            numbered: true,
            groups: [{
                items: [
                    {
                        id: 'step-account',
                        title: 'Create a Garge account',
                        body: (
                            <>
                                <p>Go to www.garge.no and select <Ui>“Create account”</Ui>.</p>
                                <p>You need an active subscription to add sensors.</p>
                            </>
                        ),
                    },
                    {
                        id: 'step-pairing-code',
                        title: 'Get a pairing code in the app',
                        body: (
                            <>
                                <p>A pairing code is a one-time code that links the sensor to your account.</p>
                                <Steps>
                                    <li>In <Ui>“My Devices”</Ui>, select <Ui>“+ Add device”</Ui>. On a phone, the button only shows <Ui>“+”</Ui>.</li>
                                    <li>Select <Ui>“Get pairing code”</Ui>.</li>
                                    <li>Keep the page open.</li>
                                </Steps>
                                <p>The code has 6 characters and lasts 15 minutes.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/crop-dashboard.png', width: 640, height: 659, alt: 'My Devices with the plus button at the top right', caption: '“+” in “My Devices” on a phone.' },
                            { src: '/help/crop-pairing.png', width: 640, height: 611, alt: 'Add a device showing a pairing code', caption: 'Your pairing code appears here.' },
                        ],
                    },
                    {
                        id: 'step-power',
                        title: 'Power on the sensor',
                        body: (
                            <>
                                <p><Ui>Garge Sensor:</Ui> connect it to power with a USB-C cable.</p>
                                <p><Ui>Garge Voltmeter:</Ui> connect it to the SAE plug on the 12&nbsp;V battery.</p>
                                <p>The blue light blinks fast when the sensor is ready. <Go to="light-not-blinking-fast">Not blinking fast?</Go></p>
                            </>
                        ),
                    },
                    {
                        id: 'step-wifi',
                        title: 'Connect the sensor to Wi-Fi',
                        body: (
                            <>
                                <Steps>
                                    <li>In your phone&apos;s Wi-Fi settings, join “Garge …”, for example “Garge a1b2c3d4e5f6”.</li>
                                    <li>The setup page opens. If it does not, go to <Ui>192.168.4.1</Ui> in your browser.</li>
                                    <li>Choose your Wi-Fi network and enter its password.</li>
                                    <li>Enter the pairing code.</li>
                                    <li>Select <Ui>“Connect”</Ui>.</li>
                                </Steps>
                                <p>If the page shows <Ui>“Pair device”</Ui>, the sensor already has a Wi-Fi network saved. <Go to="setup-asks-for-code">See what to do.</Go></p>
                            </>
                        ),
                        images: [
                            { src: '/help/setup-page-en.png', width: 660, height: 650, alt: 'The sensor’s Wi-Fi Setup page', caption: 'The setup page on your phone.' },
                        ],
                    },
                    {
                        id: 'step-name',
                        title: 'Name the sensor in the app',
                        body: (
                            <>
                                <Steps>
                                    <li>Go back to <Ui>“My Devices”</Ui>. The sensor appears automatically within a couple of minutes.</li>
                                    <li>Give it a name, for example “MC battery”. <Go to="renaming">How to rename a sensor.</Go></li>
                                </Steps>
                                <p>If it does not appear, reload the page. <Go to="sensor-not-showing-up">Still not showing?</Go></p>
                            </>
                        ),
                    },
                ],
            }],
        },
        {
            id: 'troubleshooting',
            title: 'Something is not working',
            groups: [
                {
                    id: 'setup-problems',
                    title: 'Problems during setup',
                    items: [
                        {
                            id: 'light-not-blinking-fast',
                            title: 'The sensor does not blink fast',
                            body: (
                                <>
                                    <DoThis>How to fix it</DoThis>
                                    <Steps>
                                        <li><Go to="setup-mode">Open setup mode on the sensor.</Go></li>
                                        <li><Go to="step-wifi">Then connect the sensor to Wi-Fi.</Go></li>
                                    </Steps>
                                    <p>In setup mode, the sensor creates its own Wi-Fi network, “Garge …”. A sensor that was set up before does not go into setup mode by itself.</p>
                                </>
                            ),
                        },
                        {
                            id: 'setup-network-missing',
                            title: 'Your phone cannot find the “Garge …” Wi-Fi network',
                            body: (
                                <>
                                    <DoThis>How to fix it</DoThis>
                                    <Steps>
                                        <li><Go to="setup-mode">Open setup mode on the sensor.</Go></li>
                                        <li>In your phone&apos;s Wi-Fi settings, look for “Garge …” again. The network is open, so you do not need a password.</li>
                                    </Steps>
                                    <p>Setup mode lasts up to 30 minutes.</p>
                                </>
                            ),
                        },
                        {
                            id: 'setup-page-not-opening',
                            title: "The sensor's setup page does not open",
                            body: (
                                <>
                                    <DoThis>How to fix it</DoThis>
                                    <Steps>
                                        <li>Stay connected to “Garge …”.</li>
                                        <li>In your browser, go to <Ui>http://192.168.4.1</Ui>.</li>
                                    </Steps>
                                </>
                            ),
                        },
                        {
                            id: 'setup-asks-for-code',
                            title: "The sensor's setup page only asks for a pairing code",
                            body: (
                                <>
                                    <DoThis>How to fix it</DoThis>
                                    <Steps>
                                        <li>Enter a <Go to="step-pairing-code">new pairing code</Go>.</li>
                                        <li>Select <Ui>“Pair”</Ui>.</li>
                                    </Steps>
                                    <p>To choose another network, select <Ui>“Change Wi-Fi”</Ui> instead.</p>
                                    <p>The page shows <Ui>“Pair device”</Ui> because the sensor already has a Wi-Fi network saved. The first setup page says <Ui>“Pairing code (optional)”</Ui>, but a new sensor needs the code. If you left it empty, the sensor goes into setup mode again so you can enter it.</p>
                                </>
                            ),
                        },
                        {
                            id: 'pairing-code-expired',
                            title: 'The pairing code has expired',
                            body: (
                                <>
                                    <DoThis>How to fix it</DoThis>
                                    <Steps>
                                        <li>If you see <Ui>“This pairing code has expired.”</Ui>, select <Ui>“Get new code”</Ui>. The old code stops working.</li>
                                        <li>If you already entered the old code on the sensor, <Go to="setup-mode">open setup mode</Go>. Then join “Garge …” on your phone and enter the new code. <Go to="setup-asks-for-code">Read more about the “Pair device” page.</Go></li>
                                    </Steps>
                                    <p>Closed the page? <Go to="step-pairing-code">Get a new pairing code.</Go></p>
                                    <p>A code lasts 15 minutes, and you can only use it once.</p>
                                </>
                            ),
                        },
                        {
                            id: 'cannot-get-pairing-code',
                            title: 'You cannot get a pairing code in the app',
                            body: (
                                <>
                                    <DoThis>How to fix it</DoThis>
                                    <p>If you see <Ui>“You need an active subscription to add more devices.”</Ui>, select <Ui>“See plans”</Ui>. The sensors you already have keep working.</p>
                                    <p>If <Ui>“Sensor capacity”</Ui> under <Ui>“Profile”</Ui> says <Ui>“At capacity”</Ui>, turn a sensor off or add capacity.</p>
                                </>
                            ),
                        },
                        {
                            id: 'sensor-not-showing-up',
                            title: 'A new sensor does not show up in the app',
                            body: (
                                <>
                                    <DoThis>How to fix it</DoThis>
                                    <p>Check that your network is on 2.4&nbsp;GHz and not hidden. The sensor only supports 2.4&nbsp;GHz Wi-Fi. The setup page only lists the networks it finds. If your network is hidden, make it visible. If it is 5&nbsp;GHz only, use a 2.4&nbsp;GHz network.</p>
                                    <p>If the password may be wrong, do this:</p>
                                    <Steps>
                                        <li><Go to="step-pairing-code">Get a new pairing code in the app</Go> first. Your phone has no internet while it is connected to the sensor.</li>
                                        <li><Go to="setup-mode">Open setup mode on the sensor.</Go></li>
                                        <li>On your phone, join “Garge …”.</li>
                                        <li>On the <Ui>“Pair device”</Ui> page, select <Ui>“Change Wi-Fi”</Ui>.</li>
                                        <li>Choose the network, and enter the password and the new code.</li>
                                        <li>Select <Ui>“Connect”</Ui>.</li>
                                    </Steps>
                                    <p>The setup page does not test the password. It only says “Data received. Restarting...” A sensor with a wrong password does not go back to setup mode by itself.</p>
                                </>
                            ),
                        },
                    ],
                },
                {
                    id: 'later-problems',
                    title: 'Problems after setup',
                    items: [
                        {
                            id: 'sensor-stopped-reporting',
                            title: 'The sensor has stopped sending readings',
                            body: (
                                <>
                                    <DoThis>How to fix it</DoThis>
                                    <Steps>
                                        <li>Check that your Wi-Fi network works.</li>
                                        <li>In <Ui>“My Devices”</Ui>, select the sensor. <Ui>“Last seen”</Ui> shows when it last sent a reading.</li>
                                        <li>If the network name or password changed, <Go to="change-wifi">change the Wi-Fi network on the sensor</Go>. The sensor does not find the network by itself.</li>
                                        <li>If a card is marked <Ui>“Off”</Ui> in <Ui>“Profile” &gt; “Manage sensors”</Ui>, its readings are hidden. Select <Ui>“Turn on”</Ui>.</li>
                                    </Steps>
                                    <p>A Garge Sensor keeps trying to reconnect by itself. It also blinks slowly while it tries, so a slow blink does not always mean it has Wi-Fi.</p>
                                    <p>A Garge Voltmeter that cannot connect sleeps longer between tries, up to 6 hours. After your Wi-Fi works again, it can take up to 6 hours for the voltmeter to show up in the app again. To skip the wait, press the Restart button. The voltmeter then tries to connect at once.</p>
                                </>
                            ),
                        },
                        {
                            id: 'voltmeter-not-responding',
                            title: 'A Garge Voltmeter does not respond to the buttons',
                            body: (
                                <>
                                    <DoThis>How to fix it</DoThis>
                                    <p>Press the Restart button to wake the voltmeter. To change its Wi-Fi network, <Go to="setup-mode">open setup mode</Go>.</p>
                                    <p>The voltmeter sleeps between readings and ignores the BOOT button while asleep.</p>
                                </>
                            ),
                        },
                        {
                            id: 'alerts-not-arriving',
                            title: 'Alerts from Garge do not arrive',
                            body: (
                                <>
                                    <DoThis>How to fix it</DoThis>
                                    <Steps>
                                        <li>Check that <Ui>“Offline alerts on this device”</Ui> is on in the browser or app you use.</li>
                                        <li>Select <Ui>“Send test”</Ui>.</li>
                                    </Steps>
                                    <p>If you see <Ui>“Notifications blocked in browser settings.”</Ui>, allow notifications for Garge in your browser.</p>
                                    <p>If you see <Ui>“Push notifications are not supported in this browser.”</Ui>, use another browser. On iPhone, first select <Ui>“Share” &gt; “Add to Home Screen”</Ui>, then open Garge from there.</p>
                                </>
                            ),
                        },
                    ],
                },
            ],
            closing: <>Still stuck? <Link href="/contact" className="text-sky-400 hover:text-sky-300">Contact us</Link>.</>,
        },
        {
            id: 'common-tasks',
            title: 'Common tasks',
            groups: [{
                items: [
                    {
                        id: 'change-wifi',
                        title: 'Change the Wi-Fi network on a sensor',
                        body: (
                            <Steps>
                                <li><Go to="setup-mode">Open setup mode on the sensor.</Go></li>
                                <li>On your phone, join “Garge …”.</li>
                                <li>Select <Ui>“Change Wi-Fi”</Ui>.</li>
                                <li>Choose the new network and enter its password.</li>
                                <li>Leave the <Ui>“Pairing code (optional)”</Ui> field empty. You do not need a new code when the sensor is already on your account.</li>
                                <li>Select <Ui>“Connect”</Ui>.</li>
                            </Steps>
                        ),
                    },
                    {
                        id: 'notifications',
                        title: 'Get an alert when a sensor goes offline',
                        body: (
                            <>
                                <Steps>
                                    <li>Go to <Ui>“Profile” &gt; “Notifications”</Ui>.</li>
                                    <li>Turn on <Ui>“Offline alerts on this device”</Ui>.</li>
                                    <li>Under <Ui>“Alert after”</Ui>, enter the number of hours, from 1 to 168.</li>
                                    <li>Select <Ui>“Send test”</Ui> to check that alerts reach you.</li>
                                </Steps>
                                <p>The switch only applies to the browser or installed app you are using now. Turn it on in each one where you want alerts. <Ui>“Alert after”</Ui> applies to your whole account.</p>
                                <p>A Garge Voltmeter sends a reading about once an hour, so choose more than 1 hour for it.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/app-notifications.png', width: 720, height: 680, alt: 'The Notifications settings with Offline alerts on this device, Alert after and Test notification', caption: 'The notification settings.' },
                        ],
                    },
                    {
                        id: 'sharing',
                        title: 'Share a sensor with another user',
                        body: (
                            <>
                                <Steps>
                                    <li>Go to <Ui>“Profile” &gt; “Manage sensors”</Ui>.</li>
                                    <li>On the card you want to share, select <Ui>“Share”</Ui>.</li>
                                    <li>Enter the email address of another Garge user.</li>
                                    <li>Choose <Ui>“Read”</Ui> if the other user should only see the readings. Choose <Ui>“Edit”</Ui> if the other user should also be able to create automations for the sockets the sensor has found.</li>
                                    <li>Select <Ui>“Share”</Ui>.</li>
                                </Steps>
                                <p>You share one card at a time. A Garge Sensor has two cards, temperature and humidity. Share each card the other user should see.</p>
                                <p>To stop sharing, open <Ui>“Share”</Ui> again and select the X next to the person under <Ui>“Shared with”</Ui>. Only the owner can share a sensor. The other user can remove the share by selecting <Ui>“Leave”</Ui> on the card.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/app-manage-sensors.png', width: 720, height: 1558, alt: 'The Sensors page with Share and Remove from account on each card', caption: 'Each card has its own “Share” and “Remove from account” buttons.' },
                            { src: '/help/app-share.png', width: 720, height: 548, alt: 'The Share dialog with an email field and a Read or Edit choice', caption: 'Enter the email address and choose “Read” or “Edit”.' },
                        ],
                    },
                    {
                        id: 'renaming',
                        title: 'Rename a sensor',
                        body: (
                            <>
                                <Steps>
                                    <li>In <Ui>“My Devices”</Ui>, select the sensor.</li>
                                    <li>Select the pencil next to its name.</li>
                                </Steps>
                                <p>A name can have up to 50 characters. Each card has its own name, so a Garge Sensor has one for temperature and one for humidity.</p>
                                <p>In <Ui>“Profile” &gt; “Manage sensors”</Ui>, you can also select the pencil on the card.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/app-rename.png', width: 720, height: 511, alt: 'A sensor opened from My Devices, with a pencil next to its name', caption: 'The pencil next to the name.' },
                        ],
                    },
                    {
                        id: 'selling',
                        title: 'Sell or give away a sensor',
                        body: (
                            <>
                                <Steps>
                                    <li>Go to <Ui>“Profile” &gt; “Manage sensors”</Ui>.</li>
                                    <li>On each card, save the code under <Ui>“Device code”</Ui>. The code disappears when you remove the card. A Garge Sensor has two codes.</li>
                                    <li>On every card for the sensor, select <Ui>“Remove from account”</Ui>.</li>
                                </Steps>
                                <p>A Garge Sensor has two cards, temperature and humidity. If one stays, the new owner gets only part of the sensor and you keep access to the rest.</p>
                                <p>Cards from the same sensor have the same code in their default name, for example “Garge D4E5F6 temperature” and “Garge D4E5F6 humidity”. If you renamed a card, its default name is on the <Ui>“Default:”</Ui> line.</p>
                                <p>Removing a card deletes its custom name, photos, activities and thresholds from your account. Anyone you shared it with loses access. You can add the sensor back later with the code under <Ui>“Device code”</Ui>. This needs an active subscription.</p>
                                <h4 id="new-owner" className="scroll-mt-20 pt-2 font-semibold text-gray-100">What the new owner does</h4>
                                <Steps>
                                    <li>Follow setup steps <Go to="step-account">1</Go> and <Go to="step-pairing-code">2</Go>.</li>
                                    <li><Go to="step-power">Power on the sensor.</Go></li>
                                    <li><Go to="setup-mode">Open setup mode on the sensor.</Go></li>
                                    <li>On the phone, join “Garge …”.</li>
                                    <li>On the <Ui>“Pair device”</Ui> page, select <Ui>“Change Wi-Fi”</Ui>.</li>
                                    <li>Choose the Wi-Fi network.</li>
                                    <li>Enter its password and the pairing code.</li>
                                    <li>Select <Ui>“Connect”</Ui>.</li>
                                    <li>Follow setup step <Go to="step-name">5</Go>.</li>
                                </Steps>
                                <p>The new owner does not see the seller&apos;s readings. The seller&apos;s Wi-Fi name and password stay on the sensor until the new owner&apos;s Wi-Fi replaces them.</p>
                            </>
                        ),
                    },
                ],
            }],
        },
        {
            id: 'buttons-and-light',
            title: 'The buttons and light on the sensor',
            groups: [{
                items: [
                    {
                        id: 'buttons',
                        title: 'Where to find the BOOT and Restart buttons',
                        body: <p>The buttons are behind two small holes on the case. The case has no labels. BOOT is behind the upper hole and Restart is behind the lower hole.</p>,
                        device: {
                            label: 'The sensor with the BOOT button and the Restart button',
                            caption: 'The buttons on the sensor.',
                        },
                    },
                    {
                        id: 'setup-mode',
                        title: 'How to open setup mode on the sensor',
                        body: (
                            <>
                                <p>In setup mode, the sensor creates its own Wi-Fi network, “Garge …”.</p>
                                <Steps>
                                    <li>Press the Restart button and let go.</li>
                                    <li>Straight away, hold the BOOT button until the light blinks fast.</li>
                                </Steps>
                                <p>This can take more than 5 seconds. If it does not blink fast, try again. Opening setup mode erases nothing.</p>
                                <p>If the light does not come on at all, check the power. For a Garge Voltmeter, check the battery and the plug. If the light is still off, press the Restart button once more.</p>
                                <p>If the sensor is already set up, you can leave setup mode at once. Press the Restart button.</p>
                            </>
                        ),
                    },
                    {
                        id: 'blue-light',
                        title: 'What the blue light on the sensor means',
                        body: (
                            <LightTable
                                headers={['Light', 'What it means', 'What to do']}
                                rows={[
                                    ['Fast: 1\u00a0s on, 1\u00a0s off', 'The sensor is in setup mode. This lasts up to 30 minutes.', <><Go to="step-wifi">Connect the sensor to Wi-Fi</Go>.</>],
                                    ['Slow: 5\u00a0s on, 5\u00a0s off (Garge Sensor)', 'The sensor is running. The light also blinks like this when Wi-Fi is not working.', <>Nothing. <Go to="sensor-stopped-reporting">Getting no readings?</Go></>],
                                    ['Short blink (Garge Voltmeter)', 'The sensor wakes, sends a reading and sleeps again.', 'Nothing.'],
                                ]}
                            />
                        ),
                    },
                ],
            }],
        },
    ],
};
