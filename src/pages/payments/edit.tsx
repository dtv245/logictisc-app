/** Pending metadata-only Payment route; financial fields are immutable. */
import { useParams } from "react-router-dom";
import { PaymentCommandForm } from "@/features/payments/PaymentCommandForm";
export const PaymentEdit = () => { const { id } = useParams(); return <PaymentCommandForm action="edit" id={id} />; };
