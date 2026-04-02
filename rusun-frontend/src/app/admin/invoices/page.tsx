import { redirect } from "next/navigation";

export default function InvoicesRedirectPage() {
    redirect("/admin/invoices/rent");
}
