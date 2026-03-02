import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GanttAnbud — AI-drivet Gantt-schema för bygganbudsbevakning',
  description:
    'Interaktivt Gantt-schema för att visualisera och bevaka byggrelaterade anbudsförfrågningar med daglig auto-uppdatering och inbyggd AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="antialiased">{children}</body>
    </html>
  );
}
