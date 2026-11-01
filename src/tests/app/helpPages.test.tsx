import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { GET } from '@/app/help/route'
import { helpPathFor, isHelpPath } from '@/app/help/language'
import { helpMetadata, type HelpContent } from '@/app/help/helpContent'
import HelpPage from '@/app/help/HelpPage'
import { content as no } from '@/app/help/content/no'
import { content as en } from '@/app/help/content/en'

vi.mock('next/image', () => ({
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

/** Stands in for the browser's observer, so a test decides which sections are in view. */
let observers: { callback: IntersectionObserverCallback; targets: Element[] }[] = []

class FakeIntersectionObserver {
    private readonly entry: { callback: IntersectionObserverCallback; targets: Element[] }
    constructor(callback: IntersectionObserverCallback) {
        this.entry = { callback, targets: [] }
        observers.push(this.entry)
    }
    observe(target: Element) { this.entry.targets.push(target) }
    disconnect() { this.entry.targets = [] }
}

beforeEach(() => {
    observers = []
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})
afterEach(() => vi.unstubAllGlobals())

/** Reports each id as entering or leaving the part of the screen that decides the current section. */
function scrollTo(changes: Record<string, boolean>) {
    const [observer] = observers
    const entries = Object.entries(changes).map(([id, isIntersecting]) => ({
        target: observer.targets.find(target => target.id === id),
        isIntersecting,
    }))
    act(() => observer.callback(entries as unknown as IntersectionObserverEntry[], observer as unknown as IntersectionObserver))
}

const currentLinks = (container: HTMLElement) =>
    [...container.querySelectorAll('[aria-current]')].map(link => link.getAttribute('href'))

const NO = '/no/help'
const EN = '/en/help'

const helpItems = (content: HelpContent) => content.sections.flatMap(section => section.groups.flatMap(group => group.items))

/** Every id a help page has a heading for. */
const helpIds = (content: HelpContent) => content.sections.flatMap(section => [section.id, ...section.groups.flatMap(group => group.items.map(item => item.id))])

/** Every image a help page shows, as public paths. */
const helpImages = (content: HelpContent) => helpItems(content).flatMap(item => (item.images ?? []).map(image => image.src))

/** Every id on the rendered page, also the ones that sit inside the text. */
function renderedIds(content: HelpContent) {
    const { container, unmount } = render(<HelpPage content={content} />)
    const ids = [...container.querySelectorAll('[id]')].map(element => element.id)
    unmount()
    return ids
}

/** The two setup page screenshots show a network name in each language. */
const withoutLanguage = (src: string) => src.replace(/-(no|en)\.png$/, '.png')

/** Every text in a content file, without the code around it. */
const prose = (name: string) => readFileSync(resolve(`src/app/help/content/${name}.tsx`), 'utf8')

const manual = () => readFileSync(resolve('docs/manual/garge-manual.html'), 'utf8')

describe('helpPathFor', () => {
    it.each([
        ['nb-NO', NO],
        ['nb', NO],
        ['nn', NO],
        ['nn-NO', NO],
        ['no', NO],
        ['NB-no', NO],
        ['en-US', EN],
        ['de', EN],
        ['sv,da;q=0.8', EN],
        ['*', EN],
        ['', EN],
        [null, EN],
    ])('sends %s to %s', (header, path) => {
        expect(helpPathFor(header)).toBe(path)
    })

    it.each([
        ['en;q=0.9,nb;q=0.8', EN],
        ['nb;q=0.9,en;q=0.8', NO],
        ['en;q=0.5,nb', NO],
        ['nb;q=0.5,en', EN],
        ['nb, en', NO],
        ['en, nb', EN],
        ['de,nb;q=0.8', NO],
        ['de,en;q=0.9,nb;q=0.8', EN],
        ['nb;q=0.5,*;q=0.9', EN],
        ['nb;q=0.9,*;q=0.5', NO],
        ['nn;q=0.3,nb;q=0.8,en;q=0.5', NO],
        ['nb ; q=0.8 , en ; q=0.7', NO],
        ['nb;Q=0.8,en;q=0.7', NO],
    ])('weighs the quality values in %s', (header, path) => {
        expect(helpPathFor(header)).toBe(path)
    })

    it.each([
        ['nb;q=0', EN],
        ['nb;q=0.000,en', EN],
        ['en;q=0,nb', NO],
    ])('treats quality 0 in %s as refused', (header, path) => {
        expect(helpPathFor(header)).toBe(path)
    })

    it.each([
        ['nb;q=2', EN],
        ['nb;q=abc', EN],
        ['nb;q=', EN],
        ['nb;q=0.1234', EN],
        ['non', EN],
        ['nob', EN],
        ['nl', EN],
    ])('does not take %s for Norwegian', (header, path) => {
        expect(helpPathFor(header)).toBe(path)
    })
})

describe('GET /help', () => {
    const get = (acceptLanguage?: string) =>
        GET(new Request('http://localhost/help', { headers: acceptLanguage ? { 'accept-language': acceptLanguage } : {} }))

    it('redirects temporarily by language and says the answer varies', () => {
        const response = get('nb-NO,nb;q=0.9,en;q=0.8')

        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toBe(NO)
        expect(response.headers.get('vary')).toBe('Accept-Language')
        expect(response.headers.get('cache-control')).toBe('private, no-store')
    })

    it('sends a request with no header to the English page', () => {
        expect(get().headers.get('location')).toBe(EN)
    })
})

describe('isHelpPath', () => {
    it('knows the two help pages and nothing else', () => {
        expect([NO, EN].every(isHelpPath)).toBe(true)
        expect(['/help', '/contact', '/no/help/x', null].some(isHelpPath)).toBe(false)
    })
})

describe('help content', () => {
    it('has the same ids in the same order in both languages', () => {
        expect(helpIds(no)).toEqual(helpIds(en))
    })

    it('has no repeated id', () => {
        expect(new Set(helpIds(en)).size).toBe(helpIds(en).length)
    })

    it('has the same images in the same order in both languages', () => {
        expect(helpImages(no).map(withoutLanguage)).toEqual(helpImages(en).map(withoutLanguage))
    })

    it('has the same ids on both rendered pages, also inside the text', () => {
        expect(renderedIds(no)).toEqual(renderedIds(en))
    })

    it('has the four sections in the agreed order', () => {
        expect(en.sections.map(s => s.id)).toEqual(['setup', 'troubleshooting', 'common-tasks', 'buttons-and-light'])
    })

    it('has five numbered setup steps', () => {
        const setup = en.sections[0]
        expect(setup.numbered).toBe(true)
        expect(setup.groups[0].items).toHaveLength(5)
    })

    it.each([[no], [en]])('splits the problems into two groups, seven during setup and three after', content => {
        const groups = content.sections.find(section => section.id === 'troubleshooting')?.groups ?? []
        expect(groups.map(group => group.items.length)).toEqual([7, 3])
    })

    it.each([[no], [en]])('keeps every id a customer may already have been sent', content => {
        const ids = renderedIds(content)
        const earlier = [
            'setup', 'step-account', 'step-pairing-code', 'step-power', 'step-wifi', 'step-name',
            'buttons-and-light', 'buttons', 'blue-light',
            'notifications', 'sharing', 'renaming',
            'troubleshooting', 'change-wifi', 'sensor-not-showing-up', 'pairing-code-expired', 'setup-asks-for-code',
            'setup-network-missing', 'setup-page-not-opening', 'cannot-get-pairing-code', 'voltmeter-not-responding',
            'sensor-stopped-reporting', 'alerts-not-arriving', 'selling', 'new-owner',
        ]
        expect(earlier.filter(id => !ids.includes(id))).toEqual([])
    })

    it('has the agreed Norwegian titles', () => {
        expect(no.sections.map(section => section.title)).toEqual(['Sett opp en ny sensor', 'Noe virker ikke', 'Vanlige oppgaver', 'Knappene og lyset på sensoren'])
        expect(helpItems(no).map(item => item.title)).toEqual([
            'Opprett en Garge-konto', 'Hent en pairing code i appen', 'Slå på sensoren', 'Koble sensoren til Wi-Fi', 'Gi sensoren et navn i appen',
            'Sensoren blinker ikke raskt', 'Mobilen finner ikke Wi-Fi-nettverket «Garge …»', 'Sensorens oppsettside åpner seg ikke', 'Sensorens oppsettside ber bare om pairing code', 'Pairing code har gått ut', 'Appen gir deg ikke en pairing code', 'Ny sensor dukker ikke opp i appen',
            'Sensoren har sluttet å sende målinger', 'Garge Voltmeter reagerer ikke på knappene', 'Varsler fra Garge kommer ikke frem',
            'Bytte Wi-Fi-nettverk på sensoren', 'Få varsel når en sensor er frakoblet', 'Dele en sensor med en annen bruker', 'Gi en sensor nytt navn', 'Selge eller gi bort en sensor',
            'Hvor er BOOT- og Restart-knappene?', 'Slik åpner du oppsettmodus på sensoren', 'Hva betyr det blå lyset på sensoren?',
        ])
    })

    it.each([
        ['en', /hold the BOOT button/gi, /Restart button and let go/g],
        ['no', /Hold BOOT-knappen/g, /Restart-knappen og slipp/g],
    ])('states the BOOT procedure once in %s, and every other place links to it', (name, hold, release) => {
        expect(prose(name).match(hold)).toHaveLength(1)
        expect(prose(name).match(release)).toHaveLength(1)
        expect(prose(name).match(/<Go to="setup-mode">/g)?.length).toBeGreaterThanOrEqual(5)
    })

    it('uses only images that exist, and the print manual and the pages use all of them', () => {
        const used = new Set([
            ...[...helpImages(no), ...helpImages(en), '/help/device.png'].map(src => src.replace('/help/', '')),
            ...[...manual().matchAll(/\.\.\/\.\.\/public\/help\/([\w.-]+)/g)].map(match => match[1]),
        ])

        expect([...used].filter(file => !existsSync(resolve('public/help', file)))).toEqual([])
        expect(readdirSync(resolve('public/help')).filter(file => !used.has(file))).toEqual([])
    })

    it('shows the page address for help in both print headers', () => {
        expect(manual().match(/<div class="web">www\.garge\.no\/help<\/div>/g)).toHaveLength(2)
        expect(manual()).toContain('Gå til www.garge.no og')
    })

    it('uses the example network name on the pages and in the manual', () => {
        for (const text of [prose('no'), prose('en'), manual()]) {
            expect(text).toContain('Garge a1b2c3d4e5f6')
        }
    })

    it('tells the reader to hold BOOT until the light blinks fast, never for a set time', () => {
        for (const text of [prose('en'), manual()]) {
            expect(text).not.toMatch(/hold the BOOT button for 5 seconds/i)
            expect(text).toContain('Straight away, hold the BOOT button until the light blinks fast.')
        }
        for (const text of [prose('no'), manual()]) expect(text).not.toMatch(/inne i 5 sekunder/)
        expect(prose('no')).toContain('Hold BOOT-knappen inne med en gang, helt til lyset blinker raskt.')
        expect(manual()).toContain('Hold så BOOT-knappen inne med en gang, til lyset blinker raskt.')
    })

    it('tells a seller to remove every entry, on the pages and in the manual', () => {
        for (const text of [prose('en'), manual()]) expect(text).toMatch(/“Remove from account”(<\/\w+>)? on every card/)
        for (const text of [prose('no'), manual()]) expect(text).toMatch(/«Remove from account»(<\/\w+>)? på alle kortene/)
    })

    it('says what a partial removal leads to, on the pages and in the manual', () => {
        for (const text of [prose('en'), manual()]) expect(text).toContain('the new owner gets only part of the sensor and you keep access to the rest')
        for (const text of [prose('no'), manual()]) expect(text).toContain('får den nye eieren bare deler av sensoren, og du beholder tilgang til resten')
    })

    it('writes Norwegian button instructions with «trykk på», and uses the agreed words', () => {
        const text = prose('no')
        expect(text).not.toMatch(/\b[Tt]rykk <Ui>/)
        expect(text).not.toMatch(/oppføring|\blinjen?e?r?\b/i)
        expect(manual()).not.toMatch(/oppføring|\bentr(y|ies)\b/i)
        expect(prose('en')).not.toMatch(/\bentr(y|ies)\b/i)
        expect(text).not.toMatch(/Wi-Fi er nede|For å slutte å dele|For å velge|For å bytte|Bli værende|rapporterer/)
        expect(text).toContain('<DoThis>Slik løser du det</DoThis>')
        expect(text).not.toContain('<DoThis>Gjør dette</DoThis>')
    })

    it('never says tilkoblingskode, and uses the quotes of each language', () => {
        expect(prose('no')).not.toMatch(/tilkoblingskode/i)
        expect(prose('no')).not.toMatch(/[“”]/)
        expect(prose('en')).not.toMatch(/[«»]/)
    })
})

describe('helpMetadata', () => {
    it.each([[no, NO], [en, EN]])('gives each page its canonical and the same alternates', (content, path) => {
        const metadata = helpMetadata(content)
        const alternates = metadata.alternates

        expect(metadata.title).toBeUndefined()
        expect(metadata.description).toBe(content.metaDescription)
        expect(alternates?.canonical).toBe(`https://www.garge.no${path}`)
        expect(alternates?.languages).toEqual({
            nb: 'https://www.garge.no/no/help',
            en: 'https://www.garge.no/en/help',
            'x-default': 'https://www.garge.no/help',
        })
    })
})

/** The sidebar's links that a reader can see, going by what the list folds away. */
function shownSidebarLinks(container: HTMLElement) {
    return [...container.querySelectorAll('aside nav a')]
        .filter(link => !link.closest('div.hidden'))
        .map(link => link.getAttribute('href'))
}

describe('HelpPage', () => {
    it('goes from the heading straight to the content, with no intro line', () => {
        const { container } = render(<HelpPage content={en} />)
        expect(container.querySelector('h1 + p')).toBeNull()
    })

    it('shows the light as a table with the agreed columns', () => {
        render(<HelpPage content={no} />)
        const table = screen.getByRole('table')

        expect(within(table).getAllByRole('columnheader').map(header => header.textContent)).toEqual(['Lyset', 'Hva det betyr', 'Hva du gjør'])
        expect(within(table).getAllByRole('row')).toHaveLength(4)
        expect(within(table).getByRole('link', { name: 'Koble sensoren til Wi-Fi' })).toHaveAttribute('href', '#step-wifi')
        expect(within(table).getByRole('link', { name: 'Får du ikke målinger?' })).toHaveAttribute('href', '#sensor-stopped-reporting')
    })

    it('numbers the setup steps with a real list', () => {
        const { container } = render(<HelpPage content={en} />)
        expect(container.querySelectorAll('#setup > div > ol > li > article')).toHaveLength(5)
    })

    it('lets a screenshot open at full size with a plain link', () => {
        render(<HelpPage content={en} />)
        expect(screen.getByAltText('A sensor opened from My Devices, with a pencil next to its name').closest('a')).toHaveAttribute('href', '/help/app-rename.png')
    })

    it('expands only the first section until a section is in view', () => {
        const { container } = render(<HelpPage content={en} />)
        const shown = shownSidebarLinks(container)

        expect(shown).toEqual(['#setup', '#step-account', '#step-pairing-code', '#step-power', '#step-wifi', '#step-name', '#troubleshooting', '#common-tasks', '#buttons-and-light'])
    })

    it('expands the section being read and folds the others', () => {
        const { container } = render(<HelpPage content={en} />)
        scrollTo({ 'common-tasks': true, sharing: true })

        expect(shownSidebarLinks(container)).toEqual(['#setup', '#troubleshooting', '#common-tasks', '#change-wifi', '#notifications', '#sharing', '#renaming', '#selling', '#buttons-and-light'])
    })

    it('shows the group labels of the expanded section', () => {
        const { container } = render(<HelpPage content={no} />)
        scrollTo({ troubleshooting: true })
        expect(within(container.querySelector('aside nav') as HTMLElement).getByText('Problemer under oppsett')).toBeInTheDocument()
    })

    it('lets a browser with no scripting show the folded subtitles', () => {
        const { container } = render(<HelpPage content={en} />)
        const folded = (container.querySelector('aside nav a[href="#change-wifi"]') as Element).closest('.hidden')
        expect(folded?.className).toContain('[@media(scripting:none)]:block')
    })

    it('holds the list still while a mouse is over it', () => {
        const { container } = render(<HelpPage content={en} />)
        const nav = container.querySelector('aside nav') as HTMLElement
        const before = shownSidebarLinks(container)

        fireEvent.pointerEnter(nav, { pointerType: 'mouse' })
        scrollTo({ 'common-tasks': true, sharing: true })
        expect(shownSidebarLinks(container)).toEqual(before)

        fireEvent.pointerLeave(nav, { pointerType: 'mouse' })
        expect(shownSidebarLinks(container)).toContain('#sharing')
        expect(shownSidebarLinks(container)).not.toContain('#step-name')
    })

    it('marks the section while its subtitle is folded away by the held list', () => {
        const { container } = render(<HelpPage content={en} />)

        fireEvent.pointerEnter(container.querySelector('aside nav') as HTMLElement, { pointerType: 'mouse' })
        scrollTo({ 'common-tasks': true, sharing: true })

        expect(currentLinks(container)).toEqual(['#common-tasks'])
    })

    it('opens a clicked section without closing the one above it, so the clicked link stays put', () => {
        const { container } = render(<HelpPage content={en} />)
        const nav = container.querySelector('aside nav') as HTMLElement

        fireEvent.pointerEnter(nav, { pointerType: 'mouse' })
        fireEvent.click(nav.querySelector('a[href="#common-tasks"]') as Element)

        const shown = shownSidebarLinks(container)
        expect(shown).toContain('#step-name')
        expect(shown).toContain('#sharing')
    })

    it.each(['touch', 'pen'])('does not hold the list for a %s', pointerType => {
        const { container } = render(<HelpPage content={en} />)

        fireEvent.pointerEnter(container.querySelector('aside nav') as HTMLElement, { pointerType })
        scrollTo({ 'common-tasks': true, sharing: true })

        expect(shownSidebarLinks(container)).toContain('#sharing')
        expect(shownSidebarLinks(container)).not.toContain('#step-name')
    })

    it('opens every section while the keyboard is in the list, and folds them when it leaves', () => {
        const { container } = render(<HelpPage content={en} />)
        const nav = container.querySelector('aside nav') as HTMLElement
        const first = nav.querySelector('a') as HTMLElement
        vi.spyOn(first, 'matches').mockReturnValue(true)

        fireEvent.focusIn(first)
        expect(shownSidebarLinks(container)).toContain('#blue-light')
        expect(shownSidebarLinks(container)).toContain('#pairing-code-expired')

        fireEvent.focusOut(first, { relatedTarget: nav.querySelector('a[href="#step-name"]') })
        expect(shownSidebarLinks(container)).toContain('#blue-light')

        fireEvent.focusOut(first, { relatedTarget: document.body })
        expect(shownSidebarLinks(container)).not.toContain('#blue-light')
    })

    it('does not open every section when a press moves the focus, so the link stays under the cursor', () => {
        const { container } = render(<HelpPage content={en} />)
        const first = container.querySelector('aside nav a') as HTMLElement
        const matches = vi.spyOn(first, 'matches').mockReturnValue(false)

        fireEvent.focusIn(first)

        expect(matches).toHaveBeenCalledWith(':focus-visible')
        expect(shownSidebarLinks(container)).not.toContain('#blue-light')
    })

    it('tells assistive technology which sections are open', () => {
        const { container } = render(<HelpPage content={en} />)
        const state = (id: string) => container.querySelector(`aside nav a[href="#${id}"]`)?.getAttribute('aria-expanded')

        expect(state('setup')).toBe('true')
        expect(state('common-tasks')).toBe('false')
        expect(state('step-account')).toBeNull()

        scrollTo({ 'common-tasks': true })
        expect(state('setup')).toBe('false')
        expect(state('common-tasks')).toBe('true')
        expect(container.querySelector('details [aria-expanded]')).toBeNull()
    })

    it('uses a plain paragraph for the sidebar label', () => {
        const { container } = render(<HelpPage content={en} />)
        expect(container.querySelector('aside nav h2')).toBeNull()
        expect(container.querySelector('aside nav > p')).toHaveTextContent('Contents')
    })

    describe('after a jump', () => {
        let clock = 1000
        beforeEach(() => {
            clock = 1000
            vi.spyOn(Date, 'now').mockImplementation(() => clock)
        })
        afterEach(() => {
            vi.restoreAllMocks()
            window.location.hash = ''
        })

        it('marks the target of the address the page opens with', () => {
            window.location.hash = '#blue-light'
            const { container } = render(<HelpPage content={en} />)
            expect(currentLinks(container)).toEqual(['#blue-light'])
        })

        it('marks the target of a hash change and ignores the strip until the jump has settled', () => {
            const { container } = render(<HelpPage content={en} />)

            window.location.hash = '#setup-mode'
            act(() => { window.dispatchEvent(new Event('hashchange')) })
            expect(currentLinks(container)).toEqual(['#setup-mode'])

            scrollTo({ 'buttons-and-light': true })
            expect(currentLinks(container)).toEqual(['#setup-mode'])

            clock += 100
            act(() => { window.dispatchEvent(new Event('scroll')) })
            expect(currentLinks(container)).toEqual(['#setup-mode'])
        })

        it('marks the target of a clicked link, and follows the strip again once the reader scrolls', () => {
            const { container } = render(<HelpPage content={en} />)

            fireEvent.click(container.querySelector('aside nav a[href="#buttons-and-light"]') as Element)
            expect(currentLinks(container)).toEqual(['#buttons-and-light'])

            scrollTo({ 'common-tasks': true })
            expect(currentLinks(container)).toEqual(['#buttons-and-light'])

            clock += 1000
            act(() => { window.dispatchEvent(new Event('scroll')) })
            expect(currentLinks(container)).toEqual(['#common-tasks'])
        })

        it('ignores an address that is not a section', () => {
            window.location.hash = '#nothing-here'
            const { container } = render(<HelpPage content={en} />)
            expect(currentLinks(container)).toEqual([])
        })

        it('marks the last item at the end of the page', () => {
            const { container } = render(<HelpPage content={en} />)
            const scrollHeight = vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(window.innerHeight + 500)
            vi.spyOn(window, 'scrollY', 'get').mockReturnValue(500)

            act(() => { window.dispatchEvent(new Event('scroll')) })
            expect(currentLinks(container)).toEqual(['#blue-light'])

            scrollHeight.mockReturnValue(window.innerHeight + 900)
            scrollTo({ 'common-tasks': true })
            expect(currentLinks(container)).toEqual(['#common-tasks'])
        })
    })

    it('has a collapsed contents list above the sections, labelled for the language', () => {
        const { container } = render(<HelpPage content={no} />)
        const details = container.querySelector('details') as HTMLDetailsElement

        expect(details.open).toBe(false)
        expect(details.querySelector('summary')).toHaveTextContent('Innhold')
        expect(details.querySelector('a[href="#change-wifi"]')).not.toBeNull()
        expect(details.querySelector('.hidden')).toBeNull()
        expect(details.compareDocumentPosition(container.querySelector('section') as Element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('marks no link as current until a section is in view', () => {
        const { container } = render(<HelpPage content={en} />)
        expect(currentLinks(container)).toEqual([])
    })

    it('marks the section in view with aria-current in the sidebar', () => {
        const { container } = render(<HelpPage content={en} />)
        scrollTo({ setup: true })
        expect(currentLinks(container)).toEqual(['#setup'])
    })

    it('prefers the problem over the section around it, and moves on when it leaves', () => {
        const { container } = render(<HelpPage content={en} />)

        scrollTo({ troubleshooting: true, 'pairing-code-expired': true })
        expect(currentLinks(container)).toEqual(['#pairing-code-expired'])

        scrollTo({ 'pairing-code-expired': false })
        expect(currentLinks(container)).toEqual(['#troubleshooting'])
    })

    it('keeps the last section marked while nothing is in view', () => {
        const { container } = render(<HelpPage content={en} />)

        scrollTo({ 'buttons-and-light': true })
        scrollTo({ 'buttons-and-light': false })
        expect(currentLinks(container)).toEqual(['#buttons-and-light'])
    })

    it('drops the mark when the page is back above the first section', () => {
        const { container } = render(<HelpPage content={en} />)
        scrollTo({ setup: true })

        vi.spyOn(container.querySelector('#setup') as Element, 'getBoundingClientRect').mockReturnValue({ top: 300 } as DOMRect)
        scrollTo({ setup: false })

        expect(currentLinks(container)).toEqual([])
    })

    it('marks the Norwegian text with lang="nb"', () => {
        const { container } = render(<HelpPage content={no} />)
        expect(container.firstElementChild).toHaveAttribute('lang', 'nb')
    })

    it.each([[no, EN, 'English'], [en, NO, 'Norsk']])('links to the other language', (content, href, label) => {
        render(<HelpPage content={content} />)
        expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href)
    })

    it.each([[no], [en]])('offers the PDF in the sidebar and at the end of the page, with no note', content => {
        const { container } = render(<HelpPage content={content} />)
        const buttons = screen.getAllByRole('link', { name: content.download.label })

        expect(buttons).toHaveLength(2)
        expect(container.querySelector('aside')).toContainElement(buttons[0])
        expect(buttons[1].parentElement?.className).toContain('lg:hidden')
        for (const button of buttons) {
            expect(button).toHaveAttribute('href', '/garge-manual.pdf')
            expect(button.parentElement?.children).toHaveLength(1)
        }
        expect(container).not.toHaveTextContent('Inneholder ikke alt')
        expect(container).not.toHaveTextContent('Does not include everything')
    })

    it('gives every section and problem an element and a link to it', () => {
        const { container } = render(<HelpPage content={en} />)

        for (const id of helpIds(en)) {
            const target = container.querySelector(`[id="${id}"]`)
            expect(target).not.toBeNull()
            expect(target?.querySelector(`a[href="#${id}"]`)).not.toBeNull()
        }
    })

    it('states what to do with a hidden or 5 GHz network, on both pages', () => {
        expect(prose('en')).toContain('If your network is hidden, make it visible. If it is 5 GHz only, use a 2.4 GHz network.')
        expect(prose('no')).toContain('Hvis nettverket er skjult, gjør du det synlig. Hvis det bare er på 5 GHz, bruker du et nettverk på 2,4 GHz.')
    })

    it('links to the page about «Pair device» with the agreed Norwegian text', () => {
        render(<HelpPage content={no} />)

        expect(screen.getByRole('link', { name: 'Slik gjør du da.' })).toHaveAttribute('href', '#setup-asks-for-code')
        expect(screen.getByRole('link', { name: 'Les mer om siden «Pair device».' })).toHaveAttribute('href', '#setup-asks-for-code')
        expect(prose('no')).toContain('må du tillate varsler for Garge i nettleseren')
    })

    it('points every link inside the page at something that exists', () => {
        const { container } = render(<HelpPage content={no} />)
        const hrefs = [...container.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')?.slice(1))

        expect(hrefs.filter(id => !container.querySelector(`[id="${id}"]`))).toEqual([])
    })
})
