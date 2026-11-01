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
                                <p>Go to www.garge.no and tap <Ui>“Create account”</Ui>.</p>
                                <p>You need an active subscription to add sensors.</p>
                            </>
                        ),
                    },
                    {
                        id: 'step-pairing-code',
                        title: 'Get a pairing code in the app',
                        body: (
                            <>
                                <Steps>
                                    <li>Tap <Ui>“+ Add device”</Ui> in <Ui>“My Devices”</Ui>. On a phone the button only shows <Ui>“+”</Ui>.</li>
                                    <li>Tap <Ui>“Get pairing code”</Ui>.</li>
                                    <li>Keep the page open.</li>
                                </Steps>
                                <p>The code has six characters and lasts 15 minutes.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/crop-dashboard.png', width: 640, height: 659, alt: 'My Devices with the plus button at the top right', caption: '“+” in “My Devices” on a phone.' },
                            { src: '/help/crop-pairing.png', width: 640, height: 611, alt: 'Add a device showing a pairing code', caption: 'Your pairing code shows here.' },
                        ],
                    },
                    {
                        id: 'step-power',
                        title: 'Power on the sensor',
                        body: (
                            <>
                                <p><Ui>Garge Sensor:</Ui> plug in USB-C power.</p>
                                <p><Ui>Garge Voltmeter:</Ui> connect it to the SAE plug on the 12 V battery.</p>
                                <p>The blue light blinks fast when the sensor is ready. <Go to="light-not-blinking-fast">Does it not blink fast?</Go></p>
                            </>
                        ),
                    },
                    {
                        id: 'step-wifi',
                        title: 'Connect the sensor to Wi-Fi',
                        body: (
                            <>
                                <Steps>
                                    <li>Join “Garge …” in your phone&apos;s Wi-Fi settings, for example “Garge a1b2c3d4e5f6”.</li>
                                    <li>The setup page opens. If it does not, go to <Ui>192.168.4.1</Ui> in your browser.</li>
                                    <li>Choose your Wi-Fi network and enter its password.</li>
                                    <li>Enter the pairing code.</li>
                                    <li>Tap <Ui>“Connect”</Ui>.</li>
                                </Steps>
                                <p>If the page shows <Ui>“Pair device”</Ui>, see <Go to="setup-asks-for-code">the setup page only asks for a pairing code</Go>.</p>
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
                                    <li>Go back to <Ui>“My Devices”</Ui>. The sensor appears by itself within a couple of minutes.</li>
                                    <li>Give it a name, for example “MC battery”. <Go to="renaming">How to rename a sensor.</Go></li>
                                </Steps>
                                <p>If it does not appear, reload the page. <Go to="sensor-not-showing-up">Still not there?</Go></p>
                            </>
                        ),
                    },
                ],
            }],
        },
        {
            id: 'troubleshooting',
            title: 'Something does not work',
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
                                    <DoThis>Do this</DoThis>
                                    <Steps>
                                        <li><Go to="setup-mode">Open setup mode on the sensor.</Go></li>
                                        <li>Continue with <Go to="step-wifi">connecting the sensor to Wi-Fi</Go>.</li>
                                    </Steps>
                                    <p>A sensor that was set up before does not go into setup mode by itself.</p>
                                </>
                            ),
                        },
                        {
                            id: 'setup-network-missing',
                            title: 'Your phone cannot find the “Garge …” Wi-Fi network',
                            body: (
                                <>
                                    <DoThis>Do this</DoThis>
                                    <Steps>
                                        <li><Go to="setup-mode">Open setup mode on the sensor.</Go></li>
                                        <li>Look for “Garge …” again in your phone&apos;s Wi-Fi settings. The network is open, so it asks for no password.</li>
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
                                    <DoThis>Do this</DoThis>
                                    <Steps>
                                        <li>Stay connected to “Garge …”.</li>
                                        <li>Go to <Ui>http://192.168.4.1</Ui> in your browser.</li>
                                    </Steps>
                                </>
                            ),
                        },
                        {
                            id: 'setup-asks-for-code',
                            title: "The sensor's setup page only asks for a pairing code",
                            body: (
                                <>
                                    <DoThis>Do this</DoThis>
                                    <Steps>
                                        <li>Enter a <Go to="step-pairing-code">new pairing code</Go>.</li>
                                        <li>Tap <Ui>“Pair”</Ui>.</li>
                                    </Steps>
                                    <p>To pick another network, tap <Ui>“Change Wi-Fi”</Ui> instead.</p>
                                    <p>The page shows <Ui>“Pair device”</Ui> because the sensor already has a Wi-Fi network saved. The first setup page says <Ui>“Pairing code (optional)”</Ui>, but a new sensor needs the code. If you left it empty, the sensor goes into setup mode again so you can enter it.</p>
                                </>
                            ),
                        },
                        {
                            id: 'pairing-code-expired',
                            title: 'The pairing code has expired',
                            body: (
                                <>
                                    <DoThis>Do this</DoThis>
                                    <Steps>
                                        <li>If you see <Ui>“This pairing code has expired.”</Ui>, tap <Ui>“Get new code”</Ui>. The old code stops working.</li>
                                        <li>If you already entered the old code on the sensor, <Go to="setup-mode">open setup mode</Go>, join “Garge …” on your phone and enter the new code. See <Go to="setup-asks-for-code">the setup page only asks for a pairing code</Go>.</li>
                                    </Steps>
                                    <p>A code lasts 15 minutes and works once.</p>
                                </>
                            ),
                        },
                        {
                            id: 'cannot-get-pairing-code',
                            title: 'The app does not give you a pairing code',
                            body: (
                                <>
                                    <DoThis>Do this</DoThis>
                                    <p>If you see <Ui>“You need an active subscription to add more devices.”</Ui>, tap <Ui>“See plans”</Ui>. The sensors you already have keep working.</p>
                                    <p>If <Ui>“Sensor capacity”</Ui> under <Ui>“Profile”</Ui> says <Ui>“At capacity”</Ui>, turn a sensor off or add capacity.</p>
                                </>
                            ),
                        },
                        {
                            id: 'sensor-not-showing-up',
                            title: 'A new sensor does not show up in the app',
                            body: (
                                <>
                                    <DoThis>Do this</DoThis>
                                    <Steps>
                                        <li>Check that your network is on 2.4 GHz and not hidden. The sensor only supports 2.4 GHz Wi-Fi, and the setup page only lists the networks it finds. If your network is hidden, make it visible. If it is 5 GHz only, use a 2.4 GHz network.</li>
                                    </Steps>
                                    <p>If the password may be wrong:</p>
                                    <Steps>
                                        <li><Go to="step-pairing-code">Get a new pairing code in the app</Go> first. Your phone has no internet while it is on the sensor&apos;s network.</li>
                                        <li><Go to="setup-mode">Open setup mode on the sensor.</Go></li>
                                        <li>Join “Garge …” on your phone.</li>
                                        <li>Tap <Ui>“Change Wi-Fi”</Ui> on the <Ui>“Pair device”</Ui> page.</li>
                                        <li>Choose the network, and enter the password and the new code.</li>
                                        <li>Tap <Ui>“Connect”</Ui>.</li>
                                    </Steps>
                                    <p>The setup page does not test the password. It only says “Data received. Restarting...”. A sensor with a wrong password does not go back to setup mode by itself.</p>
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
                                    <DoThis>Do this</DoThis>
                                    <Steps>
                                        <li>Check that your Wi-Fi works. <Ui>“Last seen”</Ui> in the sensor&apos;s view shows the time of the last reading.</li>
                                        <li>If the network name or password changed, <Go to="change-wifi">change the Wi-Fi network on the sensor</Go>. It does not find the network by itself.</li>
                                        <li>If a card is marked <Ui>“Off”</Ui> in <Ui>“Profile” &gt; “Manage sensors”</Ui>, its readings are hidden. Tap <Ui>“Turn on”</Ui>.</li>
                                    </Steps>
                                    <p>A Garge Sensor keeps trying to reconnect by itself. It also blinks slowly while it tries, so the slow blink alone does not prove it has Wi-Fi.</p>
                                    <p>A Garge Voltmeter that cannot connect sleeps longer between tries, up to 6 hours. It can take that long to show up again after your Wi-Fi is back.</p>
                                </>
                            ),
                        },
                        {
                            id: 'voltmeter-not-responding',
                            title: 'Garge Voltmeter does not respond to the buttons',
                            body: (
                                <>
                                    <DoThis>Do this</DoThis>
                                    <p>Press the Restart button to wake it. To change its Wi-Fi network, <Go to="setup-mode">open setup mode</Go>.</p>
                                    <p>The voltmeter sleeps between readings and ignores the BOOT button while asleep.</p>
                                </>
                            ),
                        },
                        {
                            id: 'alerts-not-arriving',
                            title: 'Alerts from Garge do not arrive',
                            body: (
                                <>
                                    <DoThis>Do this</DoThis>
                                    <Steps>
                                        <li>Check that <Ui>“Offline alerts on this device”</Ui> is on in the browser or app you use.</li>
                                        <li>Tap <Ui>“Send test”</Ui>.</li>
                                    </Steps>
                                    <p>If you see <Ui>“Notifications blocked in browser settings.”</Ui>, allow notifications for Garge in your browser.</p>
                                    <p>If you see <Ui>“Push notifications are not supported in this browser.”</Ui>, use another browser. On iPhone, first tap <Ui>“Share” &gt; “Add to Home Screen”</Ui> and open Garge from there.</p>
                                </>
                            ),
                        },
                    ],
                },
            ],
        },
        {
            id: 'common-tasks',
            title: 'Common tasks',
            groups: [{
                items: [
                    {
                        id: 'change-wifi',
                        title: 'Change the Wi-Fi network on the sensor',
                        body: (
                            <Steps>
                                <li><Go to="setup-mode">Open setup mode on the sensor.</Go></li>
                                <li>Join “Garge …” on your phone.</li>
                                <li>Tap <Ui>“Change Wi-Fi”</Ui>.</li>
                                <li>Choose the new network and enter its password.</li>
                                <li>Leave <Ui>“Pairing code (optional)”</Ui> empty and tap <Ui>“Connect”</Ui>. A sensor already on your account does not need a new code.</li>
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
                                    <li>Set the hours under <Ui>“Alert after”</Ui>, from 1 to 168.</li>
                                    <li>Tap <Ui>“Send test”</Ui> to check that alerts reach you.</li>
                                </Steps>
                                <p>The switch applies to one browser or installed app at a time. Turn it on in each one where you want alerts. <Ui>“Alert after”</Ui> applies to your whole account.</p>
                                <p>A Garge Voltmeter reports about once an hour, so pick more than 1 hour for it.</p>
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
                                    <li>Tap <Ui>“Share”</Ui> on the card.</li>
                                    <li>Enter another Garge user&apos;s email address.</li>
                                    <li>Pick <Ui>“Read”</Ui> if the other user should only see the readings, or <Ui>“Edit”</Ui> if the other user can also create automations for the sockets this sensor has found.</li>
                                    <li>Tap <Ui>“Share”</Ui>.</li>
                                </Steps>
                                <p>Sharing applies to one card at a time. A Garge Sensor has two cards, temperature and humidity, so share each one you want the other user to see.</p>
                                <p>To stop sharing, open <Ui>“Share”</Ui> again and tap the X next to the person under <Ui>“Shared with”</Ui>. Only the owner can share a sensor. The other user can stop by tapping <Ui>“Leave”</Ui> on the sensor.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/app-manage-sensors.png', width: 720, height: 1558, alt: 'The Sensors page with Share and Remove from account on each card', caption: 'Each card has its own “Share” and “Remove from account”.' },
                            { src: '/help/app-share.png', width: 720, height: 548, alt: 'The Share dialog with an email field and a Read or Edit choice', caption: 'Enter the email address and pick “Read” or “Edit”.' },
                        ],
                    },
                    {
                        id: 'renaming',
                        title: 'Rename a sensor',
                        body: (
                            <>
                                <Steps>
                                    <li>Tap the sensor in <Ui>“My Devices”</Ui>.</li>
                                    <li>Tap the pencil next to its name.</li>
                                </Steps>
                                <p>A name can have up to 50 characters. Each card has its own name, so a Garge Sensor has one for temperature and one for humidity.</p>
                                <p>You can also use the pencil on the sensor in <Ui>“Profile” &gt; “Manage sensors”</Ui>.</p>
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
                                    <li>Save the code under <Ui>“Device code”</Ui> on each card. It disappears with the card, and a Garge Sensor has two.</li>
                                    <li>Tap <Ui>“Remove from account”</Ui> on every card for the sensor.</li>
                                </Steps>
                                <p>A Garge Sensor has two cards, temperature and humidity. If one stays, the new owner gets only part of the sensor and you keep access to the rest.</p>
                                <p>Cards from the same sensor have the same code in their default name, for example “Garge D4E5F6 temperature” and “Garge D4E5F6 humidity”. If you renamed a card, its default name is on the <Ui>“Default:”</Ui> line.</p>
                                <p>Removing a card deletes its custom name, photos, activities and thresholds from your account. Anyone you shared it with loses access. You can add the sensor back later with the code under <Ui>“Device code”</Ui>. This needs an active subscription.</p>
                                <h4 id="new-owner" className="scroll-mt-20 pt-2 font-semibold text-gray-100">What the new owner does</h4>
                                <Steps>
                                    <li>Follow setup steps <Go to="step-account">1</Go> and <Go to="step-pairing-code">2</Go>.</li>
                                    <li><Go to="step-power">Power on the sensor.</Go></li>
                                    <li><Go to="setup-mode">Open setup mode on the sensor.</Go></li>
                                    <li>Join “Garge …” on the phone.</li>
                                    <li>Tap <Ui>“Change Wi-Fi”</Ui> on the <Ui>“Pair device”</Ui> page.</li>
                                    <li>Choose the Wi-Fi network, enter its password and the pairing code, and tap <Ui>“Connect”</Ui>.</li>
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
                        title: 'Where are the BOOT and Restart buttons?',
                        body: <p>The buttons sit behind two small holes on the case. The case has no labels. BOOT is the upper hole and Restart is the lower hole.</p>,
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
                                <Steps>
                                    <li>Press the Restart button and let go.</li>
                                    <li>Straight away, hold the BOOT button until the light blinks fast.</li>
                                </Steps>
                                <p>This can take more than 5 seconds. If it does not blink fast, try again. This erases nothing.</p>
                                <p>If the light does not come on at all, check the power. For a Garge Voltmeter, check the battery and the plug.</p>
                                <p>On a sensor that is already set up, press the Restart button to leave setup mode at once.</p>
                            </>
                        ),
                    },
                    {
                        id: 'blue-light',
                        title: 'What does the blue light on the sensor mean?',
                        body: (
                            <LightTable
                                headers={['Light', 'Means', 'Do this']}
                                rows={[
                                    ['Fast: 1 s on, 1 s off', 'Setup mode, for up to 30 minutes', <Go key="wifi" to="step-wifi">Connect the sensor to Wi-Fi</Go>],
                                    ['Slow: 5 s on, 5 s off (Garge Sensor)', 'Running, also when Wi-Fi is down', <>Nothing. <Go to="sensor-stopped-reporting">Getting no readings?</Go></>],
                                    ['Short blink (Garge Voltmeter)', 'Wakes, sends a reading and sleeps', 'Nothing'],
                                ]}
                            />
                        ),
                    },
                ],
            }],
        },
    ],
};
