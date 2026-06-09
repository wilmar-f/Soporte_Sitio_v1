export default function PdfPreview({ pdfUrl, onClose, filename }) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = filename || 'Diagnostico.pdf';
    a.click();
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-iframe');
    if (iframe) {
      iframe.contentWindow.print();
    } else {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
      {/* Barra de controles */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0d1f35] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div>
            <p className="text-white font-semibold text-sm">{filename || 'Diagnóstico Técnico'}</p>
            <p className="text-white/40 text-xs">Previsualización del PDF generado</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            🖨 Imprimir
          </button>
          <button
            onClick={handleDownload}
            className="btn-gold flex items-center gap-2 text-sm"
          >
            ⬇ Descargar PDF
          </button>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Iframe con el PDF */}
      <div className="flex-1 overflow-hidden bg-gray-700">
        <iframe
          id="pdf-iframe"
          src={pdfUrl}
          title="Diagnóstico PDF"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
