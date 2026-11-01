import type { HelpContent } from '../helpContent';
import { Ui } from './Ui';

export const content: HelpContent = {
    lang: 'nb',
    path: '/no/help',
    switchLabel: 'English',
    switchPath: '/en/help',
    switchLang: 'en',
    title: 'Hjelp',
    intro: 'Sett opp Garge-sensoren, bruk den i appen og finn ut hva du gjør når noe ikke virker.',
    metaTitle: 'Hjelp | Garge',
    metaDescription: 'Sett opp Garge-sensoren, bruk den i appen og løs vanlige problemer.',
    download: {
        label: 'Last ned kortversjonen (PDF)',
        note: 'PDF-en er en kortversjon for utskrift og inneholder ikke alt som står på denne siden.',
    },
    contentsLabel: 'På denne siden',
    linkLabel: 'Lenke til',
    sections: [
        {
            id: 'setup',
            title: 'Oppsett',
            numbered: true,
            items: [
                {
                    id: 'step-account',
                    title: 'Opprett konto og logg inn',
                    body: <p>Gå til www.garge.no og trykk <Ui>«Create account»</Ui>. Du trenger et aktivt abonnement for å legge til sensorer.</p>,
                },
                {
                    id: 'step-pairing-code',
                    title: 'Hent en pairing code',
                    body: <p>Trykk <Ui>«+ Add device»</Ui> i <Ui>«My Devices»</Ui> og deretter <Ui>«Get pairing code»</Ui>. På mobil står det bare <Ui>«+»</Ui>. Koden har seks tegn og gjelder i 15 minutter. La siden stå åpen.</p>,
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
                            <p><Ui>Det blå lyset blinker raskt</Ui> når sensoren er klar. Hvis ikke, eller hvis sensoren er satt opp fra før, trykk på Restart-knappen og slipp den. Hold så BOOT-knappen inne med en gang, til lyset blinker raskt. Det kan ta mer enn 5 sekunder. Hvis det ikke blinker raskt, prøv igjen. <a href="#buttons" className="text-sky-400 hover:text-sky-300">Se hvor knappene er.</a></p>
                        </>
                    ),
                },
                {
                    id: 'step-wifi',
                    title: 'Koble sensoren til Wi-Fi',
                    body: (
                        <>
                            <p><Ui>Koble mobilen til «Garge …»</Ui> i Wi-Fi-innstillingene, for eksempel «Garge a1b2c3d4e5f6».</p>
                            <p><Ui>Oppsettsiden åpner seg.</Ui> Hvis ikke, gå til <Ui>192.168.4.1</Ui> i nettleseren.</p>
                            <p><Ui>Velg Wi-Fi-nettverket ditt</Ui>, skriv inn <Ui>passordet</Ui> og <Ui>pairing code</Ui>, og trykk <Ui>«Connect»</Ui>.</p>
                        </>
                    ),
                    images: [
                        { src: '/help/setup-page-no.png', width: 660, height: 650, alt: 'Oppsettsiden Wi-Fi Setup på sensoren', caption: 'Oppsettsiden på mobilen.' },
                    ],
                },
                {
                    id: 'step-name',
                    title: 'Gi sensoren et navn',
                    body: <p>Gå tilbake til <Ui>«My Devices»</Ui>. Sensoren dukker opp automatisk innen et par minutter. Last siden på nytt hvis den ikke dukker opp. Gi den et navn, for eksempel «MC-batteri».</p>,
                },
            ],
        },
        {
            id: 'buttons-and-light',
            title: 'Knappene og det blå lyset',
            device: {
                label: 'Sensoren med BOOT-knappen og Restart-knappen',
                caption: 'Knappene på sensoren.',
            },
            items: [
                {
                    id: 'buttons',
                    title: 'BOOT og Restart',
                    body: (
                        <>
                            <p>Knappene sitter bak to små hull på dekselet. Dekselet har ingen merking. BOOT-knappen er det øverste hullet, og Restart-knappen er det nederste.</p>
                            <p>For å gå i oppsettmodus, trykk på Restart-knappen og slipp den. Hold så BOOT-knappen inne med en gang, til lyset blinker raskt. Det kan ta mer enn 5 sekunder. Hvis det ikke blinker raskt, prøv igjen. Dette sletter ingenting. På en sensor som allerede er satt opp, trykker du på Restart-knappen for å gå ut av oppsettmodus med en gang.</p>
                        </>
                    ),
                },
                {
                    id: 'blue-light',
                    title: 'Det blå lyset',
                    body: (
                        <>
                            <p><Ui>Blinker raskt (1 sekund på, 1 sekund av):</Ui> Oppsettmodus. Varer i opptil 30 minutter.</p>
                            <p><Ui>Garge Sensor, blinker sakte (5 sekunder på, 5 sekunder av):</Ui> I drift. Lyset blinker slik også når Wi-Fi er nede.</p>
                            <p><Ui>Garge Voltmeter, blinker kort:</Ui> Våkner, blinker, sender en måling og sover.</p>
                        </>
                    ),
                },
            ],
        },
        {
            id: 'sensors',
            title: 'De to sensorene',
            items: [
                {
                    id: 'garge-sensor',
                    title: 'Garge Sensor',
                    body: <p>Måler temperatur og luftfuktighet. Den får strøm via USB-C og sover aldri.</p>,
                },
                {
                    id: 'garge-voltmeter',
                    title: 'Garge Voltmeter',
                    body: <p>Måler spenningen på et batteri. Det får strøm fra 12 V-batteriet på motorsykkelen via en SAE-kontakt med to pinner. For å spare batteriet sover det mellom målingene. Det våkner, blinker, sender en måling og sover igjen. Som standard skjer dette omtrent én gang i timen.</p>,
                },
            ],
        },
        {
            id: 'using-the-app',
            title: 'Bruke appen',
            items: [
                {
                    id: 'notifications',
                    title: 'Få varsel når sensoren er frakoblet',
                    body: (
                        <>
                            <p>Gå til <Ui>«Profile» &gt; «Notifications»</Ui>. Slå på <Ui>«Offline alerts on this device»</Ui> og velg antall timer under <Ui>«Alert after»</Ui>, fra 1 til 168.</p>
                            <p>Bryteren gjelder for én nettleser eller installert app om gangen. Slå den på i hver av dem der du vil ha varsler. <Ui>«Alert after»</Ui> gjelder for hele kontoen din. Et Garge Voltmeter rapporterer omtrent én gang i timen, så velg mer enn 1 time for det. Bruk <Ui>«Send test»</Ui> for å sjekke at varslene kommer frem.</p>
                        </>
                    ),
                    images: [
                        { src: '/help/app-notifications.png', width: 720, height: 680, alt: 'Innstillingene for Notifications med Offline alerts on this device, Alert after og Test notification', caption: 'Varselinnstillingene under «Profile».' },
                    ],
                },
                {
                    id: 'sharing',
                    title: 'Dele sensoren',
                    body: (
                        <>
                            <p>Gå til <Ui>«Profile» &gt; «Manage sensors» &gt; «Share»</Ui>. Skriv inn e-postadressen til en annen Garge-bruker. Velg <Ui>«Read»</Ui> hvis den andre brukeren bare skal se målingene, eller <Ui>«Edit»</Ui> hvis den andre brukeren også skal få automatiseringer for stikkontaktene denne sensoren har funnet.</p>
                            <p>Deling gjelder for én oppføring om gangen. En Garge Sensor har to oppføringer, temperatur og luftfuktighet, så del hver av dem den andre brukeren skal se.</p>
                            <p>For å slutte å dele, åpne <Ui>«Share»</Ui> på nytt og trykk på X-en ved personen under <Ui>«Shared with»</Ui>. Bare eieren kan dele en sensor. Den andre brukeren kan selv avslutte ved å trykke <Ui>«Leave»</Ui> på sensoren.</p>
                        </>
                    ),
                    images: [
                        { src: '/help/app-manage-sensors.png', width: 720, height: 1558, alt: 'Siden Sensors med Share og Remove from account på hver sensor', caption: 'Hver oppføring i «Manage sensors» har sin egen «Share» og «Remove from account».' },
                        { src: '/help/app-share.png', width: 720, height: 548, alt: 'Dialogen Share med felt for e-post og valget Read eller Edit', caption: 'Skriv inn e-postadressen og velg «Read» eller «Edit».' },
                    ],
                },
                {
                    id: 'renaming',
                    title: 'Gi sensoren nytt navn',
                    body: (
                        <>
                            <p>Trykk på sensoren i <Ui>«My Devices»</Ui>, og trykk deretter på blyanten ved navnet. Et navn kan ha opptil 50 tegn. Hver oppføring har sitt eget navn, så en Garge Sensor har ett for temperatur og ett for luftfuktighet.</p>
                            <p>Du kan også bruke blyanten på sensoren i <Ui>«Profile» &gt; «Manage sensors»</Ui>.</p>
                        </>
                    ),
                    images: [
                        { src: '/help/app-rename.png', width: 720, height: 511, alt: 'En sensor åpnet fra My Devices, med en blyant ved navnet', caption: 'Blyanten ved navnet.' },
                    ],
                },
            ],
        },
        {
            id: 'troubleshooting',
            title: 'Feilsøking',
            items: [
                {
                    id: 'change-wifi',
                    title: 'Bytte Wi-Fi-nettverk',
                    body: (
                        <>
                            <p>Trykk på Restart-knappen og slipp den. Hold så BOOT-knappen inne med en gang, til lyset blinker raskt. Det kan ta mer enn 5 sekunder. Hvis det ikke blinker raskt, prøv igjen. Koble mobilen til «Garge …», trykk <Ui>«Change Wi-Fi»</Ui>, velg det nye nettverket og trykk <Ui>«Connect»</Ui>.</p>
                            <p>En sensor som allerede er på kontoen din, trenger ingen ny kode. La <Ui>«Pairing code (optional)»</Ui> stå tomt.</p>
                        </>
                    ),
                },
                {
                    id: 'sensor-not-showing-up',
                    title: 'Sensoren dukker ikke opp',
                    body: (
                        <>
                            <p>Sensoren støtter bare Wi-Fi på 2,4 GHz. Skjulte nettverk vises ikke i listen. Hvis passordet kan være feil, følg <a href="#change-wifi" className="text-sky-400 hover:text-sky-300">bytte Wi-Fi-nettverk</a>, og skriv inn passordet og en ny pairing code.</p>
                            <p>Oppsettsiden tester ikke passordet. Den sier bare «Data received. Restarting...». En sensor med feil passord går ikke tilbake til oppsettmodus av seg selv, så da må du bruke knappene. Oppsettmodus viser da <Ui>«Pair device»</Ui>, så trykk <Ui>«Change Wi-Fi»</Ui> for å komme til passordfeltet.</p>
                        </>
                    ),
                },
                {
                    id: 'pairing-code-expired',
                    title: 'Pairing code har gått ut',
                    body: (
                        <>
                            <p>Hvis du ser <Ui>«This pairing code has expired.»</Ui>, trykk <Ui>«Get new code»</Ui>. Den gamle koden slutter da å virke.</p>
                            <p>En kode gjelder i 15 minutter og virker én gang. Hvis du allerede har skrevet inn den gamle koden på sensoren, går du tilbake til oppsettsiden. Trykk på Restart-knappen og slipp den. Hold så BOOT-knappen inne med en gang, til lyset blinker raskt. Det kan ta mer enn 5 sekunder. Hvis det ikke blinker raskt, prøv igjen. Koble mobilen til «Garge …» og skriv inn den nye koden. Se <a href="#setup-asks-for-code" className="text-sky-400 hover:text-sky-300">oppsettsiden ber bare om pairing code</a>.</p>
                        </>
                    ),
                },
                {
                    id: 'setup-asks-for-code',
                    title: 'Oppsettsiden ber bare om pairing code',
                    body: (
                        <>
                            <p>Hvis oppsettsiden viser <Ui>«Pair device»</Ui>, har sensoren allerede lagret et Wi-Fi-nettverk. Skriv inn en ny pairing code og trykk <Ui>«Pair»</Ui>. For å velge et annet nettverk, trykk <Ui>«Change Wi-Fi»</Ui>.</p>
                            <p>Den første oppsettsiden sier <Ui>«Pairing code (optional)»</Ui>, men en ny sensor trenger koden. Hvis du lot feltet stå tomt, går sensoren i oppsettmodus igjen så du kan skrive den inn.</p>
                        </>
                    ),
                },
                {
                    id: 'setup-network-missing',
                    title: 'Nettverket «Garge …» er borte',
                    body: <p>Oppsettmodus varer i opptil 30 minutter. Hvis du ikke lenger ser nettverket, trykk på Restart-knappen og slipp den. Hold så BOOT-knappen inne med en gang, til lyset blinker raskt. Det kan ta mer enn 5 sekunder. Hvis det ikke blinker raskt, prøv igjen. Nettverket er åpent, så det ber ikke om passord.</p>,
                },
                {
                    id: 'setup-page-not-opening',
                    title: 'Oppsettsiden åpner seg ikke',
                    body: <p>Bli værende på «Garge …» og gå til <Ui>http://192.168.4.1</Ui> i nettleseren.</p>,
                },
                {
                    id: 'cannot-get-pairing-code',
                    title: 'Du får ikke hentet en pairing code',
                    body: (
                        <>
                            <p>Hvis du ser <Ui>«You need an active subscription to add more devices.»</Ui>, trykk <Ui>«See plans»</Ui>. Sensorene du allerede har, virker som før.</p>
                            <p>Hvis <Ui>«Sensor capacity»</Ui> under <Ui>«Profile»</Ui> sier <Ui>«At capacity»</Ui>, slå av en sensor eller legg til mer kapasitet.</p>
                        </>
                    ),
                },
                {
                    id: 'voltmeter-not-responding',
                    title: 'Garge Voltmeter reagerer ikke',
                    body: <p>Voltmeteret sover mellom målingene og reagerer da ikke på BOOT-knappen. Trykk på Restart-knappen for å vekke det.</p>,
                },
                {
                    id: 'sensor-stopped-reporting',
                    title: 'Sensoren har sluttet å rapportere',
                    body: (
                        <>
                            <p>Sjekk at Wi-Fi-en din virker. <Ui>«Last seen»</Ui> i visningen av sensoren viser tidspunktet for siste måling.</p>
                            <p>En Garge Sensor prøver selv å koble til igjen. Den blinker sakte også mens den prøver, så sakte blink alene viser ikke at den har Wi-Fi.</p>
                            <p>Et Garge Voltmeter som ikke får koblet til, sover lenger mellom hvert forsøk, opptil 6 timer. Det kan ta så lang tid før det dukker opp igjen etter at Wi-Fi-en er tilbake.</p>
                            <p>Hvis nettverksnavnet eller passordet er endret, finner ikke sensoren nettverket selv. Se <a href="#change-wifi" className="text-sky-400 hover:text-sky-300">bytte Wi-Fi-nettverk</a>.</p>
                            <p>En oppføring merket <Ui>«Off»</Ui> i <Ui>«Profile» &gt; «Manage sensors»</Ui> har skjulte målinger. Trykk <Ui>«Turn on»</Ui>.</p>
                        </>
                    ),
                },
                {
                    id: 'alerts-not-arriving',
                    title: 'Varsler kommer ikke frem',
                    body: (
                        <>
                            <p>Sjekk at <Ui>«Offline alerts on this device»</Ui> er slått på i nettleseren eller appen du bruker, og trykk <Ui>«Send test»</Ui>.</p>
                            <p>Hvis du ser <Ui>«Notifications blocked in browser settings.»</Ui>, tillat varsler for Garge i nettleseren. Hvis du ser <Ui>«Push notifications are not supported in this browser.»</Ui>, bruk en annen nettleser. På iPhone åpner du først delingsmenyen, legger Garge til på Hjem-skjermen og åpner Garge derfra.</p>
                        </>
                    ),
                },
            ],
        },
        {
            id: 'selling',
            title: 'Selge eller gi bort en sensor',
            items: [
                {
                    id: 'sell-sensor',
                    title: 'Fjern sensoren fra kontoen din',
                    body: (
                        <>
                            <p>Gå til <Ui>«Profile» &gt; «Manage sensors»</Ui> og trykk <Ui>«Remove from account»</Ui> på alle oppføringene for sensoren. En Garge Sensor har to, temperatur og luftfuktighet. Blir én stående, får den nye eieren bare deler av sensoren, og du beholder tilgang til resten.</p>
                            <p>Oppføringer fra samme sensor har samme kode i standardnavnet, for eksempel «Garge D4E5F6 temperature» og «Garge D4E5F6 humidity». Hvis du har gitt en oppføring nytt navn, står standardnavnet på linjen <Ui>«Default:»</Ui>.</p>
                            <p>Før du fjerner en oppføring, må du ta vare på koden under <Ui>«Device code»</Ui>. Den forsvinner sammen med oppføringen, og en Garge Sensor har to.</p>
                            <p>Når du fjerner en oppføring, slettes navnet du har gitt den, bildene, aktivitetene og terskelverdiene fra kontoen din. Alle du har delt den med, mister tilgangen. Du kan legge sensoren til igjen senere med koden under <Ui>«Device code»</Ui>. Det krever et aktivt abonnement.</p>
                        </>
                    ),
                },
                {
                    id: 'new-owner',
                    title: 'Dette gjør den nye eieren',
                    body: (
                        <>
                            <p>Den nye eieren følger oppsettet fra <a href="#setup" className="text-sky-400 hover:text-sky-300">steg 1</a> og ser ikke målingene dine. Sensoren er satt opp fra før, så oppsettsiden viser <Ui>«Pair device»</Ui>. Den nye eieren trykker <Ui>«Change Wi-Fi»</Ui>, skriver inn sitt eget Wi-Fi og pairing code, og trykker <Ui>«Connect»</Ui>.</p>
                            <p>Wi-Fi-navnet og passordet ditt blir liggende på sensoren til den nye eierens Wi-Fi erstatter dem.</p>
                        </>
                    ),
                },
            ],
        },
    ],
};
