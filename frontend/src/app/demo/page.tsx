import { redirect } from 'next/navigation';

/** Day-10 A2-finish — `/demo` is the wallet-free entry point on the
 *  landing's primary CTA. It redirects to `/join/<seeded-demo-cid>` so a
 *  first-time visitor lands on a live community preview without
 *  connecting any wallet.
 *
 *  Anonymous post-body access depends on the Day-10 A5 backend change
 *  (preview-quota + non-member content GET allowing anonymous read of
 *  preview_eligible posts). Until A5 lands, the visitor sees community
 *  metadata + the privacy card; post bodies stay locked. The demo CTA
 *  copy on the landing acknowledges this honestly: "See it work — 90
 *  second demo" rather than "read everything for free". */
const DEMO_COMMUNITY_ID = 'demo-research';

export default function DemoEntryPage() {
  redirect(`/join/${DEMO_COMMUNITY_ID}`);
}
