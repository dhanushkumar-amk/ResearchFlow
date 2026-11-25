import Image from 'next/image';

export default function ObservatoryArt({ className, sizes, priority = false }: {
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className={`rf-observatory ${className ?? ''}`} aria-hidden="true">
      <Image src="/research-observatory-day.webp" alt="" fill sizes={sizes} preload={priority} />
    </div>
  );
}
