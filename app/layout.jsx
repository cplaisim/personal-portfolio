import './globals.css';

export const metadata = {
  title: 'Charles Plaisimond | Knowledge Graph',
  description: 'An interactive knowledge graph of research, work, places, and skills.',
};

export default function RootLayout({ children }) {
  // data-theme is set to dark here so the server-rendered HTML matches the
  // client's initial state; graph-experience swaps it after reading storage.
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
