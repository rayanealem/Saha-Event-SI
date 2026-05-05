import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saha Event — Gestion de salles des fêtes',
  description: 'Plateforme cloud de réservation et gestion de salles des fêtes en Algérie.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
