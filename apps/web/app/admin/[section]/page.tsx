"use client";

import { use } from "react";
import SectionView from "../../components/SectionView";

export default function AdminSectionPage({
  params,
}: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  return <SectionView area="admin" section={section} />;
}
