import { useState, useCallback, useEffect, useRef } from 'react';

interface ProductColor {
    name: string;
    hex: string;
}

interface ProductImagesUploaderProps {
    initialImages?: string[];
    inputName?: string;
    availableColors?: ProductColor[];
    initialImageColors?: Record<string, string>; // url -> colorName
}

export default function ProductImagesUploader({
    initialImages = [],
    inputName = 'images',
    availableColors = [],
    initialImageColors = {}
}: ProductImagesUploaderProps) {
    const [images, setImages] = useState<string[]>(initialImages);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageColors, setImageColors] = useState<Record<string, string>>(initialImageColors);
    const [colors, setColors] = useState<ProductColor[]>(availableColors);
    const prevColorsLengthRef = useRef(availableColors.length);

    // Listen for color changes from the page script
    useEffect(() => {
        const handler = () => {
            const jsonInput = document.getElementById('colors-json-input') as HTMLInputElement;
            if (jsonInput) {
                try {
                    const parsed = JSON.parse(jsonInput.value);
                    setColors(parsed);
                } catch { /* ignore */ }
            }
        };
        // Check on an interval since direct event is tricky across frameworks
        const interval = setInterval(handler, 2000);
        return () => clearInterval(interval);
    }, []);

    // Auto-assign colors to unassigned images when colors change
    useEffect(() => {
        if (colors.length > 0 && images.length > 0) {
            const hasAnyAssignment = images.some(url => imageColors[url]);
            if (!hasAnyAssignment && colors.length > prevColorsLengthRef.current) {
                // Auto-assign: distribute images among colors in round-robin
                const newAssignments: Record<string, string> = { ...imageColors };
                images.forEach((url, idx) => {
                    if (!newAssignments[url]) {
                        newAssignments[url] = colors[idx % colors.length].name;
                    }
                });
                setImageColors(newAssignments);
            }
        }
        prevColorsLengthRef.current = colors.length;
    }, [colors, images]);

    // Sync image color assignments to a hidden input so the form can read them
    useEffect(() => {
        const hiddenInput = document.getElementById('image-colors-json-input') as HTMLInputElement;
        if (hiddenInput && colors.length > 0) {
            const mapping: Record<string, { color: string; colorHex: string }> = {};
            for (const [url, colorName] of Object.entries(imageColors)) {
                const c = colors.find(c => c.name === colorName);
                if (c) {
                    mapping[url] = { color: c.name, colorHex: c.hex };
                }
            }
            hiddenInput.value = JSON.stringify(mapping);
        }
    }, [imageColors, colors]);

    // Helper: get hex for a color name
    const getColorHex = (colorName: string): string | null => {
        const c = colors.find(c => c.name === colorName);
        return c ? c.hex : null;
    };

    // Helper: is a color light enough to need dark text?
    const isLightColor = (hex: string): boolean => {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 160;
    };

    const cloudinaryCloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || 'djlc45ybk';
    const cloudinaryUploadPreset = 'fashionstore_products';

    const uploadFile = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', cloudinaryUploadPreset);
            formData.append('folder', 'products');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Error al subir imagen');
            }

            const data = await response.json();
            return data.secure_url;
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Error al subir la imagen');
            return null;
        }
    };

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        setUploading(true);
        setError(null);

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const newImages: string[] = [];

        for (const file of Array.from(files)) {
            if (!validTypes.includes(file.type)) {
                setError('Solo se permiten imágenes JPG, PNG o WebP');
                continue;
            }
            if (file.size > maxSize) {
                setError('El tamaño máximo es 10MB per imagen');
                continue;
            }

            const url = await uploadFile(file);
            if (url) {
                newImages.push(url);
            }
        }

        if (newImages.length > 0) {
            setImages(prev => {
                const updated = [...prev, ...newImages];
                // Auto-assign colors to new images if colors are available
                if (colors.length > 0) {
                    setImageColors(prevColors => {
                        const next = { ...prevColors };
                        newImages.forEach((url, i) => {
                            const idx = prev.length + i;
                            next[url] = colors[idx % colors.length].name;
                        });
                        return next;
                    });
                }
                return updated;
            });
        }
        setUploading(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeImage = (indexToRemove: number) => {
        const removedUrl = images[indexToRemove];
        setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
        if (removedUrl) {
            setImageColors(prev => {
                const next = { ...prev };
                delete next[removedUrl];
                return next;
            });
        }
    };

    const moveImage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= images.length) return;
        const newImages = [...images];
        const [moved] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, moved);
        setImages(newImages);
    };

    return (
        <div className="space-y-6">
            {/* Hidden input for form submission - comma separated URLs */}
            <input type="hidden" name={inputName} value={images.join(',')} />

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                    border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                    ${dragActive
                        ? 'border-cyan-500 bg-cyan-900/30 scale-[1.01]'
                        : 'border-zinc-600 hover:border-cyan-400 bg-zinc-800/50'
                    }
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileInput}
                    className="hidden"
                    id="product-images-upload"
                    multiple
                    disabled={uploading}
                />
                <label htmlFor="product-images-upload" className="cursor-pointer w-full h-full block">
                    {uploading ? (
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <svg className="animate-spin h-10 w-10 text-cyan-600 mb-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </div>
                            <span className="text-zinc-300 font-medium">Subiendo imágenes...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <svg className="w-10 h-10 text-zinc-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-zinc-300 font-medium">
                                Arrastra imágenes o <span className="text-cyan-400">examina</span>
                            </span>
                            <span className="text-xs text-zinc-500 mt-1">
                                JPG, PNG, WebP (Máx 10MB)
                            </span>
                        </div>
                    )}
                </label>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Image Grid */}
            {images.length > 0 && (
                <div>
                    {/* Color legend when colors are available */}
                    {colors.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '12px',
                            padding: '10px 14px',
                            background: '#18181b',
                            borderRadius: '10px',
                            border: '1px solid #27272a',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '12px', color: '#a1a1aa', marginRight: '4px' }}>Colores:</span>
                            {colors.map(c => (
                                <span key={c.name} style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '12px',
                                    color: '#e4e4e7',
                                    padding: '2px 8px',
                                    background: '#27272a',
                                    borderRadius: '6px',
                                    border: `2px solid ${c.hex}`,
                                }}>
                                    <span style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: c.hex,
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        flexShrink: 0
                                    }} />
                                    {c.name}
                                    <span style={{ color: '#71717a', fontSize: '11px' }}>
                                        ({images.filter(url => imageColors[url] === c.name).length} img)
                                    </span>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Unassigned warning */}
                    {colors.length > 0 && images.some(url => !imageColors[url]) && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            marginBottom: '12px',
                            background: '#451a03',
                            border: '1px solid #92400e',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#fbbf24'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Hay imágenes sin color asignado. Selecciona un color en el desplegable de cada imagen.
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((url, idx) => {
                        const assignedColor = imageColors[url];
                        const colorHex = assignedColor ? getColorHex(assignedColor) : null;
                        const borderColor = colorHex || (colors.length > 0 ? '#ef4444' : '#27272a');
                        const showWarning = colors.length > 0 && !assignedColor;

                        return (
                        <div key={`${url}-${idx}`} className="group relative aspect-[3/4] bg-zinc-100 rounded-lg overflow-hidden shadow-sm"
                            style={{
                                border: `3px solid ${borderColor}`,
                                boxShadow: colorHex ? `0 0 12px ${colorHex}44` : undefined,
                            }}>
                            <img
                                src={url}
                                alt={`Product ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => moveImage(idx, idx - 1)}
                                        disabled={idx === 0}
                                        className="p-1.5 bg-white text-zinc-900 rounded-full hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Mover atrás"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveImage(idx, idx + 1)}
                                        disabled={idx === images.length - 1}
                                        className="p-1.5 bg-white text-zinc-900 rounded-full hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Mover adelante"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full hover:bg-red-600 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>

                            {/* Order Badge (bottom-right) */}
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-black/70 text-white text-xs flex items-center justify-center rounded-full pointer-events-none">
                                {idx + 1}
                            </div>

                            {/* Color Badge (bottom-left) - always visible */}
                            {assignedColor && colorHex && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '8px',
                                    left: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px 2px 4px',
                                    background: colorHex,
                                    color: isLightColor(colorHex) ? '#18181b' : '#fff',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    pointerEvents: 'none',
                                    maxWidth: 'calc(100% - 44px)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: isLightColor(colorHex) ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                                        flexShrink: 0
                                    }} />
                                    {assignedColor}
                                </div>
                            )}

                            {/* Warning badge if no color assigned and colors exist */}
                            {showWarning && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '8px',
                                    left: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 7px',
                                    background: '#dc2626',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    borderRadius: '12px',
                                    pointerEvents: 'none',
                                }}>
                                    ⚠ Sin color
                                </div>
                            )}

                            {/* Color Selector (top) */}
                            {colors.length > 0 && (
                                <div className="absolute top-2 left-2 right-2">
                                    <select
                                        value={imageColors[url] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setImageColors(prev => {
                                                const next = { ...prev };
                                                if (val) next[url] = val;
                                                else delete next[url];
                                                return next;
                                            });
                                        }}
                                        style={{
                                            width: '100%',
                                            fontSize: '12px',
                                            padding: '4px 6px',
                                            borderRadius: '6px',
                                            border: assignedColor ? `2px solid ${colorHex}` : '2px solid #ef4444',
                                            background: 'rgba(0,0,0,0.75)',
                                            color: '#fff',
                                            backdropFilter: 'blur(4px)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value="">⚠ Sin color</option>
                                        {colors.map(c => (
                                            <option key={c.name} value={c.name}>● {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        );
                    })}
                    </div>
                </div>
            )}
        </div>
    );
}
