/**
 * SizeRecommender Component - Recomendador de Talla Interactivo
 * 
 * NOTA EDUCATIVA:
 * Usamos client:load porque este componente necesita estar interactivo inmediatamente
 * cuando el usuario hace clic en "¿Cuál es mi talla?". A diferencia de client:visible
 * (que carga cuando es visible en viewport), client:load asegura que el modal
 * pueda abrirse sin delay, mejorando la UX.
 * 
 * La lógica de recomendación se basa en medidas estándar de ropa masculina europea:
 * - S: Para contextura más pequeña (altura < 170cm o peso < 60kg)
 * - M: Contextura promedio-pequeña (altura 170-175cm, peso 60-70kg)
 * - L: Contextura promedio-grande (altura 175-185cm, peso 70-85kg)
 * - XL: Contextura grande (altura > 185cm o peso > 90kg)
 */

import { useState, useEffect } from 'react';

interface SizeRecommenderProps {
  productName?: string;
  availableSizes?: string[];
  onSizeSelect?: (size: string) => void;
}

type RecommendedSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | null;

interface SizeResult {
  size: RecommendedSize;
  confidence: 'alta' | 'media' | 'baja';
  tip: string;
}

/**
 * Lógica de cálculo de talla
 * Basada en IMC y proporciones corporales estándar
 */
function calculateSize(altura: number, peso: number): SizeResult {
  // Validaciones
  if (altura < 140 || altura > 220 || peso < 40 || peso > 150) {
    return {
      size: null,
      confidence: 'baja',
      tip: 'Los valores ingresados están fuera del rango típico. Por favor, verifica los datos.'
    };
  }

  // Calcular IMC como referencia adicional
  const alturaM = altura / 100;
  const imc = peso / (alturaM * alturaM);

  let size: RecommendedSize;
  let confidence: 'alta' | 'media' | 'baja';
  let tip: string;

  // Lógica de decisión basada en altura y peso
  if (peso < 60 && altura < 170) {
    // Contextura pequeña
    size = 'S';
    confidence = 'alta';
    tip = 'La talla S es ideal para tu contextura. Ajuste ceñido y cómodo.';
  } else if (peso < 70 && altura < 175) {
    // Contextura promedio-pequeña
    size = 'M';
    confidence = 'alta';
    tip = 'La talla M te quedará perfecta. Es nuestra talla más versátil.';
  } else if (peso >= 70 && peso <= 85 && altura >= 175 && altura <= 185) {
    // Contextura promedio-grande
    size = 'L';
    confidence = 'alta';
    tip = 'La talla L es perfecta para tu complexión. Buen equilibrio entre comodidad y estilo.';
  } else if (peso > 90) {
    // Peso elevado → XL
    size = 'XL';
    confidence = 'alta';
    tip = 'La talla XL te proporcionará el mejor ajuste y comodidad.';
  } else if (altura > 185) {
    // Muy alto pero no pesado
    if (peso < 75) {
      size = 'L';
      confidence = 'media';
      tip = 'Recomendamos L. Si prefieres más holgura en longitud, considera XL.';
    } else {
      size = 'XL';
      confidence = 'alta';
      tip = 'XL es ideal para tu altura. Te dará la longitud perfecta en mangas y torso.';
    }
  } else if (peso < 65 && altura >= 175) {
    // Alto pero delgado
    size = 'M';
    confidence = 'media';
    tip = 'M debería funcionar bien. Si buscas más longitud, prueba L.';
  } else if (peso >= 85 && peso <= 90) {
    // En el límite L/XL
    size = 'L';
    confidence = 'media';
    tip = 'Estás entre L y XL. Si prefieres ajuste holgado, ve por XL.';
  } else if (peso >= 60 && peso < 70 && altura >= 175) {
    // Zona intermedia M/L
    size = 'M';
    confidence = 'media';
    tip = 'M es una buena opción. Si prefieres más amplitud, considera L.';
  } else {
    // Caso general - usar IMC como guía adicional
    if (imc < 20) {
      size = 'S';
      confidence = 'media';
      tip = 'Basándonos en tu contextura, S sería ideal.';
    } else if (imc < 24) {
      size = 'M';
      confidence = 'media';
      tip = 'Tu complexión indica que M sería una buena elección.';
    } else if (imc < 28) {
      size = 'L';
      confidence = 'media';
      tip = 'Recomendamos L para mejor comodidad.';
    } else {
      size = 'XL';
      confidence = 'alta';
      tip = 'XL te dará el mejor ajuste y confort.';
    }
  }

  return { size, confidence, tip };
}

// Tabla de medidas de referencia
const sizeChart = {
  XS: { pecho: '86-91', cintura: '71-76', cadera: '86-91' },
  S: { pecho: '91-96', cintura: '76-81', cadera: '91-96' },
  M: { pecho: '96-101', cintura: '81-86', cadera: '96-101' },
  L: { pecho: '101-106', cintura: '86-91', cadera: '101-106' },
  XL: { pecho: '106-111', cintura: '91-96', cadera: '106-111' },
  XXL: { pecho: '111-116', cintura: '96-101', cadera: '111-116' }
};

export default function SizeRecommender({ 
  productName = 'esta prenda',
  availableSizes = ['S', 'M', 'L', 'XL'],
  onSizeSelect
}: SizeRecommenderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [altura, setAltura] = useState<string>('');
  const [peso, setPeso] = useState<string>('');
  const [result, setResult] = useState<SizeResult | null>(null);
  const [showChart, setShowChart] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCalculate = () => {
    const alturaNum = parseFloat(altura);
    const pesoNum = parseFloat(peso);

    if (isNaN(alturaNum) || isNaN(pesoNum)) {
      alert('Por favor, introduce valores numéricos válidos');
      return;
    }

    const recommendation = calculateSize(alturaNum, pesoNum);
    setResult(recommendation);
  };

  const handleSelectSize = () => {
    if (result?.size && onSizeSelect) {
      onSizeSelect(result.size);
      setIsOpen(false);
    }
  };

  const resetForm = () => {
    setAltura('');
    setPeso('');
    setResult(null);
    setShowChart(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 300);
  };

  return (
    <>
      {/* Botón trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-neon-cyan hover:text-neon-cyan-light transition-colors underline underline-offset-4"
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
          />
        </svg>
        ¿Cuál es mi talla?
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal Content */}
          <div 
            className="relative bg-dark-500 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Encuentra tu talla perfecta
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Te ayudamos a elegir la talla ideal
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {!result ? (
                <>
                  {/* Formulario */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Altura (cm)
                      </label>
                      <input
                        type="number"
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                        placeholder="Ej: 175"
                        min="140"
                        max="220"
                        className="w-full px-4 py-3 bg-dark-400 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        placeholder="Ej: 75"
                        min="40"
                        max="150"
                        className="w-full px-4 py-3 bg-dark-400 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors"
                      />
                    </div>

                    <button
                      onClick={handleCalculate}
                      disabled={!altura || !peso}
                      className="w-full py-3 px-4 bg-gradient-to-r from-neon-cyan to-neon-fuchsia text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Calcular mi talla
                    </button>
                  </div>

                  {/* Enlace a tabla de tallas */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button
                      onClick={() => setShowChart(!showChart)}
                      className="text-sm text-zinc-400 hover:text-neon-cyan transition-colors flex items-center gap-2"
                    >
                      <svg className={`w-4 h-4 transition-transform ${showChart ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Ver guía de tallas completa
                    </button>

                    {showChart && (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-zinc-400 border-b border-white/10">
                              <th className="text-left py-2">Talla</th>
                              <th className="text-center py-2">Pecho</th>
                              <th className="text-center py-2">Cintura</th>
                              <th className="text-center py-2">Cadera</th>
                            </tr>
                          </thead>
                          <tbody className="text-zinc-300">
                            {Object.entries(sizeChart)
                              .filter(([size]) => availableSizes.includes(size))
                              .map(([size, measures]) => (
                                <tr key={size} className="border-b border-white/5">
                                  <td className="py-2 font-medium text-white">{size}</td>
                                  <td className="text-center py-2">{measures.pecho}</td>
                                  <td className="text-center py-2">{measures.cintura}</td>
                                  <td className="text-center py-2">{measures.cadera}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        <p className="text-xs text-zinc-500 mt-2">*Medidas en centímetros</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Resultado */
                <div className="text-center">
                  {result.size ? (
                    <>
                      <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-fuchsia/20 border-2 border-neon-cyan mb-4">
                          <span className="text-4xl font-bold text-white">{result.size}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Tu talla recomendada
                        </h3>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                          result.confidence === 'alta' 
                            ? 'bg-green-500/20 text-green-400'
                            : result.confidence === 'media'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            result.confidence === 'alta' 
                              ? 'bg-green-400'
                              : result.confidence === 'media'
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                          }`} />
                          Confianza {result.confidence}
                        </div>
                      </div>

                      <p className="text-zinc-400 mb-6">{result.tip}</p>

                      <div className="space-y-3">
                        {availableSizes.includes(result.size) ? (
                          <button
                            onClick={handleSelectSize}
                            className="w-full py-3 px-4 bg-neon-cyan text-dark-600 font-medium rounded-lg hover:bg-neon-cyan-light transition-colors"
                          >
                            Seleccionar talla {result.size}
                          </button>
                        ) : (
                          <p className="text-amber-400 text-sm">
                            ⚠️ La talla {result.size} no está disponible para este producto
                          </p>
                        )}
                        
                        <button
                          onClick={resetForm}
                          className="w-full py-3 px-4 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors"
                        >
                          Calcular de nuevo
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-amber-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No pudimos calcular tu talla
                      </h3>
                      <p className="text-zinc-400 mb-6">{result.tip}</p>
                      <button
                        onClick={resetForm}
                        className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
                      >
                        Intentar de nuevo
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-dark-400/50 border-t border-white/5">
              <p className="text-xs text-zinc-500 text-center">
                💡 Esta es una recomendación orientativa. El ajuste puede variar según el modelo.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
