import { useRef, useState, useEffect } from 'react';

export default function FirmaCanvas({ onChange }) {
  const [tab, setTab] = useState('dibujar');
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDraw, setHasDraw] = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const lastPos = useRef(null);

  // ─── Helpers de posición ───────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    setDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a3a5c';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setHasDraw(true);
  };

  const stopDraw = (e) => {
    e?.preventDefault();
    setDrawing(false);
    lastPos.current = null;
    if (hasDraw) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDraw(false);
    onChange(null);
  };

  // ─── Carga de imagen ───────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgPreview(ev.target.result);
      onChange(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImgPreview(null);
    onChange(null);
  };

  // ─── Al cambiar de tab, limpiar el otro ───────────────────────────────
  const switchTab = (newTab) => {
    setTab(newTab);
    if (newTab === 'dibujar') {
      setImgPreview(null);
      onChange(hasDraw ? canvasRef.current?.toDataURL('image/png') : null);
    } else {
      clearCanvas();
      onChange(imgPreview);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => switchTab('dibujar')}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${
            tab === 'dibujar' ? 'tab-active' : 'tab-inactive'
          }`}
        >
          ✍️ Dibujar firma
        </button>
        <button
          type="button"
          onClick={() => switchTab('imagen')}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${
            tab === 'imagen' ? 'tab-active' : 'tab-inactive'
          }`}
        >
          📷 Cargar imagen
        </button>
      </div>

      {/* Panel Dibujar */}
      {tab === 'dibujar' && (
        <div className="p-3">
          <p className="text-xs text-gray-400 mb-2 text-center">
            Dibuje su firma con el mouse, dedo o lápiz óptico
          </p>
          <canvas
            ref={canvasRef}
            width={500}
            height={150}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-white cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors duration-150"
            >
              🗑 Limpiar
            </button>
          </div>
          {hasDraw && (
            <p className="text-xs text-emerald-600 font-medium text-center mt-1">
              ✓ Firma capturada
            </p>
          )}
        </div>
      )}

      {/* Panel Cargar imagen */}
      {tab === 'imagen' && (
        <div className="p-4">
          {!imgPreview ? (
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-[#2563a8] hover:bg-blue-50/50 transition-all duration-200">
              <div className="text-4xl">📁</div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Haga clic para seleccionar</p>
                <p className="text-xs text-gray-400 mt-1">PNG o JPG, máx. 2 MB</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="text-center">
              <img
                src={imgPreview}
                alt="Firma cargada"
                className="max-h-36 mx-auto border border-gray-200 rounded-lg object-contain bg-white p-2"
              />
              <button
                type="button"
                onClick={clearImage}
                className="mt-3 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors duration-150"
              >
                🗑 Eliminar imagen
              </button>
              <p className="text-xs text-emerald-600 font-medium mt-2">✓ Imagen cargada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
