import { useState, useCallback } from 'react';

interface CategoryImageUploaderProps {
    existingImage?: string;
    onImageChange: (url: string) => void;
}

export default function CategoryImageUploader({
    existingImage = '',
    onImageChange
}: CategoryImageUploaderProps) {
    const [image, setImage] = useState<string>(existingImage);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cloudName = (import.meta as any).env?.PUBLIC_CLOUDINARY_CLOUD_NAME || 'djlc45ybk';
    const uploadPreset = 'fashionstore_products';

    const uploadFile = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', 'categories');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) throw new Error('Error al subir imagen');
            const data = await response.json();
            return data.secure_url;
        } catch (err) {
            console.error('Upload error:', err);
            return null;
        }
    };

    const handleFile = useCallback(async (file: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Solo se permiten imágenes JPG, PNG o WebP');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('La imagen no puede superar 10MB');
            return;
        }

        setUploading(true);
        setError(null);
        const url = await uploadFile(file);
        if (url) {
            setImage(url);
            onImageChange(url);
        } else {
            setError('Error al subir la imagen');
        }
        setUploading(false);
    }, [onImageChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const removeImage = () => {
        setImage('');
        onImageChange('');
    };

    return (
        <div>
            <input type="hidden" name="image_url" value={image} />
            
            {image ? (
                <div style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    aspectRatio: '16/9',
                    maxWidth: '400px'
                }}>
                    <img
                        src={image}
                        alt="Imagen de categoría"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                        type="button"
                        onClick={removeImage}
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.9)',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }}
                    >
                        ×
                    </button>
                </div>
            ) : (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('category-image-input')?.click()}
                    style={{
                        border: `2px dashed ${dragActive ? '#06b6d4' : 'rgba(255,255,255,0.15)'}`,
                        borderRadius: '12px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragActive ? 'rgba(6,182,212,0.05)' : 'transparent',
                        transition: 'all 0.2s ease',
                        maxWidth: '400px'
                    }}
                >
                    <input
                        id="category-image-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                    />
                    {uploading ? (
                        <div style={{ color: '#06b6d4' }}>
                            <div style={{ fontSize: '14px', marginBottom: '4px' }}>Subiendo imagen...</div>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid rgba(6,182,212,0.2)',
                                borderTop: '3px solid #06b6d4',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '12px auto'
                            }} />
                        </div>
                    ) : (
                        <>
                            <svg width="40" height="40" fill="none" stroke="#52525b" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div style={{ color: '#a1a1aa', fontSize: '14px' }}>
                                Arrastra una imagen o haz clic para seleccionar
                            </div>
                            <div style={{ color: '#52525b', fontSize: '12px', marginTop: '4px' }}>
                                JPG, PNG o WebP • Máx. 10MB • Recomendado: 600×400
                            </div>
                        </>
                    )}
                </div>
            )}

            {error && (
                <div style={{ color: '#f87171', fontSize: '13px', marginTop: '8px' }}>
                    {error}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
