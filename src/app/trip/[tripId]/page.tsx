import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default async function LegacyTripRedirect({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  redirect(`/${routing.defaultLocale}/trip/${tripId}`);
}
