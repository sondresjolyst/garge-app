import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkdownText from '@/components/MarkdownText';

describe('MarkdownText', () => {
    it('returns null when empty / null / undefined', () => {
        const { container: a } = render(<MarkdownText>{''}</MarkdownText>);
        expect(a.firstChild).toBeNull();

        const { container: b } = render(<MarkdownText>{null}</MarkdownText>);
        expect(b.firstChild).toBeNull();

        const { container: c } = render(<MarkdownText>{undefined}</MarkdownText>);
        expect(c.firstChild).toBeNull();
    });

    it('renders bold text', () => {
        render(<MarkdownText>{'Hello **world**'}</MarkdownText>);
        const strong = screen.getByText('world');
        expect(strong.tagName).toBe('STRONG');
    });

    it('renders italic text', () => {
        render(<MarkdownText>{'a *fast* car'}</MarkdownText>);
        const em = screen.getByText('fast');
        expect(em.tagName).toBe('EM');
    });

    it('renders unordered list', () => {
        render(<MarkdownText>{'- one\n- two\n- three'}</MarkdownText>);
        expect(screen.getByText('one').tagName).toBe('LI');
        expect(screen.getByText('two').tagName).toBe('LI');
        expect(screen.getByText('three').tagName).toBe('LI');
    });

    it('renders link with target=_blank rel=noopener noreferrer', () => {
        render(<MarkdownText>{'See [docs](https://example.com)'}</MarkdownText>);
        const a = screen.getByRole('link', { name: 'docs' }) as HTMLAnchorElement;
        expect(a.getAttribute('href')).toBe('https://example.com');
        expect(a.getAttribute('target')).toBe('_blank');
        expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('sanitizes script tag', () => {
        const { container } = render(<MarkdownText>{'safe text <script>alert(1)</script> after'}</MarkdownText>);
        expect(container.querySelector('script')).toBeNull();
    });
});
