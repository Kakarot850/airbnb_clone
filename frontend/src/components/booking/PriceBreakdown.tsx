import { formatPrice, plural } from "@/lib/format";

interface PriceLines {
  nightly_price: number;
  nights: number;
  subtotal?: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
}

/** "$120 x 5 nights / Cleaning fee / Airbnb service fee / Total" rows. Used on the listing, checkout and trip pages. */
export default function PriceBreakdown({ price, totalLabel = "Total before taxes" }: { price: PriceLines; totalLabel?: string }) {
  const row = "flex justify-between text-base";
  return (
    <div className="space-y-4">
      <div className={row}>
        <span className="underline">
          {formatPrice(price.nightly_price)} x {plural(price.nights, "night")}
        </span>
        <span>{formatPrice(price.subtotal ?? price.nightly_price * price.nights)}</span>
      </div>
      {price.cleaning_fee > 0 && (
        <div className={row}>
          <span className="underline">Cleaning fee</span>
          <span>{formatPrice(price.cleaning_fee)}</span>
        </div>
      )}
      <div className={row}>
        <span className="underline">Airbnb service fee</span>
        <span>{formatPrice(price.service_fee)}</span>
      </div>
      <div className={`${row} border-t border-divider pt-6 font-semibold`}>
        <span>{totalLabel}</span>
        <span>{formatPrice(price.total)}</span>
      </div>
    </div>
  );
}
