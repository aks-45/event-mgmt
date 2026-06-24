import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useIdCardLayout } from '../context/IdCardLayoutContext';
import { getCardLayout } from '../config/idCardLayout';

const getCardType = (participant) => {
  if (participant?.isHonorary) return 'honorary';
  if (participant?.guestId) return 'guest';
  return 'member';
};

const getCardTypeLabel = (participant) => {
  if (participant?.isHonorary) return 'Honorary Guest';
  if (participant?.guestId) return 'Guest';
  return 'Member';
};

const IdCardGenerator = ({
  participant,
  showActions = true,
  layout: layoutOverride,
  previewWidth,
  templateSrc = '/id-card-template.jpeg',
}) => {
  const { layout: contextLayout } = useIdCardLayout();
  const layout = getCardLayout(layoutOverride || contextLayout, getCardType(participant));
  const cardRef = useRef(null);

  const cardWidth = previewWidth || layout.cardWidth;
  const physicalWidthCm = Number(layout.cardWidthCm) || 5.4;
  const physicalHeightCm = Number(layout.cardHeightCm) || physicalWidthCm * layout.aspectRatio;
  const physicalAspectRatio = physicalHeightCm / physicalWidthCm;
  const cardHeight = Math.round(cardWidth * physicalAspectRatio);
  const scale = cardWidth / layout.cardWidth;
  const { name, industry, qr, typeLabel } = layout;
  const cardTypeLabel = getCardTypeLabel(participant);

  const captureCard = useCallback(async () => {
    if (!cardRef.current) return null;
    return html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  }, []);

  const downloadPng = async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${participant.participantId || participant.guestId}-id-card.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const downloadPdf = async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const cardWmm = physicalWidthCm * 10;
    const cardHmm = physicalHeightCm * 10;
    pdf.addImage(imgData, 'PNG', (pageW - cardWmm) / 2, (pageH - cardHmm) / 2, cardWmm, cardHmm);
    pdf.save(`${participant.participantId || participant.guestId}-id-card.pdf`);
  };

  const printCard = async () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Preparing ID Card</title></head><body>Preparing print...</body></html>`);
    win.document.close();

    const canvas = await captureCard();
    if (!canvas) { win.close(); return; }

    win.document.open();
    win.document.write(`
      <html>
        <head>
          <title>Print ID Card</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; }
            body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #ffffff; }
            img { display: block; width: ${physicalWidthCm}cm; height: ${physicalHeightCm}cm; }
            @media print { body { min-height: auto; } }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL('image/png')}" alt="ID Card" onload="window.focus(); setTimeout(() => window.print(), 150);" />
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={cardRef}
        className="print-area relative overflow-hidden shadow-xl rounded-lg"
        style={{ width: cardWidth, height: cardHeight }}
      >
        <img
          src={templateSrc}
          alt="IIA ID Card Template"
          className="absolute inset-0 w-full h-full object-fill"
          crossOrigin="anonymous"
        />

        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: `${typeLabel.topPercent}%` }}
        >
          <span
            className="font-serif leading-tight"
            style={{
              fontSize: `${typeLabel.fontSizePx * scale}px`,
              fontWeight: typeLabel.fontWeight,
              textAlign: typeLabel.textAlign,
              color: typeLabel.color,
              textTransform: typeLabel.textTransform,
            }}
          >
            {cardTypeLabel}
          </span>
        </div>

        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: `${name.topPercent}%`, paddingLeft: name.paddingLeft * scale, paddingRight: name.paddingRight * scale }}
        >
          <h2
            className="font-serif leading-tight"
            style={{ fontSize: `${name.fontSizePx * scale}px`, maxWidth: name.maxWidthPx * scale, fontWeight: name.fontWeight, textAlign: name.textAlign, color: name.color }}
          >
            {participant.fullName}
          </h2>
        </div>

        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: `${industry.topPercent}%`, paddingLeft: industry.paddingLeft * scale, paddingRight: industry.paddingRight * scale }}
        >
          <p
            className="font-serif"
            style={{ fontSize: `${industry.fontSizePx * scale}px`, maxWidth: industry.maxWidthPx * scale, lineHeight: industry.lineHeight, fontWeight: industry.fontWeight, textAlign: industry.textAlign, color: industry.color }}
          >
            {participant.industryName}
          </p>
        </div>

        <div
          className="absolute flex items-center justify-center"
          style={{ right: `${qr.rightPercent}%`, bottom: `${qr.bottomPercent}%`, width: `${qr.widthPercent}%`, aspectRatio: '1', padding: qr.paddingPx * scale }}
        >
          {participant.qrImage ? (
            <img
              src={participant.qrImage}
              alt="QR"
              className="w-full h-full object-contain"
              style={{ backgroundColor: qr.whiteBackground ? '#fff' : 'transparent' }}
              crossOrigin="anonymous"
            />
          ) : (
            <span className="text-xs text-slate-400">No QR</span>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2 justify-center no-print">
          <button type="button" onClick={printCard} className="btn-primary">Print Card</button>
          <button type="button" onClick={downloadPdf} className="btn-gold">Download PDF</button>
          <button type="button" onClick={downloadPng} className="btn-outline">Download PNG</button>
        </div>
      )}
    </div>
  );
};

export default IdCardGenerator;
