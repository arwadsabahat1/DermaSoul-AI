import { useCallback, useEffect, useState } from "react";
import { conditionCoverImageUrl } from "../../constants/conditionCovers";

const FALLBACK_SRC = "/covers/fallback-cover.svg";

type Props = {
  slug: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

/** Remote cover URLs may fail in locked-down browsers; use the bundled fallback on error. */
export function ConditionCoverImage({ slug, alt, className, loading = "lazy" }: Props) {
  const [src, setSrc] = useState(() => conditionCoverImageUrl(slug));

  useEffect(() => {
    setSrc(conditionCoverImageUrl(slug));
  }, [slug]);

  const onError = useCallback(() => {
    setSrc((current) => (current === FALLBACK_SRC ? current : FALLBACK_SRC));
  }, []);

  return <img src={src} alt={alt} className={className} loading={loading} decoding="async" onError={onError} />;
}
