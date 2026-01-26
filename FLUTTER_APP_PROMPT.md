# 🚀 Prompt para Crear FashionMarket en Flutter

> Usa este prompt para crear la versión móvil de FashionMarket con Flutter

---

Crea una aplicación Flutter para una tienda e-commerce de moda masculina llamada "FashionMarket" que replique todas las funcionalidades del proyecto web existente. Usa Clean Architecture con Riverpod para gestión de estado y GoRouter para navegación.

---

## BACKEND: SUPABASE (Reutilizar el existente)

La app debe conectarse al mismo backend Supabase con estas tablas principales:
- `categories` - Categorías de productos
- `products` - Productos con precio, stock, is_offer, sizes[]
- `product_images` - URLs de imágenes (Cloudinary)
- `product_variants` - Stock y precio por talla (XS, S, M, L, XL, XXL)
- `orders` - Pedidos (pending, paid, shipped, delivered, cancelled)
- `order_items` - Líneas de pedido
- `customers` - Perfiles de clientes (vinculados a auth.users)
- `customer_addresses` - Direcciones guardadas
- `customer_favorites` - Productos favoritos
- `shipping_methods` - Métodos de envío
- `discount_codes` - Códigos promocionales
- `carousel_slides` - Slides del homepage
- `newsletter_subscribers` - Suscriptores newsletter

---

## PALETA DE COLORES (FUTURISTIC DARK THEME)

```dart
class AppColors {
  // Colores Principales (Neon)
  static const Color primaryMain = Color(0xFF06B6D4);      // neon-cyan
  static const Color primaryLight = Color(0xFF22D3EE);     // neon-cyan-light
  static const Color primaryDark = Color(0xFF0891B2);      // neon-cyan-dark
  
  static const Color secondaryMain = Color(0xFFD946EF);    // neon-fuchsia
  static const Color secondaryLight = Color(0xFFE879F9);   // neon-fuchsia-light
  static const Color secondaryDark = Color(0xFFA21CAF);    // neon-fuchsia-dark
  
  static const Color accentBlue = Color(0xFF3B82F6);       // neon-blue
  static const Color accentPurple = Color(0xFF8B5CF6);     // neon-purple
  
  // Fondos Oscuros
  static const Color dark100 = Color(0xFF2A2A35);
  static const Color dark200 = Color(0xFF1F1F28);
  static const Color dark300 = Color(0xFF18181F);
  static const Color dark400 = Color(0xFF12121A);
  static const Color dark500 = Color(0xFF0D0D14);          // Fondo principal
  static const Color dark600 = Color(0xFF0A0A0F);          // Fondo body
  
  // Textos
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFE4E4E7);    // zinc-200
  static const Color textMuted = Color(0xFFA1A1AA);         // zinc-400
  static const Color textSubtle = Color(0xFF71717A);        // zinc-500
  
  // Estados
  static const Color success = Color(0xFF10B981);           // emerald-500
  static const Color warning = Color(0xFFF59E0B);           // amber-500
  static const Color error = Color(0xFFEF4444);             // red-500
  static const Color info = Color(0xFF3B82F6);              // blue-500
  
  // Glass/Transparencias
  static Color glassLight = Colors.white.withOpacity(0.05);
  static Color glassMedium = Colors.white.withOpacity(0.08);
  static Color glassHeavy = Colors.white.withOpacity(0.12);
  static Color glassBorder = Colors.white.withOpacity(0.1);
  
  // Gradientes
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF06B6D4), Color(0xFF0891B2)],
  );
  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [Color(0xFFD946EF), Color(0xFFA21CAF)],
  );
  static const LinearGradient cyanFuchsiaGradient = LinearGradient(
    colors: [Color(0xFF06B6D4), Color(0xFFD946EF)],
  );
}
```

---

## ESTRUCTURA DEL PROYECTO FLUTTER

```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── config/
│   │   ├── supabase_config.dart
│   │   └── stripe_config.dart
│   ├── theme/
│   │   ├── app_colors.dart
│   │   ├── app_theme.dart
│   │   └── app_text_styles.dart
│   ├── utils/
│   │   ├── formatters.dart         # formatPrice, formatDate
│   │   └── validators.dart
│   └── constants/
│       └── app_constants.dart
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── repositories/auth_repository_impl.dart
│   │   │   └── datasources/auth_remote_datasource.dart
│   │   ├── domain/
│   │   │   ├── entities/user.dart
│   │   │   ├── repositories/auth_repository.dart
│   │   │   └── usecases/login_usecase.dart
│   │   └── presentation/
│   │       ├── providers/auth_provider.dart
│   │       ├── screens/login_screen.dart
│   │       └── widgets/login_form.dart
│   ├── products/
│   │   ├── data/
│   │   ├── domain/
│   │   │   └── entities/product.dart
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── home_screen.dart
│   │       │   ├── products_screen.dart
│   │       │   ├── product_detail_screen.dart
│   │       │   └── category_screen.dart
│   │       └── widgets/
│   │           ├── product_card.dart
│   │           ├── carousel_slider.dart
│   │           └── filter_sidebar.dart
│   ├── cart/
│   │   ├── domain/
│   │   │   └── entities/cart_item.dart
│   │   └── presentation/
│   │       ├── providers/cart_provider.dart
│   │       ├── screens/cart_screen.dart
│   │       └── widgets/cart_item_tile.dart
│   ├── checkout/
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── checkout_screen.dart
│   │       │   └── order_success_screen.dart
│   │       └── widgets/
│   │           ├── address_form.dart
│   │           ├── shipping_method_selector.dart
│   │           └── discount_code_input.dart
│   ├── orders/
│   │   └── presentation/
│   │       ├── screens/order_history_screen.dart
│   │       └── widgets/order_card.dart
│   ├── account/
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── account_screen.dart
│   │       │   ├── addresses_screen.dart
│   │       │   └── favorites_screen.dart
│   │       └── widgets/address_card.dart
│   └── newsletter/
│       └── presentation/
│           └── widgets/newsletter_popup.dart
└── shared/
    ├── widgets/
    │   ├── app_button.dart
    │   ├── app_text_field.dart
    │   ├── loading_indicator.dart
    │   └── glass_container.dart
    └── providers/
        └── supabase_provider.dart
```

---

## FUNCIONALIDADES REQUERIDAS

### 1. PANTALLA PRINCIPAL (Home)
- Carousel con slides dinámicos de la tabla `carousel_slides`
- Sección de ofertas flash (productos con `is_offer = true`)
- Grid de categorías
- Productos destacados
- Popup de newsletter

### 2. CATÁLOGO DE PRODUCTOS
- Grid de productos con filtros laterales
- Filtrar por: categoría, rango de precio, tallas disponibles, tags
- Ordenar por: precio, fecha, nombre
- Tarjetas con imagen, nombre, precio, badge de oferta

### 3. DETALLE DE PRODUCTO
- Galería de imágenes con swipe
- Selector de talla (mostrar stock por talla)
- Recomendador de tallas
- Botón añadir al carrito
- Botón añadir a favoritos (si está logueado)
- Productos relacionados

### 4. CARRITO
- Lista de productos con imagen, talla, cantidad
- Modificar cantidad / eliminar
- Resumen de precios
- Continuar al checkout

### 5. CHECKOUT
- Formulario de dirección de envío
- Selección de direcciones guardadas (si logueado)
- Input de código de descuento con validación
- Selector de método de envío
- Resumen del pedido
- Integración con Stripe para pago

### 6. AUTENTICACIÓN
- Login con email/password
- Registro con creación automática de perfil
- Recuperar contraseña
- Persistencia de sesión

### 7. CUENTA DE USUARIO
- Ver/editar perfil
- Historial de pedidos con estados
- Direcciones guardadas (CRUD)
- Productos favoritos
- Suscripción a newsletter

### 8. PEDIDOS
- Estados: pending → paid → shipped → delivered / cancelled
- Ver detalle con tracking de envío
- Ver productos del pedido

---

## MODELOS DE DATOS (Freezed)

```dart
@freezed
class Product with _$Product {
  const factory Product({
    required String id,
    required String name,
    required String slug,
    String? description,
    required double price,
    double? originalPrice,
    int? discountPercent,
    required int stock,
    String? categoryId,
    required bool isOffer,
    required List<String> sizes,
    required bool active,
    required DateTime createdAt,
    @Default([]) List<ProductImage> images,
    Category? category,
    @Default({}) Map<String, int> stockBySize,
  }) = _Product;
  
  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
}

@freezed
class ProductImage with _$ProductImage {
  const factory ProductImage({
    required String id,
    required String productId,
    required String imageUrl,
    required int order,
    String? color,
    String? colorHex,
  }) = _ProductImage;
  
  factory ProductImage.fromJson(Map<String, dynamic> json) => _$ProductImageFromJson(json);
}

@freezed
class Category with _$Category {
  const factory Category({
    required String id,
    required String name,
    required String slug,
  }) = _Category;
  
  factory Category.fromJson(Map<String, dynamic> json) => _$CategoryFromJson(json);
}

@freezed
class CartItem with _$CartItem {
  const factory CartItem({
    required String productId,
    required String name,
    required String slug,
    required double price,
    required int quantity,
    required String size,
    required String image,
  }) = _CartItem;
  
  factory CartItem.fromJson(Map<String, dynamic> json) => _$CartItemFromJson(json);
}

@freezed
class Order with _$Order {
  const factory Order({
    required String id,
    required int orderNumber,
    required double totalPrice,
    required String status, // pending, paid, shipped, delivered, cancelled
    String? customerEmail,
    String? customerName,
    String? shippingAddress,
    int? shippingMethodId,
    String? shippingCarrier,
    String? trackingNumber,
    String? trackingUrl,
    DateTime? shippedAt,
    DateTime? deliveredAt,
    required DateTime createdAt,
    @Default([]) List<OrderItem> items,
  }) = _Order;
  
  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
}

@freezed
class OrderItem with _$OrderItem {
  const factory OrderItem({
    required String id,
    required String orderId,
    String? productId,
    required String productName,
    String? productImage,
    required int quantity,
    String? size,
    required double priceAtPurchase,
  }) = _OrderItem;
  
  factory OrderItem.fromJson(Map<String, dynamic> json) => _$OrderItemFromJson(json);
}

@freezed
class Customer with _$Customer {
  const factory Customer({
    required String id,
    required String email,
    String? fullName,
    String? phone,
    String? avatarUrl,
    @Default({}) Map<String, dynamic> defaultAddress,
    @Default(false) bool newsletter,
    required DateTime createdAt,
  }) = _Customer;
  
  factory Customer.fromJson(Map<String, dynamic> json) => _$CustomerFromJson(json);
}

@freezed
class CustomerAddress with _$CustomerAddress {
  const factory CustomerAddress({
    required String id,
    required String customerId,
    required String label,
    required String fullName,
    required String street,
    required String city,
    required String postalCode,
    required String province,
    @Default('España') String country,
    String? phone,
    @Default(false) bool isDefault,
  }) = _CustomerAddress;
  
  factory CustomerAddress.fromJson(Map<String, dynamic> json) => _$CustomerAddressFromJson(json);
}

@freezed
class CarouselSlide with _$CarouselSlide {
  const factory CarouselSlide({
    required String id,
    required String title,
    String? subtitle,
    String? description,
    required String imageUrl,
    @Default('Ver más') String ctaText,
    @Default('/productos') String ctaLink,
    @Default(5000) int duration,
    required int sortOrder,
    required bool isActive,
    String? discountCode,
    @Default({}) Map<String, dynamic> styleConfig,
  }) = _CarouselSlide;
  
  factory CarouselSlide.fromJson(Map<String, dynamic> json) => _$CarouselSlideFromJson(json);
}

@freezed
class DiscountCode with _$DiscountCode {
  const factory DiscountCode({
    required String id,
    required String code,
    String? description,
    required String discountType, // 'percentage' or 'fixed'
    required double discountValue,
    @Default(0) double minPurchase,
    double? maxDiscount,
    int? usageLimit,
    @Default(0) int timesUsed,
    @Default(false) bool singleUsePerCustomer,
    DateTime? startsAt,
    DateTime? expiresAt,
    @Default(true) bool active,
  }) = _DiscountCode;
  
  factory DiscountCode.fromJson(Map<String, dynamic> json) => _$DiscountCodeFromJson(json);
}

@freezed
class ShippingMethod with _$ShippingMethod {
  const factory ShippingMethod({
    required int id,
    required String name,
    String? description,
    required double price,
    String? estimatedDays,
    @Default(true) bool isActive,
  }) = _ShippingMethod;
  
  factory ShippingMethod.fromJson(Map<String, dynamic> json) => _$ShippingMethodFromJson(json);
}
```

---

## DEPENDENCIAS RECOMENDADAS

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.0
  riverpod_annotation: ^2.3.0
  
  # Navigation
  go_router: ^12.0.0
  
  # Backend
  supabase_flutter: ^2.0.0
  
  # Payments
  flutter_stripe: ^10.0.0
  
  # Code Generation
  freezed_annotation: ^2.4.0
  json_annotation: ^4.8.0
  
  # UI Components
  cached_network_image: ^3.3.0
  flutter_svg: ^2.0.0
  shimmer: ^3.0.0
  carousel_slider: ^4.2.0
  flutter_staggered_grid_view: ^0.7.0
  
  # Local Storage
  shared_preferences: ^2.2.0
  hive_flutter: ^1.1.0
  
  # Utils
  intl: ^0.18.0
  url_launcher: ^6.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.0
  freezed: ^2.4.0
  json_serializable: ^6.7.0
  riverpod_generator: ^2.3.0
  hive_generator: ^2.0.0
```

---

## CONFIGURACIÓN INICIAL

### main.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await Supabase.initialize(
    url: const String.fromEnvironment('SUPABASE_URL'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
  );
  
  // Initialize Stripe
  Stripe.publishableKey = const String.fromEnvironment('STRIPE_PUBLISHABLE_KEY');
  
  runApp(
    const ProviderScope(
      child: FashionMarketApp(),
    ),
  );
}
```

### app.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';

class FashionMarketApp extends ConsumerWidget {
  const FashionMarketApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    
    return MaterialApp.router(
      title: 'FashionMarket',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}
```

---

## REQUISITOS DE ESTILO

1. **Tema oscuro futurista** con colores neon (cyan, fuchsia, purple)
2. **Glassmorphism** en cards y containers usando `BackdropFilter` y `ClipRRect`
3. **Animaciones suaves** con `AnimatedContainer`, `Hero` y `PageTransition`
4. **Gradientes** de cyan a fuchsia para elementos destacados (botones, badges)
5. **Tipografía moderna** - Usar Google Fonts: Inter, Outfit o Poppins
6. **Iconos** - Usar Lucide Icons o Phosphor Icons con estilo outline
7. **Bottom navigation** con 4 tabs: Home, Catálogo, Carrito, Cuenta
8. **Shimmer effects** para estados de carga
9. **Pull-to-refresh** en todas las listas
10. **Responsive** para tablets (grid de 3-4 columnas) y móviles (2 columnas)

---

## WIDGETS REUTILIZABLES

### GlassContainer
```dart
class GlassContainer extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final EdgeInsets padding;
  
  const GlassContainer({
    super.key,
    required this.child,
    this.borderRadius = 16,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: AppColors.glassMedium,
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: child,
        ),
      ),
    );
  }
}
```

### GradientButton
```dart
class GradientButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final bool isLoading;
  
  const GradientButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.cyanFuchsiaGradient,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Text(text, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
    );
  }
}
```

---

## NOTAS IMPORTANTES

- ✅ Reutilizar el backend Supabase existente (mismas tablas y RLS policies)
- ❌ El panel de administración se queda solo web, NO incluir en Flutter
- 🔄 Implementar offline-first para el carrito (persistir con Hive)
- ⏳ Manejar estados de carga con shimmer effects
- 📱 Implementar pull-to-refresh en todas las listas
- 📐 Diseño responsive para tablets y móviles
- 🔐 Usar Supabase Auth para autenticación
- 💳 Integrar Stripe con Payment Sheet para checkout nativo

---

*Generado desde el proyecto FashionStore - Enero 2026*
