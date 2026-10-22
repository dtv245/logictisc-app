import { Button, Input } from "antd";
import { Check, Copy, Link2, Plus } from "lucide-react";
import { useRef, useState } from "react";

import { DEFAULT_TRACKING_PREFERENCES } from "@/api/tms-flow/tmsFlow.api";
import { ResourceModalFrame } from "@/components/resources/ResourceModalFrame";
import type {
  Shipment,
  TrackingLink,
  TrackingPreferences,
  TrackingRecipient,
} from "@/types/tms-flow/tmsFlow.types";
import { addMinutes, formatDate, formatTime } from "@/utils/tms-flow/format";

export interface ShareTrackingPayload {
  recipients: TrackingRecipient[];
  preferences: TrackingPreferences;
}

export interface ShareTrackingModalProps {
  open: boolean;
  shipment: Shipment;
  existingLink?: TrackingLink;
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: ShareTrackingPayload) => void | Promise<void>;
}

const DEFAULT_RECIPIENTS: TrackingRecipient[] = [
  { id: "ethan", name: "Ethan Cole", email: "ethan.cole@acmeretail.example" },
  { id: "zoe", name: "Zoe Turner", phone: "+1 (916) 555-0148" },
];

export function ShareTrackingModal({
  open,
  shipment,
  existingLink,
  pending = false,
  error,
  onClose,
  onSubmit,
}: ShareTrackingModalProps) {
  const [preferences, setPreferences] = useState<TrackingPreferences>(
    existingLink?.preferences ?? DEFAULT_TRACKING_PREFERENCES,
  );
  const [recipients, setRecipients] = useState<TrackingRecipient[]>(
    existingLink?.recipients ?? DEFAULT_RECIPIENTS,
  );
  const [selected, setSelected] = useState<string[]>(
    (existingLink?.recipients ?? DEFAULT_RECIPIENTS).map((recipient) => recipient.id),
  );
  const [newRecipient, setNewRecipient] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number>();

  const token = existingLink?.token ?? `demo-${shipment.id}-link`;
  const expiresAt = existingLink?.expiresAt ?? addMinutes(shipment.delivery.end, 24 * 60);
  const linkValue = `${window.location.origin}/tms/tracking/${token}`;

  const togglePreference = (key: keyof TrackingPreferences) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const toggleRecipient = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const addRecipient = () => {
    const value = newRecipient.trim();
    if (!value) return;
    const isEmail = value.includes("@");
    const recipient: TrackingRecipient = {
      id: `custom-${recipients.length + 1}`,
      name: isEmail ? value.split("@")[0] : value,
      ...(isEmail ? { email: value } : { phone: value }),
    };
    setRecipients((current) => [...current, recipient]);
    setSelected((current) => [...current, recipient.id]);
    setNewRecipient("");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkValue);
    } catch {
      // Clipboard permission can be denied in the demo; the field is selectable as a fallback.
    }
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2_000);
  };

  const footer = (
    <div className="tms-modal-footer__end">
      <Button disabled={pending} onClick={onClose}>
        Cancel
      </Button>
      <Button
        data-testid="tracking-send"
        disabled={selected.length === 0}
        loading={pending}
        onClick={() =>
          void onSubmit({
            recipients: recipients.filter((recipient) => selected.includes(recipient.id)),
            preferences,
          })
        }
        type="primary"
      >
        Send tracking link
      </Button>
    </div>
  );

  return (
    <ResourceModalFrame
      cancelText="Cancel"
      footer={footer}
      okText="Send tracking link"
      onCancel={onClose}
      open={open}
      subtitle={`${shipment.id} · ${shipment.customer} · customer-safe view only`}
      title="Share live tracking"
      width={720}
    >
      <div className="tms-share">
        <label className="tms-field">
          <span>Tracking link (demo token)</span>
          <span className="tms-share__link">
            <Input readOnly value={linkValue} />
            <Button
              data-testid="tracking-copy-link"
              icon={copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              onClick={() => void copyLink()}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </span>
        </label>

        <p className="tms-share__expiry" data-testid="tracking-link-expiry">
          <Link2 size={14} aria-hidden="true" />
          Link expires {formatDate(expiresAt)} at {formatTime(expiresAt)} · 24 hours after delivery
        </p>

        <fieldset className="tms-share__group">
          <legend>Send to</legend>
          {recipients.map((recipient) => (
            <label className="tms-check" data-testid={`tracking-recipient-${recipient.id}`} key={recipient.id}>
              <input
                checked={selected.includes(recipient.id)}
                onChange={() => toggleRecipient(recipient.id)}
                type="checkbox"
              />
              <span>
                <strong>{recipient.name}</strong>
                <small>{recipient.email ?? recipient.phone}</small>
              </span>
            </label>
          ))}
          <div className="tms-share__add">
            <Input
              onChange={(event) => setNewRecipient(event.target.value)}
              onPressEnter={addRecipient}
              placeholder="Add by email or phone"
              value={newRecipient}
            />
            <Button icon={<Plus size={15} aria-hidden="true" />} onClick={addRecipient}>
              Add
            </Button>
          </div>
        </fieldset>

        <fieldset className="tms-share__group">
          <legend>What the customer can see</legend>
          <label className="tms-check">
            <input
              checked={preferences.liveMap}
              onChange={() => togglePreference("liveMap")}
              type="checkbox"
            />
            <span>
              <strong>Live map</strong>
              <small>Vehicle position and route progress</small>
            </span>
          </label>
          <label className="tms-check">
            <input
              checked={preferences.eta}
              onChange={() => togglePreference("eta")}
              type="checkbox"
            />
            <span>
              <strong>ETA</strong>
              <small>Current estimate and delivery window</small>
            </span>
          </label>
          <label className="tms-check">
            <input
              checked={preferences.reefer}
              onChange={() => togglePreference("reefer")}
              type="checkbox"
            />
            <span>
              <strong>Reefer temperature</strong>
              <small>Only for temperature-controlled shipments</small>
            </span>
          </label>
          <label className="tms-check" data-testid="tracking-show-driver-contact">
            <input
              checked={preferences.driverName}
              onChange={() => {
                togglePreference("driverName");
                togglePreference("driverPhone");
              }}
              type="checkbox"
            />
            <span>
              <strong>Driver name and phone</strong>
              <small>Off by default. Never shown unless the operator opts in.</small>
            </span>
          </label>
        </fieldset>

        <p className="tms-share__privacy">
          The customer link never exposes rates, other loads, or internal notes. Nothing is sent until you press
          Send.
        </p>

        {error ? (
          <p className="tms-share__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </ResourceModalFrame>
  );
}
