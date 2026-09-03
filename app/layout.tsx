import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Toul'hygiène | Nettoyage éco-responsable à Toulouse",
  description: "Services de nettoyage professionnel éco-responsable pour entreprises, copropriétés et particuliers à Toulouse.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
