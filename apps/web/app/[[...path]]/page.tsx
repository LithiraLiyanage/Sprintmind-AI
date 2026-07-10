import { RouteRenderer } from "@/components/route-renderer";

export default async function Page({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  return <RouteRenderer path={path} />;
}

