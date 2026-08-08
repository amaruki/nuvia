import type { Invoice } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface InvoiceItemsSectionProps {
  invoice: Invoice;
}

export function InvoiceItemsSection({ invoice }: InvoiceItemsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Invoice Items</h3>
      <div className="border rounded-lg overflow-hidden">
        {/* Desktop Header: Hidden on mobile */}
        <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] gap-4 p-4 font-medium text-sm border-b bg-muted/40">
          <div>Description</div>
          <div className="text-right">Quantity</div>
          <div className="text-right">Unit Price</div>
          <div className="text-right">Total</div>
        </div>

        {invoice.items.map((item, index) => (
          <div
            key={item.id}
            className={`
              p-4 
              flex flex-col gap-2
              sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-4 
              ${index < invoice.items.length - 1 ? "border-b sm:border-b-0" : ""} 
              ${index % 2 === 0 ? "bg-muted/10" : ""}
            `}
          >
            {/* Description */}
            <div className="font-medium sm:font-normal break-words">{item.description}</div>

            {/* Stats Row for Mobile / Columns for Desktop */}
            <div className="flex justify-between items-center sm:contents text-sm">
              {/* Quantity */}
              <div className="flex flex-col sm:block sm:text-right">
                <span className="text-muted-foreground text-xs sm:hidden">Qty</span>
                <span>{item.quantity}</span>
              </div>

              {/* Unit Price */}
              <div className="flex flex-col sm:block sm:text-right">
                <span className="text-muted-foreground text-xs sm:hidden">Price</span>
                <span>{formatCurrency(item.unitPrice)}</span>
              </div>

              {/* Total */}
              <div className="flex flex-col sm:block sm:text-right font-medium">
                <span className="text-muted-foreground text-xs sm:hidden">Total</span>
                <span>{formatCurrency(item.total)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Summary Section */}
        <div className="border-t bg-muted/5">
          <div className="flex justify-between p-4 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-4">
            <div className="sm:col-span-3 text-left sm:text-right font-medium">Subtotal</div>
            <div className="text-right">{formatCurrency(invoice.subtotal)}</div>
          </div>
          <div className="flex justify-between px-4 pb-4 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-4 sm:p-4 sm:pt-0">
            <div className="sm:col-span-3 text-left sm:text-right font-medium">Tax</div>
            <div className="text-right">{formatCurrency(invoice.taxAmount)}</div>
          </div>
          <div className="flex justify-between p-4 bg-muted/20 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-4 font-bold text-lg">
            <div className="sm:col-span-3 text-left sm:text-right">Total</div>
            <div className="text-right">{formatCurrency(invoice.totalAmount)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
