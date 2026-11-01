import type { HelpContent } from '../helpContent';
import { Ui } from './Ui';

export const content: HelpContent = {
    lang: 'en',
    path: '/en/help',
    switchLabel: 'Norsk',
    switchPath: '/no/help',
    switchLang: 'nb',
    title: 'Help',
    metaTitle: 'Help | Garge',
    metaDescription: 'Setup, buttons, light and troubleshooting for Garge Sensor and Garge Voltmeter.',
    download: {
        label: 'Download the short print version (PDF)',
        note: 'Does not include everything on this page.',
    },
    contentsLabel: 'Contents',
    linkLabel: 'Link to',
    sections: [
        {
            id: 'setup',
            title: 'Setup',
            numbered: true,
            items: [
                {
                    id: 'step-account',
                    title: 'Create an account and sign in',
                    body: <p>Go to www.garge.no and tap <Ui>“Create account”</Ui>. You need an active subscription to add sensors.</p>,
                },
                {
                    id: 'step-pairing-code',
                    title: 'Get a pairing code',
                    body: <p>Tap <Ui>“+ Add device”</Ui> in <Ui>“My Devices”</Ui>, then <Ui>“Get pairing code”</Ui>. On a phone the button only shows <Ui>“+”</Ui>. The code has six characters and lasts 15 minutes. Keep the page open.</p>,
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
                            <p><Ui>The blue light blinks fast</Ui> when the sensor is ready. If it does not, or if the sensor was set up before, press the Restart button and let go. Straight away, hold the BOOT button until the light blinks fast. This can take more than 5 seconds. If it does not blink fast, try again. <a href="#buttons" className="text-sky-400 hover:text-sky-300">See where the buttons are.</a></p>
                        </>
                    ),
                },
                {
                    id: 'step-wifi',
                    title: 'Connect the sensor to Wi-Fi',
                    body: (
                        <>
                            <p><Ui>Join “Garge …”</Ui> in your phone&apos;s Wi-Fi settings, for example “Garge a1b2c3d4e5f6”.</p>
                            <p><Ui>The setup page opens.</Ui> If it does not, go to <Ui>192.168.4.1</Ui> in your browser.</p>
                            <p><Ui>Choose your Wi-Fi network</Ui>, enter its <Ui>password</Ui> and the <Ui>pairing code</Ui>, and tap <Ui>“Connect”</Ui>.</p>
                        </>
                    ),
                    images: [
                        { src: '/help/setup-page-en.png', width: 660, height: 650, alt: 'The sensor’s Wi-Fi Setup page', caption: 'The setup page on your phone.' },
                    ],
                },
                {
                    id: 'step-name',
                    title: 'Name the sensor',
                    body: <p>Go back to <Ui>“My Devices”</Ui>. The sensor appears by itself within a couple of minutes. Reload the page if it does not appear. Give it a name, for example “MC battery”.</p>,
                },
            ],
        },
        {
            id: 'buttons-and-light',
            title: 'What the buttons and light mean',
            device: {
                label: 'The sensor with the BOOT button and the Restart button',
                caption: 'The buttons on the sensor.',
            },
            items: [
                {
                    id: 'buttons',
                    title: 'BOOT and Restart',
                    body: (
                        <>
                            <p>The buttons sit behind two small holes on the case. The case has no labels. BOOT is the upper hole and Restart is the lower hole.</p>
                            <p>To open setup mode, press the Restart button and let go. Straight away, hold the BOOT button until the light blinks fast. This can take more than 5 seconds. If it does not blink fast, try again. This erases nothing. On a sensor that is already set up, press the Restart button to leave setup mode at once.</p>
                        </>
                    ),
                },
                {
                    id: 'blue-light',
                    title: 'The blue light',
                    body: (
                        <>
                            <p><Ui>Fast blink (1 second on, 1 second off):</Ui> Setup mode. Lasts up to 30 minutes.</p>
                            <p><Ui>Garge Sensor, slow blink (5 seconds on, 5 seconds off):</Ui> Running. The light also blinks like this while Wi-Fi is down.</p>
                            <p><Ui>Garge Voltmeter, short blink:</Ui> Wakes, blinks, sends a reading and sleeps.</p>
                        </>
                    ),
                },
            ],
        },
        {
            id: 'sensors',
            title: 'Garge Sensor and Garge Voltmeter',
            items: [
                {
                    id: 'garge-sensor',
                    title: 'Garge Sensor',
                    body: <p>Measures temperature and humidity. It gets power through USB-C and never sleeps.</p>,
                },
                {
                    id: 'garge-voltmeter',
                    title: 'Garge Voltmeter',
                    body: <p>Measures the voltage of a battery. It gets power from the 12 V motorcycle battery through an SAE 2-pin plug. To save the battery it sleeps between readings. It wakes, blinks, sends one reading and sleeps again. By default it does this about once an hour.</p>,
                },
            ],
        },
        {
            id: 'using-the-app',
            title: 'Using the app',
            items: [
                {
                    id: 'notifications',
                    title: 'Get alerts when the sensor goes offline',
                    body: (
                        <>
                            <p>Go to <Ui>“Profile” &gt; “Notifications”</Ui>. Turn on <Ui>“Offline alerts on this device”</Ui> and set the hours under <Ui>“Alert after”</Ui>, from 1 to 168.</p>
                            <p>The switch applies to one browser or installed app at a time. Turn it on in each one where you want alerts. <Ui>“Alert after”</Ui> applies to your whole account. A Garge Voltmeter reports about once an hour, so pick more than 1 hour for it. Use <Ui>“Send test”</Ui> to check that alerts reach you.</p>
                        </>
                    ),
                    images: [
                        { src: '/help/app-notifications.png', width: 720, height: 680, alt: 'The Notifications settings with Offline alerts on this device, Alert after and Test notification', caption: 'The notification settings under “Profile”.' },
                    ],
                },
                {
                    id: 'sharing',
                    title: 'Share the sensor',
                    body: (
                        <>
                            <p>Go to <Ui>“Profile” &gt; “Manage sensors” &gt; “Share”</Ui>. Enter another Garge user&apos;s email address. Pick <Ui>“Read”</Ui> if the other user should only see the readings, or <Ui>“Edit”</Ui> if the other user should also get automations for the sockets this sensor has found.</p>
                            <p>Sharing applies to one entry at a time. A Garge Sensor has two entries, temperature and humidity, so share each one you want the other user to see.</p>
                            <p>To stop sharing, open <Ui>“Share”</Ui> again and tap the X next to the person under <Ui>“Shared with”</Ui>. Only the owner can share a sensor. The other user can stop by tapping <Ui>“Leave”</Ui> on the sensor.</p>
                        </>
                    ),
                    images: [
                        { src: '/help/app-manage-sensors.png', width: 720, height: 1558, alt: 'The Sensors page with Share and Remove from account on each sensor', caption: 'Each entry in “Manage sensors” has its own “Share” and “Remove from account”.' },
                        { src: '/help/app-share.png', width: 720, height: 548, alt: 'The Share dialog with an email field and a Read or Edit choice', caption: 'Enter the email address and pick “Read” or “Edit”.' },
                    ],
                },
                {
                    id: 'renaming',
                    title: 'Rename the sensor',
                    body: (
                        <>
                            <p>Tap the sensor in <Ui>“My Devices”</Ui>, then tap the pencil next to its name. A name can have up to 50 characters. Each entry has its own name, so a Garge Sensor has one for temperature and one for humidity.</p>
                            <p>You can also use the pencil on the sensor in <Ui>“Profile” &gt; “Manage sensors”</Ui>.</p>
                        </>
                    ),
                    images: [
                        { src: '/help/app-rename.png', width: 720, height: 511, alt: 'A sensor opened from My Devices, with a pencil next to its name', caption: 'The pencil next to the name.' },
                    ],
                },
            ],
        },
        {
            id: 'troubleshooting',
            title: 'Troubleshooting',
            items: [
                {
                    id: 'change-wifi',
                    title: 'Change Wi-Fi network',
                    body: (
                        <>
                            <p>Press the Restart button and let go. Straight away, hold the BOOT button until the light blinks fast. This can take more than 5 seconds. If it does not blink fast, try again. Join “Garge …” on your phone, tap <Ui>“Change Wi-Fi”</Ui>, pick the new network and tap <Ui>“Connect”</Ui>.</p>
                            <p>A sensor that is already on your account does not need a new code. Leave <Ui>“Pairing code (optional)”</Ui> empty.</p>
                        </>
                    ),
                },
                {
                    id: 'sensor-not-showing-up',
                    title: 'Sensor does not show up',
                    body: (
                        <>
                            <p>The sensor only supports 2.4 GHz Wi-Fi. Hidden networks are not listed. If the password may be wrong, follow <a href="#change-wifi" className="text-sky-400 hover:text-sky-300">change Wi-Fi network</a>, enter the password again and a new pairing code.</p>
                            <p>The setup page does not test the password. It only says “Data received. Restarting...”. A sensor with a wrong password does not go back to setup mode by itself, so it needs the buttons. Setup mode then shows <Ui>“Pair device”</Ui>, so tap <Ui>“Change Wi-Fi”</Ui> to reach the password field.</p>
                        </>
                    ),
                },
                {
                    id: 'pairing-code-expired',
                    title: 'The pairing code expired',
                    body: (
                        <>
                            <p>If you see <Ui>“This pairing code has expired.”</Ui>, tap <Ui>“Get new code”</Ui>. The old code stops working.</p>
                            <p>A code lasts 15 minutes and works once. If you already entered the old code on the sensor, go back to the setup page. Press the Restart button and let go. Straight away, hold the BOOT button until the light blinks fast. This can take more than 5 seconds. If it does not blink fast, try again. Join “Garge …” on your phone and enter the new code. See <a href="#setup-asks-for-code" className="text-sky-400 hover:text-sky-300">the setup page only asks for a pairing code</a>.</p>
                        </>
                    ),
                },
                {
                    id: 'setup-asks-for-code',
                    title: 'The setup page only asks for a pairing code',
                    body: (
                        <>
                            <p>If the setup page shows <Ui>“Pair device”</Ui>, the sensor already has a Wi-Fi network saved. Enter a new pairing code and tap <Ui>“Pair”</Ui>. To pick another network, tap <Ui>“Change Wi-Fi”</Ui>.</p>
                            <p>The first setup page says <Ui>“Pairing code (optional)”</Ui>, but a new sensor needs the code. If you left it empty, the sensor goes into setup mode again so you can enter it.</p>
                        </>
                    ),
                },
                {
                    id: 'setup-network-missing',
                    title: 'The “Garge …” network is gone',
                    body: <p>Setup mode lasts up to 30 minutes. If you no longer see the network, press the Restart button and let go. Straight away, hold the BOOT button until the light blinks fast. This can take more than 5 seconds. If it does not blink fast, try again. The network is open, so it asks for no password.</p>,
                },
                {
                    id: 'setup-page-not-opening',
                    title: 'The setup page does not open',
                    body: <p>Stay connected to “Garge …” and go to <Ui>http://192.168.4.1</Ui> in your browser.</p>,
                },
                {
                    id: 'cannot-get-pairing-code',
                    title: 'You cannot get a pairing code',
                    body: (
                        <>
                            <p>If you see <Ui>“You need an active subscription to add more devices.”</Ui>, tap <Ui>“See plans”</Ui>. The sensors you already have keep working.</p>
                            <p>If <Ui>“Sensor capacity”</Ui> under <Ui>“Profile”</Ui> says <Ui>“At capacity”</Ui>, turn a sensor off or add capacity.</p>
                        </>
                    ),
                },
                {
                    id: 'voltmeter-not-responding',
                    title: 'Garge Voltmeter does not respond',
                    body: <p>The voltmeter sleeps between readings and ignores the BOOT button while asleep. Press the Restart button to wake it.</p>,
                },
                {
                    id: 'sensor-stopped-reporting',
                    title: 'The sensor stopped reporting',
                    body: (
                        <>
                            <p>Check that your Wi-Fi works. <Ui>“Last seen”</Ui> in the sensor&apos;s view shows the time of the last reading.</p>
                            <p>A Garge Sensor keeps trying to reconnect by itself. It also blinks slowly while it tries, so the slow blink alone does not prove it has Wi-Fi.</p>
                            <p>A Garge Voltmeter that cannot connect sleeps longer between tries, up to 6 hours. It can take that long to show up again after your Wi-Fi is back.</p>
                            <p>If the network name or password changed, the sensor does not find the network by itself. See <a href="#change-wifi" className="text-sky-400 hover:text-sky-300">change Wi-Fi network</a>.</p>
                            <p>An entry marked <Ui>“Off”</Ui> in <Ui>“Profile” &gt; “Manage sensors”</Ui> has its readings hidden. Tap <Ui>“Turn on”</Ui>.</p>
                        </>
                    ),
                },
                {
                    id: 'alerts-not-arriving',
                    title: 'Alerts do not arrive',
                    body: (
                        <>
                            <p>Check that <Ui>“Offline alerts on this device”</Ui> is on in the browser or app you use, and tap <Ui>“Send test”</Ui>.</p>
                            <p>If you see <Ui>“Notifications blocked in browser settings.”</Ui>, allow notifications for Garge in your browser. If you see <Ui>“Push notifications are not supported in this browser.”</Ui>, use another browser. On iPhone, first tap <Ui>“Share” &gt; “Add to Home Screen”</Ui> and open Garge from there.</p>
                        </>
                    ),
                },
            ],
        },
        {
            id: 'selling',
            title: 'Selling or giving away a sensor',
            items: [
                {
                    id: 'sell-sensor',
                    title: 'Remove the sensor from your account',
                    body: (
                        <>
                            <p>Go to <Ui>“Profile” &gt; “Manage sensors”</Ui> and tap <Ui>“Remove from account”</Ui> on every entry for the sensor. A Garge Sensor has two, temperature and humidity. If one stays, the new owner gets only part of the sensor and you keep access to the rest.</p>
                            <p>Entries from the same sensor have the same code in their default name, for example “Garge D4E5F6 temperature” and “Garge D4E5F6 humidity”. If you renamed an entry, its default name is on the <Ui>“Default:”</Ui> line.</p>
                            <p>Before you remove an entry, save the code under <Ui>“Device code”</Ui>. It disappears with the entry, and a Garge Sensor has two.</p>
                            <p>Removing an entry deletes its custom name, photos, activities and thresholds from your account. Anyone you shared it with loses access. You can add the sensor back later with the code under <Ui>“Device code”</Ui>. This needs an active subscription.</p>
                        </>
                    ),
                },
                {
                    id: 'new-owner',
                    title: 'What the new owner does',
                    body: (
                        <>
                            <p>The new owner follows setup from <a href="#setup" className="text-sky-400 hover:text-sky-300">step 1</a> and does not see your readings. The sensor was set up before, so the setup page shows <Ui>“Pair device”</Ui>. They tap <Ui>“Change Wi-Fi”</Ui>, enter their own Wi-Fi and the pairing code, and tap <Ui>“Connect”</Ui>.</p>
                            <p>Your Wi-Fi name and password stay on the sensor until the new owner&apos;s Wi-Fi replaces them.</p>
                        </>
                    ),
                },
            ],
        },
    ],
};
