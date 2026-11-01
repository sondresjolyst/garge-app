import type { HelpContent } from '../helpContent';
import { DoThis, Go, LightTable, Steps, Ui } from './Ui';

export const content: HelpContent = {
    lang: 'nb',
    path: '/no/help',
    switchLabel: 'English',
    switchPath: '/en/help',
    switchLang: 'en',
    title: 'Hjelp',
    metaDescription: 'Oppsett, knapper, lys og feilsøking for Garge Sensor og Garge Voltmeter.',
    download: {
        label: 'Last ned kort utskriftsversjon (PDF)',
    },
    contentsLabel: 'Innhold',
    linkLabel: 'Lenke til',
    sections: [
        {
            id: 'setup',
            title: 'Sett opp en ny sensor',
            numbered: true,
            groups: [{
                items: [
                    {
                        id: 'step-account',
                        title: 'Opprett en Garge-konto',
                        body: (
                            <>
                                <p>Gå til www.garge.no og trykk på <Ui>«Create account»</Ui>.</p>
                                <p>Du trenger et aktivt abonnement for å legge til sensorer.</p>
                            </>
                        ),
                    },
                    {
                        id: 'step-pairing-code',
                        title: 'Hent en pairing code i appen',
                        body: (
                            <>
                                <Steps>
                                    <li>Trykk på <Ui>«+ Add device»</Ui> i <Ui>«My Devices»</Ui>. På mobil står det bare <Ui>«+»</Ui>.</li>
                                    <li>Trykk på <Ui>«Get pairing code»</Ui>.</li>
                                    <li>La siden stå åpen.</li>
                                </Steps>
                                <p>Koden har seks tegn og gjelder i 15 minutter.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/crop-dashboard.png', width: 640, height: 659, alt: 'My Devices med plussknappen øverst til høyre', caption: '«+» i «My Devices» på mobil.' },
                            { src: '/help/crop-pairing.png', width: 640, height: 611, alt: 'Add a device viser en pairing code', caption: 'Her ser du pairing code.' },
                        ],
                    },
                    {
                        id: 'step-power',
                        title: 'Slå på sensoren',
                        body: (
                            <>
                                <p><Ui>Garge Sensor:</Ui> koble den til strøm med en USB-C-kabel.</p>
                                <p><Ui>Garge Voltmeter:</Ui> koble det til SAE-kontakten på 12 V-batteriet.</p>
                                <p>Det blå lyset blinker raskt når sensoren er klar. <Go to="light-not-blinking-fast">Blinker det ikke raskt?</Go></p>
                            </>
                        ),
                    },
                    {
                        id: 'step-wifi',
                        title: 'Koble sensoren til Wi-Fi',
                        body: (
                            <>
                                <Steps>
                                    <li>Koble mobilen til «Garge …» i Wi-Fi-innstillingene, for eksempel «Garge a1b2c3d4e5f6».</li>
                                    <li>Oppsettsiden åpner seg. Hvis den ikke gjør det, går du til <Ui>192.168.4.1</Ui> i nettleseren.</li>
                                    <li>Velg Wi-Fi-nettverket ditt og skriv inn passordet.</li>
                                    <li>Skriv inn pairing code.</li>
                                    <li>Trykk på <Ui>«Connect»</Ui>.</li>
                                </Steps>
                                <p>Hvis siden viser <Ui>«Pair device»</Ui>, har sensoren allerede lagret et Wi-Fi-nettverk. <Go to="setup-asks-for-code">Slik gjør du da.</Go></p>
                            </>
                        ),
                        images: [
                            { src: '/help/setup-page-no.png', width: 660, height: 650, alt: 'Oppsettsiden Wi-Fi Setup på sensoren', caption: 'Oppsettsiden på mobilen.' },
                        ],
                    },
                    {
                        id: 'step-name',
                        title: 'Gi sensoren et navn i appen',
                        body: (
                            <>
                                <Steps>
                                    <li>Gå tilbake til <Ui>«My Devices»</Ui>. Sensoren dukker opp automatisk innen et par minutter.</li>
                                    <li>Gi den et navn, for eksempel «MC-batteri». <Go to="renaming">Slik gir du en sensor nytt navn.</Go></li>
                                </Steps>
                                <p>Hvis den ikke dukker opp, laster du siden på nytt. <Go to="sensor-not-showing-up">Dukker den fortsatt ikke opp?</Go></p>
                            </>
                        ),
                    },
                ],
            }],
        },
        {
            id: 'troubleshooting',
            title: 'Noe virker ikke',
            groups: [
                {
                    id: 'setup-problems',
                    title: 'Problemer under oppsett',
                    items: [
                        {
                            id: 'light-not-blinking-fast',
                            title: 'Sensoren blinker ikke raskt',
                            body: (
                                <>
                                    <DoThis>Slik løser du det</DoThis>
                                    <Steps>
                                        <li><Go to="setup-mode">Åpne oppsettmodus på sensoren.</Go></li>
                                        <li>Koble så <Go to="step-wifi">sensoren til Wi-Fi</Go>.</li>
                                    </Steps>
                                    <p>En sensor som er satt opp fra før, går ikke i oppsettmodus av seg selv.</p>
                                </>
                            ),
                        },
                        {
                            id: 'setup-network-missing',
                            title: 'Mobilen finner ikke Wi-Fi-nettverket «Garge …»',
                            body: (
                                <>
                                    <DoThis>Slik løser du det</DoThis>
                                    <Steps>
                                        <li><Go to="setup-mode">Åpne oppsettmodus på sensoren.</Go></li>
                                        <li>Se etter «Garge …» på nytt i Wi-Fi-innstillingene på mobilen. Nettverket er åpent, så du trenger ikke passord.</li>
                                    </Steps>
                                    <p>Oppsettmodus varer i opptil 30 minutter.</p>
                                </>
                            ),
                        },
                        {
                            id: 'setup-page-not-opening',
                            title: 'Sensorens oppsettside åpner seg ikke',
                            body: (
                                <>
                                    <DoThis>Slik løser du det</DoThis>
                                    <Steps>
                                        <li>La mobilen være koblet til «Garge …».</li>
                                        <li>Gå til <Ui>http://192.168.4.1</Ui> i nettleseren.</li>
                                    </Steps>
                                </>
                            ),
                        },
                        {
                            id: 'setup-asks-for-code',
                            title: 'Sensorens oppsettside ber bare om pairing code',
                            body: (
                                <>
                                    <DoThis>Slik løser du det</DoThis>
                                    <Steps>
                                        <li>Skriv inn en <Go to="step-pairing-code">ny pairing code</Go>.</li>
                                        <li>Trykk på <Ui>«Pair»</Ui>.</li>
                                    </Steps>
                                    <p>Vil du velge et annet nettverk, trykker du på <Ui>«Change Wi-Fi»</Ui> i stedet.</p>
                                    <p>Siden viser <Ui>«Pair device»</Ui> fordi sensoren allerede har lagret et Wi-Fi-nettverk. På den første oppsettsiden står det <Ui>«Pairing code (optional)»</Ui>, men en ny sensor trenger koden. Hvis du lot feltet stå tomt, går sensoren i oppsettmodus igjen, så du kan skrive inn koden.</p>
                                </>
                            ),
                        },
                        {
                            id: 'pairing-code-expired',
                            title: 'Pairing code har gått ut',
                            body: (
                                <>
                                    <DoThis>Slik løser du det</DoThis>
                                    <Steps>
                                        <li>Hvis du ser <Ui>«This pairing code has expired.»</Ui>, trykker du på <Ui>«Get new code»</Ui>. Den gamle koden slutter da å virke.</li>
                                        <li>Hvis du allerede har skrevet inn den gamle koden på sensoren, <Go to="setup-mode">åpner du oppsettmodus</Go>, kobler mobilen til «Garge …» og skriver inn den nye koden. <Go to="setup-asks-for-code">Les mer om siden «Pair device».</Go></li>
                                    </Steps>
                                    <p>En kode gjelder i 15 minutter, og du kan bare bruke den én gang.</p>
                                </>
                            ),
                        },
                        {
                            id: 'cannot-get-pairing-code',
                            title: 'Appen gir deg ikke en pairing code',
                            body: (
                                <>
                                    <DoThis>Slik løser du det</DoThis>
                                    <p>Hvis du ser <Ui>«You need an active subscription to add more devices.»</Ui>, trykker du på <Ui>«See plans»</Ui>. Sensorene du allerede har, virker som før.</p>
                                    <p>Hvis det står <Ui>«At capacity»</Ui> ved <Ui>«Sensor capacity»</Ui> under <Ui>«Profile»</Ui>, slår du av en sensor eller legger til mer kapasitet.</p>
                                </>
                            ),
                        },
                        {
                            id: 'sensor-not-showing-up',
                            title: 'Ny sensor dukker ikke opp i appen',
                            body: (
                                <>
                                    <DoThis>Slik løser du det</DoThis>
                                    <Steps>
                                        <li>Sjekk at nettverket ditt er på 2,4 GHz og ikke er skjult. Sensoren støtter bare Wi-Fi på 2,4 GHz, og oppsettsiden viser bare nettverkene den finner. Hvis nettverket er skjult, gjør du det synlig. Hvis det bare er på 5 GHz, bruker du et nettverk på 2,4 GHz.</li>
                                    </Steps>
                                    <p>Hvis passordet kan være feil, gjør du slik:</p>
                                    <Steps>
                                        <li><Go to="step-pairing-code">Hent en ny pairing code i appen</Go> først. Mobilen har ikke internett mens den er koblet til sensoren.</li>
                                        <li><Go to="setup-mode">Åpne oppsettmodus på sensoren.</Go></li>
                                        <li>Koble mobilen til «Garge …».</li>
                                        <li>Trykk på <Ui>«Change Wi-Fi»</Ui> på siden <Ui>«Pair device»</Ui>.</li>
                                        <li>Velg nettverket og skriv inn passordet og den nye koden.</li>
                                        <li>Trykk på <Ui>«Connect»</Ui>.</li>
                                    </Steps>
                                    <p>Oppsettsiden tester ikke passordet. Det står bare «Data received. Restarting...». En sensor med feil passord går ikke tilbake til oppsettmodus av seg selv.</p>
                                </>
                            ),
                        },
                    ],
                },
                {
                    id: 'later-problems',
                    title: 'Problemer etter oppsett',
                    items: [
                        {
                            id: 'sensor-stopped-reporting',
                            title: 'Sensoren har sluttet å sende målinger',
                            body: (
                                <>
                                    <DoThis>Slik løser du det</DoThis>
                                    <Steps>
                                        <li>Sjekk at Wi-Fi-nettverket virker. Åpne sensoren. Under <Ui>«Last seen»</Ui> ser du når den sist sendte en måling.</li>
                                        <li>Hvis nettverksnavnet eller passordet er endret, må du <Go to="change-wifi">bytte Wi-Fi-nettverk på sensoren</Go>. Sensoren finner ikke nettverket selv.</li>
                                        <li>Hvis et kort er merket <Ui>«Off»</Ui> i <Ui>«Profile» &gt; «Manage sensors»</Ui>, er målingene skjult. Trykk på <Ui>«Turn on»</Ui>.</li>
                                    </Steps>
                                    <p>En Garge Sensor prøver selv å koble til igjen. Den blinker sakte også mens den prøver, så sakte blink betyr ikke alltid at den har Wi-Fi.</p>
                                    <p>Et Garge Voltmeter som ikke får koblet til, sover lenger mellom hvert forsøk, opptil 6 timer. Det kan ta så lang tid før det er tilbake i appen etter at Wi-Fi virker igjen.</p>
                                </>
                            ),
                        },
                        {
                            id: 'voltmeter-not-responding',
                            title: 'Garge Voltmeter reagerer ikke på knappene',
                            body: (
                                <>
                                    <DoThis>Slik løser du det</DoThis>
                                    <p>Trykk på Restart-knappen for å vekke det. Vil du bytte Wi-Fi-nettverk, <Go to="setup-mode">åpner du oppsettmodus</Go>.</p>
                                    <p>Voltmeteret sover mellom målingene og reagerer ikke på BOOT-knappen mens det sover.</p>
                                </>
                            ),
                        },
                        {
                            id: 'alerts-not-arriving',
                            title: 'Varsler fra Garge kommer ikke frem',
                            body: (
                                <>
                                    <DoThis>Slik løser du det</DoThis>
                                    <Steps>
                                        <li>Sjekk at <Ui>«Offline alerts on this device»</Ui> er slått på i nettleseren eller appen du bruker.</li>
                                        <li>Trykk på <Ui>«Send test»</Ui>.</li>
                                    </Steps>
                                    <p>Hvis du ser <Ui>«Notifications blocked in browser settings.»</Ui>, må du tillate varsler for Garge i nettleseren.</p>
                                    <p>Hvis du ser <Ui>«Push notifications are not supported in this browser.»</Ui>, bruker du en annen nettleser. På iPhone åpner du først delingsmenyen, legger Garge til på Hjem-skjermen og åpner Garge derfra.</p>
                                </>
                            ),
                        },
                    ],
                },
            ],
        },
        {
            id: 'common-tasks',
            title: 'Vanlige oppgaver',
            groups: [{
                items: [
                    {
                        id: 'change-wifi',
                        title: 'Bytte Wi-Fi-nettverk på sensoren',
                        body: (
                            <Steps>
                                <li><Go to="setup-mode">Åpne oppsettmodus på sensoren.</Go></li>
                                <li>Koble mobilen til «Garge …».</li>
                                <li>Trykk på <Ui>«Change Wi-Fi»</Ui>.</li>
                                <li>Velg det nye nettverket og skriv inn passordet.</li>
                                <li>La <Ui>«Pairing code (optional)»</Ui> stå tomt og trykk på <Ui>«Connect»</Ui>. Du trenger ingen ny kode når sensoren allerede er på kontoen din.</li>
                            </Steps>
                        ),
                    },
                    {
                        id: 'notifications',
                        title: 'Få varsel når en sensor er frakoblet',
                        body: (
                            <>
                                <Steps>
                                    <li>Gå til <Ui>«Profile» &gt; «Notifications»</Ui>.</li>
                                    <li>Slå på <Ui>«Offline alerts on this device»</Ui>.</li>
                                    <li>Velg antall timer under <Ui>«Alert after»</Ui>, fra 1 til 168.</li>
                                    <li>Trykk på <Ui>«Send test»</Ui> for å sjekke at varslene kommer frem.</li>
                                </Steps>
                                <p>Bryteren gjelder bare for nettleseren eller den installerte appen du bruker nå. Slå den på i hver nettleser eller app der du vil ha varsler. <Ui>«Alert after»</Ui> gjelder for hele kontoen din.</p>
                                <p>Et Garge Voltmeter sender en måling omtrent én gang i timen, så velg mer enn 1 time for det.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/app-notifications.png', width: 720, height: 680, alt: 'Innstillingene for Notifications med Offline alerts on this device, Alert after og Test notification', caption: 'Varselinnstillingene.' },
                        ],
                    },
                    {
                        id: 'sharing',
                        title: 'Dele en sensor med en annen bruker',
                        body: (
                            <>
                                <Steps>
                                    <li>Gå til <Ui>«Profile» &gt; «Manage sensors»</Ui>.</li>
                                    <li>Trykk på <Ui>«Share»</Ui> på kortet du vil dele.</li>
                                    <li>Skriv inn e-postadressen til en annen Garge-bruker.</li>
                                    <li>Velg <Ui>«Read»</Ui> hvis den andre brukeren bare skal se målingene, eller <Ui>«Edit»</Ui> hvis den andre brukeren også skal kunne lage automatiseringer for stikkontaktene sensoren har funnet.</li>
                                    <li>Trykk på <Ui>«Share»</Ui>.</li>
                                </Steps>
                                <p>Du deler ett kort om gangen. En Garge Sensor vises som to kort, temperatur og luftfuktighet, så del hvert kort den andre brukeren skal se.</p>
                                <p>Vil du slutte å dele, åpner du <Ui>«Share»</Ui> på nytt og trykker på X-en ved personen under <Ui>«Shared with»</Ui>. Bare eieren kan dele en sensor. Den andre brukeren kan selv avslutte ved å trykke på <Ui>«Leave»</Ui> på sensoren.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/app-manage-sensors.png', width: 720, height: 1558, alt: 'Siden Sensors med Share og Remove from account på hvert kort', caption: 'Hvert kort har sin egen «Share» og «Remove from account».' },
                            { src: '/help/app-share.png', width: 720, height: 548, alt: 'Dialogen Share med felt for e-post og valget Read eller Edit', caption: 'Skriv inn e-postadressen og velg «Read» eller «Edit».' },
                        ],
                    },
                    {
                        id: 'renaming',
                        title: 'Gi en sensor nytt navn',
                        body: (
                            <>
                                <Steps>
                                    <li>Trykk på sensoren i <Ui>«My Devices»</Ui>.</li>
                                    <li>Trykk på blyanten ved navnet.</li>
                                </Steps>
                                <p>Et navn kan ha opptil 50 tegn. Hvert kort har sitt eget navn, så en Garge Sensor har ett navn for temperatur og ett for luftfuktighet.</p>
                                <p>Du kan også bruke blyanten på sensoren i <Ui>«Profile» &gt; «Manage sensors»</Ui>.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/app-rename.png', width: 720, height: 511, alt: 'En sensor åpnet fra My Devices, med en blyant ved navnet', caption: 'Blyanten ved navnet.' },
                        ],
                    },
                    {
                        id: 'selling',
                        title: 'Selge eller gi bort en sensor',
                        body: (
                            <>
                                <Steps>
                                    <li>Gå til <Ui>«Profile» &gt; «Manage sensors»</Ui>.</li>
                                    <li>Ta vare på koden under <Ui>«Device code»</Ui> på hvert kort. Koden forsvinner når du fjerner kortet, og en Garge Sensor har to.</li>
                                    <li>Trykk på <Ui>«Remove from account»</Ui> på alle kortene for sensoren.</li>
                                </Steps>
                                <p>En Garge Sensor vises som to kort, temperatur og luftfuktighet. Blir ett kort stående, får den nye eieren bare deler av sensoren, og du beholder tilgang til resten.</p>
                                <p>Kort fra samme sensor har samme kode i standardnavnet, for eksempel «Garge D4E5F6 temperature» og «Garge D4E5F6 humidity». Hvis du har gitt et kort nytt navn, står standardnavnet etter <Ui>«Default:»</Ui>.</p>
                                <p>Når du fjerner et kort, sletter du samtidig navnet du har gitt det, bildene, aktivitetene og terskelverdiene fra kontoen din. Alle du har delt det med, mister tilgangen. Du kan legge sensoren til igjen senere med koden under <Ui>«Device code»</Ui>. Det krever et aktivt abonnement.</p>
                                <h4 id="new-owner" className="scroll-mt-20 pt-2 font-semibold text-gray-100">Dette gjør den nye eieren</h4>
                                <Steps>
                                    <li>Følg steg <Go to="step-account">1</Go> og <Go to="step-pairing-code">2</Go> i oppsettet.</li>
                                    <li><Go to="step-power">Slå på sensoren.</Go></li>
                                    <li><Go to="setup-mode">Åpne oppsettmodus på sensoren.</Go></li>
                                    <li>Koble mobilen til «Garge …».</li>
                                    <li>Trykk på <Ui>«Change Wi-Fi»</Ui> på siden <Ui>«Pair device»</Ui>.</li>
                                    <li>Velg Wi-Fi-nettverket, skriv inn passordet og pairing code, og trykk på <Ui>«Connect»</Ui>.</li>
                                    <li>Følg steg <Go to="step-name">5</Go> i oppsettet.</li>
                                </Steps>
                                <p>Den nye eieren ser ikke selgerens målinger. Selgerens Wi-Fi-navn og passord ligger lagret på sensoren til den nye eierens Wi-Fi erstatter dem.</p>
                            </>
                        ),
                    },
                ],
            }],
        },
        {
            id: 'buttons-and-light',
            title: 'Knappene og lyset på sensoren',
            groups: [{
                items: [
                    {
                        id: 'buttons',
                        title: 'Hvor er BOOT- og Restart-knappene?',
                        body: <p>Knappene sitter bak to små hull på dekselet. Dekselet har ingen merking. BOOT-knappen er bak det øverste hullet, og Restart-knappen er bak det nederste.</p>,
                        device: {
                            label: 'Sensoren med BOOT-knappen og Restart-knappen',
                            caption: 'Knappene på sensoren.',
                        },
                    },
                    {
                        id: 'setup-mode',
                        title: 'Slik åpner du oppsettmodus på sensoren',
                        body: (
                            <>
                                <Steps>
                                    <li>Trykk på Restart-knappen og slipp den.</li>
                                    <li>Hold BOOT-knappen inne med en gang, helt til lyset blinker raskt.</li>
                                </Steps>
                                <p>Det kan ta mer enn 5 sekunder. Hvis lyset ikke blinker raskt, prøver du igjen. Dette sletter ingenting.</p>
                                <p>Hvis lyset ikke kommer på i det hele tatt, sjekker du strømmen. På et Garge Voltmeter sjekker du batteriet og kontakten.</p>
                                <p>Hvis sensoren allerede er satt opp, går du ut av oppsettmodus med en gang ved å trykke på Restart-knappen.</p>
                            </>
                        ),
                    },
                    {
                        id: 'blue-light',
                        title: 'Hva betyr det blå lyset på sensoren?',
                        body: (
                            <LightTable
                                headers={['Lyset', 'Hva det betyr', 'Hva du gjør']}
                                rows={[
                                    ['Raskt: 1 s på, 1 s av', 'Sensoren er i oppsettmodus. Det varer i opptil 30 minutter.', <Go key="wifi" to="step-wifi">Koble sensoren til Wi-Fi</Go>],
                                    ['Sakte: 5 s på, 5 s av (Garge Sensor)', 'Sensoren er i drift. Lyset blinker slik også når Wi-Fi ikke virker.', <>Ingenting. <Go to="sensor-stopped-reporting">Får du ikke målinger?</Go></>],
                                    ['Kort blink (Garge Voltmeter)', 'Sensoren våkner, sender en måling og sover igjen.', 'Ingenting'],
                                ]}
                            />
                        ),
                    },
                ],
            }],
        },
    ],
};
