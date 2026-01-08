import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface ImageUploaderProps {
    bucket?: string;
    existingImages?: string[];
    onImagesChange: (urls: string[]) => void;
}

export default function ImageUploader({
    bucket = 'products-images',
    existingImages = [],
    onImagesChange
}: ImageUploaderProps) {
    const [images, setImages] = useState<string[]>(existingImages);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    };

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        setUploading(true);
        setError(null);

        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => {
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (!validTypes.includes(file.type)) {
                setError('Solo se permiten imágenes JPG, PNG o WebP');
                return false;
            }
            if (file.size > maxSize) {
                setError('El tamaño máximo por imagen es 10MB');
                return false;
            }
            return true;
        });

        const uploadPromises = validFiles.map(uploadFile);
        const urls = await Promise.all(uploadPromises);
        const successfulUrls = urls.filter((url): url is string => url !== null);

        const newImages = [...images, ...successfulUrls];
        setImages(newImages);
        onImagesChange(newImages);
        setUploading(false);
    }, [images, onImagesChange, bucket]);

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

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesChange(newImages);
    };

    const moveImage = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= images.length) return;

        const newImages = [...images];
        [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
        setImages(newImages);
        onImagesChange(newImages);
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-brand-charcoal-700">
                Imágenes del Producto
            </label>

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center
          transition-colors cursor-pointer
          ${dragActive
                        ? 'border-brand-navy-500 bg-brand-navy-50'
                        : 'border-brand-charcoal-200 hover:border-brand-charcoal-300'
                    }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                    {uploading ? (
                        <div className="flex flex-col items-center">
                            <svg className="animate-spin h-8 w-8 text-brand-navy-500 mb-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-brand-charcoal-500">Subiendo imágenes...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <svg className="w-10 h-10 text-brand-charcoal-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-brand-charcoal-600 font-medium">
                                Arrastra imágenes aquí
                            </span>
                            <span className="text-sm text-brand-charcoal-400 mt-1">
                                o haz clic para seleccionar
                            </span>
                            <span className="text-xs text-brand-charcoal-400 mt-2">
                                JPG, PNG o WebP • Máx. 10MB por imagen
                            </span>
                        </div>
                    )}
                </label>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                        <div
                            key={url}
                            className="relative group aspect-[4/5] bg-cream-200 rounded-lg overflow-hidden"
                        >
                            <img
                                src={url}
                                alt={`Imagen ${index + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Image controls overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => moveImage(index, 'up')}
                                        className="p-2 bg-white rounded-full text-brand-charcoal-600 hover:bg-cream-100"
                                        title="Mover a la izquierda"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                                    title="Eliminar imagen"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {index < images.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => moveImage(index, 'down')}
                                        className="p-2 bg-white rounded-full text-brand-charcoal-600 hover:bg-cream-100"
                                        title="Mover a la derecha"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Primary image badge */}
                            {index === 0 && (
                                <span className="absolute top-2 left-2 px-2 py-1 bg-accent-leather text-white text-xs font-medium rounded">
                                    Principal
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Hidden input for form submission */}
            <input type="hidden" name="images" value={JSON.stringify(images)} />
        </div>
    );
}
