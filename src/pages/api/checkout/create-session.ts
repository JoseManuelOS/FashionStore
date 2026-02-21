import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getStockForSize } from '../../../lib/supabase';

// Verificar que la clave existe
if (!import.meta.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY no está configurada en las variables de entorno');
}

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
});

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();

        const { items, customerEmail, customerPhone, customerName, shippingAddress, discount, shippingMethodId, shippingCost } = body;

        if (!items || items.length === 0) {
            return new Response(
                JSON.stringify({ error: 'El carrito está vacío' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Validate stock availability before creating payment session
        for (const item of items) {
            if (item.id && item.size) {
                const available = await getStockForSize(item.id, item.size, item.color || '');
                if (available < (item.quantity || 1)) {
                    return new Response(
                        JSON.stringify({
                            error: `Stock insuficiente para ${item.name} (${item.size}${item.color ? `, ${item.color}` : ''}). Disponible: ${available}`,
                            outOfStock: true,
                            productId: item.id,
                            size: item.size
                        }),
                        {
                            status: 409,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
            }
        }

        // Convertir items del carrito a line_items de Stripe
        const lineItems = items.map((item: any) => {
            const unitAmount = Math.round(item.price * 100);

            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: item.name,
                        images: item.image ? [item.image] : [],
                        metadata: {
                            product_id: item.id,
                            size: item.size || '',
                            color: item.color || '',
                        },
                    },
                    unit_amount: unitAmount,
                },
                quantity: item.quantity,
            };
        });

        // Session config
        // 'card' incluye automáticamente Visa, Mastercard, Apple Pay y Google Pay
        // PayPal y Revolut Pay son métodos separados
        const sessionConfig: any = {
            payment_method_types: ['card', 'paypal', 'revolut_pay'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/checkout`,
        };

        // Add discount if provided
        if (discount && discount.code) {
            // Calculate discount for Stripe
            const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
            let discountAmount = 0;

            if (discount.type === 'percentage') {
                discountAmount = Math.round((subtotal * discount.value) / 100 * 100); // Convert to cents
            } else if (discount.type === 'fixed') {
                discountAmount = Math.round(Math.min(discount.value, subtotal) * 100); // Convert to cents
            }

            if (discountAmount > 0) {
                const coupon = await stripe.coupons.create(
                    discount.type === 'percentage'
                        ? {
                            percent_off: discount.value,
                            duration: 'once',
                            name: discount.code,
                        }
                        : {
                            amount_off: discountAmount,
                            currency: 'eur',
                            duration: 'once',
                            name: discount.code,
                        }
                );
                sessionConfig.discounts = [{ coupon: coupon.id }];

                // Schedule coupon cleanup after session creation
                sessionConfig._couponId = coupon.id;
            }
        }

        // Add customer info if provided
        if (customerEmail) {
            sessionConfig.customer_email = customerEmail;
        }

        // Add shipping options if complete address provided
        if (customerPhone && customerName && shippingAddress) {
            sessionConfig.shipping_options = [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 0,
                            currency: 'eur',
                        },
                        display_name: 'Envío Gratis',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 3,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 7,
                            },
                        },
                    },
                },
            ];
            sessionConfig.metadata = {
                customer_phone: customerPhone,
                customer_name: customerName,
                shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : null,
                shipping_method_id: shippingMethodId ? String(shippingMethodId) : null,
                shipping_cost: shippingCost ? String(shippingCost) : '0',
            };
        } else {
            sessionConfig.shipping_address_collection = {
                allowed_countries: ['ES', 'FR', 'IT', 'PT', 'DE', 'NL', 'BE'],
            };
            sessionConfig.billing_address_collection = 'required';

            // Still pass metadata if we have partial info, or at least pass the address if we have it but not phone/name?
            // Actually the frontend always sends all of them if form is filled.
            if (shippingAddress) {
                sessionConfig.metadata = {
                    ...sessionConfig.metadata,
                    shipping_address: JSON.stringify(shippingAddress)
                };
            }
        }

        console.log('Creando sesión de Stripe...');

        // Crear sesión de Stripe Checkout
        const session = await stripe.checkout.sessions.create(sessionConfig);

        console.log('Checkout session created:', session.id);

        // Clean up Stripe coupon after session creation (one-time use)
        if (sessionConfig._couponId) {
            stripe.coupons.del(sessionConfig._couponId).catch(() => {
                // Non-critical: coupon will expire naturally
            });
        }

        return new Response(
            JSON.stringify({
                sessionId: session.id,
                url: session.url
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error: any) {
        console.error('Checkout error:', error.message);

        return new Response(
            JSON.stringify({
                error: error.message || 'Error desconocido al crear la sesión de pago',
                type: error.type || 'unknown'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};
