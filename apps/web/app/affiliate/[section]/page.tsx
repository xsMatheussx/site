"use client";

import { use } from "react";
import SectionView from "../../components/SectionView";

export default function AffiliateSectionPage({
  params,
}: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  return <SectionView area="affiliate" section={section} />;
}
