import ReceiptShareGuard from "@/components/receipts/ReceiptShareGuard";
import ReceiptViewer from "@/components/receipts/ReceiptViewer";

export default function ReceiptsPage() {
  return (
    <ReceiptShareGuard>
      <ReceiptViewer />
    </ReceiptShareGuard>
  );
}
