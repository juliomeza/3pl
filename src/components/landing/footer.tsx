
import Link from 'next/link';

const footerLinks = {
    Product: [
        { href: '#features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
        { href: '#', label: 'API' },
        { href: '#', label: 'Integrations' },
    ],
    Company: [
        { href: '#', label: 'About' },
        { href: '#', label: 'Blog' },
        { href: '#', label: 'Careers' },
        { href: '#', label: 'Press' },
    ],
    Resources: [
        { href: '#', label: 'Documentation' },
        { href: '#', label: 'Help Center' },
        { href: '#', label: 'Community' },
        { href: '#', label: 'Status' },
    ],
    Legal: [
        { href: '#', label: 'Privacy' },
        { href: '#', label: 'Terms' },
        { href: '#', label: 'Security' },
        { href: '#', label: 'Cookies' },
    ],
};

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
                <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                    Synapse3PL
                </Link>
                <p className="text-muted-foreground mt-2 text-sm">Stress free logistics.</p>
            </div>
            {Object.entries(footerLinks).map(([title, links]) => (
                <div key={title}>
                    <h4 className="font-headline font-semibold text-foreground mb-4">{title}</h4>
                    <ul className="space-y-2">
                        {links.map(link => (
                            <li key={link.label}>
                                <Link href={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
        <div className="mt-8 pt-8 border-t text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} Synapse3PL. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
