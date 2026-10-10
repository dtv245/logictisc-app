/** Read projection plus a dedicated pending cancellation, gated with the command surface. */
import { useParams } from "react-router-dom";
import { ResourceShowPage } from "@components";
import { PaymentCommandForm } from "@/features/payments/PaymentCommandForm";
import { PAYMENT_COMMANDS_RUNTIME_VERIFIED } from "@/features/payments/paymentCommands";
export const PaymentShow = () => { const { id } = useParams(); return <><ResourceShowPage resource="payments" />{PAYMENT_COMMANDS_RUNTIME_VERIFIED && <PaymentCommandForm action="cancel" id={id} />}</>; };
