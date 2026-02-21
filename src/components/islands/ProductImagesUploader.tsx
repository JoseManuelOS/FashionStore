import { useState, useCallback, useEffect } from 'react';

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
            setImages(prev => [...prev, ...newImages]);
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
                        ? 'border-cyan-500 bg-cyan-50 scale-[1.01]'
                        : 'border-zinc-300 hover:border-cyan-400 bg-zinc-50'
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
                            <span className="text-zinc-700 font-medium">Subiendo imágenes...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <svg className="w-10 h-10 text-zinc-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-zinc-700 font-medium">
                                Arrastra imágenes o <span className="text-cyan-600">examina</span>
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="group relative aspect-[3/4] bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
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

                            {/* Order Badge */}
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-black/70 text-white text-xs flex items-center justify-center rounded-full pointer-events-none">
                                {idx + 1}
                            </div>

                            {/* Color Tag */}
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
                                        className="w-full text-xs bg-black/70 text-white border border-white/20 rounded px-1 py-0.5 backdrop-blur-sm"
                                        style={{ fontSize: '11px' }}
                                    >
                                        <option value="">Sin color</option>
                                        {colors.map(c => (
                                            <option key={c.name} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
