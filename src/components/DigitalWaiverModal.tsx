import React, { useRef, useState, useEffect } from 'react';
import { BookingData, DigitalWaiverData } from '../types';
import {
  X,
  FileCheck2,
  AlertTriangle,
  ShieldCheck,
  PenTool,
  Type,
  RotateCcw,
  CheckCircle2,
  Lock,
  Printer,
  Download
} from 'lucide-react';

interface DigitalWaiverModalProps {
  booking: BookingData;
  existingWaiver?: DigitalWaiverData | null;
  onClose: () => void;
  onSubmitWaiver: (waiver: DigitalWaiverData) => Promise<void>;
  insuranceProvider?: string;
  coverageAmount?: string;
}

export const DigitalWaiverModal: React.FC<DigitalWaiverModalProps> = ({
  booking,
  existingWaiver,
  onClose,
  onSubmitWaiver,
  insuranceProvider = 'AXA Winterthur Aviation Switzerland',
  coverageAmount = 'CHF 5,000,000'
}) => {
  const isAlreadySigned = existingWaiver?.status === 'signed' || booking.waiverSigned;

  // Form States
  const [flyerName, setFlyerName] = useState(
    existingWaiver?.flyerName || booking.flyerName || ''
  );
  const [dateOfBirth, setDateOfBirth] = useState(
    existingWaiver?.dateOfBirth || '1996-05-18'
  );
  const [emergencyContactName, setEmergencyContactName] = useState(
    existingWaiver?.emergencyContactName || 'Marcus Lindqvist'
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    existingWaiver?.emergencyContactPhone || '+41 79 382 91 04'
  );

  // Checkbox Confirmations
  const [medicalDeclaration, setMedicalDeclaration] = useState(
    Boolean(existingWaiver?.medicalDeclarationConfirmed || isAlreadySigned)
  );
  const [riskAcknowledgment, setRiskAcknowledgment] = useState(
    Boolean(existingWaiver?.riskAcknowledgmentConfirmed || isAlreadySigned)
  );
  const [liabilityInsurance, setLiabilityInsurance] = useState(
    Boolean(existingWaiver?.thirdPartyLiabilityConfirmed || isAlreadySigned)
  );

  // Signature Method & Data
  const [signatureMode, setSignatureMode] = useState<'draw' | 'typed'>(
    existingWaiver?.signatureType || 'draw'
  );
  const [typedSignature, setTypedSignature] = useState(
    existingWaiver?.signatureType === 'typed' ? existingWaiver.signatureData : flyerName
  );
  const [drawnSignatureData, setDrawnSignatureData] = useState<string>(
    existingWaiver?.signatureType === 'draw' ? existingWaiver.signatureData : ''
  );
  const [hasDrawn, setHasDrawn] = useState<boolean>(
    Boolean(existingWaiver?.signatureType === 'draw' && existingWaiver.signatureData)
  );

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Canvas
  useEffect(() => {
    if (signatureMode === 'draw' && canvasRef.current && !isAlreadySigned) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signatureMode, isAlreadySigned]);

  // Drawing Handlers
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (isAlreadySigned) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || isAlreadySigned) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || isAlreadySigned) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setDrawnSignatureData(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setDrawnSignatureData('');
      setHasDrawn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!flyerName.trim()) {
      setErrorMessage('Please enter the passenger legal full name.');
      return;
    }
    if (!dateOfBirth) {
      setErrorMessage('Please provide the passenger date of birth.');
      return;
    }
    if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      setErrorMessage('Please provide emergency contact details.');
      return;
    }
    if (!medicalDeclaration || !riskAcknowledgment || !liabilityInsurance) {
      setErrorMessage('All three statutory legal declarations must be acknowledged.');
      return;
    }

    let finalSignature = '';
    if (signatureMode === 'draw') {
      if (!hasDrawn && !drawnSignatureData) {
        setErrorMessage('Please draw your digital signature on the pad provided.');
        return;
      }
      finalSignature = drawnSignatureData;
    } else {
      if (!typedSignature.trim()) {
        setErrorMessage('Please type your legal full name for electronic signature.');
        return;
      }
      finalSignature = typedSignature.trim();
    }

    const waiverId = existingWaiver?.waiverId || `waiver_${booking.bookingId}`;
    const now = new Date();
    const signedAt = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)} CET`;

    const waiverData: DigitalWaiverData = {
      waiverId,
      bookingId: booking.bookingId,
      flyerId: booking.flyerId,
      flyerName: flyerName.trim(),
      pilotId: booking.pilotId,
      pilotName: booking.pilotName,
      locationName: booking.locationName,
      flightDate: booking.flightDate,
      dateOfBirth,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      medicalDeclarationConfirmed: true,
      riskAcknowledgmentConfirmed: true,
      thirdPartyLiabilityConfirmed: true,
      signatureType: signatureMode,
      signatureData: finalSignature,
      status: 'signed',
      signedAt
    };

    setIsSubmitting(true);
    try {
      await onSubmitWaiver(waiverData);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to record digital waiver. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-[#181818] border border-[#8A8A8A]/35 rounded-2xl overflow-hidden shadow-2xl my-auto">
        {/* Modal Top Bar */}
        <div className="bg-[#111111] border-b border-[#8A8A8A]/25 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E62B1E]/15 border border-[#E62B1E]/40 rounded-lg text-[#E62B1E]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#E62B1E] font-semibold">
                SWISS COMMERCIAL TANDEM PARAGLIDING · BAZL / FOCA &amp; SHV COMPLIANT
              </div>
              <h2 className="text-lg font-bold text-[#FFFFFF]">
                Passenger Digital Legal Waiver &amp; Liability Release
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#181818] rounded-lg transition-colors cursor-pointer"
            aria-label="Close waiver modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Flight & Passenger Operational Context Strip */}
        <div className="bg-[#141414] border-b border-[#8A8A8A]/20 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <span className="text-[#8A8A8A] block text-[10px]">BOOKING REF</span>
            <span className="text-[#E62B1E] font-bold">#{booking.bookingId}</span>
          </div>
          <div>
            <span className="text-[#8A8A8A] block text-[10px]">SCHEDULED FLIGHT</span>
            <span className="text-[#FFFFFF]">{booking.flightDate} @ {booking.flightTime}</span>
          </div>
          <div>
            <span className="text-[#8A8A8A] block text-[10px]">TANDEM PILOT</span>
            <span className="text-[#FFFFFF]">{booking.pilotName}</span>
          </div>
          <div>
            <span className="text-[#8A8A8A] block text-[10px]">LAUNCH ZONE</span>
            <span className="text-[#FFFFFF] truncate block">{booking.locationName}</span>
          </div>
        </div>

        {/* Scrollable Legal Body & Form */}
        <div className="max-h-[72vh] overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Status Alert if Already Signed */}
          {isAlreadySigned ? (
            <div className="p-4 bg-[#111111] border border-emerald-500/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Digital Waiver Completed &amp; Verified in Flight Manifest</span>
                </div>
                <span className="text-xs font-mono text-[#8A8A8A]">
                  Signed: {existingWaiver?.signedAt || booking.waiverSignedAt || 'Verified on File'}
                </span>
              </div>
              <p className="text-xs text-[#8A8A8A] leading-relaxed">
                This digital legal release is stored in Firestore with an immutable verification timestamp. Your pilot has confirmed clearance for departure.
              </p>
              {existingWaiver && (
                <div className="pt-2 border-t border-[#8A8A8A]/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[#8A8A8A]">Passenger:</span>{' '}
                    <span className="text-[#FFFFFF] font-bold">{existingWaiver.flyerName}</span>
                  </div>
                  <div>
                    <span className="text-[#8A8A8A]">Emergency Contact:</span>{' '}
                    <span className="text-[#FFFFFF]">{existingWaiver.emergencyContactName} ({existingWaiver.emergencyContactPhone})</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-[#111111] border border-[#E62B1E]/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#E62B1E] font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Mandatory Pre-Flight Requirement (Swiss Air Transport Act / LTr)</span>
              </div>
              <p className="text-[#8A8A8A] leading-relaxed">
                Under Swiss Federal Office of Civil Aviation (BAZL) regulations and Swiss Hang Gliding Association (SHV/FSVL) commercial operating standards, every tandem passenger must submit a signed legal waiver acknowledging inherent flight risks and confirming fitness prior to flight dispatch.
              </p>
            </div>
          )}

          {/* Statutory Clauses Accordion Box */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-semibold text-[#E62B1E] uppercase tracking-wider">
              Statutory Terms &amp; Passenger Acknowledgment
            </h3>
            <div className="bg-[#111111] border border-[#8A8A8A]/25 rounded-xl p-4 text-xs text-[#8A8A8A] space-y-3.5 leading-relaxed max-h-48 overflow-y-auto">
              <div>
                <strong className="text-[#FFFFFF] block mb-1">
                  1. Inherent Alpine Aviation &amp; Free-Flight Hazards
                </strong>
                The passenger acknowledges that paragliding is an alpine sport subject to meteorological variables including thermals, wind shear, variable alpine terrain, and dynamic landing situations. While certified tandem pilots adhere to SHV safety envelopes, residual risk cannot be entirely excluded.
              </div>
              <div>
                <strong className="text-[#FFFFFF] block mb-1">
                  2. Physical Fitness &amp; Active Passenger Role
                </strong>
                The passenger certifies that they are capable of accelerating to a short running sprint (5–10 meters) during the take-off run and landing flare. The passenger must not be under the influence of alcohol, drugs, or medications that impair balance or response.
              </div>
              <div>
                <strong className="text-[#FFFFFF] block mb-1">
                  3. Compliance with Pilot-in-Command Directives
                </strong>
                The pilot is the sole authority regarding launch decisions, in-flight route selection, maneuvers, and landing approaches. The passenger agrees to follow all verbal instructions from the pilot immediately and without hesitation.
              </div>
              <div>
                <strong className="text-[#FFFFFF] block mb-1">
                  4. Aviation Liability &amp; Insurance Protection
                </strong>
                Commercial tandem operations are insured by {insuranceProvider} with statutory passenger third-party liability coverage up to {coverageAmount} per flight incident. Personal electronic devices (phones, cameras) flown at passenger risk unless securely tethered.
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Passenger Legal Full Name
                </label>
                <input
                  type="text"
                  required
                  disabled={isAlreadySigned}
                  value={flyerName}
                  onChange={(e) => setFlyerName(e.target.value)}
                  placeholder="e.g. Elena Rossi"
                  className="w-full px-3.5 py-2.5 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  disabled={isAlreadySigned}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E] disabled:opacity-60 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Emergency Contact Full Name
                </label>
                <input
                  type="text"
                  required
                  disabled={isAlreadySigned}
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Marco Rossi (Spouse / Parent)"
                  className="w-full px-3.5 py-2.5 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Emergency Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  disabled={isAlreadySigned}
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+41 79 123 45 67"
                  className="w-full px-3.5 py-2.5 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E] disabled:opacity-60 font-mono"
                />
              </div>
            </div>

            {/* Checkbox Declarations */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3 bg-[#111111] border border-[#8A8A8A]/25 rounded-xl cursor-pointer hover:border-[#8A8A8A]/40 transition-colors">
                <input
                  type="checkbox"
                  required
                  disabled={isAlreadySigned}
                  checked={medicalDeclaration}
                  onChange={(e) => setMedicalDeclaration(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#E62B1E] border-[#8A8A8A] focus:ring-[#E62B1E] accent-[#E62B1E]"
                />
                <span className="text-xs text-[#FFFFFF]">
                  <strong className="text-[#FFFFFF] block mb-0.5">Medical Fitness Declaration:</strong>
                  I confirm that I am in sound physical condition and do not suffer from unmanaged cardiovascular diseases, acute spinal disorders, or inner ear issues that prohibit flight participation.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 bg-[#111111] border border-[#8A8A8A]/25 rounded-xl cursor-pointer hover:border-[#8A8A8A]/40 transition-colors">
                <input
                  type="checkbox"
                  required
                  disabled={isAlreadySigned}
                  checked={riskAcknowledgment}
                  onChange={(e) => setRiskAcknowledgment(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#E62B1E] border-[#8A8A8A] focus:ring-[#E62B1E] accent-[#E62B1E]"
                />
                <span className="text-xs text-[#FFFFFF]">
                  <strong className="text-[#FFFFFF] block mb-0.5">Inherent Alpine Risk Acknowledgment:</strong>
                  I understand the nature of tandem free-flight, accept inherent alpine hazards, and agree to strictly follow all commands given by the certified tandem pilot during takeoff, flight, and landing.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 bg-[#111111] border border-[#8A8A8A]/25 rounded-xl cursor-pointer hover:border-[#8A8A8A]/40 transition-colors">
                <input
                  type="checkbox"
                  required
                  disabled={isAlreadySigned}
                  checked={liabilityInsurance}
                  onChange={(e) => setLiabilityInsurance(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#E62B1E] border-[#8A8A8A] focus:ring-[#E62B1E] accent-[#E62B1E]"
                />
                <span className="text-xs text-[#FFFFFF]">
                  <strong className="text-[#FFFFFF] block mb-0.5">Commercial Insurance &amp; Legal Release:</strong>
                  I acknowledge the commercial aviation liability limits provided by {insuranceProvider} ({coverageAmount}) and agree that this digital waiver serves as an authentic electronic record in Swiss jurisdiction.
                </span>
              </label>
            </div>

            {/* Signature Area */}
            <div className="space-y-3 pt-2 border-t border-[#8A8A8A]/25">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#E62B1E]" />
                    <span>Digital Signature of Passenger / Legal Guardian</span>
                  </h4>
                  <p className="text-[11px] text-[#8A8A8A]">
                    Legally binding electronic signature pursuant to Swiss Federal Law.
                  </p>
                </div>

                {!isAlreadySigned && (
                  <div className="flex items-center gap-1 bg-[#111111] border border-[#8A8A8A]/30 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSignatureMode('draw')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center gap-1 cursor-pointer ${
                        signatureMode === 'draw'
                          ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                          : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                      }`}
                    >
                      <PenTool className="w-3 h-3" />
                      <span>Draw</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode('typed')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center gap-1 cursor-pointer ${
                        signatureMode === 'typed'
                          ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                          : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                      }`}
                    >
                      <Type className="w-3 h-3" />
                      <span>Type</span>
                    </button>
                  </div>
                )}
              </div>

              {isAlreadySigned ? (
                /* Signed Signature Proof View */
                <div className="p-4 bg-[#111111] border border-[#8A8A8A]/30 rounded-xl space-y-2">
                  <div className="text-xs text-[#8A8A8A] font-mono">VERIFIED SIGNATURE ON FILE</div>
                  {existingWaiver?.signatureType === 'draw' && existingWaiver.signatureData ? (
                    <div className="bg-[#181818] p-3 rounded-lg border border-[#8A8A8A]/20 flex items-center justify-center">
                      <img
                        src={existingWaiver.signatureData}
                        alt="Signed Passenger Release"
                        className="max-h-24 object-contain filter invert"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-[#181818] rounded-lg border border-[#8A8A8A]/20 font-serif italic text-2xl text-[#FFFFFF] tracking-wide">
                      {existingWaiver?.signatureData || flyerName}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8A8A] pt-1">
                    <span>Signer: {flyerName}</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Timestamp Certified</span>
                    </span>
                  </div>
                </div>
              ) : signatureMode === 'draw' ? (
                /* Canvas Drawing Signature */
                <div className="space-y-2">
                  <div className="relative border-2 border-dashed border-[#8A8A8A]/40 rounded-xl bg-[#111111] overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-36 touch-none cursor-crosshair bg-[#111111]"
                    />
                    <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#8A8A8A] pointer-events-none">
                      Draw with mouse, stylus, or fingertip inside this box
                    </div>
                    {hasDrawn && (
                      <div className="absolute top-2 right-3 text-[10px] font-mono text-emerald-400 bg-[#111111]/80 px-2 py-0.5 rounded border border-emerald-500/40">
                        ✓ Signature Captured
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs text-[#8A8A8A] hover:text-[#FFFFFF] inline-flex items-center gap-1 px-2.5 py-1 hover:bg-[#111111] rounded cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear Signature</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Typed Cursive Signature */
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your full legal name..."
                    className="w-full px-3.5 py-2.5 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E] text-xs font-mono"
                  />
                  {typedSignature && (
                    <div className="p-3 bg-[#111111] border border-[#8A8A8A]/30 rounded-lg">
                      <div className="text-[10px] font-mono text-[#8A8A8A] mb-1">
                        LEGAL SIGNATURE PREVIEW:
                      </div>
                      <div className="font-serif italic text-2xl text-[#FFFFFF] tracking-wide">
                        {typedSignature}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-[#E62B1E] rounded-lg text-xs text-[#FFFFFF] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E62B1E] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#8A8A8A]/20">
              <div className="text-xs text-[#8A8A8A] font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#E62B1E]" />
                <span>Encrypted &amp; Stored in Firestore `/waivers`</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#111111] border border-[#8A8A8A]/30 rounded-lg transition-colors cursor-pointer"
                >
                  {isAlreadySigned ? 'Close' : 'Cancel'}
                </button>

                {!isAlreadySigned && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isSubmitting ? 'Recording Signature in Firestore...' : 'Sign & Submit Legal Release'}
                    </span>
                  </button>
                )}

                {isAlreadySigned && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#111111] hover:bg-[#222222] border border-[#8A8A8A]/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Proof</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
