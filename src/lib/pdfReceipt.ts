import html2pdf from 'html2pdf.js';
import { BookingData, PilotPublicProfileBundle } from '../types';
import { formatCurrency } from './validation';
import { GENERATED_ASSETS } from '../data/masterSpecScript';

export async function generateAndDownloadReceipt(
  booking: BookingData,
  profile?: PilotPublicProfileBundle
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '750px';
  container.style.backgroundColor = '#FFFFFF';
  container.style.color = '#111111';
  container.style.fontFamily = 'Helvetica, Arial, sans-serif';
  container.style.padding = '32px 36px';
  container.style.boxSizing = 'border-box';

  const companyName = profile?.businessInfo.companyName || 'Swiss Paragliding Interlaken AG';
  const headquarters = profile?.businessInfo.headquarters || 'Höheweg 95, 3800 Interlaken, Switzerland';
  const vatNumber = profile?.businessInfo.uidVatNumber || 'CHE-441.982.110 MWST';
  const insurance = profile?.businessInfo.insuranceProvider || 'AXA Winterthur Aviation Switzerland';
  const coverage = profile?.businessInfo.coverageAmount || 'CHF 5,000,000';

  const totalFormatted = formatCurrency(booking.totalAmountCents, booking.currency);
  const pilotPayoutFormatted = formatCurrency(booking.pilotPayoutCents, booking.currency);
  const partnerCommFormatted = formatCurrency(booking.partnerCommissionCents, booking.currency);
  const platformFeeFormatted = formatCurrency(booking.platformFeeCents, booking.currency);

  const partnerPercent = booking.totalAmountCents > 0
    ? ((booking.partnerCommissionCents / booking.totalAmountCents) * 100).toFixed(1)
    : '0';
  const pilotPercent = booking.totalAmountCents > 0
    ? ((booking.pilotPayoutCents / booking.totalAmountCents) * 100).toFixed(1)
    : '0';
  const platformPercent = booking.totalAmountCents > 0
    ? ((booking.platformFeeCents / booking.totalAmountCents) * 100).toFixed(1)
    : '0';

  const issueDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  container.innerHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111; line-height: 1.45; font-size: 13px;">
      <!-- Header with Alpine Brand & Escrow Seal -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E62B1E; padding-bottom: 18px; margin-bottom: 20px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${GENERATED_ASSETS.logo}" alt="2paraglide logo" style="height: 32px; width: auto; object-fit: contain; border-radius: 4px; border: 1px solid #ddd;" crossorigin="anonymous" />
            <span style="background-color: #E62B1E; color: #FFFFFF; font-weight: 800; font-size: 16px; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px;">2PARAGLIDE</span>
            <span style="font-weight: 700; font-size: 14px; color: #555555; text-transform: uppercase;">Switzerland Escrow</span>
          </div>
          <div style="font-size: 11px; color: #666666; margin-top: 6px;">
            ${companyName} · ${headquarters}
          </div>
          <div style="font-size: 10px; color: #888888; font-family: monospace;">
            UID/VAT: ${vatNumber} · Commercial Tandem Flight Registry
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 800; color: #111111; letter-spacing: -0.5px;">OFFICIAL RECEIPT</div>
          <div style="font-family: monospace; font-size: 12px; font-weight: 700; color: #E62B1E; margin-top: 2px;">
            #${booking.bookingId}
          </div>
          <div style="font-size: 10px; color: #666666; margin-top: 2px;">
            Issued: ${issueDate} · Escrow Settled
          </div>
        </div>
      </div>

      <!-- Flight Operational Manifest & Passenger Block -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background-color: #F8F9FA; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px 16px;">
        <div>
          <div style="font-size: 10px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">PASSENGER & FLIGHT</div>
          <div style="font-size: 14px; font-weight: 700; color: #111111;">${booking.flyerName}</div>
          <div style="font-size: 12px; color: #333333; margin-top: 2px;">
            <strong>Launch Zone:</strong> ${booking.locationName} (${booking.countryCode})
          </div>
          <div style="font-size: 12px; color: #333333; margin-top: 2px;">
            <strong>Scheduled Flight:</strong> ${booking.flightDate} at ${booking.flightTime}
          </div>
          <div style="font-size: 11px; color: #666666; margin-top: 2px;">
            Package: ${booking.mediaIncluded ? 'Tandem Flight + 4K GoPro Media Reel' : 'Standard Tandem Flight Only'}
          </div>
        </div>

        <div>
          <div style="font-size: 10px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">PILOT & COMPLIANCE</div>
          <div style="font-size: 14px; font-weight: 700; color: #111111;">${booking.pilotName}</div>
          <div style="font-size: 12px; color: #333333; margin-top: 2px;">
            <strong>BAZL / SHV Pilot:</strong> Commercial Tandem License Verified
          </div>
          <div style="font-size: 12px; color: #333333; margin-top: 2px;">
            <strong>Passenger Insurance:</strong> ${insurance} (${coverage})
          </div>
          <div style="font-size: 11px; color: #10B981; font-weight: 600; margin-top: 2px;">
            Status: ${booking.status.toUpperCase()} · Completed & Landed
          </div>
        </div>
      </div>

      <!-- Partner Attribution & Referral Banner -->
      <div style="margin-bottom: 20px; padding: 12px 14px; background-color: #FEF2F2; border-left: 4px solid #E62B1E; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 10px; font-weight: 700; color: #E62B1E; text-transform: uppercase; letter-spacing: 0.5px;">PARTNER ATTRIBUTION & REFERRAL</div>
            <div style="font-size: 13px; font-weight: 700; color: #111111; margin-top: 2px;">
              Partner Attribution Code: <span style="font-family: monospace; color: #E62B1E;">${booking.partnerCode}</span>
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #555555;">
            Attribution Engine: <strong>2paraglide QR Referral Ledger</strong>
          </div>
        </div>
      </div>

      <!-- Payment & Escrow Split Ledger Table -->
      <div style="margin-bottom: 22px;">
        <div style="font-size: 11px; font-weight: 700; color: #444444; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          PAYMENT SPLIT & ESCROW SETTLEMENT SUMMARY
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #111111; color: #FFFFFF; font-size: 11px; text-transform: uppercase;">
              <th style="text-align: left; padding: 8px 10px; border-radius: 4px 0 0 0;">Escrow Split Component</th>
              <th style="text-align: center; padding: 8px 10px;">Recipient / Destination</th>
              <th style="text-align: center; padding: 8px 10px;">Share (%)</th>
              <th style="text-align: right; padding: 8px 10px; border-radius: 0 4px 0 0;">Settled Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px; font-weight: 600; color: #111111;">
                Pilot Escrow Allocation
                <div style="font-size: 10px; color: #666666; font-weight: normal;">Base tandem flight payout & equipment maintenance</div>
              </td>
              <td style="padding: 10px; text-align: center; color: #444444;">${booking.pilotName}</td>
              <td style="padding: 10px; text-align: center; font-family: monospace; color: #666666;">${pilotPercent}%</td>
              <td style="padding: 10px; text-align: right; font-weight: 700; font-family: monospace; color: #111111;">${pilotPayoutFormatted}</td>
            </tr>

            <tr style="border-bottom: 1px solid #E5E7EB; background-color: #FAFAFA;">
              <td style="padding: 10px; font-weight: 600; color: #111111;">
                QR Partner Attribution Commission
                <div style="font-size: 10px; color: #666666; font-weight: normal;">Hotel / Cafe / Concierge verified QR referral bonus</div>
              </td>
              <td style="padding: 10px; text-align: center; color: #444444; font-family: monospace;">${booking.partnerCode}</td>
              <td style="padding: 10px; text-align: center; font-family: monospace; color: #666666;">${partnerPercent}%</td>
              <td style="padding: 10px; text-align: right; font-weight: 700; font-family: monospace; color: #111111;">${partnerCommFormatted}</td>
            </tr>

            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px; font-weight: 600; color: #111111;">
                Platform & Aviation Insurance Escrow Fee
                <div style="font-size: 10px; color: #666666; font-weight: normal;">2paraglide escrow protection, TWINT gateway & insurance</div>
              </td>
              <td style="padding: 10px; text-align: center; color: #444444;">2paraglide Platform AG</td>
              <td style="padding: 10px; text-align: center; font-family: monospace; color: #666666;">${platformPercent}%</td>
              <td style="padding: 10px; text-align: right; font-weight: 700; font-family: monospace; color: #E62B1E;">${platformFeeFormatted}</td>
            </tr>

            <tr style="background-color: #F3F4F6; font-weight: 700;">
              <td colspan="3" style="padding: 12px 10px; text-align: right; font-size: 13px; color: #111111; text-transform: uppercase;">
                Total Escrow Charge (${booking.currency} Total Paid):
              </td>
              <td style="padding: 12px 10px; text-align: right; font-size: 15px; font-family: monospace; color: #E62B1E;">
                ${totalFormatted}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Payment Method & Settlement Metadata Details -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 11px; color: #555555; border-top: 1px solid #E5E7EB; padding-top: 14px; margin-bottom: 20px;">
        <div>
          <div><strong>Payment Method:</strong> ${booking.paymentMethod} (Instant Settlement)</div>
          <div style="margin-top: 3px;"><strong>Legal Waiver:</strong> ${booking.waiverSigned ? 'Signed & Verified in Flight Manifest' : 'Pending'}</div>
          <div style="margin-top: 3px;"><strong>Escrow Release:</strong> Post-Flight Inspection Confirmed</div>
        </div>
        <div style="text-align: right;">
          <div><strong>Attribution Engine:</strong> Deterministic 30-Day Token</div>
          <div style="margin-top: 3px;"><strong>VAT Status:</strong> Swiss MWST (8.1%) Included</div>
          <div style="margin-top: 3px;"><strong>Authority:</strong> Swiss BAZL / FOCA Standard Compliant</div>
        </div>
      </div>

      <!-- Official Footer & Legal Disclaimer -->
      <div style="border-top: 2px solid #111111; padding-top: 14px; text-align: center; font-size: 10px; color: #888888;">
        <div style="font-weight: 700; color: #111111; text-transform: uppercase;">
          2paraglide Switzerland · High-Alpine Tandem Booking & Escrow Platform
        </div>
        <div style="margin-top: 3px;">
          This official receipt certifies that payment was received into platform escrow and fully distributed according to the multi-party contract upon tandem flight completion. Keep this document for insurance and tax deduction purposes.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `2paraglide-Receipt-${booking.bookingId}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const
      }
    };

    await html2pdf().from(container).set(opt).save();
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
