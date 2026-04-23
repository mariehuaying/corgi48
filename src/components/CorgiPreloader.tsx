import { CORGI_MAP } from "@/lib/corgi-images";

const allSrcs = Object.values(CORGI_MAP);

export function CorgiPreloader() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      {allSrcs.map((src) => (
        <img key={src} src={src} alt="" width={1} height={1} />
      ))}
    </div>
  );
}
