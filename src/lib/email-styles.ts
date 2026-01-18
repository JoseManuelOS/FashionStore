/**
 * Email Template Styles - FashionMarket Brand Colors
 * 
 * Paleta corporativa extraída de tailwind.config.mjs y global.css
 * Usada para mantener consistencia en todas las plantillas de email
 */

export const EMAIL_COLORS = {
    // Primary - Neon Cyan
    primary: '#06b6d4',
    primaryLight: '#22d3ee',
    primaryDark: '#0891b2',

    // Accent - Neon Fuchsia
    accent: '#d946ef',
    accentDark: '#a21caf',

    // Backgrounds
    bgDark: '#0a0a0f',
    bgCard: '#12121a',
    bgLight: '#1f1f28',
    bgWhite: '#ffffff',
    bgGray: '#f9fafb',

    // Text
    textWhite: '#ffffff',
    textPrimary: '#1f2937',
    textSecondary: '#4b5563',
    textMuted: '#6b7280',
    textLight: '#9ca3af',

    // Status
    success: '#10b981',
    successBg: '#ecfdf5',
    successText: '#065f46',

    warning: '#f59e0b',
    warningBg: '#fef3c7',
    warningText: '#92400e',

    error: '#ef4444',
    errorBg: '#fef2f2',
    errorText: '#991b1b',

    info: '#3b82f6',
    infoBg: '#dbeafe',
    infoText: '#1e40af',
};

export const EMAIL_GRADIENTS = {
    primary: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    accent: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
    dark: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
};

// Base email wrapper styles
export const EMAIL_BASE_STYLES = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: ${EMAIL_COLORS.textPrimary};
    margin: 0;
    padding: 0;
    background-color: #f3f4f6;
`;

// Common email components
export const EMAIL_COMPONENTS = {
    // Main container
    container: `
        max-width: 600px;
        margin: 40px auto;
        background-color: ${EMAIL_COLORS.bgWhite};
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `,

    // Header section
    header: (gradient: string = EMAIL_GRADIENTS.primary) => `
        background: ${gradient};
        padding: 40px 20px;
        text-align: center;
    `,

    // Header title
    headerTitle: `
        color: ${EMAIL_COLORS.textWhite};
        margin: 0;
        font-size: 24px;
        font-weight: bold;
    `,

    // Content section
    content: `
        padding: 40px 30px;
    `,

    // Primary CTA button
    button: `
        display: inline-block;
        padding: 14px 32px;
        background: ${EMAIL_GRADIENTS.primary};
        color: ${EMAIL_COLORS.textWhite};
        text-decoration: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 16px;
    `,

    // Footer section
    footer: `
        background-color: ${EMAIL_COLORS.bgDark};
        padding: 25px;
        text-align: center;
    `,

    // Footer text
    footerText: `
        color: ${EMAIL_COLORS.textLight};
        margin: 0;
        font-size: 14px;
    `,

    // Info box
    infoBox: `
        background-color: ${EMAIL_COLORS.infoBg};
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 25px;
    `,

    // Success box
    successBox: `
        background-color: ${EMAIL_COLORS.successBg};
        border-left: 4px solid ${EMAIL_COLORS.success};
        padding: 15px 20px;
        margin-bottom: 25px;
        border-radius: 4px;
    `,

    // Warning box
    warningBox: `
        background-color: ${EMAIL_COLORS.warningBg};
        border-left: 4px solid ${EMAIL_COLORS.warning};
        padding: 20px;
        margin-bottom: 25px;
        border-radius: 4px;
    `,
};

/**
 * Generate standard email HTML wrapper
 */
export function generateEmailHTML(options: {
    headerGradient?: string;
    headerIcon?: string;
    headerTitle: string;
    headerSubtitle?: string;
    content: string;
    showButton?: boolean;
    buttonText?: string;
    buttonUrl?: string;
}): string {
    const {
        headerGradient = EMAIL_GRADIENTS.primary,
        headerIcon = '',
        headerTitle,
        headerSubtitle = '',
        content,
        showButton = false,
        buttonText = 'Ver en la tienda',
        buttonUrl = 'https://fashionmarket.com'
    } = options;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${EMAIL_BASE_STYLES}">
    <div style="${EMAIL_COMPONENTS.container}">
        <!-- Header -->
        <div style="${EMAIL_COMPONENTS.header(headerGradient)}">
            ${headerIcon ? `<div style="font-size: 48px; margin-bottom: 15px;">${headerIcon}</div>` : ''}
            <h1 style="${EMAIL_COMPONENTS.headerTitle}">${headerTitle}</h1>
            ${headerSubtitle ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${headerSubtitle}</p>` : ''}
        </div>
        
        <!-- Content -->
        <div style="${EMAIL_COMPONENTS.content}">
            ${content}
            
            ${showButton ? `
            <div style="text-align: center; margin-top: 30px;">
                <a href="${buttonUrl}" style="${EMAIL_COMPONENTS.button}">
                    ${buttonText}
                </a>
            </div>
            ` : ''}
        </div>
        
        <!-- Footer -->
        <div style="${EMAIL_COMPONENTS.footer}">
            <p style="${EMAIL_COMPONENTS.footerText}">
                © ${new Date().getFullYear()} FashionMarket. Todos los derechos reservados.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}
