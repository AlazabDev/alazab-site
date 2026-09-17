import ReceiptShareGuard from "@/components/receipts/ReceiptShareGuard";
import ReceiptReviewExperience from "@/components/receipts/ReceiptReviewExperience";

export default function ReceiptsPage() {
  return (
    <ReceiptShareGuard>
      <ReceiptReviewExperience />
    </ReceiptShareGuard>
  );
}
