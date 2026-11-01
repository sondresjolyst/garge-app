import { describe, it, expect, vi } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { GET } from '@/app/help/route'
import { helpPathFor, isHelpPath } from '@/app/help/language'
import { helpIds, helpImages, helpMetadata } from '@/app/help/helpContent'
import HelpPage from '@/app/help/HelpPage'
import { content as no } from '@/app/help/content/no'
import { content as en } from '@/app/help/content/en'

vi.mock('next/image', () => ({
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

const NO = '/no/help'
const EN = '/en/help'

/** The two setup page screenshots show a network name in each language. */
const withoutLanguage = (src: string) => src.replace(/-(no|en)\.png$/, '.png')

/** Every text in a content file, without the code around it. */
const prose = (name: string) => readFileSync(resolve(`src/app/help/content/${name}.tsx`), 'utf8')

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

    it('has the six sections in the agreed order', () => {
        expect(en.sections.map(s => s.id)).toEqual(['setup', 'buttons-and-light', 'sensors', 'using-the-app', 'troubleshooting', 'selling'])
    })

    it('has five numbered setup steps', () => {
        const setup = en.sections[0]
        expect(setup.numbered).toBe(true)
        expect(setup.items).toHaveLength(5)
    })

    it('uses only images that exist, and the print manual and the pages use all of them', () => {
        const manual = readFileSync(resolve('docs/manual/garge-manual.html'), 'utf8')
        const used = new Set([
            ...[...helpImages(no), ...helpImages(en), '/help/device.png'].map(src => src.replace('/help/', '')),
            ...[...manual.matchAll(/\.\.\/\.\.\/public\/help\/([\w.-]+)/g)].map(match => match[1]),
        ])

        expect([...used].filter(file => !existsSync(resolve('public/help', file)))).toEqual([])
        expect(readdirSync(resolve('public/help')).filter(file => !used.has(file))).toEqual([])
    })

    it('keeps the real example network out of the repo text', () => {
        const realNetwork = ['b43a', '4536a880'].join('')
        for (const text of [prose('no'), prose('en'), readFileSync(resolve('docs/manual/garge-manual.html'), 'utf8')]) {
            expect(text).not.toContain(realNetwork)
            expect(text).toContain('Garge a1b2c3d4e5f6')
        }
    })

    it('never says tilkoblingskode, and uses the quotes of each language', () => {
        expect(prose('no')).not.toMatch(/tilkoblingskode/i)
        expect(prose('no')).not.toMatch(/[“”]/)
        expect(prose('en')).not.toMatch(/[«»]/)
    })
})

describe('helpMetadata', () => {
    it.each([[no, NO], [en, EN]])('gives each page its canonical and the same alternates', (content, path) => {
        const alternates = helpMetadata(content).alternates

        expect(alternates?.canonical).toBe(`https://www.garge.no${path}`)
        expect(alternates?.languages).toEqual({
            nb: 'https://www.garge.no/no/help',
            en: 'https://www.garge.no/en/help',
            'x-default': 'https://www.garge.no/help',
        })
    })
})

describe('HelpPage', () => {
    it('marks the Norwegian text with lang="nb"', () => {
        const { container } = render(<HelpPage content={no} />)
        expect(container.firstElementChild).toHaveAttribute('lang', 'nb')
    })

    it.each([[no, EN, 'English'], [en, NO, 'Norsk']])('links to the other language', (content, href, label) => {
        render(<HelpPage content={content} />)
        expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href)
    })

    it.each([[no], [en]])('offers the PDF with the note next to it', content => {
        render(<HelpPage content={content} />)
        const button = screen.getByRole('link', { name: content.download.label })

        expect(button).toHaveAttribute('href', '/garge-manual.pdf')
        expect(within(button.parentElement as HTMLElement).getByText(content.download.note)).toBeInTheDocument()
    })

    it('gives every section and problem an element and a visible link to it', () => {
        const { container } = render(<HelpPage content={en} />)

        for (const id of helpIds(en)) {
            const target = container.querySelector(`[id="${id}"]`)
            expect(target).not.toBeNull()
            expect(target?.querySelector(`a[href="#${id}"]`)).not.toBeNull()
        }
    })

    it('points every link inside the page at something that exists', () => {
        const { container } = render(<HelpPage content={no} />)
        const hrefs = [...container.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')?.slice(1))

        expect(hrefs.filter(id => !container.querySelector(`[id="${id}"]`))).toEqual([])
    })
})
