import { getGarminAuth } from "@/actions/garmin";
import { Header } from "./header";

export async function HeaderWrapper() {
  const auth = await getGarminAuth();

  return <Header isAuthenticated={auth.isAuthenticated} />;
}
