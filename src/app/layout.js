import '@/styles.css';
import { Providers } from './providers';

export const metadata = {
  title: 'NikkiBee — Where Style Meets Your Story',
  description: 'A curated Nigerian fashion collection for every version of your day.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
