"use client";

export function ProductImage({ src, alt, className = "", eager = false }: {
  src: string; alt: string; className?: string; eager?: boolean;
}) {
  return <img className={className} src={src} alt={alt}
    loading={eager ? "eager" : "lazy"} width={400} height={400}
    onError={event => {
      const target = event.currentTarget;
      if (!target.src.endsWith("/products/placeholder.svg")) target.src = "/products/placeholder.svg";
    }} />;
}
export function Shopee({

}){
  return 
}

