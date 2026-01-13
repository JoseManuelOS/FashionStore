import { useState, useCallback } from 'react';

interface CarouselImageUploaderProps {
    initialImage?: string;
    inputName?: string;
}

export default function CarouselImageUploader({
    initialImage = '',
    inputName = 'image_url'
}: CarouselImageUploaderProps) {
    const [imageUrl, setImageUrl] = useState<string>(initialImage);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cloudinaryCloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || 'djlc45ybk';
    const cloudinaryUploadPreset = 'fashionstore_products';

    const uploadFile = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', cloudinaryUploadPreset);
            formData.append('folder', 'carousel');

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

    const handleFile = useCallback(async (file: File) => {
        setUploading(true);
        setError(null);

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            setError('Solo se permiten imágenes JPG, PNG o WebP');
            setUploading(false);
            return;
        }
        if (file.size > maxSize) {
            setError('El tamaño máximo es 10MB');
            setUploading(false);
            return;
        }

        const url = await uploadFile(file);
        if (url) {
            setImageUrl(url);
        }
        setUploading(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

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
            handleFile(e.target.files[0]);
        }
    };

    const removeImage = () => {
        setImageUrl('');
    };

    return (
        <div className="space-y-4">
            {/* Hidden input for form submission */}
            <input type="hidden" name={inputName} value={imageUrl} />

            {imageUrl ? (
                /* Image Preview */
                <div className="relative group">
                    <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-xl border border-zinc-200"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-xl">
                        <label className="cursor-pointer px-6 py-2.5 bg-white text-zinc-900 rounded-lg font-semibold hover:bg-zinc-50 transition-colors shadow-lg">
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileInput}
                                className="hidden"
                                disabled={uploading}
                            />
                            Cambiar
                        </label>
                        <button
                            type="button"
                            onClick={removeImage}
                            className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-lg"
                        >
                            Eliminar
                        </button>
                    </div>
                    {/* Cloudinary badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-1.5 bg-white/90 backdrop-blur-sm text-zinc-700 text-xs rounded-lg flex items-center gap-1.5 shadow-sm border border-zinc-200">
                        <svg className="w-3.5 h-3.5 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                        <span className="font-medium">Cloudinary</span>
                    </div>
                </div>
            ) : (
                /* Drop Zone */
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                        border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
                        ${dragActive
                            ? 'border-cyan-500 bg-cyan-50 scale-[1.02]'
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
                        id="carousel-image-upload"
                        disabled={uploading}
                    />
                    <label htmlFor="carousel-image-upload" className="cursor-pointer">
                        {uploading ? (
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <svg className="animate-spin h-12 w-12 text-cyan-600 mb-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                                <span className="text-zinc-700 font-medium">Subiendo a Cloudinary...</span>
                                <span className="text-sm text-zinc-500 mt-1">Por favor espera</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl mb-4 shadow-sm">
                                    <svg className="w-12 h-12 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-zinc-900 font-semibold text-lg">
                                    Arrastra una imagen aquí
                                </span>
                                <span className="text-sm text-zinc-600 mt-2">
                                    o haz clic para seleccionar desde tu computadora
                                </span>
                                <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>1920x900 px recomendado</span>
                                    </div>
                                    <span>•</span>
                                    <span>JPG, PNG o WebP</span>
                                    <span>•</span>
                                    <span>Máx. 10MB</span>
                                </div>
                            </div>
                        )}
                    </label>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
