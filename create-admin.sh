#!/bin/bash

# Script para crear un nuevo administrador en FashionMarket
# Uso: ./create-admin.sh

echo "=================================="
echo "🛡️  Crear Nuevo Administrador"
echo "=================================="
echo ""

# Solicitar datos
read -p "📧 Email del administrador: " email
read -s -p "🔐 Contraseña: " password
echo ""
read -p "👤 Nombre completo (opcional): " full_name
echo ""
echo "Selecciona el rol:"
echo "1) Admin (normal)"
echo "2) Super Admin"
read -p "Rol [1]: " role_choice

# Determinar rol
if [ "$role_choice" = "2" ]; then
    role="super_admin"
else
    role="admin"
fi

# Generar query SQL
echo ""
echo "=================================="
echo "📋 Ejecuta este comando en Supabase SQL Editor:"
echo "=================================="
echo ""

if [ -z "$full_name" ]; then
    echo "SELECT create_admin('$email', '$password', NULL, '$role');"
else
    echo "SELECT create_admin('$email', '$password', '$full_name', '$role');"
fi

echo ""
echo "=================================="
echo "✅ Copia el comando SQL de arriba y ejecútalo en:"
echo "https://app.supabase.com > SQL Editor"
echo "=================================="
