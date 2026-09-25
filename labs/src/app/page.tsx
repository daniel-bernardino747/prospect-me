import { notFound } from 'next/navigation';

/** No index: listing artifacts would tie companies to each other and to a search. */
export default function Home() {
  notFound();
}
