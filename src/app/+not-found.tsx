import { Redirect } from 'expo-router';

/**
 * Any path the router doesn't know goes to the start. On web that covers a
 * host serving the app from a subpath or an index.html URL.
 */
export default function NotFoundScreen() {
  return <Redirect href="/" />;
}
