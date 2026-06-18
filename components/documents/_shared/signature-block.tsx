import type { ResolvedDocStampSlot } from '@/components/documents/types/template-schema'
import { buildSignatureQrPayload } from '@/lib/documents/signature-qr-payload'
import { SignatureQr } from '@/components/documents/_shared/signature-qr'

type SignatureCellProps = {
  slot: ResolvedDocStampSlot
  templateId: string
  kota: string
  subject?: string
  kotaLogo: string | null
  approved: boolean
}

export function SignatureCell({
  slot,
  templateId,
  kota,
  subject,
  kotaLogo,
  approved,
}: SignatureCellProps) {
  return (
    <td data-stamp-id={slot.id}>
      <SignatureContent
        slot={slot}
        templateId={templateId}
        kota={kota}
        subject={subject}
        kotaLogo={kotaLogo}
        approved={approved}
      />
    </td>
  )
}

function SignatureContent({
  slot,
  templateId,
  kota,
  subject,
  kotaLogo,
  approved,
}: SignatureCellProps) {
  return (
    <>
      {approved ? (
        <SignatureQr
          data={buildSignatureQrPayload(templateId, kota, slot.id, subject)}
          logoSrc={kotaLogo}
          size={slot.qrSize}
        />
      ) : (
        <div
          className="doc-sign-qr-placeholder"
          style={{ width: slot.qrSize, height: slot.qrSize }}
          aria-hidden
        />
      )}
      <div className="doc-sign-name">{slot.signerName}</div>
    </>
  )
}

type SignatureBlockProps = {
  slots: ResolvedDocStampSlot[]
  templateId: string
  kota: string
  subject?: string
  kotaLogo: string | null
  approved: Record<string, boolean>
  mengetahuiLabel?: string
  columns?: 2 | 3
}

export function SignatureBlock({
  slots,
  templateId,
  kota,
  subject,
  kotaLogo,
  approved,
  mengetahuiLabel = 'Mengetahui,',
  columns = 2,
}: SignatureBlockProps) {
  const colWidth = columns === 3 ? '33.33%' : '50%'

  return (
    <table className="doc-signatures">
      <tbody>
        <tr>
          <td className="doc-sign-mengetahui" colSpan={columns}>
            {mengetahuiLabel}
          </td>
        </tr>
        <tr>
          {slots.map((slot) => (
            <td key={slot.id} className="doc-sign-role" style={{ width: colWidth }}>
              {slot.label}
            </td>
          ))}
        </tr>
        <tr>
          {slots.map((slot) => (
            <SignatureCell
              key={slot.id}
              slot={slot}
              templateId={templateId}
              kota={kota}
              subject={subject}
              kotaLogo={kotaLogo}
              approved={Boolean(approved[slot.id])}
            />
          ))}
        </tr>
      </tbody>
    </table>
  )
}

type SlotPickerProps = {
  templateId: string
  kota: string
  acara?: string
  kotaLogo: string | null
  approved: Record<string, boolean>
  stampSlots: ResolvedDocStampSlot[]
  slotIds: string[]
  labels?: string[]
  mengetahuiLabel?: string
}

function pickSlots(
  stampSlots: ResolvedDocStampSlot[],
  slotIds: string[],
  labels?: string[],
): ResolvedDocStampSlot[] {
  return slotIds
    .map((id, i) => {
      const slot = stampSlots.find((s) => s.id === id)
      if (!slot) return null
      if (labels?.[i]) return { ...slot, label: labels[i] }
      return slot
    })
    .filter((s): s is ResolvedDocStampSlot => s != null)
}

export function TwoColSignatures({
  templateId,
  kota,
  acara,
  kotaLogo,
  approved,
  stampSlots,
  slotIds,
  labels,
  mengetahuiLabel,
}: SlotPickerProps) {
  return (
    <SignatureBlock
      slots={pickSlots(stampSlots, slotIds, labels)}
      templateId={templateId}
      kota={kota}
      subject={acara}
      kotaLogo={kotaLogo}
      approved={approved}
      columns={2}
      mengetahuiLabel={mengetahuiLabel}
    />
  )
}

export function ThreeColSignatures(props: SlotPickerProps) {
  return (
    <SignatureBlock
      slots={pickSlots(props.stampSlots, props.slotIds, props.labels)}
      templateId={props.templateId}
      kota={props.kota}
      subject={props.acara}
      kotaLogo={props.kotaLogo}
      approved={props.approved}
      columns={3}
      mengetahuiLabel={props.mengetahuiLabel}
    />
  )
}

/** 2 tanda tangan atas + 1 tengah bawah (Korwil) */
export function TwoTierApprovalSignatures({
  templateId,
  kota,
  acara,
  kotaLogo,
  approved,
  stampSlots,
  hormatLabel = 'Hormat Kami,',
  hormatAlign = 'left',
  approvalLabel = 'Telah Menyetujui,',
  ketuaRole = 'KETUA PANITIA ACARA',
  picRole,
  korwilRole = 'KORWIL PPHTGD',
}: Omit<SlotPickerProps, 'slotIds' | 'labels' | 'mengetahuiLabel'> & {
  hormatLabel?: string
  hormatAlign?: 'left' | 'right'
  approvalLabel?: string
  ketuaRole?: string
  picRole?: string
  korwilRole?: string
}) {
  const ketua = stampSlots.find((s) => s.id === 'ketuaPanitia')
  const pic = stampSlots.find((s) => s.id === 'pic')
  const korwil = stampSlots.find((s) => s.id === 'korwil')
  if (!ketua || !pic || !korwil) return null

  const kotaUpper = kota.trim().toUpperCase()
  const picRoleLabel = picRole ?? `LEADER/CPIC LEVELUP ${kotaUpper}`
  const hormatClass =
    hormatAlign === 'right'
      ? 'doc-sign-hormat doc-sign-hormat-right'
      : 'doc-sign-hormat'

  return (
    <table className="doc-signatures doc-signatures-event">
      <tbody>
        <tr>
          <td colSpan={2} className={hormatClass}>
            {hormatLabel}
          </td>
        </tr>
        <tr>
          <td className="doc-sign-role">{ketuaRole}</td>
          <td className="doc-sign-role">{picRoleLabel}</td>
        </tr>
        <tr>
          <SignatureCell
            slot={ketua}
            templateId={templateId}
            kota={kota}
            subject={acara}
            kotaLogo={kotaLogo}
            approved={Boolean(approved.ketuaPanitia)}
          />
          <SignatureCell
            slot={pic}
            templateId={templateId}
            kota={kota}
            subject={acara}
            kotaLogo={kotaLogo}
            approved={Boolean(approved.pic)}
          />
        </tr>
        <tr>
          <td colSpan={2} className="doc-sign-mengetahui doc-sign-spacer-top">
            {approvalLabel}
          </td>
        </tr>
        <tr>
          <td colSpan={2} className="doc-sign-role">
            {korwilRole}
          </td>
        </tr>
        <tr>
          <td colSpan={2} className="doc-sign-korwil" data-stamp-id={korwil.id}>
            <SignatureContent
              slot={korwil}
              templateId={templateId}
              kota={kota}
              subject={acara}
              kotaLogo={kotaLogo}
              approved={Boolean(approved.korwil)}
            />
          </td>
        </tr>
      </tbody>
    </table>
  )
}

/** SPH Event: 2 tanda tangan atas (Ketua Panitia + PIC), 1 tengah bawah (Korwil) */
export function EventApprovalSignatures(
  props: Omit<SlotPickerProps, 'slotIds' | 'labels' | 'mengetahuiLabel'>,
) {
  return <TwoTierApprovalSignatures {...props} />
}

export function SingleSignature({
  templateId,
  kota,
  acara,
  kotaLogo,
  approved,
  stampSlots,
  slotId,
  label,
  mengetahuiLabel = 'Hormat kami,',
}: Omit<SlotPickerProps, 'slotIds' | 'labels'> & {
  slotId: string
  label?: string
}) {
  const slots = pickSlots(stampSlots, [slotId], label ? [label] : undefined)
  if (!slots[0]) return null
  return (
    <table className="doc-signatures doc-signatures-single">
      <tbody>
        <tr>
          <td className="doc-sign-mengetahui">{mengetahuiLabel}</td>
        </tr>
        <tr>
          <td className="doc-sign-role">{slots[0].label}</td>
        </tr>
        <tr>
          <SignatureCell
            slot={slots[0]}
            templateId={templateId}
            kota={kota}
            subject={acara}
            kotaLogo={kotaLogo}
            approved={Boolean(approved[slotId])}
          />
        </tr>
      </tbody>
    </table>
  )
}

/** @deprecated use SingleSignature */
export const SingleSignatureBlock = SingleSignature
