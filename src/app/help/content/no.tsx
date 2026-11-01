import type { HelpContent } from '../helpContent';
import { DoThis, Go, LightTable, Steps, Ui } from './Ui';

export const content: HelpContent = {
    lang: 'nb',
    path: '/no/help',
    switchLabel: 'English',
    switchPath: '/en/help',
    switchLang: 'en',
    title: 'Hjelp',
    metaTitle: 'Hjelp | Garge',
    metaDescription: 'Oppsett, knapper, lys og feilsøking for Garge Sensor og Garge Voltmeter.',
    download: {
        label: 'Last ned kort utskriftsversjon (PDF)',
        note: 'Inneholder ikke alt som står på denne siden.',
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
                                <p>Gå til www.garge.no og trykk <Ui>«Create account»</Ui>.</p>
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
                                    <li>Trykk <Ui>«+ Add device»</Ui> i <Ui>«My Devices»</Ui>. På mobil står det bare <Ui>«+»</Ui>.</li>
                                    <li>Trykk <Ui>«Get pairing code»</Ui>.</li>
                                    <li>La siden stå åpen.</li>
                                </Steps>
                                <p>Koden har seks tegn og gjelder i 15 minutter.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/crop-dashboard.png', width: 640, height: 659, alt: 'My Devices med plussknappen øverst til høyre', caption: '«+» i «My Devices» på mobil.' },
                            { src: '/help/crop-pairing.png', width: 640, height: 611, alt: 'Add a device med en pairing code', caption: 'Pairing code vises her.' },
                        ],
                    },
                    {
                        id: 'step-power',
                        title: 'Slå på sensoren',
                        body: (
                            <>
                                <p><Ui>Garge Sensor:</Ui> koble til USB-C-strøm.</p>
                                <p><Ui>Garge Voltmeter:</Ui> koble til SAE-kontakten på 12 V-batteriet.</p>
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
                                    <li>Oppsettsiden åpner seg. Hvis ikke, gå til <Ui>192.168.4.1</Ui> i nettleseren.</li>
                                    <li>Velg Wi-Fi-nettverket ditt, og skriv inn passordet.</li>
                                    <li>Skriv inn pairing code.</li>
                                    <li>Trykk <Ui>«Connect»</Ui>.</li>
                                </Steps>
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
                                <p>Hvis den ikke dukker opp, last siden på nytt.</p>
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
                                    <DoThis>Gjør dette</DoThis>
                                    <Steps>
                                        <li><Go to="setup-mode">Åpne oppsettmodus på sensoren.</Go></li>
                                        <li>Fortsett med å <Go to="step-wifi">koble sensoren til Wi-Fi</Go>.</li>
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
                                    <DoThis>Gjør dette</DoThis>
                                    <Steps>
                                        <li><Go to="setup-mode">Åpne oppsettmodus på sensoren.</Go></li>
                                        <li>Se etter «Garge …» på nytt i Wi-Fi-innstillingene på mobilen. Nettverket er åpent, så det ber ikke om passord.</li>
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
                                    <DoThis>Gjør dette</DoThis>
                                    <Steps>
                                        <li>Bli værende på «Garge …».</li>
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
                                    <DoThis>Gjør dette</DoThis>
                                    <Steps>
                                        <li>Skriv inn en ny pairing code.</li>
                                        <li>Trykk <Ui>«Pair»</Ui>.</li>
                                    </Steps>
                                    <p>For å velge et annet nettverk, trykk <Ui>«Change Wi-Fi»</Ui> i stedet.</p>
                                    <p>Siden viser <Ui>«Pair device»</Ui> fordi sensoren allerede har lagret et Wi-Fi-nettverk. Den første oppsettsiden sier <Ui>«Pairing code (optional)»</Ui>, men en ny sensor trenger koden. Hvis du lot feltet stå tomt, går sensoren i oppsettmodus igjen så du kan skrive den inn.</p>
                                </>
                            ),
                        },
                        {
                            id: 'pairing-code-expired',
                            title: 'Pairing code har gått ut',
                            body: (
                                <>
                                    <DoThis>Gjør dette</DoThis>
                                    <Steps>
                                        <li>Hvis du ser <Ui>«This pairing code has expired.»</Ui>, trykk <Ui>«Get new code»</Ui>. Den gamle koden slutter da å virke.</li>
                                        <li>Hvis du allerede har skrevet inn den gamle koden på sensoren, <Go to="setup-mode">åpne oppsettmodus</Go>, koble mobilen til «Garge …» og skriv inn den nye koden.</li>
                                    </Steps>
                                    <p>En kode gjelder i 15 minutter og virker én gang.</p>
                                </>
                            ),
                        },
                        {
                            id: 'cannot-get-pairing-code',
                            title: 'Appen gir deg ikke en pairing code',
                            body: (
                                <>
                                    <DoThis>Gjør dette</DoThis>
                                    <p>Hvis du ser <Ui>«You need an active subscription to add more devices.»</Ui>, trykk <Ui>«See plans»</Ui>. Sensorene du allerede har, virker som før.</p>
                                    <p>Hvis <Ui>«Sensor capacity»</Ui> under <Ui>«Profile»</Ui> sier <Ui>«At capacity»</Ui>, slå av en sensor eller legg til mer kapasitet.</p>
                                </>
                            ),
                        },
                        {
                            id: 'sensor-not-showing-up',
                            title: 'Ny sensor dukker ikke opp i appen',
                            body: (
                                <>
                                    <DoThis>Gjør dette</DoThis>
                                    <Steps>
                                        <li>Sjekk at nettverket ditt er på 2,4 GHz og ikke er skjult. Sensoren støtter bare Wi-Fi på 2,4 GHz, og skjulte nettverk vises ikke i listen.</li>
                                        <li>Hvis passordet kan være feil, <Go to="setup-mode">åpne oppsettmodus</Go> og trykk <Ui>«Change Wi-Fi»</Ui> på siden <Ui>«Pair device»</Ui>.</li>
                                        <li>Velg nettverket, og skriv inn passordet og en ny pairing code.</li>
                                    </Steps>
                                    <p>Oppsettsiden tester ikke passordet. Den sier bare «Data received. Restarting...». En sensor med feil passord går ikke tilbake til oppsettmodus av seg selv.</p>
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
                                    <DoThis>Gjør dette</DoThis>
                                    <Steps>
                                        <li>Sjekk at Wi-Fi-en din virker. <Ui>«Last seen»</Ui> i visningen av sensoren viser tidspunktet for siste måling.</li>
                                        <li>Hvis nettverksnavnet eller passordet er endret, <Go to="change-wifi">bytt Wi-Fi-nettverk på sensoren</Go>. Den finner ikke nettverket selv.</li>
                                        <li>Hvis en oppføring er merket <Ui>«Off»</Ui> i <Ui>«Profile» &gt; «Manage sensors»</Ui>, er målingene skjult. Trykk <Ui>«Turn on»</Ui>.</li>
                                    </Steps>
                                    <p>En Garge Sensor prøver selv å koble til igjen. Den blinker sakte også mens den prøver, så sakte blink alene viser ikke at den har Wi-Fi.</p>
                                    <p>Et Garge Voltmeter som ikke får koblet til, sover lenger mellom hvert forsøk, opptil 6 timer. Det kan ta så lang tid før det dukker opp igjen etter at Wi-Fi-en er tilbake.</p>
                                </>
                            ),
                        },
                        {
                            id: 'voltmeter-not-responding',
                            title: 'Garge Voltmeter reagerer ikke på knappene',
                            body: (
                                <>
                                    <DoThis>Gjør dette</DoThis>
                                    <p>Trykk på Restart-knappen for å vekke det. For å bytte Wi-Fi-nettverk, <Go to="setup-mode">åpne oppsettmodus</Go>.</p>
                                    <p>Voltmeteret sover mellom målingene og reagerer da ikke på BOOT-knappen.</p>
                                </>
                            ),
                        },
                        {
                            id: 'alerts-not-arriving',
                            title: 'Varsler fra Garge kommer ikke frem',
                            body: (
                                <>
                                    <DoThis>Gjør dette</DoThis>
                                    <Steps>
                                        <li>Sjekk at <Ui>«Offline alerts on this device»</Ui> er slått på i nettleseren eller appen du bruker.</li>
                                        <li>Trykk <Ui>«Send test»</Ui>.</li>
                                    </Steps>
                                    <p>Hvis du ser <Ui>«Notifications blocked in browser settings.»</Ui>, tillat varsler for Garge i nettleseren.</p>
                                    <p>Hvis du ser <Ui>«Push notifications are not supported in this browser.»</Ui>, bruk en annen nettleser. På iPhone åpner du først delingsmenyen, legger Garge til på Hjem-skjermen og åpner Garge derfra.</p>
                                </>
                            ),
                        },
                    ],
                },
            ],
        },
        {
            id: 'common-tasks',
            aliases: ['using-the-app'],
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
                                <li>Trykk <Ui>«Change Wi-Fi»</Ui>.</li>
                                <li>Velg det nye nettverket, og skriv inn passordet.</li>
                                <li>La <Ui>«Pairing code (optional)»</Ui> stå tomt, og trykk <Ui>«Connect»</Ui>. En sensor som allerede er på kontoen din, trenger ingen ny kode.</li>
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
                                    <li>Trykk <Ui>«Send test»</Ui> for å sjekke at varslene kommer frem.</li>
                                </Steps>
                                <p>Bryteren gjelder for én nettleser eller installert app om gangen. Slå den på i hver av dem der du vil ha varsler. <Ui>«Alert after»</Ui> gjelder for hele kontoen din.</p>
                                <p>Et Garge Voltmeter rapporterer omtrent én gang i timen, så velg mer enn 1 time for det.</p>
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
                                    <li>Trykk <Ui>«Share»</Ui> på oppføringen.</li>
                                    <li>Skriv inn e-postadressen til en annen Garge-bruker.</li>
                                    <li>Velg <Ui>«Read»</Ui> hvis den andre brukeren bare skal se målingene, eller <Ui>«Edit»</Ui> hvis den andre brukeren også skal få automatiseringer for stikkontaktene denne sensoren har funnet.</li>
                                    <li>Trykk <Ui>«Share»</Ui>.</li>
                                </Steps>
                                <p>Deling gjelder for én oppføring om gangen. En Garge Sensor har to oppføringer, temperatur og luftfuktighet, så del hver av dem den andre brukeren skal se.</p>
                                <p>For å slutte å dele, åpne <Ui>«Share»</Ui> på nytt og trykk på X-en ved personen under <Ui>«Shared with»</Ui>. Bare eieren kan dele en sensor. Den andre brukeren kan selv avslutte ved å trykke <Ui>«Leave»</Ui> på sensoren.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/app-manage-sensors.png', width: 720, height: 1558, alt: 'Siden Sensors med Share og Remove from account på hver sensor', caption: 'Hver oppføring har sin egen «Share» og «Remove from account».' },
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
                                <p>Et navn kan ha opptil 50 tegn. Hver oppføring har sitt eget navn, så en Garge Sensor har ett for temperatur og ett for luftfuktighet.</p>
                                <p>Du kan også bruke blyanten på sensoren i <Ui>«Profile» &gt; «Manage sensors»</Ui>.</p>
                            </>
                        ),
                        images: [
                            { src: '/help/app-rename.png', width: 720, height: 511, alt: 'En sensor åpnet fra My Devices, med en blyant ved navnet', caption: 'Blyanten ved navnet.' },
                        ],
                    },
                    {
                        id: 'selling',
                        aliases: ['sell-sensor'],
                        title: 'Selge eller gi bort en sensor',
                        body: (
                            <>
                                <Steps>
                                    <li>Gå til <Ui>«Profile» &gt; «Manage sensors»</Ui>.</li>
                                    <li>Ta vare på koden under <Ui>«Device code»</Ui> på hver oppføring. Den forsvinner sammen med oppføringen, og en Garge Sensor har to.</li>
                                    <li>Trykk <Ui>«Remove from account»</Ui> på alle oppføringene for sensoren.</li>
                                </Steps>
                                <p>En Garge Sensor har to oppføringer, temperatur og luftfuktighet. Blir én stående, får den nye eieren bare deler av sensoren, og du beholder tilgang til resten.</p>
                                <p>Oppføringer fra samme sensor har samme kode i standardnavnet, for eksempel «Garge D4E5F6 temperature» og «Garge D4E5F6 humidity». Hvis du har gitt en oppføring nytt navn, står standardnavnet på linjen <Ui>«Default:»</Ui>.</p>
                                <p>Når du fjerner en oppføring, slettes navnet du har gitt den, bildene, aktivitetene og terskelverdiene fra kontoen din. Alle du har delt den med, mister tilgangen. Du kan legge sensoren til igjen senere med koden under <Ui>«Device code»</Ui>. Det krever et aktivt abonnement.</p>
                                <h4 id="new-owner" className="scroll-mt-20 pt-2 font-semibold text-gray-100">Dette gjør den nye eieren</h4>
                                <Steps>
                                    <li>Følg oppsettet fra <Go to="setup">steg 1</Go>. Den nye eieren ser ikke målingene dine.</li>
                                    <li><Go to="setup-mode">Åpne oppsettmodus på sensoren</Go>. Den er satt opp fra før, så oppsettsiden viser <Ui>«Pair device»</Ui>.</li>
                                    <li>Trykk <Ui>«Change Wi-Fi»</Ui>.</li>
                                    <li>Skriv inn ditt eget Wi-Fi og pairing code, og trykk <Ui>«Connect»</Ui>.</li>
                                </Steps>
                                <p>Selgerens Wi-Fi-navn og passord blir liggende på sensoren til den nye eierens Wi-Fi erstatter dem.</p>
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
                        body: <p>Knappene sitter bak to små hull på dekselet. Dekselet har ingen merking. BOOT-knappen er det øverste hullet, og Restart-knappen er det nederste.</p>,
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
                                    <li>Hold så BOOT-knappen inne med en gang, til lyset blinker raskt.</li>
                                </Steps>
                                <p>Det kan ta mer enn 5 sekunder. Hvis det ikke blinker raskt, prøv igjen. Dette sletter ingenting.</p>
                                <p>På en sensor som allerede er satt opp, trykker du på Restart-knappen for å gå ut av oppsettmodus med en gang.</p>
                            </>
                        ),
                    },
                    {
                        id: 'blue-light',
                        title: 'Hva betyr det blå lyset på sensoren?',
                        body: (
                            <LightTable
                                headers={['Lyset', 'Betyr', 'Gjør dette']}
                                rows={[
                                    ['Raskt: 1 s på, 1 s av', 'Oppsettmodus, i opptil 30 minutter', <Go key="wifi" to="step-wifi">Koble sensoren til Wi-Fi</Go>],
                                    ['Sakte: 5 s på, 5 s av (Garge Sensor)', 'I drift, også når Wi-Fi er nede', <>Ingenting. <Go to="sensor-stopped-reporting">Får du ikke målinger?</Go></>],
                                    ['Kort blink (Garge Voltmeter)', 'Våkner, sender en måling og sover', 'Ingenting'],
                                ]}
                            />
                        ),
                    },
                ],
            }],
        },
        {
            id: 'sensors',
            title: 'Forskjellen på sensorene',
            groups: [{
                items: [
                    {
                        id: 'garge-sensor',
                        title: 'Garge Sensor måler temperatur og luftfuktighet',
                        body: <p>Den får strøm via USB-C og sover aldri.</p>,
                    },
                    {
                        id: 'garge-voltmeter',
                        title: 'Garge Voltmeter måler batterispenning',
                        body: <p>Det får strøm fra 12 V-batteriet på motorsykkelen via en SAE-kontakt med to pinner. For å spare batteriet sover det mellom målingene. Det våkner, blinker, sender en måling og sover igjen. Som standard skjer dette omtrent én gang i timen.</p>,
                    },
                ],
            }],
        },
    ],
};
