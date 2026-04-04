import { redirect } from "next/navigation";

export default function WarningsRedirect() {
    redirect("/admin/invoices/rent");
}
