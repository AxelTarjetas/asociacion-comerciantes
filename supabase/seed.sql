insert into public.categories (name, slug)
values
  ('Alimentación', 'alimentacion'),
  ('Moda y complementos', 'moda'),
  ('Servicios locales', 'servicios')
on conflict (slug) do update
set name = excluded.name;

insert into public.merchants (
  category_id,
  name,
  slug,
  description,
  address,
  city,
  phone,
  website_url,
  image_url,
  is_active
)
values
  (
    (select id from public.categories where slug = 'alimentacion'),
    'Panadería La Plaza',
    'panaderia-la-plaza',
    'Obrador familiar con pan diario, bollería artesana y desayunos para llevar en el centro del barrio.',
    'Calle Mayor de Puente Tocinos 14, Local 2',
    'Puente Tocinos',
    '910 245 118',
    null,
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    true
  ),
  (
    (select id from public.categories where slug = 'alimentacion'),
    'Mercado Verde',
    'mercado-verde',
    'Frutería y tienda de producto fresco con proveedores de proximidad y cestas semanales.',
    'Avenida Región Murciana 7',
    'Puente Tocinos',
    '910 338 764',
    null,
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    true
  ),
  (
    (select id from public.categories where slug = 'moda'),
    'Atelier Norte',
    'atelier-norte',
    'Boutique independiente con prendas seleccionadas, arreglos sencillos y asesoría cercana.',
    'Calle Huerta de Murcia 21',
    'Murcia',
    '910 781 422',
    null,
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    true
  ),
  (
    (select id from public.categories where slug = 'servicios'),
    'Bicis Rivera',
    'bicis-rivera',
    'Taller de bicicletas para revisiones, reparaciones rápidas y puesta a punto antes de rutas urbanas.',
    'Camino Viejo de Orihuela 5',
    'Puente Tocinos',
    '910 556 390',
    null,
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80',
    true
  )
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  address = excluded.address,
  city = excluded.city,
  phone = excluded.phone,
  website_url = excluded.website_url,
  image_url = excluded.image_url,
  is_active = excluded.is_active;

insert into public.offers (
  merchant_id,
  title,
  slug,
  description,
  featured_promotion,
  customer_benefit,
  business_goal,
  coupon_code,
  qr_token,
  starts_at,
  ends_at,
  is_active,
  max_redemptions
)
values
  (
    (select id from public.merchants where slug = 'panaderia-la-plaza'),
    'Desayuno local con 15% de descuento',
    'desayuno-local-la-plaza',
    'Café, tostada o pieza dulce con descuento directo mostrando el cupón en mostrador.',
    '15% en desayunos de barrio',
    'Ahorrar en el desayuno diario y descubrir un obrador cercano.',
    'Aumentar visitas por la mañana y convertir vecinos en clientes recurrentes.',
    'PLAZA15',
    'qr-desayuno-local-la-plaza',
    '2026-06-01 00:00:00+00',
    '2026-07-15 23:59:59+00',
    true,
    250
  ),
  (
    (select id from public.merchants where slug = 'panaderia-la-plaza'),
    'Segunda barra a mitad de precio',
    'segunda-barra-mitad-precio',
    'Oferta para compras de pan del día. Válida de lunes a jueves hasta fin de existencias.',
    'Segunda barra al 50%',
    'Llevar más pan fresco pagando menos en compras entre semana.',
    'Impulsar ventas en días de menor afluencia y medir la respuesta por código.',
    'PAN2X50',
    'qr-segunda-barra-mitad-precio',
    '2026-06-01 00:00:00+00',
    '2026-06-30 23:59:59+00',
    true,
    180
  ),
  (
    (select id from public.merchants where slug = 'mercado-verde'),
    '5 euros en cesta de temporada',
    'cesta-temporada-mercado-verde',
    'Descuento aplicado en compras superiores a 30 euros en fruta, verdura y producto fresco.',
    '5 euros de ahorro directo',
    'Comprar producto fresco de proximidad con descuento inmediato.',
    'Incrementar el ticket medio y atraer clientes que hacen compra semanal.',
    'VERDE5',
    'qr-cesta-temporada-mercado-verde',
    '2026-06-01 00:00:00+00',
    '2026-08-01 23:59:59+00',
    true,
    200
  ),
  (
    (select id from public.merchants where slug = 'atelier-norte'),
    'Arreglo básico incluido',
    'arreglo-basico-gratis',
    'Incluye bajo sencillo o ajuste menor al comprar una prenda de nueva temporada.',
    'Arreglo básico sin coste',
    'Salir con una prenda lista para usar y adaptada desde el primer día.',
    'Diferenciar la boutique frente a grandes cadenas y mejorar la conversión.',
    'ATELIERFIT',
    'qr-arreglo-basico-gratis',
    '2026-06-01 00:00:00+00',
    '2026-07-05 23:59:59+00',
    true,
    120
  ),
  (
    (select id from public.merchants where slug = 'bicis-rivera'),
    'Revisión urbana por 19 euros',
    'revision-urbana-bicis',
    'Chequeo de frenos, ruedas y cambios para bicicletas urbanas. Cita previa recomendada.',
    'Revisión rápida por precio cerrado',
    'Circular con más seguridad sin esperar a una avería grande.',
    'Generar nuevas citas de taller y activar servicios recurrentes.',
    'RIVERA19',
    'qr-revision-urbana-bicis',
    '2026-06-01 00:00:00+00',
    '2026-07-20 23:59:59+00',
    true,
    90
  )
on conflict (slug) do update
set
  merchant_id = excluded.merchant_id,
  title = excluded.title,
  description = excluded.description,
  featured_promotion = excluded.featured_promotion,
  customer_benefit = excluded.customer_benefit,
  business_goal = excluded.business_goal,
  coupon_code = excluded.coupon_code,
  qr_token = excluded.qr_token,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  is_active = excluded.is_active,
  max_redemptions = excluded.max_redemptions;

insert into public.coupon_redemptions (
  offer_id,
  merchant_id,
  coupon_code,
  qr_token,
  redeemed_at,
  notes
)
values
  (
    (select id from public.offers where slug = 'desayuno-local-la-plaza'),
    (select id from public.merchants where slug = 'panaderia-la-plaza'),
    'PLAZA15',
    'qr-desayuno-local-la-plaza',
    '2026-06-05 09:42:00+00',
    'Canje de ejemplo en mostrador'
  ),
  (
    (select id from public.offers where slug = 'cesta-temporada-mercado-verde'),
    (select id from public.merchants where slug = 'mercado-verde'),
    'VERDE5',
    'qr-cesta-temporada-mercado-verde',
    '2026-06-06 18:10:00+00',
    'Canje de ejemplo en caja'
  );
