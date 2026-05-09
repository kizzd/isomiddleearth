import IsoCanvas from "@/components/iso-canvas";
import AssetPicker from "@/components/asset-picker";
import Toolbar from "@/components/toolbar";
import CollectionLoader from "@/components/collection-loader";
import type { CollectionLoaderSnapshot } from "@/components/collection-loader";
import { getCollectionMapById } from "@/lib/collections";
import GithubStarModal from "@/components/github-star-modal";
import GameRoot from "@/components/game-root";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ collection?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const rawCollectionId = params?.collection;
  const collectionId = Array.isArray(rawCollectionId)
    ? rawCollectionId[0]
    : rawCollectionId;

  let initialCollection: CollectionLoaderSnapshot | null = null;
  if (collectionId) {
    const collection = await getCollectionMapById(collectionId);
    if (collection) {
      initialCollection = {
        id: collection.id,
        map: collection.map,
        gridSize: collection.gridSize,
        location: collection.location,
      };
    }
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <CollectionLoader snapshot={initialCollection} />
      <GithubStarModal />
      <Toolbar />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <IsoCanvas />
        <GameRoot />
      </div>
      <AssetPicker />
    </main>
  );
}
